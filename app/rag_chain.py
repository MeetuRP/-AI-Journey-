import os
from deep_translator import GoogleTranslator
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import OllamaLLM
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# Translator function using Google
def translate_text(text, source='auto', target='en'):
    return GoogleTranslator(source=source, target=target).translate(text)

def build_rag_chain():
    pdf_path = "AI_concepts.pdf"
    faiss_path = "faiss_index"

    # Use multilingual embedding model (optional upgrade)
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    if os.path.exists(faiss_path):
        vectordb = FAISS.load_local(faiss_path, embeddings, allow_dangerous_deserialization=True)
    else:
        loader = PyPDFLoader(pdf_path)
        documents = loader.load()
        splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
        docs = splitter.split_documents(documents)
        vectordb = FAISS.from_documents(docs, embeddings)
        vectordb.save_local(faiss_path)

    retriever = vectordb.as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs={"score_threshold": 0.05, "k": 10}
    )

    # Load local LLM via Ollama
    llm = OllamaLLM(model="gemma:2b")

    # Custom prompt for QA generation
    prompt_template = (
        "Answer the question using ONLY the provided context. "
        "If the answer is not in the context, say 'I don't know.'\n\n"
        "Context:\n{context}\n\nQuestion: {question}\nAnswer:"
    )
    prompt = PromptTemplate(template=prompt_template, input_variables=["context", "question"])

    # Return the full RAG chain and translator
    return RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt}
    ), translate_text

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import OllamaLLM
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
import os
from deep_translator import GoogleTranslator


def translate_text(text, source='auto', target='en'):
    return GoogleTranslator(source=source, target=target).translate(text)


def build_combined_rag_chain(question: str):
    pdf_path = "Press Release - INR.pdf"
    faiss_path = "faiss_index"

    # 1. Setup embeddings
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    # 2. Load vector store or build new
    if os.path.exists(faiss_path):
        vectordb = FAISS.load_local(faiss_path, embeddings, allow_dangerous_deserialization=True)
    else:
        loader = PyPDFLoader(pdf_path)
        documents = loader.load()
        splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=250)
        docs = splitter.split_documents(documents)
        vectordb = FAISS.from_documents(docs, embeddings)
        vectordb.save_local(faiss_path)

    # 3. Determine if it's a summary-type question
    summary_keywords = ["summarize", "what is this pdf", "give me details", "explain"]
    is_summary = any(kw in question.lower() for kw in summary_keywords)

    # 4. Build the prompt template
    prompt_template = PromptTemplate(
        template=(
            "You are an AI assistant. Use the following context to answer the question.\n\n"
            "{context}\n\nQuestion: {question}\nAnswer:"
            if not is_summary else
            "You are a document analyst. Summarize or explain the document using this context:\n\n"
            "{context}\n\nQuestion: {question}\nAnswer:"
        ),
        input_variables=["context", "question"]
    )

    # 5. Load the LLM
    llm = OllamaLLM(model="gemma:2b")

    # 6. Build and return chain
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=vectordb.as_retriever(search_kwargs={"k": 6}),
        chain_type_kwargs={"prompt": prompt_template},
        return_source_documents=True
    )

    return qa_chain

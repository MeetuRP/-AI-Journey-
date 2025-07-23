import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from deep_translator import GoogleTranslator
from dotenv import load_dotenv
from langchain.chat_models import ChatOpenAI
'''
from langchain_ollama import OllamaLLM  ---❌ Removed for Gemini
from langchain_google_genai import ChatGoogleGenerativeAI  ❌ Removed for groq
'''

# ✅ Load .env from the current script's folder
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=dotenv_path)
# ✅ Confirm it's loading
openai_api_key = os.getenv("GROQ_API_KEY")
print(f"🔑 OPENAI_API_KEY loaded: {openai_api_key is not None}")


# Translator
def translate_text(text, source='auto', target='en'):
    return GoogleTranslator(source=source, target=target).translate(text)

# Build RAG chain
def build_combined_rag_chain(question: str):
    pdf_path = "Press Release - INR.pdf"  # Change your static PDF path here
    faiss_path = "faiss_index"

    # 1. Embeddings
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    # 2. Load or create vector DB
    if os.path.exists(faiss_path):
        vectordb = FAISS.load_local(faiss_path, embeddings, allow_dangerous_deserialization=True)
    else:
        loader = PyPDFLoader(pdf_path)
        docs = loader.load()
        splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=300)
        chunks = splitter.split_documents(docs)
        vectordb = FAISS.from_documents(chunks, embeddings)
        vectordb.save_local(faiss_path)

    # 3. Detect if it's a summarization-type question
    summary_keywords = ["summarize", "what is this pdf", "give me details", "explain", "summary", "overview", "highlights"]
    is_summary = any(kw in question.lower() for kw in summary_keywords)

    # 4. Prompt template
    prompt_template = PromptTemplate(
        template=(
            "You are a document analyst. Summarize or explain the document using this context:\n\n"
            "{context}\n\nAnswer:"
            if is_summary else
            "You are a helpful assistant that only uses the provided document context to answer.\n\n"
            "Answer the user's question accurately based on this context.\n\n"
            "Context:\n{context}\n\nQuestion:\n{question}\n\n"
            "If the answer is not in the context, say \"The context does not provide this information.\"\n\n"
            "Be specific, include names, titles, financial values, or quotes if present."
        ),
        input_variables=["context", "question"]
    )

    '''llm = OllamaLLM(model="gemma:2b")'''
    # 5. Replace Ollama LLM with Gemini (ChatGoogleGenerativeAI)
    '''
    llm = ChatGoogleGenerativeAI(
        model="gemini-pro",
        temperature=0.2,
        google_api_key="your_actual_gemini_api_key_here"
    )
    '''
    # Use Groq's LLM
    llm = ChatOpenAI(
        model="llama3-70b-8192",
        base_url="https://api.groq.com/openai/v1",
        openai_api_key=openai_api_key
    )

    # 6. Retriever with MMR
    retriever = vectordb.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 12, "fetch_k": 15}
    )

    # 7. Build chain
    rag_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt_template}
    )

    return rag_chain





# app/.env
# GROQ_API_KEY=REMOVED_SECRET
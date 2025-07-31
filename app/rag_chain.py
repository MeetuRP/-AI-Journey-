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

# ✅ Load .env variables (Groq key)
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=dotenv_path)
openai_api_key = os.getenv("GROQ_API_KEY")
print(f"🔑 OPENAI_API_KEY loaded: {openai_api_key is not None}")

# Translate text using GoogleTranslator
def translate_text(text, source='auto', target='en'):
    return GoogleTranslator(source=source, target=target).translate(text)

# Build RAG chain based on question and dynamic PDF path
def build_combined_rag_chain(question: str, pdf_path: str):
    # FAISS path is tied to PDF path to support multiple sessions
    faiss_path = f"faiss_index/{os.path.basename(pdf_path)}.faiss"

    # 1. Load or create embeddings
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    # 2. Vector DB creation or reuse
    if os.path.exists(faiss_path):
        vectordb = FAISS.load_local(faiss_path, embeddings, allow_dangerous_deserialization=True)
    else:
        loader = PyPDFLoader(pdf_path)
        docs = loader.load()
        splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=300)
        chunks = splitter.split_documents(docs)
        vectordb = FAISS.from_documents(chunks, embeddings)
        vectordb.save_local(faiss_path)

    # 3. Determine if it’s a summary-type query
    summary_keywords = ["summarize", "overview", "explain", "highlight", "what is this pdf"]
    is_summary = any(kw in question.lower() for kw in summary_keywords)

    # 4. Define prompt template
    prompt_template = PromptTemplate(
        template=(
            "### Context:\n\n{context}\n\n"
            "### Task:\nSummarize this document in Markdown bullet points with headers if applicable.\n\n"
            "### Response:"
            if is_summary else
            "### Context:\n\n{context}\n\n"
            "### Question:\n{question}\n\n"
            "### Instructions:\n"
            "- Answer only using the context above.\n"
            "- If the answer is not in the context, respond with: `The context does not provide this information.`\n"
            "- Format the answer in clean Markdown: use bullet points, headers, bold/italics where useful.\n\n"
            "### Response:"
        ),
        input_variables=["context", "question"]
    )

    # 5. Initialize LLM (Groq’s LLaMA3)
    llm = ChatOpenAI(
        model="llama3-70b-8192",
        base_url="https://api.groq.com/openai/v1",
        openai_api_key=openai_api_key
    )

    # 6. Build retriever with Max Marginal Relevance
    retriever = vectordb.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 12, "fetch_k": 15}
    )

    # 7. RAG pipeline using LangChain's RetrievalQA
    rag_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt_template}
    )

    return rag_chain

import os
from dotenv import load_dotenv
from langchain_community.document_loaders import (
    PyPDFLoader, TextLoader, CSVLoader, UnstructuredWordDocumentLoader
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from deep_translator import GoogleTranslator
from langchain.schema import Document

# ✅ Load .env variables
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=dotenv_path)
openai_api_key = os.getenv("GROQ_API_KEY")
print(f"🔑 OPENAI_API_KEY loaded: {openai_api_key is not None}")

# 🌐 Translator
def translate_text(text, source='auto', target='en'):
    return GoogleTranslator(source=source, target=target).translate(text)

# 📄 Loader selector
def get_loader(file_path: str):
    ext = os.path.splitext(file_path)[-1].lower()
    if ext == ".pdf":
        return PyPDFLoader(file_path)
    elif ext == ".txt":
        return TextLoader(file_path)
    elif ext == ".csv":
        return CSVLoader(file_path)
    elif ext in [".doc", ".docx"]:
        return UnstructuredWordDocumentLoader(file_path)
    else:
        raise ValueError(f"❌ Unsupported file type: {ext}")

# 🧠 Core RAG builder (Strict Mode Enabled)
def build_combined_rag_chain(question: str, pdf_path: str = None, web_text: str = None):
    vectordb = None

    # 📂 File-based RAG
    if pdf_path:
        faiss_path = f"faiss_index/{os.path.basename(pdf_path)}.faiss"
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

        if os.path.exists(faiss_path):
            vectordb = FAISS.load_local(faiss_path, embeddings, allow_dangerous_deserialization=True)
        else:
            try:
                loader = get_loader(pdf_path)
                docs = loader.load()
            except Exception as e:
                print(f"❌ Document loading failed: {e}")
                docs = []

            if docs:
                splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=300)
                chunks = splitter.split_documents(docs)
                vectordb = FAISS.from_documents(chunks, embeddings)
                os.makedirs("faiss_index", exist_ok=True)
                vectordb.save_local(faiss_path)

    # 🌐 Web scraping RAG
    elif web_text:
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        fake_doc = Document(page_content=web_text)
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = splitter.split_documents([fake_doc])
        vectordb = FAISS.from_documents(chunks, embeddings)

    # 🔍 Summary keyword detection
    summary_keywords = [
        "summarize", "overview", "explain", "highlight", "short note", "brief",
        "describe", "gist", "outline", "summary", "recap"
    ]
    is_summary = any(kw in question.lower() for kw in summary_keywords)

    # 📝 Prompt template
    prompt_template = PromptTemplate(
        template=(
            "### Context:\n\n{context}\n\n"
            "### Task:\nSummarize this document in Markdown bullet points with headers if applicable.\n\n"
            "### Response:"
            if is_summary else
            "### Context:\n\n{context}\n\n"
            "### Question:\n{query}\n\n"
            "### Instructions:\n"
            "- Answer ONLY using the context above.\n"
            "- If the answer is not in the context, respond exactly with: `The context does not provide this information.`\n"
            "- Do NOT use any outside knowledge.\n"
            "- Use clean Markdown: bullet points, headers, bold/italics where useful.\n\n"
            "### Response:"
        ),
        input_variables=["context", "query"]
    )

    # 🧠 LLM
    llm = ChatOpenAI(
        model="llama3-70b-8192",
        base_url="https://api.groq.com/openai/v1",
        openai_api_key=openai_api_key
    )

    # 🌍 Global mode fallback (no doc / no web)
    if not vectordb:
        from langchain.chains import LLMChain
        from langchain.prompts import PromptTemplate as BasicPrompt
        prompt = BasicPrompt.from_template("Answer this question:\n\n{question}")
        return LLMChain(prompt=prompt, llm=llm)

    # 📦 Retriever setup
    retriever = vectordb.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 8, "fetch_k": 10}
    )

    # 🛡 Strict Context Wrapper
    def strict_context_chain(user_question: str):
        retrieved_docs = retriever.get_relevant_documents(user_question)
        if not retrieved_docs or all(doc.page_content.strip() == "" for doc in retrieved_docs):
            return {"result": "The context does not provide this information.", "source_documents": []}

        # Join context text
        context_text = "\n\n".join(doc.page_content for doc in retrieved_docs)

        # Run prompt with context
        formatted_prompt = prompt_template.format(context=context_text, query=user_question)
        response = llm.invoke(formatted_prompt)
        return {"result": response.content, "source_documents": retrieved_docs}

    return strict_context_chain

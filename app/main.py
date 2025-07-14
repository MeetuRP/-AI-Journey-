from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag_chain import build_rag_chain
import uvicorn

app = FastAPI()

#  Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your React domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#  Define request body schema
class Query(BaseModel):
    question: str

#  Build RAG chain on startup
qa_chain = build_rag_chain()

@app.get("/")
def root():
    return {"message": "RAG API with Gemma 2B and Ollama is running."}

@app.post("/ask")
def ask_q(query: Query):
    print(f"🧠 Question received: {query.question}")
    result = qa_chain.invoke(query.question)
    print("🔍 Retrieval complete. Processing answer...")

    # Extract answer
    answer = result["result"]

    # Show retrieved docs for debugging
    print("\n📄 Retrieved Context from PDF:")
    for i, doc in enumerate(result["source_documents"]):
        print(f"\n--- Document {i+1} ---\n{doc.page_content[:500]}...")  # truncate for readability

    return {
        "question": query.question,
        "answer": answer
    }

#  Run server (used when running `python main.py` directly)
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

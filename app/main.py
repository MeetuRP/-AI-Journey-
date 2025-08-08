from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from gtts import gTTS
from bson import ObjectId
from rag_chain import build_combined_rag_chain, translate_text
from db import create_session, add_message, get_session, list_sessions, update_session_file
from utils.firecrawl_utils import scrape_url
import uvicorn
import shutil
import os
import inspect

app = FastAPI()

# ✅ Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Query model
class Query(BaseModel):
    question: str
    lang: str = 'en'

@app.get("/")
def root():
    return {"message": "🧠 Multilingual RAG Chatbot API is running."}

# ✅ Create new session (no file required at creation)
@app.post("/create-session")
def new_session(session_name: str = Form(...)):
    session_id = create_session(session_name=session_name, pdf_path=None)  # initially no pdf_path
    return {"session_id": str(session_id)}

# ✅ Upload PDF/DOC/TXT/CSV file after session
@app.post("/upload/{session_id}")
def upload_file(session_id: str, file: UploadFile = File(...)):
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[-1].lower()
    allowed_exts = [".pdf", ".csv", ".txt", ".doc", ".docx"]

    if file_ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    update_session_file(ObjectId(session_id), file_path)
    return {"message": f"📄 {file.filename} uploaded successfully."}

# ✅ Scrape URL and attach content to session
@app.post("/scrape/{session_id}")
def scrape(session_id: str, url: str = Form(...)):
    try:
        text = scrape_url(url)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract content from URL")
        update_session_file(ObjectId(session_id), None, web_text=text)
        return {"message": "🔗 Web content attached successfully."}
    except Exception as e:
        print(f"🔥 Scrape error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ✅ Ask from either uploaded file or scraped URL
@app.post("/ask/{session_id}")
def ask_q_with_session(session_id: str, query: Query):
    translated_q = translate_text(query.question, source=query.lang, target='en')
    session_data = get_session(ObjectId(session_id))

    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")

    pdf_path = session_data.get("pdf_path")
    web_text = session_data.get("web_text")

    qa_chain = build_combined_rag_chain(translated_q, pdf_path=pdf_path, web_text=web_text)

    # ✅ Detect if qa_chain is a LangChain Chain or our strict context function
    if callable(qa_chain) and not hasattr(qa_chain, "invoke"):
        # Strict mode function
        result = qa_chain(translated_q)
    else:
        # LLMChain or RetrievalQA
        result = qa_chain.invoke({"question": translated_q})

    # ✅ Extract the answer
    if isinstance(result, dict):
        answer = (
            result.get("result")
            or result.get("text")
            or "The model did not return a valid answer."
        )
    else:
        answer = str(result)

    translated_a = translate_text(answer, source='en', target=query.lang)

    add_message(ObjectId(session_id), "user", query.question)
    add_message(ObjectId(session_id), "bot", translated_a)

    return {
        "question": query.question,
        "answer": translated_a
    }

# ✅ Get session list
@app.get("/sessions")
def fetch_sessions():
    sessions = list_sessions()
    return [{"id": str(s["_id"]), "name": s["session_name"]} for s in sessions]

# ✅ Get session history
@app.get("/session/{session_id}")
def get_full_session(session_id: str):
    session = get_session(ObjectId(session_id))
    return {"messages": session.get("messages", [])}

# ✅ Text-to-speech endpoint
@app.get("/tts")
def text_to_speech(text: str, lang: str = "en"):
    tts = gTTS(text=text, lang=lang)
    audio_path = "response.mp3"
    tts.save(audio_path)
    return FileResponse(audio_path, media_type="audio/mpeg")

# ✅ Run server
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

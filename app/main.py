from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from gtts import gTTS
from bson import ObjectId
from rag_chain import build_combined_rag_chain, translate_text
from db import create_session, add_message, get_session, list_sessions
import uvicorn
import shutil
import os


app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input structure for the ask endpoint
class Query(BaseModel):
    question: str
    lang: str = 'en'

@app.get("/")
def root():
    return {"message": "Multilingual RAG API with session support is running."}

# ✅ Create new chat session with associated PDF
@app.post("/create-session")
def new_session(
    session_name: str = Form(...),
    pdf_file: UploadFile = File(...)
):
    # Save uploaded file
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    pdf_path = os.path.join(upload_dir, pdf_file.filename)

    with open(pdf_path, "wb") as f:
        shutil.copyfileobj(pdf_file.file, f)

    # Save session
    session_id = create_session(session_name, pdf_path)
    return {"session_id": str(session_id)}

# ✅ Ask question in context of existing session
@app.post("/ask/{session_id}")
def ask_q_with_session(session_id: str, query: Query):
    # 1. Translate question to English
    translated_q = translate_text(query.question, source=query.lang, target='en')

    # 2. Fetch session details from MongoDB (PDF, etc.)
    session_data = get_session(ObjectId(session_id))

    # 3. Build RAG chain with this session's PDF
    qa_chain = build_combined_rag_chain(translated_q, session_data["pdf_path"])

    # 4. Invoke chain and get response
    result = qa_chain.invoke(translated_q)
    answer = result["result"]

    # 5. Translate back to user's language
    translated_a = translate_text(answer, source='en', target=query.lang)

    # 6. Log Q&A in MongoDB session
    add_message(ObjectId(session_id), "user", query.question)
    add_message(ObjectId(session_id), "bot", translated_a)

    return {
        "question": query.question,
        "answer": translated_a
    }

# ✅ List all available sessions
@app.get("/sessions")
def fetch_sessions():
    sessions = list_sessions()
    return [{"id": str(s["_id"]), "name": s["session_name"]} for s in sessions]

# ✅ Fetch full history of a single session
@app.get("/session/{session_id}")
def get_full_session(session_id: str):
    session = get_session(ObjectId(session_id))
    return {"messages": session["messages"]}

# ✅ Text-to-Speech for bot response
@app.get("/tts")
def text_to_speech(text: str, lang: str = "en"):
    tts = gTTS(text=text, lang=lang)
    audio_path = "response.mp3"
    tts.save(audio_path)
    return FileResponse(audio_path, media_type="audio/mpeg")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

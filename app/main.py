from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from gtts import gTTS
from rag_chain import build_rag_chain
import uvicorn


app = FastAPI()

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input model for POST request
class Query(BaseModel):
    question: str
    lang: str = 'en'

# Initialize RAG chain and translation
qa_chain, translate_text = build_rag_chain()

@app.get("/")
def root():
    return {"message": "Multilingual RAG API is running."}

@app.post("/ask")
def ask_q(query: Query):
    print(f"🧠 Question received: {query.question} (lang: {query.lang})")

    # Translate question to English
    translated_q = translate_text(query.question, source=query.lang, target='en')

    # Get RAG-based answer
    result = qa_chain.invoke(translated_q)
    answer = result["result"]

    # Translate answer back to user's language
    translated_a = translate_text(answer, source='en', target=query.lang)

    return {
        "question": query.question,
        "answer": translated_a
    }

@app.get("/tts")
def text_to_speech(text: str, lang: str = "en"):
    """
    Converts text to speech using Google gTTS and returns an MP3 file.
    """
    print(f"🔊 Generating speech for: {text} | Language: {lang}")
    tts = gTTS(text=text, lang=lang)
    audio_path = "response.mp3"
    tts.save(audio_path)
    return FileResponse(audio_path, media_type="audio/mpeg")

# Start FastAPI server
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

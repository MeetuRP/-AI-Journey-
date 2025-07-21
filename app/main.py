from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from gtts import gTTS
from rag_chain import build_combined_rag_chain, translate_text
import uvicorn

app = FastAPI()

# CORS settings to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input format for /ask
class Query(BaseModel):
    question: str
    lang: str = 'en'

@app.get("/")
def root():
    return {"message": "Multilingual RAG API is running."}

@app.post("/ask")
def ask_q(query: Query):
    print(f"🧠 Question received: {query.question} (lang: {query.lang})")

    # 1. Translate incoming question to English
    translated_q = translate_text(query.question, source=query.lang, target='en')

    # 2. Build dynamic chain and get response
    qa_chain = build_combined_rag_chain(translated_q)
    result = qa_chain.invoke(translated_q)
    answer = result["result"]

    # 3. Translate answer back to original language
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

# Run the FastAPI app
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

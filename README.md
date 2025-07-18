# 🧠 AI Chatbot with RAG, Voice Input & Hindi/English Support

This project is an intelligent, voice-enabled chatbot that uses **Retrieval-Augmented Generation (RAG)** with **FastAPI + LangChain + Gemma LLM + FAISS** in the backend and **React.js** in the frontend.

It supports:
- 💬 Text & 🎤 Voice-based questions
- 🌐 English and Hindi language selection
- 🔊 Text-to-Speech using gTTS
- 🧠 Context-aware answers using a PDF knowledge base (AI_concepts.pdf)
- 🔁 Automatic translation using deep-translator (Hindi ➡ English)

---

## 🚀 Features

| Feature                     | Description                                                                 |
|----------------------------|-----------------------------------------------------------------------------|
| 🗃️ Retrieval-Augmented Generation | Answers are based only on facts retrieved from the uploaded PDF.            |
| 🎙️ Voice Assistant          | Ask questions via voice input using browser's built-in Speech Recognition API. |
| 🔊 Spoken Responses         | Bot's answers are spoken aloud using gTTS (Google Text-to-Speech).          |
| 🌐 Language Switcher        | Choose between Hindi and English — works for both input and output.         |
| 🔁 Translation              | Uses [`deep-translator`](https://pypi.org/project/deep-translator/) to convert Hindi queries to English before sending to the backend. |
| 🤖 Powered by LLM + Ollama | Uses Gemma 2B locally via Ollama for fast and private inference.            |

---

## 📂 Project Structure

```
AI_agent/
├── app/
│   ├── main.py           # FastAPI backend with /ask and /tts endpoints
│   ├── rag_chain.py      # RAG setup using LangChain + FAISS + Ollama
│   ├── AI_concepts.pdf   # Source document for context
├── frontend/
│   ├── src/
│   │   ├── App.js        # React app with voice input, translation, TTS
│   ├── package.json      # Frontend dependencies
```

---

## 🛠️ Setup Instructions

### 🔧 Backend (FastAPI + LangChain + gTTS + deep-translator)

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

Include at least:
- `fastapi`
- `uvicorn`
- `langchain`
- `faiss-cpu`
- `gtts`
- `deep-translator`
- `PyPDF2`

2. Run Ollama & pull the Gemma model (if not already done):

```bash
ollama run gemma:2b
```

3. Start FastAPI server:

```bash
python main.py
```

> Make sure `AI_concepts.pdf` is placed inside the `app/` folder.

---

### 🌐 Frontend (React.js)

1. Go to the frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm start
```

---

## 🧠 Technologies Used

| Area                  | Tool/Library                             |
|-----------------------|-------------------------------------------|
| Backend Server        | FastAPI                                  |
| AI Model              | Gemma 2B (via Ollama)                    |
| RAG Framework         | LangChain + FAISS                        |
| PDF Loading           | PyPDFLoader                              |
| Text-to-Speech (TTS)  | gTTS                                      |
| Translation           | deep-translator                          |
| Speech Recognition    | Web Speech API (SpeechRecognition / webkitSpeechRecognition) |
| Frontend              | React.js + Axios                         |

---

## 🧪 Example Prompts

| English Questions            | Hindi Voice/Text Questions       |
|-----------------------------|----------------------------------|
| `What is RAG?`              | `रैग क्या है?`                   |
| `What is an AI Agent?`      | `AI एजेंट क्या होता है?`        |
| `Applications of LangChain?`| `LangChain के उपयोग क्या हैं?`  |

---

## ⚠️ Known Limitations

- ⚠️ Speech recognition accuracy varies — tech terms in Hindi like “LLM” may be misheard as “IIM”.
- 📢 gTTS has a short delay during audio generation.
- 🤖 Answers are only based on the given PDF file — no external web search or training.

---

## 🙏 Acknowledgements

- [LangChain](https://www.langchain.com/)
- [Ollama](https://ollama.com/)
- [FAISS](https://github.com/facebookresearch/faiss)
- [gTTS (Google Text-to-Speech)](https://pypi.org/project/gTTS/)
- [Deep Translator](https://pypi.org/project/deep-translator/)

---

## 👤 Author

**Meet Parmar**  
<li/>🎓 Integrated MCA @ LJ University  |
<li/>💼 Intern at Mindsyncx Labs llt => Coginsun Infotech pvt ltd.  |
<li/>💡 AI/ML Explorer |✏️ Sketch Artist  |
- 🔗 [www.linkedin.com] (https://www.linkedin.com/in/meet-parmar-28jan2005/)

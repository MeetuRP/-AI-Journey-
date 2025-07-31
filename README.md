# 🧠 AI Chatbot with RAG, Voice Input & Hindi/English Support

This project is an intelligent, voice-enabled chatbot that uses **Retrieval-Augmented Generation (RAG)** with **FastAPI + LangChain + Groq LLaMA3 + FAISS** in the backend and **React.js** in the frontend.

It supports:
- 💬 Text & 🎤 Voice-based questions  
- 📂 Multiple chat sessions with memory (MongoDB)  
- 🌐 English and Hindi language selection  
- 🔊 Text-to-Speech using gTTS (with interrupt on new input)  
- 🧠 Context-aware answers using a custom uploaded PDF  
- 🔁 Automatic translation using deep-translator (Hindi ➡ English)  

---

## 🚀 Features

| Feature                      | Description                                                                 |
|-----------------------------|-----------------------------------------------------------------------------|
| 🗃️ Retrieval-Augmented Generation | Answers are based only on facts retrieved from the uploaded PDF.            |
| 🧠 Session-based Memory       | Each session is stored in MongoDB and remembers the conversation history.   |
| 📂 Custom PDF Upload          | Upload your own PDF for each session to personalize the knowledge base.     |
| 🎙️ Voice Assistant           | Ask questions via voice input using browser's built-in Speech Recognition API. |
| 🔊 Spoken Responses          | Bot's answers are spoken aloud using gTTS and can be stopped on new action. |
| 🌐 Language Switcher         | Choose between Hindi and English — works for both input and output.         |
| 🔁 Translation               | Uses [`deep-translator`](https://pypi.org/project/deep-translator/) to convert Hindi queries to English before sending to the backend. |
| 🤖 Powered by LLM + Groq     | Uses LLaMA3 70B via Groq API for blazing-fast cloud inference.              |

---

## 📂 Project Structure

```
AI_agent/
├── app/
│   ├── main.py           # FastAPI backend with /ask, /tts, session endpoints
│   ├── rag_chain.py      # RAG setup using LangChain + FAISS + Groq LLaMA3
│   ├── db.py             # MongoDB session management
│   ├── uploads/          # User-uploaded PDFs (ignored in Git)
├── frontend/
│   ├── src/
│   │   ├── App.js        # React app with voice input, translation, TTS, session handling
│   ├── package.json      # Frontend dependencies
├── .env                  # Environment config (Groq & Mongo URI)
```

---

## 🛠️ Setup Instructions

### 🔧 Backend (FastAPI + LangChain + gTTS + MongoDB)

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

Includes:
- fastapi  
- uvicorn  
- langchain  
- langchain-community  
- langchain-ollama  
- faiss-cpu  
- gtts  
- deep-translator  
- pymongo  
- PyPDF2  

2. Add your `.env` file in root:

```env
# .env
GROQ_API_KEY=your_groq_api_key
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=chatbotDB
```

3. Start FastAPI server:

```bash
python main.py
```

> Make sure MongoDB is running and PDF files are uploaded in `/app/uploads`.

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
| AI Model              | LLaMA3-70B (via Groq API)                |
| RAG Framework         | LangChain + FAISS                        |
| PDF Loading           | PyPDFLoader                              |
| Text-to-Speech (TTS)  | gTTS (with interrupt feature)            |
| Translation           | deep-translator                          |
| Session Storage       | MongoDB                                  |
| Speech Recognition    | Web Speech API                           |
| Frontend              | React.js + Axios                         |

---

## 🧪 Example Prompts

| English Questions            | Hindi Voice/Text Questions       |
|-----------------------------|----------------------------------|
| What is RAG?                | रैग क्या है?                      |
| What is an AI Agent?        | AI एजेंट क्या होता है?           |
| Applications of LangChain?  | LangChain के उपयोग क्या हैं?     |
| Summarize this PDF          | इस PDF का सारांश बताइए            |

---

## ⚠️ Known Limitations

- ⚠️ Speech recognition accuracy varies — tech terms in Hindi like “LLM” may be misheard as “IIM”.
- 📢 gTTS has a short delay during audio generation (but stops instantly if interrupted).
- 🤖 Answers are only based on the uploaded PDF — no external data or internet-based context is used.

---

## 🙏 Acknowledgements

- [LangChain](https://www.langchain.com/)
- [Groq API](https://groq.com/)
- [FAISS](https://github.com/facebookresearch/faiss)
- [gTTS (Google Text-to-Speech)](https://pypi.org/project/gTTS/)
- [Deep Translator](https://pypi.org/project/deep-translator/)

---

## 👤 Author

**Meet Parmar**  
<li/>🎓 Integrated MCA @ LJ University  |
<li/>💼 Intern at Mindsyncx Labs llt => Coginsun Infotech pvt ltd.  |
<li/>💡 AI/ML Explorer |✏️ Sketch Artist  |
<li/>🔗 https://www.linkedin.com/in/meet-parmar-28jan2005

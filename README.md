🧠 AI Chatbot with RAG, Voice Input, Web Scraping & Hindi/English Support

This project is an intelligent, voice-enabled AI chatbot that uses Retrieval-Augmented Generation (RAG) with FastAPI + LangChain + Groq LLaMA3 + FAISS in the backend and React.js in the frontend.

It supports:

💬 Text & 🎤 Voice-based questions

📂 Multiple chat sessions with memory (MongoDB)

📑 Upload custom files (PDF, DOC, DOCX, TXT, CSV)

🔗 Scrape live web pages as knowledge source

🌐 English and Hindi language selection

🔊 Text-to-Speech with interrupt support

🧠 Context-aware answers from documents & web content

🔁 Automatic translation (Hindi ⇄ English)

🚀 Features
Feature	Description
🗃️ Retrieval-Augmented Generation	Answers are based only on facts retrieved from uploaded files or scraped web pages.
🧠 Session-based Memory	Each session is stored in MongoDB and remembers conversation history.
📂 Custom File Upload	Upload your own PDF, DOC/DOCX, TXT, or CSV for each session.
🔗 Web Scraping	Add live content by scraping a website URL (via Firecrawl + BeautifulSoup fallback).
🎙️ Voice Assistant	Ask via voice input using browser’s Speech Recognition API.
🔊 Spoken Responses	Bot’s answers are spoken aloud with gTTS (interrupts if new question is asked).
🌐 Language Switcher	Switch between Hindi and English for both input and output.
🔁 Translation	Automatically translates Hindi queries to English before RAG, and translates answers back.
🤖 Powered by LLM + Groq	Uses LLaMA3-70B via Groq API for blazing-fast inference.
🎨 Modern UI	Sidebar sessions, collapsible menus, typing indicator, Markdown tables & formatting.
📂 Project Structure
AI_agent/
├── app/
│   ├── main.py             # FastAPI backend (chat, TTS, upload, scrape endpoints)
│   ├── rag_chain.py        # RAG setup using LangChain + FAISS + Groq LLaMA3
│   ├── db.py               # MongoDB session management
│   ├── firecrawl_utils.py  # Web scraping (Firecrawl + BeautifulSoup fallback)
│   ├── uploads/            # Uploaded files (ignored in Git)
├── frontend/
│   ├── src/
│   │   ├── App.js          # React app (UI, voice, TTS, sessions, scraping)
│   │   ├── App.css         # Modern styled chat UI
│   ├── package.json        # Frontend dependencies
├── .env                    # Environment config (Groq, MongoDB, Firecrawl keys)
├── requirements.txt        # Backend dependencies

🛠️ Setup Instructions
🔧 Backend (FastAPI + LangChain + MongoDB + gTTS)

Install Python dependencies:

pip install -r requirements.txt


Includes:

fastapi

uvicorn

langchain, langchain-community

faiss-cpu, sentence-transformers

gtts, deep-translator

pymongo

firecrawl (API for scraping)

PyPDF2, python-docx, pandas

Add your .env:

GROQ_API_KEY=your_groq_api_key
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=chatbotDB
FIRECRAWL_API_KEY=your_firecrawl_api_key


Start FastAPI:

python main.py


Make sure MongoDB is running and uploads/ folder exists.

🌐 Frontend (React.js)

Move into frontend:

cd frontend


Install dependencies:

npm install


Start React app:

npm start

🧠 Technologies Used
Area	Tool/Library
Backend Server	FastAPI
AI Model	LLaMA3-70B (Groq API)
RAG Framework	LangChain + FAISS
Embeddings	sentence-transformers (MiniLM)
PDF/Doc/CSV/TXT Loading	PyPDFLoader, TextLoader, CSVLoader, DocxLoader
Web Scraping	Firecrawl API + BeautifulSoup fallback
Text-to-Speech	gTTS (interrupt support)
Translation	deep-translator
Session Storage	MongoDB
Voice Input	Web Speech API
Frontend	React.js + Axios + ReactMarkdown (with tables support)
🧪 Example Prompts
English	Hindi
What is RAG?	RAG क्या है?
Summarize this PDF	इस PDF का सारांश बताइए
What is an AI Agent?	AI एजेंट क्या होता है?
Applications of LangChain?	LangChain के उपयोग क्या हैं?
Scrape this link and summarize it: https://example.com	इस वेबसाइट का सारांश बताओ: https://example.com
⚠️ Known Limitations

🎤 Speech recognition accuracy varies, especially for Hindi technical words (e.g., “LLM” → “IIM”).

🔊 gTTS delay: short pause while generating audio, though playback interruption works smoothly.

📑 Only one source per session: uploading a new file or scraping a link replaces the old context (planned improvement: multi-source support).

🔒 No authentication yet — all sessions are public.

🙏 Acknowledgements

LangChain

Groq API

FAISS

gTTS

Deep Translator

Firecrawl

👤 Author

Meet Parmar
🎓 Integrated MCA @ LJ University
💼 Intern at Mindsyncx Labs → Coginsun Infotech Pvt Ltd.
💡 AI/ML Explorer | ✏️ Sketch Artist
🔗 https://www.linkedin.com/in/meet-parmar-28jan2005

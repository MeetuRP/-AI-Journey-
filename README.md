🧠 AI Chatbot with RAG, Voice Input, Web Scraping & Hindi/English Support

This project is an intelligent, voice-enabled chatbot that uses Retrieval-Augmented Generation (RAG) with FastAPI + LangChain + Groq LLaMA3 + FAISS in the backend and React.js in the frontend.

It supports:

💬 Text & 🎤 Voice-based questions

📂 Multiple chat sessions with memory (MongoDB)

📑 Upload custom files (PDF, DOC, DOCX, TXT, CSV)

🔗 Scrape live web pages into a session as knowledge source

🌐 English and Hindi language selection

🔊 Text-to-Speech using gTTS (with interrupt on new input)

🧠 Context-aware answers using uploaded files or scraped content

🔁 Automatic translation using deep-translator (Hindi ⇄ English)

🚀 Features
Feature	Description
🗃️ Retrieval-Augmented Generation	Answers are based only on facts retrieved from uploaded files or scraped web pages.
🧠 Session-based Memory	Each session is stored in MongoDB and remembers the conversation history.
📂 Multi-File Support	Upload PDF, DOC, DOCX, TXT, or CSV files to personalize the knowledge base.
🔗 Web Scraping	Add knowledge dynamically by scraping any URL (via Firecrawl + BeautifulSoup fallback).
🎙️ Voice Assistant	Ask questions via voice input using browser's built-in Speech Recognition API.
🔊 Spoken Responses	Bot’s answers are spoken aloud using gTTS and can be stopped on new action.
🌐 Language Switcher	Choose between Hindi and English — works for both input and output.
🔁 Translation	Uses deep-translator for Hindi ⇄ English conversion.
🎨 Modern UI	Sidebar sessions, collapsible menus, typing indicator, Markdown tables & formatting.
🤖 Powered by LLM + Groq	Uses LLaMA3-70B via Groq API for blazing-fast cloud inference.
📂 Project Structure
AI_agent/
├── app/
│   ├── main.py             # FastAPI backend with /ask, /tts, session, upload, scrape endpoints
│   ├── rag_chain.py        # RAG setup using LangChain + FAISS + Groq LLaMA3
│   ├── db.py               # MongoDB session management
│   ├── firecrawl_utils.py  # Web scraping (Firecrawl + BeautifulSoup fallback)
│   ├── uploads/            # User-uploaded files (ignored in Git)
├── frontend/
│   ├── src/
│   │   ├── App.js          # React app with voice input, translation, TTS, sessions, scraping
│   │   ├── App.css         # Chat UI styles (dark mode, Markdown formatting, sidebar)
│   ├── package.json        # Frontend dependencies
├── .env                    # Environment config (Groq, MongoDB, Firecrawl keys)
├── requirements.txt        # Backend dependencies

🛠️ Setup Instructions
🔧 Backend (FastAPI + LangChain + gTTS + MongoDB)

Install Python dependencies:

pip install -r requirements.txt


Includes:

fastapi

uvicorn

langchain

langchain-community

langchain-ollama

faiss-cpu

gtts

deep-translator

pymongo

PyPDF2, python-docx, pandas

firecrawl

Add your .env file in root:

# .env
GROQ_API_KEY=your_groq_api_key
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=chatbotDB
FIRECRAWL_API_KEY=your_firecrawl_api_key


Start FastAPI server:

python main.py


Make sure MongoDB is running and uploads/ folder exists.

🌐 Frontend (React.js)

Go to the frontend folder:

cd frontend


Install dependencies:

npm install


Start the app:

npm start

🧠 Technologies Used
Area	Tool/Library
Backend Server	FastAPI
AI Model	LLaMA3-70B (via Groq API)
RAG Framework	LangChain + FAISS
Embeddings	sentence-transformers (MiniLM)
File Loading	PyPDFLoader, TextLoader, CSVLoader, DocxLoader
Web Scraping	Firecrawl API + BeautifulSoup fallback
Text-to-Speech (TTS)	gTTS (with interrupt feature)
Translation	deep-translator
Session Storage	MongoDB
Speech Recognition	Web Speech API
Frontend	React.js + Axios + ReactMarkdown (with tables)
🧪 Example Prompts
English Questions	Hindi Voice/Text Questions
What is RAG?	RAG क्या है?
What is an AI Agent?	AI एजेंट क्या होता है?
Applications of LangChain?	LangChain के उपयोग क्या हैं?
Summarize this PDF	इस PDF का सारांश बताइए
Scrape this link and summarize: https://example.com	इस वेबसाइट का सारांश बताइए: https://example.com
⚠️ Known Limitations

⚠️ Speech recognition accuracy varies — tech terms in Hindi like “LLM” may be misheard as “IIM”.

📢 gTTS has a short delay during audio generation (but stops instantly if interrupted).

📑 Only one source per session — uploading a new file or scraping a new link replaces the old context (future upgrade: multi-source support).

🔒 No authentication yet — all sessions are publicly accessible.

🙏 Acknowledgements

LangChain

Groq API

FAISS

gTTS (Google Text-to-Speech)

Deep Translator

Firecrawl

👤 Author

Meet Parmar

<li/>🎓 Integrated MCA @ LJ University | <li/>💼 Intern at Mindsyncx Labs → Coginsun Infotech Pvt Ltd. | <li/>💡 AI/ML Explorer | ✏️ Sketch Artist | <li/>🔗 https://www.linkedin.com/in/meet-parmar-28jan2005
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import axios from 'axios';
import './App.css';

function App() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [language, setLanguage] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchSessions = async () => {
    const res = await axios.get('http://localhost:8000/sessions');
    setSessions(res.data);
  };

  const fetchMessages = async (sessionId) => {
    const res = await axios.get(`http://localhost:8000/session/${sessionId}`);
    setMessages(res.data.messages || []);
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleSessionChange = (id) => {
    stopAudio();
    setSelectedSession(id);
    if (id) fetchMessages(id);
    else setMessages([]);
  };

  const handleNewSession = async () => {
    const name = prompt("Enter session name:");
    if (!name) return;
    const res = await axios.post('http://localhost:8000/create-session', new URLSearchParams({ session_name: name }));
    await fetchSessions();
    setSelectedSession(res.data.session_id);
    setMessages([]);
  };

  const handleFileUpload = async () => {
    if (!selectedSession) return alert("Select a session first.");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.csv,.txt,.doc,.docx";
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      try {
        await axios.post(`http://localhost:8000/upload/${selectedSession}`, formData);
        alert("✅ File uploaded and context updated.");
      } catch {
        alert("❌ File upload failed.");
      }
    };
    input.click();
    setShowMoreMenu(false);
  };

  const handleScrapeToSession = async () => {
    if (!selectedSession) return alert("Select a session first.");
    const url = prompt("Paste a URL to scrape into session:");
    if (!url) return;

    try {
      await axios.post(
        `http://localhost:8000/scrape/${selectedSession}`,
        new URLSearchParams({ url }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      alert("✅ Link scraped into session.");
    } catch (err) {
      console.error(err);
      alert(`❌ Failed to scrape: ${err.response?.data?.detail || "Unknown error"}`);
    }
    setShowMoreMenu(false);
  };

  const formatBotText = (text) => {
    if (!text) return '';

    // Remove markdown headings
    text = text.replace(/^#+\s+/gm, '');
    // Collapse multiple blank lines outside tables
    // text = text.replace(/([^\S\r\n]*\n){2,}/g, '\n');

    // Trim leading/trailing spaces inside table rows
    text = text.replace(/^\s*\|(.+)\|\s*$/gm, (line) => line.trim());

    const match = text.match(/^.*?[.?!,](\s|$)/);
    if (match) {
      const firstSentence = match[0].trim();
      const rest = text.substring(firstSentence.length).trim();
      return `<span class="highlight">${firstSentence}</span>${rest ? '<br>' + rest : ''}`;
    }
    return `<span class="highlight">${text}</span>`;
  };


  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedSession) return;

    stopAudio();
    const userMsg = { sender: 'user', text: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`http://localhost:8000/ask/${selectedSession}`, {
        question: input,
        lang: language,
      });

      const botText = res.data.answer;
      setMessages(msgs => [...msgs, { sender: 'bot', text: botText }]);

      const ttsRes = await axios.get('http://localhost:8000/tts', {
        params: { text: botText, lang: language },
        responseType: 'blob',
      });

      const audioBlob = new Blob([ttsRes.data], { type: 'audio/mpeg' });
      const audioURL = URL.createObjectURL(audioBlob);
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = audioURL;
      audioRef.current.play();
    } catch {
      setMessages(msgs => [...msgs, { sender: 'bot', text: 'Error: Backend failed.' }]);
    }

    setLoading(false);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech Recognition not supported.");
    const rec = new SpeechRecognition();
    rec.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setRecognizing(true);
    rec.onend = () => setRecognizing(false);
    rec.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      setRecognizing(false);
    };
    rec.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setInput(text);
    };
    rec.start();
    recognitionRef.current = rec;
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="new-session-btn" onClick={handleNewSession}><b>New Session ➕</b></button>
        </div>
        <div className="session-list">
          {sessions.map(s => (
            <div
              key={s.id}
              className={`session-item ${selectedSession === s.id ? 'active' : ''}`}
              onClick={() => handleSessionChange(s.id)}
            >
              {s.name}
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '|||' : '☰'}
          </button>
          <div className="header-info">
            <h2>--AI ChatBot--</h2>
          </div>
          {/* Language Selector */}
          <div className="language-menu-container">
            <button
              type="button"
              className="language-toggle"
              onClick={() => setShowLangMenu(!showLangMenu)}
            >
              🌐
            </button>
            {showLangMenu && (
              <div className="language-menu">
                <button onClick={() => { setLanguage('en'); setShowLangMenu(false); }}>
                  <><b>English</b></>
                </button>
                <button onClick={() => { setLanguage('hi'); setShowLangMenu(false); }}>
                  <><b>Hindi</b></>
                </button>
              </div>
            )}
          </div>
          <div className="msg-count"><button>💬 {messages.length}</button></div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message-row ${msg.sender === "user" ? "user" : "bot"}`}
            >
              <div className={`message-bubble ${msg.sender === "user" ? "user-bubble" : "bot-bubble"}`}>
                {msg.sender === "bot" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {`🤖: ${formatBotText(msg.text)}`}
                  </ReactMarkdown>
                ) : (
                  <ReactMarkdown>{`${msg.text} :😁`}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          {/* AI typing indicator */}
          {loading && (
            <div className="message-bubble bot typing-indicator">
              <span className="typing-text">AI is thinking</span>
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <form className="chat-input-area" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => {
              stopAudio();
              setInput(e.target.value);
            }}
            placeholder="Type your message..."
          />
          <div className="input-buttons">
            <button type="button" onClick={startListening} disabled={recognizing || !selectedSession}>
              {recognizing ? '🎙️' : '🎤'}
            </button>
            <div className="more-menu-container">
              <button type="button" onClick={() => setShowMoreMenu(!showMoreMenu)}>🔼</button>
              {showMoreMenu && (
                <div className="more-menu">
                  <button onClick={handleFileUpload}><b>📄 Upload File</b></button>
                  <button onClick={handleScrapeToSession}><b>🔗 Scraping web</b></button>
                </div>
              )}
            </div>
            <button type="submit" disabled={!input.trim() || !selectedSession} className="send-button"><b>SEND</b></button>
          </div>
        </form>

        <audio ref={audioRef} />
      </div>
    </div>
  );
}

export default App;

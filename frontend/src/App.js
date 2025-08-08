import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
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

  const handleSessionChange = (e) => {
    stopAudio();
    const id = e.target.value;
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
  };

  const formatBotText = (text) => {
    if (!text) return '';

    // First sentence (ends with ., ?, ! or ,)
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
    <div className="App">
      <h2>--AI ChatBot--</h2>

      <div className="session-controls">
        <label>📂 Session:</label>
        <select value={selectedSession} onChange={handleSessionChange}>
          <option value="">-- Select --</option>
          {sessions.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button onClick={handleNewSession}>➕ New Session</button>
        <button onClick={handleFileUpload}>📄 Upload File</button>
        <button onClick={handleScrapeToSession}>🔗 Scrape to Session</button>
      </div>

      <div className="chat-container">
        <div className="chat-window">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.sender}`}>
              {msg.sender === 'bot' ? (
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                  {`🤖: ${formatBotText(msg.text)}`}
                </ReactMarkdown>
              ) : (
                <ReactMarkdown>{`${msg.text} :😁`}</ReactMarkdown>
              )}
            </div>
          ))}
          {loading && <div className="loading">Bot is thinking...</div>}
          <div ref={chatEndRef} />
        </div>

        <div className="language-select">
          <label>🌐 Language:</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        <form onSubmit={handleSend} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              stopAudio();
              setInput(e.target.value);
            }}
            placeholder="Ask something..."
          />
          <button type="submit" disabled={!input.trim() || !selectedSession}>Send</button>
        </form>

        <div className="speech-button">
          <button onClick={startListening} disabled={recognizing || !selectedSession}>
            {recognizing ? '🎙️ Listening...' : '🎤 Speak'}
          </button>
        </div>

        <audio ref={audioRef} />
      </div>

      <h6>Made with ❤️ by MeetParmar</h6>
    </div>
  );
}

export default App;

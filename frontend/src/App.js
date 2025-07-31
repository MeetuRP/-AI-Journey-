import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
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

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get('http://localhost:8000/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  const fetchMessages = async (sessionId) => {
    try {
      const res = await axios.get(`http://localhost:8000/session/${sessionId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to fetch session messages", err);
    }
  };

  const stopAudioPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleSessionChange = (e) => {
    stopAudioPlayback();
    const sessionId = e.target.value;
    setSelectedSession(sessionId);
    if (sessionId) {
      fetchMessages(sessionId);
    } else {
      setMessages([]);
    }
  };

  const handleNewSession = async () => {
    stopAudioPlayback();
    const name = prompt("Enter session name:");
    if (!name) return;

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/pdf";

    fileInput.onchange = async () => {
      const file = fileInput.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('session_name', name);
      formData.append('pdf_file', file);

      try {
        const res = await axios.post('http://localhost:8000/create-session', formData);
        await fetchSessions();
        setSelectedSession(res.data.session_id);
        setMessages([]);
      } catch (err) {
        console.error("Failed to create session", err);
      }
    };

    fileInput.click();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedSession) return;

    stopAudioPlayback();

    const userMessage = { sender: 'user', text: input };
    setMessages((msgs) => [...msgs, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`http://localhost:8000/ask/${selectedSession}`, {
        question: input,
        lang: language,
      });

      const answer = res.data.answer;
      setMessages((msgs) => [...msgs, { sender: 'bot', text: answer }]);

      const ttsRes = await axios.get('http://localhost:8000/tts', {
        params: { text: answer, lang: language },
        responseType: 'blob',
      });

      const audioBlob = new Blob([ttsRes.data], { type: 'audio/mpeg' });
      const audioURL = URL.createObjectURL(audioBlob);
      audioRef.current.src = audioURL;
      audioRef.current.play();
    } catch (err) {
      console.error(err);
      setMessages((msgs) => [...msgs, { sender: 'bot', text: 'Error: Could not reach backend.' }]);
    }

    setLoading(false);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech Recognition not supported");

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setRecognizing(true);
    recognition.onend = () => setRecognizing(false);
    recognition.onerror = (e) => {
      console.error("Speech error:", e);
      setRecognizing(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
    <div className="App">
      <h2>🧠 AI ChatBot with Sessions</h2>

      <div className="session-controls">
        <label>📂 Chat Session:</label>
        <select value={selectedSession} onChange={handleSessionChange}>
          <option value="">-- Select a session --</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button onClick={handleNewSession}>➕ New Session</button>
      </div>

      <div className="chat-container">
        <div className="chat-window">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.sender}`}>
              {msg.sender === 'bot' ? (
                <div className="bot-text">
                  <strong>🤖</strong>
                  <span className={`bot-markdown ${idx === 0 && msg.sender === 'bot' ? 'first-bot-message' : ''}`}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </span>
                </div>
              ) : (
                <div>
                  {msg.text}
                  <strong> 😁</strong>
                </div>
              )}
            </div>
          ))}
          {loading && <div className="loading">Bot is typing...</div>}
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
              stopAudioPlayback();
              setInput(e.target.value);
            }}
            placeholder="Type your question..."
            disabled={loading || !selectedSession}
          />
          <button type="submit" disabled={loading || !input.trim() || !selectedSession}>
            Send
          </button>
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

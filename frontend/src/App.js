import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! Ask me anything about AI concepts.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' = English, 'hi' = Hindi

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  // Send question to FastAPI backend
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(msgs => [...msgs, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/ask', {
        question: input,
        lang: language  // Send selected language
      });

      const answer = response.data.answer;

      setMessages(msgs => [...msgs, { sender: 'bot', text: answer }]);

      // Fetch voice from TTS endpoint
      const ttsResponse = await axios.get('http://localhost:8000/tts', {
        params: { text: answer, lang: language },
        responseType: 'blob'
      });

      // Create audio URL and play it
      const audioBlob = new Blob([ttsResponse.data], { type: 'audio/mpeg' });
      const audioURL = URL.createObjectURL(audioBlob);
      audioRef.current.src = audioURL;
      audioRef.current.play();
    } catch (err) {
      console.error(err);
      setMessages(msgs => [...msgs, { sender: 'bot', text: 'Error: Could not reach backend.' }]);
    }

    setLoading(false);
  };

  // Start speech recognition
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
    <div className="App" style={{ background: '#181c20', minHeight: '100vh', color: '#fff' }}>
      <h2 style={{ padding: '1rem' }}>AI Chatbot</h2>

      <div style={{ maxWidth: 600, margin: '0 auto', background: '#23272f', borderRadius: 8, padding: 24 }}>
        
        {/* Chat Display */}
        <div style={{ maxHeight: 400, overflowY: 'auto', background: '#1a1d22', padding: 8, borderRadius: 6 }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              textAlign: msg.sender === 'user' ? 'right' : 'left',
              margin: '8px 0',
              color: msg.sender === 'user' ? '#7ecfff' : '#fff'
            }}>
              <span style={{ fontWeight: msg.sender === 'bot' ? 'bold' : 'normal' }}>
                {msg.sender === 'bot' ? '🤖 ' : ''}{msg.text}
              </span>
            </div>
          ))}
          {loading && <div style={{ color: '#aaa' }}>Bot is typing...</div>}
        </div>

        {/* Language Dropdown */}
        <div style={{ marginTop: 10 }}>
          <label>🌐 Language: </label>
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        {/* Input Field */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your question..."
            style={{ flex: 1, padding: 10, borderRadius: 4, border: '1px solid #444', background: '#23272f', color: '#fff' }}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} style={{ padding: '0 18px' }}>
            Send
          </button>
        </form>

        {/* Voice Input Button */}
        <button onClick={startListening} disabled={recognizing} style={{ marginTop: 10 }}>
          {recognizing ? "🎙️ Listening..." : "🎤 Speak"}
        </button>

        {/* Audio Playback */}
        <audio ref={audioRef} />
      </div>
    </div>
  );
}

export default App;

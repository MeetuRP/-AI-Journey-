import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown'; // To render Markdown-formatted bot responses
import axios from 'axios';
import './App.css';

function App() {
  // State for chat messages
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello There! Ask me anything related to the PDF you\'ve given!' }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' = English, 'hi' = Hindi

  const recognitionRef = useRef(null); // For speech-to-text recognition
  const audioRef = useRef(null);       // For TTS audio playback

  // Sends user input to the FastAPI backend and handles response
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(msgs => [...msgs, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // 1. Send question and language to FastAPI
      const response = await axios.post('http://localhost:8000/ask', {
        question: input,
        lang: language
      });

      const answer = response.data.answer;
      setMessages(msgs => [...msgs, { sender: 'bot', text: answer }]);

      // 2. Request voice/audio from FastAPI using TTS
      const ttsResponse = await axios.get('http://localhost:8000/tts', {
        params: { text: answer, lang: language },
        responseType: 'blob'
      });

      // 3. Convert to audio and play
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

  // Trigger speech-to-text recognition
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

    // Capture final recognized text and set it as input
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
    <div className="App">
      <h2>AI ChatBot</h2>

      <div className="chat-container">
        {/* Chat display */}
        <div className="chat-window">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.sender}`}>
              {msg.sender === 'bot' ? (
                <div className="bot-text">
                  <strong>🤖</strong>
                  <span className={`bot-markdown ${idx === 0 && msg.sender === 'bot' ? 'first-bot-message' : ''}`}>
                    <ReactMarkdown children={msg.text} />
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

        {/* Language selector */}
        <div className="language-select">
          <label>🌐 Language: </label>
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        {/* Text input */}
        <form onSubmit={handleSend} className="input-form">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>

        {/* Speech-to-text button */}
        <div className="speech-button">
          <button onClick={startListening} disabled={recognizing}>
            {recognizing ? "🎙️ Listening..." : "🎤 Speak"}
          </button>
        </div>

        {/* TTS audio output */}
        <audio ref={audioRef} />
      </div>
      <h6>Made with ❤️ by MeetParmar</h6>
    </div>
  );
}

export default App;

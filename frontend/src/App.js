import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! Ask me anything about AI concepts.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages((msgs) => [...msgs, userMessage]);
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/ask', {
        question: input
      });
      const data = response.data;
      setMessages((msgs) => [...msgs, { sender: 'bot', text: data.answer }]);
    } catch (err) {
      setMessages((msgs) => [...msgs, { sender: 'bot', text: 'Error: Could not reach backend.' }]);
    }
    setInput('');
    setLoading(false);
  };

  return (
    <div className="App" style={{ background: '#181c20', minHeight: '100vh', color: '#fff' }}>
      <h2 style={{ marginTop: 0, padding: '1rem' }}>AI Chatbot</h2>
      <div style={{ maxWidth: 600, margin: '0 auto', background: '#23272f', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px #0003' }}>
        <div style={{ minHeight: 300, maxHeight: 350, overflowY: 'auto', marginBottom: 16, padding: 8, background: '#1a1d22', borderRadius: 6 }}>
          
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              textAlign: msg.sender === 'user' ? 'right' : 'left',
              margin: '8px 0',
              color: msg.sender === 'user' ? '#7ecfff' : '#fff'
            }}>
              <span style={{ fontWeight: msg.sender === 'bot' ? 'bold' : 'normal' }}>
                {msg.sender === 'bot' ? '🤖 ' : ''}
                {msg.text}
              </span>
            </div>
          ))}

          {loading && <div style={{ color: '#aaa' }}>Bot is typing...</div>}
        </div>


        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your question..."
            style={{ flex: 1, padding: 10, borderRadius: 4, border: '1px solid #444', background: '#23272f', color: '#fff' }}
            disabled={loading}
            autoFocus
          />

          <button type="submit" disabled={loading || !input.trim()} style={{ padding: '0 18px', borderRadius: 4, border: 'none', background: '#7ecfff', color: '#181c20', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
            Send
          </button>
        </form>


      </div>
    </div>
  );
}

export default App;

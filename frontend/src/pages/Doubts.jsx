import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

function Doubts() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  // Load subjects on mount
  useEffect(() => {
    api.get('/api/subjects').then((res) => setSubjects(res.data)).catch(() => setSubjects([]));
  }, []);

  // Fetch messages for the selected subject
  const loadMessages = async (subjectId) => {
    try {
      const res = await api.get(`/api/doubts/subject/${subjectId}`);
      setMessages(res.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Subscribe to join the doubt discussion.');
      } else {
        setError('Could not load messages.');
      }
    }
  };

  // When a subject is picked, load messages + start polling
  const openSubject = (subject) => {
    setSelectedSubject(subject);
    setMessages([]);
    loadMessages(subject.id);

    // clear any old poll, start a new one (every 4 seconds)
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(subject.id), 4000);
  };

  // Clean up polling when leaving the page
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSubject) return;
    try {
      await api.post(`/api/doubts/subject/${selectedSubject.id}`, { message: newMessage });
      setNewMessage('');
      loadMessages(selectedSubject.id); // refresh immediately
    } catch (err) {
      setError(err.response?.status === 403 ? 'Subscribe to ask doubts.' : 'Could not send.');
    }
  };

  return (
    <div className="page">
      <h2>Doubt Discussion</h2>

      {/* Subject picker */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {subjects.map((s) => (
          <button key={s.id}
            className={selectedSubject?.id === s.id ? 'btn' : 'btn btn-secondary'}
            onClick={() => openSubject(s)}>{s.name}</button>
        ))}
      </div>

      {error && <p className="message error">{error}</p>}

      {selectedSubject && !error && (
        <div className="card" style={{ maxWidth: '100%' }}>
          <h3>{selectedSubject.name} — Discussion</h3>

          {/* Messages area */}
          <div style={{
            maxHeight: '50vh', overflowY: 'auto', padding: '10px',
            background: '#f9fafb', borderRadius: '8px', marginBottom: '12px'
          }}>
            {messages.length === 0 && <p style={{ color: '#999' }}>No doubts yet. Be the first to ask!</p>}
            {messages.map((m) => {
              const isTeacher = m.userRole === 'TEACHER' || m.userRole === 'ADMIN';
              return (
                <div key={m.id} style={{
                  margin: '10px 0', padding: '10px 14px', borderRadius: '10px',
                  background: isTeacher ? '#dbeafe' : '#ffffff',
                  border: '1px solid ' + (isTeacher ? '#93c5fd' : '#e5e7eb'),
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: isTeacher ? '#1d4ed8' : '#374151' }}>
                    {m.userName} {isTeacher && <span style={{ fontSize: '11px' }}>👨‍🏫 Teacher</span>}
                  </div>
                  <div style={{ marginTop: '4px' }}>{m.message}</div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Compose box */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input className="input" style={{ margin: 0, flex: 1 }}
              placeholder="Type your doubt..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
            <button className="btn" onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Doubts;
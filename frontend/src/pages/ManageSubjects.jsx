import { useState, useEffect } from 'react';
import api from '../services/api';

function ManageSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const loadSubjects = async () => {
    try {
      const res = await api.get('/api/subjects');
      setSubjects(res.data);
    } catch { setSubjects([]); }
  };

  useEffect(() => { loadSubjects(); }, []);

  const addSubject = async () => {
    try {
      await api.post('/api/subjects/add', { name, description });
      setMessage('Subject added!');
      setName(''); setDescription('');
      loadSubjects();
    } catch (error) {
      setMessage(error.response?.status === 403 ? 'Only admin can add subjects.' : 'Failed to add subject.');
    }
  };

  return (
    <div className="page">
      <h2>Manage Subjects</h2>
      <div className="card" style={{ margin: '0 0 24px 0', maxWidth: '100%' }}>
        <h3>Add Subject</h3>
        <input className="input" placeholder="Subject name (e.g. Mathematics)"
          value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Description"
          value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className="btn" onClick={addSubject}>Add Subject</button>
        {message && <p className="message">{message}</p>}
      </div>

      <h3>All Subjects ({subjects.length})</h3>
      {subjects.map((s) => (
        <div key={s.id} className="video-card">
          <h3>{s.name}</h3>
          <p>{s.description}</p>
          <p style={{ fontSize: '13px', color: '#999' }}>ID: {s.id}</p>
        </div>
      ))}
    </div>
  );
}

export default ManageSubjects;
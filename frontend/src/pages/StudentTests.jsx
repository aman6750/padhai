import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function StudentTests() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [tests, setTests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/subjects').then((res) => setSubjects(res.data)).catch(() => setSubjects([]));
  }, []);

  const openSubject = async (subject) => {
    setSelectedSubject(subject);
    try {
      const res = await api.get(`/api/tests/subject/${subject.id}`);
      setTests(res.data);
    } catch { setTests([]); }
  };

  return (
    <div className="page">
      <h2>Mock Tests</h2>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {subjects.map((s) => (
          <button key={s.id}
            className={selectedSubject?.id === s.id ? 'btn' : 'btn btn-secondary'}
            onClick={() => openSubject(s)}>{s.name}</button>
        ))}
      </div>

      {selectedSubject && (
        <>
          <h3>{selectedSubject.name} — Tests ({tests.length})</h3>
          {tests.length === 0 && <p>No tests yet.</p>}
          {tests.map((t) => (
            <div key={t.id} className="video-card">
              <h3>{t.title} {t.isFree && <span style={{ color: 'green', fontSize: '14px' }}>(Free)</span>}</h3>
              <p>{t.description} · ⏱ {t.durationMinutes} min</p>
              <button className="btn" onClick={() => navigate(`/test/${t.id}`)}>Start Test</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default StudentTests;
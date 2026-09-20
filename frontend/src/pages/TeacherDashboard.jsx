import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function TeacherDashboard() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [noteCount, setNoteCount] = useState(0);
  const [testCount, setTestCount] = useState(0);

  useEffect(() => {
    api.get('/api/users/me/subjects').then((res) => setSubjects(res.data)).catch(() => setSubjects([]));
    api.get('/api/notes/my-subject-notes/count').then((res) => setNoteCount(res.data.count)).catch(() => {});
    api.get('/api/tests/my-subject-tests/count').then((res) => setTestCount(res.data.count)).catch(() => {});
  }, []);

  return (
    <div className="page">
      <h2>Teacher Dashboard</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>Welcome! Manage your subjects and content below.</p>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-number">{subjects.length}</div>
          <div className="stat-label">My Subjects</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{noteCount}</div>
          <div className="stat-label">Notes Uploaded</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{testCount}</div>
          <div className="stat-label">Tests Created</div>
        </div>
      </div>

      {/* My subjects */}
      <h3>My Subjects</h3>
      {subjects.length === 0 ? (
        <p style={{ color: '#666' }}>No subjects assigned yet. Contact the admin.</p>
      ) : (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '12px 0 28px' }}>
          {subjects.map((s) => (
            <span key={s.id} style={{
              background: '#dbeafe', color: '#1d4ed8', padding: '8px 16px',
              borderRadius: '20px', fontWeight: 500
            }}>
              {s.name}
            </span>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <h3>Quick Actions</h3>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
        <button className="btn" onClick={() => navigate('/teacher/notes')}>📄 Add Notes</button>
        <button className="btn" onClick={() => navigate('/teacher/tests')}>📝 Manage Tests</button>
        <button className="btn btn-secondary" onClick={() => navigate('/doubts')}>💬 Answer Doubts</button>
      </div>
    </div>
  );
}

export default TeacherDashboard;
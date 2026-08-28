import { useState, useEffect } from 'react';
import api from '../services/api';

function AssignTeacher() {
  const [users, setUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      const [usersRes, subjectsRes] = await Promise.all([
        api.get('/api/users/all'),
        api.get('/api/subjects'),
      ]);
      setUsers(usersRes.data);
      setSubjects(subjectsRes.data);
    } catch {
      setMessage('Could not load data.');
    }
  };

  useEffect(() => { loadData(); }, []);

  const toggleSubject = (id) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const assign = async () => {
    if (!selectedUser || selectedSubjects.length === 0) {
      setMessage('Pick a user and at least one subject.');
      return;
    }
    try {
      await api.post('/api/users/assign-teacher', {
        userId: parseInt(selectedUser),
        subjectIds: selectedSubjects,
      });
      setMessage('Teacher assigned successfully!');
      setSelectedUser(''); setSelectedSubjects([]);
      loadData();
    } catch {
      setMessage('Failed to assign teacher.');
    }
  };

  return (
    <div className="page">
      <h2>Assign Teacher</h2>
      <div className="card" style={{ maxWidth: '100%' }}>
        <h3>Promote a user to Teacher</h3>

        <select className="input" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
          <option value="">Select User</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name} ({u.email}) — {u.role}</option>
          ))}
        </select>

        <p style={{ margin: '12px 0 8px', fontWeight: 500 }}>Assign subjects:</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {subjects.map((s) => (
            <button
              key={s.id}
              className={selectedSubjects.includes(s.id) ? 'btn' : 'btn btn-secondary'}
              onClick={() => toggleSubject(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>

        <button className="btn" onClick={assign}>Assign as Teacher</button>
        {message && <p className="message">{message}</p>}
      </div>

      <h3 style={{ marginTop: '32px' }}>All Users</h3>
      <div className="card" style={{ maxWidth: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '8px' }}>Name</th>
              <th style={{ padding: '8px' }}>Email</th>
              <th style={{ padding: '8px' }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '8px' }}>{u.name}</td>
                <td style={{ padding: '8px' }}>{u.email}</td>
                <td style={{ padding: '8px' }}>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AssignTeacher;
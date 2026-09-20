import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/api/users/admin/stats')
      .then((res) => setStats(res.data))
      .catch(() => setStats(null));
  }, []);

  return (
    <div className="page">
      <h2>Admin Dashboard</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>Platform overview and management.</p>

      {/* Stats grid */}
      {stats ? (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
          <div className="stat-card"><div className="stat-number">{stats.totalUsers}</div><div className="stat-label">Total Users</div></div>
          <div className="stat-card"><div className="stat-number">{stats.students}</div><div className="stat-label">Students</div></div>
          <div className="stat-card"><div className="stat-number">{stats.teachers}</div><div className="stat-label">Teachers</div></div>
          <div className="stat-card"><div className="stat-number">{stats.subjects}</div><div className="stat-label">Subjects</div></div>
          <div className="stat-card"><div className="stat-number">{stats.notes}</div><div className="stat-label">Notes</div></div>
          <div className="stat-card"><div className="stat-number">{stats.tests}</div><div className="stat-label">Tests</div></div>
          <div className="stat-card"><div className="stat-number">{stats.videos}</div><div className="stat-label">Videos</div></div>
        </div>
      ) : (
        <p>Loading stats...</p>
      )}

      {/* Management actions */}
      <h3>Management</h3>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
        <button className="btn" onClick={() => navigate('/admin/subjects')}>📚 Manage Subjects</button>
        <button className="btn" onClick={() => navigate('/admin/teachers')}>👨‍🏫 Manage Teachers</button>
        <button className="btn" onClick={() => navigate('/admin')}>🎬 Manage Videos</button>
      </div>
    </div>
  );
}

export default AdminDashboard;
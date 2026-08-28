import { useState, useEffect } from 'react';
import api from '../services/api';

function Admin() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoId, setVideoId] = useState('');
  const [orderIndex, setOrderIndex] = useState('');
  const [message, setMessage] = useState('');
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState([]);

  const loadVideos = async () => {
    try {
      const response = await api.get('/api/videos');
      setVideos(response.data);
    } catch { setVideos([]); }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/api/users/all');
      setUsers(response.data);
    } catch { setUsers([]); }
  };

  useEffect(() => {
    loadVideos();
    loadUsers();
  }, []);

  const handleAddVideo = async () => {
    try {
      await api.post('/api/videos/add', {
        title, description, videoUrl: videoId,
        thumbnailUrl: 'https://via.placeholder.com/300x180',
        orderIndex: parseInt(orderIndex) || 1,
      });
      setMessage('Video added successfully!');
      setTitle(''); setDescription(''); setVideoId(''); setOrderIndex('');
      loadVideos();
    } catch (error) {
      setMessage(error.response?.status === 403 ? 'Only admins can add videos.' : 'Failed to add video.');
    }
  };

  const handleDeleteVideo = async (id) => {
    if (!window.confirm('Delete this video?')) return;
    try {
      await api.delete(`/api/videos/${id}`);
      loadVideos();
    } catch {
      setMessage('Failed to delete video.');
    }
  };

  return (
    <div className="page">
      <h2>Admin Panel</h2>

      {/* Add Video Form */}
      <div className="card" style={{ margin: '0 0 24px 0', maxWidth: '100%' }}>
        <h3>Add New Video</h3>
        <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="input" placeholder="VdoCipher Video ID" value={videoId} onChange={(e) => setVideoId(e.target.value)} />
        <input className="input" placeholder="Order (1, 2, 3...)" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} />
        <button className="btn" onClick={handleAddVideo}>Add Video</button>
        {message && <p className="message">{message}</p>}
      </div>

      {/* Videos list with delete */}
      <h3>Existing Videos ({videos.length})</h3>
      {videos.map((v) => (
        <div key={v.id} className="video-card">
          <h3>{v.title}</h3>
          <p>{v.description}</p>
          <p style={{ fontSize: '13px', color: '#999' }}>ID: {v.videoUrl} · Order: {v.orderIndex}</p>
          <button className="btn btn-secondary" onClick={() => handleDeleteVideo(v.id)}>Delete</button>
        </div>
      ))}

      {/* Users table */}
      <h3 style={{ marginTop: '32px' }}>Users ({users.length})</h3>
      <div className="card" style={{ maxWidth: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '8px' }}>ID</th>
              <th style={{ padding: '8px' }}>Name</th>
              <th style={{ padding: '8px' }}>Email</th>
              <th style={{ padding: '8px' }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '8px' }}>{u.id}</td>
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

export default Admin;
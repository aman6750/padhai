import { useState, useEffect } from 'react';
import api from '../services/api';

function Admin() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoId, setVideoId] = useState('');
  const [orderIndex, setOrderIndex] = useState('');
  const [message, setMessage] = useState('');
  const [videos, setVideos] = useState([]);

  // Load existing videos
  const loadVideos = async () => {
    try {
      const response = await api.get('/api/videos');
      setVideos(response.data);
    } catch (error) {
      // if not subscribed, videos list may 403 — that's ok for admin view
      setVideos([]);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleAddVideo = async () => {
    try {
      await api.post('/api/videos/add', {
        title,
        description,
        videoUrl: videoId, // the VdoCipher Video ID
        thumbnailUrl: 'https://via.placeholder.com/300x180',
        orderIndex: parseInt(orderIndex) || 1,
      });
      setMessage('Video added successfully!');
      // clear form
      setTitle('');
      setDescription('');
      setVideoId('');
      setOrderIndex('');
      loadVideos();
    } catch (error) {
      if (error.response?.status === 403) {
        setMessage('Only admins can add videos.');
      } else {
        setMessage('Failed to add video.');
      }
    }
  };

  return (
    <div className="page">
      <h2>Admin Panel</h2>

      <div className="card" style={{ margin: '0 0 24px 0', maxWidth: '100%' }}>
        <h3>Add New Video</h3>
        <input className="input" placeholder="Title"
          value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" placeholder="Description"
          value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="input" placeholder="VdoCipher Video ID"
          value={videoId} onChange={(e) => setVideoId(e.target.value)} />
        <input className="input" placeholder="Order (1, 2, 3...)"
          value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} />
        <button className="btn" onClick={handleAddVideo}>Add Video</button>
        {message && <p className="message">{message}</p>}
      </div>

      <h3>Existing Videos ({videos.length})</h3>
      {videos.map((v) => (
        <div key={v.id} className="video-card">
          <h3>{v.title}</h3>
          <p>{v.description}</p>
          <p style={{ fontSize: '13px', color: '#999' }}>ID: {v.videoUrl} · Order: {v.orderIndex}</p>
        </div>
      ))}
    </div>
  );
}

export default Admin;
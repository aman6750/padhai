import { useState, useEffect } from 'react';
import api from '../services/api';

function Videos() {
  const [videos, setVideos] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await api.get('/api/videos');
        setVideos(response.data);
      } catch (error) {
        if (error.response?.status === 403) {
          setMessage('You need an active subscription to watch videos. Please subscribe from the Dashboard.');
        } else {
          setMessage('Could not load videos. Are you logged in?');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return <p style={{ padding: '40px' }}>Loading videos...</p>;
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px' }}>
      <h1>पढ़AI</h1>
      <h2>Video Lessons</h2>

      {message && <p style={{ color: 'red' }}>{message}</p>}

      {videos.map((video) => (
        <div
          key={video.id}
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0' }}>{video.title}</h3>
          <p style={{ margin: '0 0 10px 0', color: '#555' }}>{video.description}</p>
          <video width="100%" controls>
            <source src={video.videoUrl} type="video/mp4" />
            Your browser does not support video.
          </video>
        </div>
      ))}
    </div>
  );
}

export default Videos;
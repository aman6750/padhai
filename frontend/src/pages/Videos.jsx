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
          setMessage('Could not load videos.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  if (loading) return <div className="page"><p>Loading videos...</p></div>;

  return (
    <div className="page">
      <h2>Video Lessons</h2>
      {message && <p className="message error">{message}</p>}
      {videos.map((video) => (
        <div key={video.id} className="video-card">
          <h3>{video.title}</h3>
          <p>{video.description}</p>
          <video controls>
            <source src={video.videoUrl} type="video/mp4" />
          </video>
        </div>
      ))}
    </div>
  );
}

export default Videos;
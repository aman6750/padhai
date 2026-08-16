import { useEffect, useState } from 'react';
import api from '../services/api';

function Videos() {
  const [videos, setVideos] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState(null); // which video is playing

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

  // Fetch OTP and start playing a video
  const playVideo = async (video) => {
    try {
      const response = await api.get(`/api/videos/${video.videoUrl}/otp`);
      setPlayingVideo({
        id: video.id,
        otp: response.data.otp,
        playbackInfo: response.data.playbackInfo,
      });
    } catch (error) {
      setMessage('Could not load video. Please try again.');
    }
  };

  if (loading) return <div className="page"><p>Loading videos...</p></div>;

  return (
    <div className="page">
      <h2>Video Lessons</h2>
      {message && <p className="message error">{message}</p>}

      {videos.map((video) => (
        <div key={video.id} className="video-card">
          <h3>{video.title}</h3>
          <p>{video.description}</p>

          {playingVideo && playingVideo.id === video.id ? (
            // Show the secure VdoCipher player
            <iframe
              src={`https://player.vdocipher.com/v2/?otp=${playingVideo.otp}&playbackInfo=${playingVideo.playbackInfo}`}
              style={{ width: '100%', height: '400px', border: 0 }}
              allow="encrypted-media"
              allowFullScreen
              title={video.title}
            ></iframe>
          ) : (
            // Show a play button
            <button className="btn" onClick={() => playVideo(video)}>
              ▶ Play Lesson
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default Videos;
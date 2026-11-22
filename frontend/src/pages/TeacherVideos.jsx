import { useEffect, useState } from 'react';
import axios from 'axios';                 // plain axios: for the upload straight to VdoCipher
import api from '../services/api';          // our backend (adds the login token)
import { subjectLabel } from '../utils/subjectLabel';

// Teacher (or admin) uploads a recorded video into one of their subjects.
// 3 steps: 1) our backend gets a one-time upload permission from VdoCipher
//          2) the browser sends the file straight to VdoCipher (with a progress bar)
//          3) our backend saves the video in the chosen subject
function TeacherVideos() {
  const [subjects, setSubjects] = useState([]);   // subjects this user may upload to
  const [videos, setVideos] = useState([]);       // videos in those subjects
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [orderIndex, setOrderIndex] = useState('');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);    // 0–100 while uploading
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Load my subjects (teacher → assigned ones; admin → all), then their videos
  const loadData = async () => {
    try {
      const roleRes = await api.get('/api/users/me/role');
      const subjRes = roleRes.data.role === 'ADMIN'
        ? await api.get('/api/subjects')
        : await api.get('/api/users/me/subjects');
      setSubjects(subjRes.data);
      const myIds = subjRes.data.map((s) => s.id);
      const vidRes = await api.get('/api/videos');
      // only show videos that belong to my subjects
      setVideos(vidRes.data.filter((v) => myIds.includes(v.subjectId)));
    } catch {
      setSubjects([]);
      setVideos([]);
    }
  };

  useEffect(() => { loadData(); }, []);

  const subjectById = (id) => subjects.find((s) => s.id === id);

  const uploadVideo = async () => {
    if (!subjectId) { setMessage('Please choose the subject & class.'); return; }
    if (!title.trim()) { setMessage('Please enter a title.'); return; }
    if (!file) { setMessage('Please choose a video file.'); return; }

    setUploading(true);
    setProgress(0);
    setMessage('');
    try {
      // 1) one-time upload permission from VdoCipher (through our backend)
      const credRes = await api.post('/api/videos/upload-credentials', {
        title, subjectId: parseInt(subjectId),
      });
      const { clientPayload, videoId } = credRes.data;

      // 2) send the file straight to VdoCipher's storage.
      //    The fields must be in this order, and the FILE MUST BE LAST.
      const form = new FormData();
      form.append('x-amz-credential', clientPayload['x-amz-credential']);
      form.append('x-amz-algorithm', clientPayload['x-amz-algorithm']);
      form.append('x-amz-date', clientPayload['x-amz-date']);
      form.append('x-amz-signature', clientPayload['x-amz-signature']);
      form.append('key', clientPayload.key);
      form.append('policy', clientPayload.policy);
      form.append('success_action_status', '201');
      form.append('success_action_redirect', '');
      form.append('file', file);
      await axios.post(clientPayload.uploadLink, form, {
        // update the progress bar as the file goes up
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      // 3) save the video in the chosen subject (videoUrl = VdoCipher id)
      await api.post('/api/videos/add', {
        title,
        description,
        videoUrl: videoId,
        thumbnailUrl: 'https://via.placeholder.com/300x180',
        orderIndex: parseInt(orderIndex) || 1,
        subjectId: parseInt(subjectId),
      });

      setMessage('✅ Uploaded! VdoCipher takes a few minutes to process it before students can play it.');
      setTitle(''); setDescription(''); setOrderIndex(''); setFile(null); setProgress(0);
      // clear the file box on screen too
      const input = document.getElementById('video-file');
      if (input) input.value = '';
      loadData();
    } catch (error) {
      setMessage(error.response?.status === 403
        ? 'You can only upload videos to your own subjects.'
        : 'Upload failed. Please check your internet and try again.');
    } finally {
      setUploading(false);
    }
  };

  const deleteVideo = async (video) => {
    if (!window.confirm(`Delete "${video.title}"?`)) return;
    try {
      await api.delete(`/api/videos/${video.id}`);
      loadData();
    } catch {
      setMessage('Failed to delete video.');
    }
  };

  return (
    <div className="page">
      <h2>Upload Videos</h2>

      <div className="card" style={{ margin: '0 0 24px 0', maxWidth: '100%' }}>
        <h3>Upload a recorded video</h3>
        {subjects.length === 0 && (
          <p style={{ color: '#666' }}>No subjects assigned to you yet. Ask the admin to assign your subjects.</p>
        )}
        <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Select subject & class</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{subjectLabel(s)}</option>)}
        </select>
        <input className="input" placeholder="Title (e.g. Chapter 3 – Fractions)"
          value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" placeholder="Description"
          value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="input" placeholder="Order (1, 2, 3...)"
          value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} />
        {/* accept="video/*" → the file picker shows only video files */}
        <input id="video-file" className="input" type="file" accept="video/*"
          onChange={(e) => setFile(e.target.files[0] || null)} />

        {uploading && (
          <div style={{ margin: '8px 0' }}>
            <div style={{ height: '10px', background: '#e5e7eb', borderRadius: '5px' }}>
              <div style={{ width: `${progress}%`, height: '10px', background: '#2563eb', borderRadius: '5px' }} />
            </div>
            <p style={{ color: '#666' }}>Uploading… {progress}% (keep this page open)</p>
          </div>
        )}

        <button className="btn" onClick={uploadVideo} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload Video'}
        </button>
        {message && <p className="message">{message}</p>}
      </div>

      <h3>My Videos ({videos.length})</h3>
      {videos.map((v) => (
        <div key={v.id} className="video-card">
          <h3>{v.title}</h3>
          <p style={{ fontSize: '13px', color: '#2563eb', margin: '0 0 4px' }}>
            {subjectLabel(subjectById(v.subjectId))}
          </p>
          <p>{v.description}</p>
          <button className="btn btn-secondary" onClick={() => deleteVideo(v)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default TeacherVideos;
import { useState, useEffect } from 'react';
import api from '../services/api';
import { subjectLabel, classLabel } from '../utils/subjectLabel';

function Admin() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoId, setVideoId] = useState('');
  const [orderIndex, setOrderIndex] = useState('');
  const [subjectId, setSubjectId] = useState('');      // subject chosen for a new video
  const [message, setMessage] = useState('');
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);        // for the subject dropdowns
  const [classes, setClasses] = useState([]);          // for the users' class dropdown

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

  // All subjects (admin gets every school and class)
  const loadSubjects = async () => {
    try {
      const response = await api.get('/api/subjects');
      setSubjects(response.data);
    } catch { setSubjects([]); }
  };

  // All classes
  const loadClasses = async () => {
    try {
      const response = await api.get('/api/classes');
      setClasses(response.data);
    } catch { setClasses([]); }
  };

  useEffect(() => {
    loadVideos();
    loadUsers();
    loadSubjects();
    loadClasses();
  }, []);

  // Helper → find a subject by its id (to show each video's subject)
  const subjectById = (id) => subjects.find((s) => s.id === id);

  const handleAddVideo = async () => {
    // A video must have a subject, otherwise no student can see it
    if (!subjectId) { setMessage('Please choose the subject (class) for this video.'); return; }
    try {
      await api.post('/api/videos/add', {
        title, description, videoUrl: videoId,
        thumbnailUrl: 'https://via.placeholder.com/300x180',
        orderIndex: parseInt(orderIndex) || 1,
        subjectId: parseInt(subjectId),               // send the subject
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

  // Move a video to a subject: PUT /api/videos/{id}/subject
  // This is how you fix your OLD videos.
  const changeVideoSubject = async (video, newSubjectId) => {
    if (!newSubjectId) return;
    try {
      await api.put(`/api/videos/${video.id}/subject`, { subjectId: parseInt(newSubjectId) });
      loadVideos();
    } catch {
      setMessage('Failed to update video.');
    }
  };

  // Set a student's class: PUT /api/users/{id}/class
  // "Not set" ('') → null, otherwise the id as a number
  const changeUserClass = async (user, classId) => {
    try {
      await api.put(`/api/users/${user.id}/class`, { classId: classId ? parseInt(classId) : null });
      loadUsers();
    } catch {
      setMessage('Failed to update class.');
    }
  };

  // NEW: delete a user after a confirmation popup (permanent!)
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name} (${user.email})? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/users/${user.id}`);
      loadUsers();   // refresh the table
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="page">
      <h2>Admin Panel</h2>

      {/* Add Video Form */}
      <div className="card" style={{ margin: '0 0 24px 0', maxWidth: '100%' }}>
        <h3>Add New Video</h3>
        {/* Pick the subject (and so the school and class) first */}
        <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Select subject & class</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{subjectLabel(s)}</option>)}
        </select>
        <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="input" placeholder="VdoCipher Video ID" value={videoId} onChange={(e) => setVideoId(e.target.value)} />
        <input className="input" placeholder="Order (1, 2, 3...)" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} />
        <button className="btn" onClick={handleAddVideo}>Add Video</button>
        {message && <p className="message">{message}</p>}
      </div>

      {/* Videos list with subject + "Move to subject" dropdown */}
      <h3>Existing Videos ({videos.length})</h3>
      {videos.map((v) => {
        const subj = subjectById(v.subjectId);   // this video's subject (or undefined)
        return (
          <div key={v.id} className="video-card">
            <h3>{v.title}</h3>
            <p>{v.description}</p>
            {/* Grey normally; RED if the video has no subject yet */}
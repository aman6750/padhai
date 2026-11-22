import { useState, useEffect } from 'react';
import api from '../services/api';
import { subjectLabel, classLabel } from '../utils/subjectLabel';

function Admin() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoId, setVideoId] = useState('');
  const [orderIndex, setOrderIndex] = useState('');
  const [subjectId, setSubjectId] = useState('');      // NEW: subject chosen for a new video
  const [message, setMessage] = useState('');
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);        // NEW: for the subject dropdowns
  const [classes, setClasses] = useState([]);          // NEW: for the users' class dropdown

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

  // NEW: all subjects (admin gets every class)
  const loadSubjects = async () => {
    try {
      const response = await api.get('/api/subjects');
      setSubjects(response.data);
    } catch { setSubjects([]); }
  };

  // NEW: all classes
  const loadClasses = async () => {
    try {
      const response = await api.get('/api/classes');
      setClasses(response.data);
    } catch { setClasses([]); }
  };

  useEffect(() => {
    loadVideos();
    loadUsers();
    loadSubjects();   // NEW
    loadClasses();    // NEW
  }, []);

  // NEW: helper → find a subject by its id (to show each video's subject)
  const subjectById = (id) => subjects.find((s) => s.id === id);

  const handleAddVideo = async () => {
    // NEW: a video must have a subject, otherwise no student can see it
    if (!subjectId) { setMessage('Please choose the subject (class) for this video.'); return; }
    try {
      await api.post('/api/videos/add', {
        title, description, videoUrl: videoId,
        thumbnailUrl: 'https://via.placeholder.com/300x180',
        orderIndex: parseInt(orderIndex) || 1,
        subjectId: parseInt(subjectId),               // NEW: send the subject
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

  // NEW: move a video to a subject: PUT /api/videos/{id}/subject (Step 6)
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

  // NEW: set a student's class: PUT /api/users/{id}/class (Step 4)
  // "Not set" ('') → null, otherwise the id as a number
  const changeUserClass = async (user, classId) => {
    try {
      await api.put(`/api/users/${user.id}/class`, { classId: classId ? parseInt(classId) : null });
      loadUsers();
    } catch {
      setMessage('Failed to update class.');
    }
  };

  return (
    <div className="page">
      <h2>Admin Panel</h2>

      {/* Add Video Form */}
      <div className="card" style={{ margin: '0 0 24px 0', maxWidth: '100%' }}>
        <h3>Add New Video</h3>
        {/* NEW: pick the subject (and so the class) first */}
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

      {/* Videos list: CHANGED to show subject + "Move to subject" dropdown */}
      <h3>Existing Videos ({videos.length})</h3>
      {videos.map((v) => {
        const subj = subjectById(v.subjectId);   // this video's subject (or undefined)
        return (
          <div key={v.id} className="video-card">
            <h3>{v.title}</h3>
            <p>{v.description}</p>
            {/* Grey normally; RED if the video has no subject yet */}
            <p style={{ fontSize: '13px', color: subj ? '#999' : '#dc2626' }}>
              {subj ? subjectLabel(subj) : 'No subject — students can\'t see this video'}
              {' · '}ID: {v.videoUrl} · Order: {v.orderIndex}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select className="input" style={{ maxWidth: '260px', margin: 0 }}
                value={v.subjectId ?? ''} onChange={(e) => changeVideoSubject(v, e.target.value)}>
                <option value="">Move to subject…</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{subjectLabel(s)}</option>)}
              </select>
              <button className="btn btn-secondary" onClick={() => handleDeleteVideo(v.id)}>Delete</button>
            </div>
          </div>
        );
      })}

      {/* Users table */}
      <h3 style={{ marginTop: '32px' }}>Users ({users.length})</h3>
      {/* CHANGED: table-wrap (already in your index.css) → table scrolls on phones */}
      <div className="card table-wrap" style={{ maxWidth: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '8px' }}>ID</th>
              <th style={{ padding: '8px' }}>Name</th>
              <th style={{ padding: '8px' }}>Email</th>
              <th style={{ padding: '8px' }}>Role</th>
              <th style={{ padding: '8px' }}>Class</th>{/* NEW column */}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '8px' }}>{u.id}</td>
                <td style={{ padding: '8px' }}>{u.name}</td>
                <td style={{ padding: '8px' }}>{u.email}</td>
                <td style={{ padding: '8px' }}>{u.role}</td>
                {/* NEW: students get a class dropdown; teachers/admins see "All classes" */}
                <td style={{ padding: '8px' }}>
                  {u.role === 'USER' ? (
                    <select value={u.classId ?? ''} onChange={(e) => changeUserClass(u, e.target.value)}>
                      <option value="">Not set</option>
                      {classes.map((c) => <option key={c.id} value={c.id}>{classLabel(c)}</option>)}
                    </select>
                  ) : 'All classes'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Admin;
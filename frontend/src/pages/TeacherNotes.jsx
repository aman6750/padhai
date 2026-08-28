import { useEffect, useState } from 'react';
import api from '../services/api';

function TeacherNotes() {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/api/users/me/subjects')
      .then((res) => setSubjects(res.data))
      .catch(() => setSubjects([]));
  }, []);

  const addNote = async () => {
    if (!file) { setMessage('Please choose a PDF file.'); return; }
    setUploading(true);
    setMessage('');

    // Build multipart form data
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('subjectId', subjectId);
    formData.append('file', file);

    try {
      await api.post('/api/notes/add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Note uploaded successfully!');
      setTitle(''); setDescription(''); setSubjectId(''); setFile(null);
    } catch (error) {
      setMessage(error.response?.status === 403
        ? 'You can only add notes to your own subjects.'
        : 'Failed to upload note.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page">
      <h2>Add Notes</h2>
      <div className="card" style={{ maxWidth: '100%' }}>
        <h3>Upload a PDF Note</h3>

        <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Select Subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <input className="input" placeholder="Title"
          value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" placeholder="Description"
          value={description} onChange={(e) => setDescription(e.target.value)} />

        <input className="input" type="file" accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])} />

        <button className="btn" onClick={addNote} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Note'}
        </button>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default TeacherNotes;
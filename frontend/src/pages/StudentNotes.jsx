import { useState, useEffect } from 'react';
import api from '../services/api';
import PdfViewer from '../components/PdfViewer';

function StudentNotes() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [notes, setNotes] = useState([]);
  const [message, setMessage] = useState('');
  const [pdfBlob, setPdfBlob] = useState(null);

  useEffect(() => {
    api.get('/api/subjects')
      .then((res) => setSubjects(res.data))
      .catch(() => setSubjects([]));
  }, []);

  const openSubject = async (subject) => {
    setSelectedSubject(subject);
    setMessage('');
    setPdfBlob(null);
    try {
      const res = await api.get(`/api/notes/subject/${subject.id}`);
      setNotes(res.data);
    } catch (error) {
      if (error.response?.status === 403) {
        setMessage('You need an active subscription to view notes. Please subscribe from the Dashboard.');
        setNotes([]);
      } else {
        setMessage('Could not load notes.');
      }
    }
  };

  const viewNote = async (noteId) => {
    try {
      const res = await api.get(`/api/notes/${noteId}/view`, { responseType: 'blob' });
      setPdfBlob(res.data); // pass the blob straight to react-pdf
    } catch (error) {
      setMessage('Could not open note.');
    }
  };

  return (
    <div className="page">
      <h2>Study Notes</h2>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {subjects.map((s) => (
          <button key={s.id}
            className={selectedSubject?.id === s.id ? 'btn' : 'btn btn-secondary'}
            onClick={() => openSubject(s)}>
            {s.name}
          </button>
        ))}
      </div>

      {message && <p className="message error">{message}</p>}

      {pdfBlob && <PdfViewer fileBlob={pdfBlob} onClose={() => setPdfBlob(null)} />}

      {selectedSubject && !message && !pdfBlob && (
        <>
          <h3>{selectedSubject.name} — Notes ({notes.length})</h3>
          {notes.length === 0 && <p>No notes yet.</p>}
          {notes.map((note) => (
            <div key={note.id} className="video-card">
              <h3>{note.title}</h3>
              <p>{note.description}</p>
              <button className="btn" onClick={() => viewNote(note.id)}>Open Note</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default StudentNotes;
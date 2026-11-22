import { useState, useEffect } from 'react';
import api from '../services/api';

function ManageSubjects() {
  // Lists that come from the backend
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  // Info / error line shown at the top
  const [message, setMessage] = useState('');

  // "Add Class" form boxes
  const [className, setClassName] = useState('');
  const [classOrder, setClassOrder] = useState('');

  // "Add Subject" form boxes
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');

  // GET /api/classes → all classes in order (Step 3)
  const loadClasses = async () => {
    try {
      const res = await api.get('/api/classes');
      setClasses(res.data);
    } catch { setClasses([]); }
  };

  // GET /api/subjects → admin gets ALL subjects of all classes (Step 5)
  const loadSubjects = async () => {
    try {
      const res = await api.get('/api/subjects');
      setSubjects(res.data);
    } catch { setSubjects([]); }
  };

  // Load both once when the page opens
  useEffect(() => {
    loadClasses();
    loadSubjects();
  }, []);

  // Create a class: POST /api/classes (admin only)
  const addClass = async () => {
    // Empty name → stop. trim() ignores spaces
    if (!className.trim()) { setMessage('Please enter a class name (e.g. Class 10).'); return; }
    try {
      await api.post('/api/classes', {
        name: className,
        // Use the order typed; if empty, put the class at the end
        orderIndex: parseInt(classOrder) || classes.length + 1,
      });
      setMessage(`${className} added!`);
      setClassName(''); setClassOrder('');   // clear the boxes
      loadClasses();                         // refresh the list
    } catch (error) {
      setMessage(error.response?.status === 403 ? 'Only admin can add classes.' : 'Failed to add class.');
    }
  };

  // Create a subject inside a class: POST /api/subjects/add
  const addSubject = async () => {
    if (!classId) { setMessage('Please choose the class for this subject.'); return; }
    try {
      // parseInt: dropdown gives "2" (text), backend wants 2 (number)
      await api.post('/api/subjects/add', { name, description, classId: parseInt(classId) });
      setMessage('Subject added!');
      setName(''); setDescription('');
      loadSubjects();
    } catch (error) {
      setMessage(error.response?.status === 403 ? 'Only admin can add subjects.' : 'Failed to add subject.');
    }
  };

  // Move a subject to another class: PUT /api/subjects/{id} (Step 5)
  const moveSubject = async (subject, newClassId) => {
    if (!newClassId) return;   // "Choose class…" picked → ignore
    try {
      await api.put(`/api/subjects/${subject.id}`, { classId: parseInt(newClassId) });
      loadSubjects();
    } catch {
      setMessage('Failed to update class.');
    }
  };

  // Subjects with NO class yet (your old subjects) → shown first, in red
  const unassigned = subjects.filter((s) => !s.classId);
  // For each class: { cls: the class, items: its subjects }
  const groups = classes.map((c) => ({ cls: c, items: subjects.filter((s) => s.classId === c.id) }));

  // Draws one subject card with a class dropdown
  const subjectCard = (s) => (
    <div key={s.id} className="video-card">
      <h3>{s.name}</h3>
      <p>{s.description}</p>
      <p style={{ fontSize: '13px', color: '#999' }}>ID: {s.id}</p>
      {/* value = current class (?? '' means: use '' if null). Changing it moves the subject */}
      <select className="input" style={{ maxWidth: '260px', margin: 0 }}
        value={s.classId ?? ''} onChange={(e) => moveSubject(s, e.target.value)}>
        <option value="">Choose class…</option>
        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  );

  return (
    <div className="page">
      <h2>Manage Classes & Subjects</h2>
      {message && <p className="message">{message}</p>}

      {/* ---- Classes ---- */}
      <div className="card" style={{ margin: '0 0 24px 0', maxWidth: '100%' }}>
        <h3>Classes ({classes.length})</h3>
        {/* Shows "Class 9 · Class 10", or a hint if there are none */}
        <p style={{ color: '#666' }}>
          {classes.length ? classes.map((c) => c.name).join(' · ') : 'No classes yet. Add your first class below.'}
        </p>
        <input className="input" placeholder="Class name (e.g. Class 10)"
          value={className} onChange={(e) => setClassName(e.target.value)} />
        <input className="input" placeholder="Order (e.g. 10) — used to sort classes"
          value={classOrder} onChange={(e) => setClassOrder(e.target.value)} />
        <button className="btn" onClick={addClass}>Add Class</button>
      </div>

      {/* ---- Add subject ---- */}
      <div className="card" style={{ margin: '0 0 24px 0', maxWidth: '100%' }}>
        <h3>Add Subject</h3>
        <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Select class</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="input" placeholder="Subject name (e.g. Mathematics)"
          value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Description"
          value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className="btn" onClick={addSubject}>Add Subject</button>
      </div>

      <h3>All Subjects ({subjects.length})</h3>

      {/* Old subjects without a class (only shown if there are any) */}
      {unassigned.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#dc2626' }}>No class set ({unassigned.length})</h3>
          <p style={{ color: '#666' }}>Students can't see these subjects until you choose a class.</p>
          {unassigned.map(subjectCard)}
        </div>
      )}

      {/* One section per class with its subjects */}
      {groups.map(({ cls, items }) => (
        <div key={cls.id} style={{ marginBottom: '24px' }}>
          <h3>{cls.name} ({items.length})</h3>
          {items.map(subjectCard)}
        </div>
      ))}
    </div>
  );
}

export default ManageSubjects;
import { useState, useEffect } from 'react';
import api from '../services/api';
import { classLabel } from '../utils/subjectLabel';   // "LPS · Class 10"

function ManageSubjects() {
  // Lists from the backend
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [message, setMessage] = useState('');

  // "Add School" box
  const [schoolName, setSchoolName] = useState('');

  // "Add Class" boxes
  const [classSchoolId, setClassSchoolId] = useState('');
  const [className, setClassName] = useState('');
  const [classOrder, setClassOrder] = useState('');

  // "Add Subject" boxes
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');

  const loadSchools = async () => {
    try { setSchools((await api.get('/api/schools')).data); } catch { setSchools([]); }
  };
  const loadClasses = async () => {
    try { setClasses((await api.get('/api/classes')).data); } catch { setClasses([]); }
  };
  const loadSubjects = async () => {
    try { setSubjects((await api.get('/api/subjects')).data); } catch { setSubjects([]); }
  };

  // Load everything once when the page opens
  useEffect(() => {
    loadSchools();
    loadClasses();
    loadSubjects();
  }, []);

  // ---------- Schools ----------
  const addSchool = async () => {
    if (!schoolName.trim()) { setMessage('Please enter a school name (e.g. LPS).'); return; }
    try {
      await api.post('/api/schools', { name: schoolName });
      setMessage(`${schoolName} added!`);
      setSchoolName('');
      loadSchools();
    } catch {
      setMessage('Failed to add school.');
    }
  };

  // ---------- Classes ----------
  const addClass = async () => {
    if (!classSchoolId) { setMessage('Please choose the school for this class.'); return; }
    if (!className.trim()) { setMessage('Please enter a class name (e.g. Class 10).'); return; }
    try {
      await api.post('/api/classes', {
        schoolId: parseInt(classSchoolId),
        name: className,
        // order typed, or put it at the end
        orderIndex: parseInt(classOrder) || classes.length + 1,
      });
      setMessage(`${className} added!`);
      setClassName(''); setClassOrder('');
      loadClasses();
    } catch {
      setMessage('Failed to add class.');
    }
  };

  // Put an existing class (made before schools existed) into a school
  const moveClass = async (cls, newSchoolId) => {
    if (!newSchoolId) return;
    try {
      await api.put(`/api/classes/${cls.id}`, { schoolId: parseInt(newSchoolId) });
      loadClasses();
      loadSubjects();   // subject labels now include the school
    } catch {
      setMessage('Failed to update class.');
    }
  };

    // Delete an EMPTY class (e.g. a duplicate). Backend refuses if it has subjects/students.
  const deleteClass = async (cls) => {
    if (!window.confirm(`Delete ${classLabel(cls)}?`)) return;
    try {
      await api.delete(`/api/classes/${cls.id}`);
      setMessage(`${classLabel(cls)} deleted.`);
      loadClasses();
    } catch (error) {
      // shows e.g. "This class has subjects. Move or delete them first."
      setMessage(error.response?.data?.message || 'Failed to delete class.');
    }
  };

  // ---------- Subjects ----------
  const addSubject = async () => {
    if (!classId) { setMessage('Please choose the class for this subject.'); return; }
    try {
      await api.post('/api/subjects/add', { name, description, classId: parseInt(classId) });
      setMessage('Subject added!');
      setName(''); setDescription('');
      loadSubjects();
    } catch {
      setMessage('Failed to add subject.');
    }
  };

  const moveSubject = async (subject, newClassId) => {
    if (!newClassId) return;
    try {
      await api.put(`/api/subjects/${subject.id}`, { classId: parseInt(newClassId) });
      loadSubjects();
    } catch {
      setMessage('Failed to update subject.');
    }
  };

  // Classes with no school yet (made before schools existed) → shown in red
  const classesWithoutSchool = classes.filter((c) => !c.schoolId);
  // Subjects with no class yet → shown in red
  const subjectsWithoutClass = subjects.filter((s) => !s.classId);

  // One subject card with a "move to class" dropdown
  const subjectCard = (s) => (
    <div key={s.id} className="video-card">
      <h3>{s.name}</h3>
      <p>{s.description}</p>
      <select className="input" style={{ maxWidth: '300px', margin: 0 }}
        value={s.classId ?? ''} onChange={(e) => moveSubject(s, e.target.value)}>
        <option value="">Choose class…</option>
        {classes.map((c) => <option key={c.id} value={c.id}>{classLabel(c)}</option>)}
      </select>
    </div>
  );

  return (
    <div className="page">
      <h2>Schools, Classes & Subjects</h2>
      {message && <p className="message">{message}</p>}

      {/* ---------- 1. Schools ---------- */}
      <div className="card" style={{ margin: '0 0 24px 0', maxWidth: '100%' }}>
        <h3>1. Schools ({schools.length})</h3>
        <p style={{ color: '#666' }}>
          {schools.length ? schools.map((s) => s.name).join(' · ') : 'No schools yet. Add your first school below.'}
        </p>
        <input className="input" placeholder="School name (e.g. LPS)"
          value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
        <button className="btn" onClick={addSchool}>Add School</button>
      </div>

      {/* ---------- 2. Classes ---------- */}
      <div className="card" style={{ margin: '0 0 24px 0', maxWidth: '100%' }}>
        <h3>2. Classes ({classes.length})</h3>
        <select className="input" value={classSchoolId} onChange={(e) => setClassSchoolId(e.target.value)}>
          <option value="">Select school</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input className="input" placeholder="Class name (e.g. Class 10)"
          value={className} onChange={(e) => setClassName(e.target.value)} />
        <input className="input" placeholder="Order (e.g. 10) — used to sort classes"
          value={classOrder} onChange={(e) => setClassOrder(e.target.value)} />
        <button className="btn" onClick={addClass}>Add Class</button>

                {/* Classes of each school, each with a small ✕ to delete it */}
        {schools.map((s) => {
          const own = classes.filter((c) => c.schoolId === s.id);
          return (
            <p key={s.id} style={{ color: '#444', marginTop: '12px' }}>
              <strong>{s.name}:</strong>{' '}
              {own.length === 0 && 'no classes yet'}
              {own.map((c) => (
                <span key={c.id} style={{ marginRight: '12px', whiteSpace: 'nowrap' }}>
                  {c.name}
                  <button onClick={() => deleteClass(c)} title={`Delete ${c.name}`}
                    style={{ marginLeft: '4px', border: 'none', background: 'none',
                             color: '#dc2626', cursor: 'pointer', fontSize: '14px' }}>
                    ✕
                  </button>
                </span>
              ))}
            </p>
          );
        })}

        {/* Old classes without a school → choose one */}
        {classesWithoutSchool.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ color: '#dc2626' }}>
              These classes have no school yet. Students can't pick them until you choose one:
            </p>
            {classesWithoutSchool.map((c) => (
              <div key={c.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                <strong>{c.name}</strong>
                <select className="input" style={{ maxWidth: '220px', margin: 0 }}
                  value="" onChange={(e) => moveClass(c, e.target.value)}>
                  <option value="">Choose school…</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------- 3. Add subject ---------- */}
      <div className="card" style={{ margin: '0 0 24px 0', maxWidth: '100%' }}>
        <h3>3. Add Subject</h3>
        <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Select school & class</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{classLabel(c)}</option>)}
        </select>
        <input className="input" placeholder="Subject name (e.g. Mathematics)"
          value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Description (e.g. book name / syllabus)"
          value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className="btn" onClick={addSubject}>Add Subject</button>
      </div>

      {/* ---------- All subjects, grouped by school → class ---------- */}
      <h3>All Subjects ({subjects.length})</h3>

      {subjectsWithoutClass.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#dc2626' }}>No class set ({subjectsWithoutClass.length})</h3>
          <p style={{ color: '#666' }}>Students can't see these subjects until you choose a class.</p>
          {subjectsWithoutClass.map(subjectCard)}
        </div>
      )}

      {classes.map((c) => {
        const items = subjects.filter((s) => s.classId === c.id);
        return (
          <div key={c.id} style={{ marginBottom: '24px' }}>
            <h3>{classLabel(c)} ({items.length})</h3>
            {items.map(subjectCard)}
          </div>
        );
      })}
    </div>
  );
}

export default ManageSubjects;
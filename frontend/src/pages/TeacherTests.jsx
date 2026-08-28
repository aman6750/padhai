import { useState, useEffect } from 'react';
import api from '../services/api';

function TeacherTests() {
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);
  const [message, setMessage] = useState('');

  // New test form
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [isFree, setIsFree] = useState(false);

  // Question form
  const [selectedTest, setSelectedTest] = useState(null);
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correct, setCorrect] = useState('A');

  useEffect(() => {
    api.get('/api/users/me/subjects')
      .then((res) => setSubjects(res.data))
      .catch(() => setSubjects([]));
  }, []);

  const loadTests = async (subjId) => {
    try {
      const res = await api.get(`/api/tests/subject/${subjId}`);
      setTests(res.data);
    } catch { setTests([]); }
  };

  const createTest = async () => {
    try {
      await api.post('/api/tests/add', {
        title, description, subjectId: parseInt(subjectId),
        durationMinutes: parseInt(duration) || 30, isFree,
      });
      setMessage('Test created!');
      setTitle(''); setDescription(''); setDuration('');
      loadTests(subjectId);
    } catch (error) {
      setMessage(error.response?.status === 403 ? 'Not your subject.' : 'Failed to create test.');
    }
  };

  const addQuestion = async () => {
    if (!selectedTest) return;
    try {
      await api.post(`/api/tests/${selectedTest.id}/questions/add`, {
        questionText: qText, optionA: optA, optionB: optB,
        optionC: optC, optionD: optD, correctOption: correct,
      });
      setMessage('Question added!');
      setQText(''); setOptA(''); setOptB(''); setOptC(''); setOptD(''); setCorrect('A');
    } catch {
      setMessage('Failed to add question.');
    }
  };

  return (
    <div className="page">
      <h2>Manage Tests</h2>

      {/* Create test */}
      <div className="card" style={{ maxWidth: '100%', marginBottom: '24px' }}>
        <h3>Create a Test</h3>
        <select className="input" value={subjectId}
          onChange={(e) => { setSubjectId(e.target.value); loadTests(e.target.value); }}>
          <option value="">Select Subject</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input className="input" placeholder="Test title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="input" placeholder="Duration (minutes)" value={duration} onChange={(e) => setDuration(e.target.value)} />
        <label style={{ display: 'block', margin: '8px 0' }}>
          <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} /> Free test (no subscription needed)
        </label>
        <button className="btn" onClick={createTest}>Create Test</button>
        {message && <p className="message">{message}</p>}
      </div>

      {/* Tests list + add questions */}
      {subjectId && (
        <>
          <h3>Tests in this subject ({tests.length})</h3>
          {tests.map((t) => (
            <div key={t.id} className="video-card">
              <h3>{t.title}</h3>
              <p>{t.description} · {t.durationMinutes} min · {t.isFree ? 'Free' : 'Paid'}</p>
              <button className="btn btn-secondary"
                onClick={() => setSelectedTest(selectedTest?.id === t.id ? null : t)}>
                {selectedTest?.id === t.id ? 'Close' : 'Add Questions'}
              </button>

              {selectedTest?.id === t.id && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
                  <input className="input" placeholder="Question" value={qText} onChange={(e) => setQText(e.target.value)} />
                  <input className="input" placeholder="Option A" value={optA} onChange={(e) => setOptA(e.target.value)} />
                  <input className="input" placeholder="Option B" value={optB} onChange={(e) => setOptB(e.target.value)} />
                  <input className="input" placeholder="Option C" value={optC} onChange={(e) => setOptC(e.target.value)} />
                  <input className="input" placeholder="Option D" value={optD} onChange={(e) => setOptD(e.target.value)} />
                  <select className="input" value={correct} onChange={(e) => setCorrect(e.target.value)}>
                    <option value="A">Correct: A</option>
                    <option value="B">Correct: B</option>
                    <option value="C">Correct: C</option>
                    <option value="D">Correct: D</option>
                  </select>
                  <button className="btn" onClick={addQuestion}>Add Question</button>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default TeacherTests;
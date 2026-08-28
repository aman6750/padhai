import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function TakeTest() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});   // { questionId: "A"/"B"/... }
  const [timeLeft, setTimeLeft] = useState(null); // seconds
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load the test questions + set the timer
  useEffect(() => {
    const load = async () => {
      try {
        // get the test info (for duration)
        const testsRes = await api.get(`/api/tests/${testId}/take`);
        setQuestions(testsRes.data);
        // we need the duration — fetch it separately (simplest: pass via query or fetch subject tests)
        // For now, default to 30 min if not available:
        setTimeLeft(30 * 60);
      } catch (error) {
        setMessage(error.response?.status === 403
          ? 'You need to subscribe to take this test.'
          : 'Could not load test.');
      }
    };
    load();
  }, [testId]);

  const handleSubmit = useCallback(async () => {
    if (submitting || result) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/api/tests/${testId}/submit`, answers);
      setResult(res.data);
    } catch {
      setMessage('Could not submit test.');
    } finally {
      setSubmitting(false);
    }
  }, [answers, testId, submitting, result]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) {
      handleSubmit();  // auto-submit when time runs out
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, result, handleSubmit]);

  const selectAnswer = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (message) return <div className="page"><p className="message error">{message}</p></div>;

  // Result screen
  if (result) {
    return (
      <div className="page">
        <div className="card">
          <h2>Test Submitted! ✅</h2>
          <p style={{ fontSize: '24px', margin: '20px 0' }}>
            Your Score: <strong>{result.score} / {result.total}</strong>
          </p>
          <button className="btn" onClick={() => navigate('/tests')}>Back to Tests</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Sticky timer */}
      <div style={{
        position: 'sticky', top: '70px', background: '#fff', padding: '12px',
        borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>Question {Object.keys(answers).length}/{questions.length} answered</h3>
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: timeLeft < 60 ? '#dc2626' : '#2563eb' }}>
          ⏱ {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
        </span>
      </div>

      {questions.map((q, idx) => (
        <div key={q.id} className="video-card">
          <h3>{idx + 1}. {q.questionText}</h3>
          {['A', 'B', 'C', 'D'].map((opt) => (
            <div key={opt} style={{ margin: '8px 0' }}>
              <label style={{ cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="radio"
                  name={`q${q.id}`}
                  checked={answers[q.id] === opt}
                  onChange={() => selectAnswer(q.id, opt)}
                />
                <span><strong>{opt}.</strong> {q['option' + opt]}</span>
              </label>
            </div>
          ))}
        </div>
      ))}

      <button className="btn" onClick={handleSubmit} disabled={submitting}
        style={{ marginTop: '20px' }}>
        {submitting ? 'Submitting...' : 'Submit Test'}
      </button>
    </div>
  );
}

export default TakeTest;
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // NEW: id of the class the student picks ('' = nothing picked yet)
  const [classId, setClassId] = useState('');
  // NEW: list of classes for the dropdown
  const [classes, setClasses] = useState([]);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  // NEW: runs ONCE when the page opens → load classes from the backend.
  // /api/classes works without login (Step 3).
  useEffect(() => {
    api.get('/api/classes')
      .then((res) => setClasses(res.data))   // e.g. [{id:1,name:"Class 9"}, {id:2,name:"Class 10"}]
      .catch(() => setClasses([]));          // if it fails → empty list, no crash
  }, []);

  const handleRegister = async () => {
    // NEW: no class picked → show error and stop (nothing is sent)
    if (!classId) {
      setIsError(true);
      setMessage('Please choose your class.');
      return;
    }
    try {
      // CHANGED: also send classId. parseInt turns "2" (text) into 2 (number)
      await api.post('/api/users/register', { name, email, password, classId: parseInt(classId) });
      setIsError(false);
      setMessage('Registered successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch {
      setIsError(true);
      setMessage('Registration failed. Email may already be registered.');
    }
  };

  return (
    <div className="card">
      <h2>Register</h2>
      {/* FIXED: Enter key used to call handleLogin(), which doesn't exist on this page */}
      <input className="input" type="text" placeholder="Name" value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
      <input className="input" type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
      <input className="input" type="password" placeholder="Password" value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />

      {/* NEW: class dropdown. Student SEES c.name ("Class 10"), we SAVE c.id (2) */}
      <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
        <option value="">Select your class</option>
        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <button className="btn" onClick={handleRegister}>Register</button>
      {message && <p className={`message ${isError ? 'error' : 'success'}`}>{message}</p>}
    </div>
  );
}

export default Register;
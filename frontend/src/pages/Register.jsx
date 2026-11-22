import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import SchoolClassPicker from '../components/SchoolClassPicker';   // NEW

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // id of the class picked in the school → class dropdowns ('' = none yet)
  const [classId, setClassId] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    // No class picked → show error and stop (nothing is sent)
    if (!classId) {
      setIsError(true);
      setMessage('Please choose your school and class.');
      return;
    }
    try {
      // parseInt turns "2" (text) into 2 (number)
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
      <input className="input" type="text" placeholder="Name" value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
      <input className="input" type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
      <input className="input" type="password" placeholder="Password" value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />

      {/* NEW: school dropdown, then class dropdown. Gives us the classId */}
      <SchoolClassPicker onChange={setClassId} />

      <button className="btn" onClick={handleRegister}>Register</button>
      {message && <p className={`message ${isError ? 'error' : 'success'}`}>{message}</p>}
    </div>
  );
}

export default Register;
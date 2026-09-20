import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
  try {
    const response = await api.post('/api/users/login', { email, password });
    localStorage.setItem('token', response.data.token);

    // Check role and redirect accordingly
    const roleRes = await api.get('/api/users/me/role');
    const role = roleRes.data.role;
    if (role === 'TEACHER') {
  navigate('/teacher-home');
} else if (role === 'ADMIN') {
  navigate('/admin-home');   // changed from /admin
} else {
  navigate('/dashboard');
}
  } catch (error) {
    setMessage('Invalid email or password');
  }
};

  return (
    <div className="card">
      <h2>Login</h2>
      <input
        className="input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
      />
      <input
        className="input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
      />
      <button className="btn" onClick={handleLogin}>Login</button>
      {message && <p className="message error">{message}</p>}
    </div>
  );
}

export default Login;
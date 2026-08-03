import { useState } from 'react';
import api from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    try {
      const response = await api.post('/api/users/login', {
        email: email,
        password: password,
      });

      // Save the token in the browser
      localStorage.setItem('token', response.data.token);
      setMessage('Login successful! Token saved.');
    } catch (error) {
      setMessage('Error: Invalid email or password');
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '400px' }}>
      <h1>पढ़AI</h1>
      <h2>Login</h2>

      <div style={{ marginBottom: '10px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <button onClick={handleLogin} style={{ padding: '10px 20px' }}>
        Login
      </button>

      {message && <p style={{ marginTop: '15px' }}>{message}</p>}
    </div>
  );
}

export default Login;
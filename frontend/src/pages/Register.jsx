import { useState } from 'react';
import api from '../services/api';

function Register() {
  // State to hold what the user types
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // Runs when the user clicks "Register"
  const handleRegister = async () => {
    try {
      const response = await api.post('/api/users/register', {
        name: name,
        email: email,
        password: password,
      });
      setMessage('Registered successfully! ID: ' + response.data.id);
    } catch (error) {
      setMessage('Error: ' + (error.response?.data?.message || 'Registration failed'));
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '400px' }}>
      <h1>पढ़AI</h1>
      <h2>Register</h2>

      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

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

      <button onClick={handleRegister} style={{ padding: '10px 20px' }}>
        Register
      </button>

      {message && <p style={{ marginTop: '15px' }}>{message}</p>}
    </div>
  );
}

export default Register;
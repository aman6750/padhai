import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Videos from './pages/Videos';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import api from './services/api';

function NavBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (token) {
      api.get('/api/users/me/role')
        .then((res) => setIsAdmin(res.data.role === 'ADMIN'))
        .catch(() => setIsAdmin(false));
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <span className="brand">पढ़<span className="ai">AI</span></span>
      <div className="navbar-links">
        {token ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/videos">Videos</Link>
            {isAdmin && <Link to="/admin">Admin</Link>}
            <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/register">Register</Link>
            <Link to="/login">Login</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
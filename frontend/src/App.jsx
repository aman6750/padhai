import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Videos from './pages/Videos';
import Admin from './pages/Admin';
import ManageSubjects from './pages/ManageSubjects';
import TeacherNotes from './pages/TeacherNotes';
import ProtectedRoute from './components/ProtectedRoute';
import api from './services/api';
import StudentNotes from './pages/StudentNotes';
import AssignTeacher from './pages/AssignTeacher';
import TakeTest from './pages/TakeTest';
import TeacherTests from './pages/TeacherTests';
import StudentTests from './pages/StudentTests';
import Doubts from './pages/Doubts';
import Terms from './pages/legal/Terms';
import Privacy from './pages/legal/Privacy';
import Refund from './pages/legal/Refund';
import Contact from './pages/legal/Contact';
import Pricing from './pages/legal/Pricing';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState('USER');
  const [menuOpen, setMenuOpen] = useState(false);

  // Re-read the token whenever the route changes (after login/logout)
  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, [location]);

  useEffect(() => {
    if (token) {
      api.get('/api/users/me/role')
        .then((res) => setRole(res.data.role))
        .catch(() => setRole('USER'));
    } else {
      setRole('USER');
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/login');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <span className="brand">पढ़<span className="ai">AI</span></span>
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
      </div>

      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        {token ? (
          <>
            <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>
            <Link to="/videos" onClick={closeMenu}>Videos</Link>
            <Link to="/notes" onClick={closeMenu}>Notes</Link>
            <Link to="/tests" onClick={closeMenu}>Tests</Link>
            <Link to="/doubts" onClick={closeMenu}>Doubts</Link>
            {role === 'TEACHER' && <Link to="/teacher-home" onClick={closeMenu}>My Dashboard</Link>}
            {role === 'TEACHER' && <Link to="/teacher/notes" onClick={closeMenu}>Add Notes</Link>}
            {role === 'TEACHER' && <Link to="/teacher/tests" onClick={closeMenu}>Manage Tests</Link>}
            {role === 'ADMIN' && <Link to="/admin" onClick={closeMenu}>Admin</Link>}
            {role === 'ADMIN' && <Link to="/admin-home" onClick={closeMenu}>My Dashboard</Link>}
            {role === 'ADMIN' && <Link to="/admin/subjects" onClick={closeMenu}>Subjects</Link>}
            {role === 'ADMIN' && <Link to="/admin/teachers" onClick={closeMenu}>Teachers</Link>}
            <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/register" onClick={closeMenu}>Register</Link>
            <Link to="/login" onClick={closeMenu}>Login</Link>
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
        <Route path="/teacher-home" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin-home" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/admin/subjects" element={<ProtectedRoute><ManageSubjects /></ProtectedRoute>} />
        <Route path="/teacher/notes" element={<ProtectedRoute><TeacherNotes /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><StudentNotes /></ProtectedRoute>} />
        <Route path="/admin/teachers" element={<ProtectedRoute><AssignTeacher /></ProtectedRoute>} />
        <Route path="/test/:testId" element={<ProtectedRoute><TakeTest /></ProtectedRoute>} />
        <Route path="/tests" element={<ProtectedRoute><StudentTests /></ProtectedRoute>} />
        <Route path="/teacher/tests" element={<ProtectedRoute><TeacherTests /></ProtectedRoute>} />
        <Route path="/doubts" element={<ProtectedRoute><Doubts /></ProtectedRoute>} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/" element={<Login />} />
      </Routes>

      <footer style={{
        padding: '24px', textAlign: 'center', borderTop: '1px solid #e5e7eb',
        marginTop: '40px', fontSize: '14px', color: '#666'
      }}>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/refund">Refund Policy</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <p>© 2026 पढ़AI. All rights reserved.</p>
      </footer>
    </BrowserRouter>
  );
}

export default App;
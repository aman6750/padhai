import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
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

function NavBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [role, setRole] = useState('USER');

  useEffect(() => {
    if (token) {
      api.get('/api/users/me/role')
        .then((res) => setRole(res.data.role))
        .catch(() => setRole('USER'));
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
            {(role === 'TEACHER') && <Link to="/teacher/notes">Add Notes</Link>}
            {role === 'ADMIN' && <Link to="/admin">Admin</Link>}
            {role === 'ADMIN' && <Link to="/admin/subjects">Subjects</Link>}
            <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
            <Link to="/notes">Notes</Link>   {/* everyone sees this — students browse notes */}
            {role === 'ADMIN' && <Link to="/admin/teachers">Teachers</Link>}
            <Link to="/tests">Tests</Link>
            {role === 'TEACHER' && <Link to="/teacher/tests">Manage Tests</Link>}
            <Link to="/doubts">Doubts</Link>
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
        <Route path="/admin/subjects" element={<ProtectedRoute><ManageSubjects /></ProtectedRoute>} />
        <Route path="/teacher/notes" element={<ProtectedRoute><TeacherNotes /></ProtectedRoute>} />
        <Route path="/" element={<Login />} />
        <Route path="/notes" element={<ProtectedRoute><StudentNotes /></ProtectedRoute>} />
        <Route path="/admin/teachers" element={<ProtectedRoute><AssignTeacher /></ProtectedRoute>} />
        <Route path="/test/:testId" element={<ProtectedRoute><TakeTest /></ProtectedRoute>} />
        <Route path="/tests" element={<ProtectedRoute><StudentTests /></ProtectedRoute>} />
        <Route path="/teacher/tests" element={<ProtectedRoute><TeacherTests /></ProtectedRoute>} />
        <Route path="/doubts" element={<ProtectedRoute><Doubts /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
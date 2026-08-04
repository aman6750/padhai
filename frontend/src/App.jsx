import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Videos from './pages/Videos';
import ProtectedRoute from './components/ProtectedRoute';

function NavBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token'); // clear the token
    navigate('/login');
  };

  return (
    <nav style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      {token ? (
        // Logged IN: show these
        <>
          <Link to="/dashboard" style={{ marginRight: '15px' }}>Dashboard</Link>
          <Link to="/videos" style={{ marginRight: '15px' }}>Videos</Link>
          <button onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</button>
        </>
      ) : (
        // Logged OUT: show these
        <>
          <Link to="/register" style={{ marginRight: '15px' }}>Register</Link>
          <Link to="/login">Login</Link>
        </>
      )}
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
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/videos"
          element={
            <ProtectedRoute>
              <Videos />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
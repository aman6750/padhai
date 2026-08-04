import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  // No token? Send them to login.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Token exists — show the page.
  return children;
}

export default ProtectedRoute;
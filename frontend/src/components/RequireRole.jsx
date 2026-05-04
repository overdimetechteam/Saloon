import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireRole({ roles }) {
  const { profile } = useAuth();
  if (!profile) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(profile.role)) return <Navigate to="/login" replace />;
  return <Outlet />;
}

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireRole({ roles }) {
  const { profile } = useAuth();
  if (!profile) {
    const dest = roles?.includes('salon_owner') ? '/owner/login' : '/login';
    return <Navigate to={dest} replace />;
  }
  if (roles && !roles.includes(profile.role)) return <Navigate to="/login" replace />;
  return <Outlet />;
}

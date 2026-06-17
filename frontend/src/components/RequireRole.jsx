import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireRole({ roles }) {
  const { profile } = useAuth();
  if (!profile) {
    let dest = '/login';
    if (roles?.includes('salon_owner')) dest = '/owner/login';
    if (roles?.includes('system_admin')) dest = '/admin/login';
    return <Navigate to={dest} replace />;
  }
  if (roles && !roles.includes(profile.role)) return <Navigate to="/login" replace />;
  return <Outlet />;
}

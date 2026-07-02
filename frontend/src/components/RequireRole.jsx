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
  // salon_owner can also browse client routes (dual-portal access)
  if (roles && !roles.includes(profile.role)) {
    if (roles.includes('client') && profile.role === 'salon_owner') return <Outlet />;
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

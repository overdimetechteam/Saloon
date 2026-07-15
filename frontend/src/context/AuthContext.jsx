import { createContext, useContext, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api/axios';
import { sanitizeProfile } from '../utils/profile';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('access');
    return token ? parseJwt(token) : null;
  });
  const [profile, setProfile] = useState(() => {
    const p = localStorage.getItem('profile');
    return p ? sanitizeProfile(JSON.parse(p)) : null;
  });

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password });
    const clean = sanitizeProfile(data.user);
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    localStorage.setItem('profile', JSON.stringify(clean));
    setUser(parseJwt(data.access));
    setProfile(clean);
    return clean;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register/', payload);
    if (data.requires_verification) {
      return data;
    }
    const clean = sanitizeProfile(data.user);
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    localStorage.setItem('profile', JSON.stringify(clean));
    setUser(parseJwt(data.access));
    setProfile(clean);
    return clean;
  };

  const socialLogin = (data) => {
    const clean = sanitizeProfile(data.user);
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    localStorage.setItem('profile', JSON.stringify(clean));
    setUser(parseJwt(data.access));
    setProfile(clean);
    return clean;
  };

  const updateProfile = (data) => {
    const stored = JSON.parse(localStorage.getItem('profile') || '{}');
    const updated = sanitizeProfile({ ...stored, ...data });
    localStorage.setItem('profile', JSON.stringify(updated));
    setProfile(updated);
    return updated;
  };

  const logout = () => {
    const refresh = localStorage.getItem('refresh');
    // Clear local state immediately — no await before this so no race condition
    // where re-login can happen while the blacklist call is still in flight.
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('profile');
    setUser(null);
    setProfile(null);
    // Blacklist server-side in the background (best-effort)
    if (refresh) {
      api.post('/auth/logout/', { refresh }).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, login, register, socialLogin, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function RequireEmployee({ children }) {
  const { profile } = useContext(AuthContext);
  if (!profile) {
    return <Navigate to="/employee/login" replace />;
  }
  if (profile.role !== 'employee') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

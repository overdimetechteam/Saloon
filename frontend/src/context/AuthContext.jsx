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
    const token = sessionStorage.getItem('access');
    return token ? parseJwt(token) : null;
  });
  const [profile, setProfile] = useState(() => {
    const p = sessionStorage.getItem('profile');
    return p ? sanitizeProfile(JSON.parse(p)) : null;
  });

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password });
    const clean = sanitizeProfile(data.user);
    sessionStorage.setItem('access', data.access);
    sessionStorage.setItem('refresh', data.refresh);
    sessionStorage.setItem('profile', JSON.stringify(clean));
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
    sessionStorage.setItem('access', data.access);
    sessionStorage.setItem('refresh', data.refresh);
    sessionStorage.setItem('profile', JSON.stringify(clean));
    setUser(parseJwt(data.access));
    setProfile(clean);
    return clean;
  };

  const socialLogin = (data) => {
    const clean = sanitizeProfile(data.user);
    sessionStorage.setItem('access', data.access);
    sessionStorage.setItem('refresh', data.refresh);
    sessionStorage.setItem('profile', JSON.stringify(clean));
    setUser(parseJwt(data.access));
    setProfile(clean);
    return clean;
  };

  const updateProfile = (data) => {
    const stored = JSON.parse(sessionStorage.getItem('profile') || '{}');
    const updated = sanitizeProfile({ ...stored, ...data });
    sessionStorage.setItem('profile', JSON.stringify(updated));
    setProfile(updated);
    return updated;
  };

  const logout = async () => {
    const refresh = sessionStorage.getItem('refresh');
    // Blacklist the refresh token server-side so it can't be reused
    if (refresh) {
      try {
        await api.post('/auth/logout/', { refresh });
      } catch {
        // proceed with local logout even if server call fails
      }
    }
    sessionStorage.removeItem('access');
    sessionStorage.removeItem('refresh');
    sessionStorage.removeItem('profile');
    setUser(null);
    setProfile(null);
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

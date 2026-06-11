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

  const logout = async () => {
    const refresh = localStorage.getItem('refresh');
    // Blacklist the refresh token server-side so it can't be reused
    if (refresh) {
      try {
        await api.post('/auth/logout/', { refresh });
      } catch {
        // proceed with local logout even if server call fails
      }
    }
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('profile');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, login, register, socialLogin, logout }}>
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

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

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
    return p ? JSON.parse(p) : null;
  });

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password });
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    localStorage.setItem('profile', JSON.stringify(data.user));
    setUser(parseJwt(data.access));
    setProfile(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register/', payload);
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    localStorage.setItem('profile', JSON.stringify(data.user));
    setUser(parseJwt(data.access));
    setProfile(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('profile');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

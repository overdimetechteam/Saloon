import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const OwnerContext = createContext(null);

export function OwnerProvider({ children }) {
  const { profile } = useAuth();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSalon = () => {
    if (!profile || profile.role !== 'salon_owner') { setLoading(false); return; }
    api.get('/owner/salon/')
      .then(r => setSalon(r.data))
      .catch(() => setSalon(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSalon(); }, [profile?.id]);

  return (
    <OwnerContext.Provider value={{ salon, setSalon, loading, reload: loadSalon }}>
      {children}
    </OwnerContext.Provider>
  );
}

export function useOwner() {
  return useContext(OwnerContext);
}

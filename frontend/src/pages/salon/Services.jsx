import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function SalonServices() {
  const { profile } = useAuth();
  const [salonId, setSalonId] = useState(null);
  const [salonServices, setSalonServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [toAdd, setToAdd] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/services/').then(r => setAllServices(r.data)).catch(() => {});
    api.get('/admin/salons/').then(r => {
      const owned = r.data.find(s => s.owner === profile?.id);
      if (owned) { setSalonId(owned.id); loadSalonServices(owned.id); }
    }).catch(() => {
      api.get('/salons/').then(r => {
        const owned = r.data.find(s => s.owner === profile?.id);
        if (owned) { setSalonId(owned.id); loadSalonServices(owned.id); }
      }).catch(() => {});
    });
  }, []);

  const loadSalonServices = id => {
    api.get(`/salons/${id}/services/`).then(r => setSalonServices(r.data)).catch(() => {});
  };

  const attach = async () => {
    if (!toAdd || !salonId) return;
    setError('');
    try {
      await api.post(`/salons/${salonId}/services/`, { service: Number(toAdd) });
      loadSalonServices(salonId);
      setToAdd('');
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error');
    }
  };

  const detach = async (ssId) => {
    try {
      await api.delete(`/salons/${salonId}/services/${ssId}/`);
      loadSalonServices(salonId);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error');
    }
  };

  const attached = new Set(salonServices.map(ss => ss.service));
  const available = allServices.filter(s => !attached.has(s.id));

  return (
    <div style={s.wrap}>
      <h2>My Services</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={s.addRow}>
        <select style={s.select} value={toAdd} onChange={e => setToAdd(e.target.value)}>
          <option value="">— Attach a service —</option>
          {available.map(sv => <option key={sv.id} value={sv.id}>{sv.name} ({sv.category})</option>)}
        </select>
        <button style={s.btn} onClick={attach}>Attach</button>
      </div>
      {salonServices.length === 0 && <p>No services attached yet.</p>}
      {salonServices.map(ss => (
        <div key={ss.id} style={s.card}>
          <div style={{ flex: 1 }}>
            <strong>{ss.service_name}</strong> <span style={s.tag}>{ss.service_category}</span>
            <p>Price: LKR {ss.effective_price} | Duration: {ss.effective_duration}min</p>
          </div>
          <button style={s.removeBtn} onClick={() => detach(ss.id)}>Detach</button>
        </div>
      ))}
    </div>
  );
}

const s = {
  wrap: { maxWidth: 700, margin: '40px auto', padding: 24 },
  addRow: { display: 'flex', gap: 8, marginBottom: 20 },
  select: { flex: 1, padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 },
  btn: { padding: '8px 16px', background: '#2c3e50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  card: { display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 8, padding: 14, marginBottom: 10 },
  tag: { background: '#eaf0fb', padding: '1px 8px', borderRadius: 10, fontSize: 12, marginLeft: 6 },
  removeBtn: { padding: '6px 12px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
};

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function SalonDashboard() {
  const { profile } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [salonId, setSalonId] = useState(null);

  useEffect(() => {
    api.get('/salons/').then(r => {
      const owned = r.data.find(s => s.owner === profile?.id);
      if (!owned) {
        api.get('/admin/salons/').then(r2 => {
          const o2 = r2.data.find(s => s.owner === profile?.id);
          if (o2) loadSalon(o2.id);
        }).catch(() => {});
        return;
      }
      loadSalon(owned.id);
    }).catch(() => {});
  }, []);

  const loadSalon = id => {
    setSalonId(id);
    api.get(`/salons/${id}/bookings/pending/`).then(r => setPendingCount(r.data.length)).catch(() => {});
    api.get(`/salons/${id}/reports/low-stock/`).then(r => setLowStockCount(r.data.length)).catch(() => {});
  };

  return (
    <div style={s.wrap}>
      <h2>Salon Dashboard</h2>
      <div style={s.cards}>
        <div style={s.card}>
          <h3>{pendingCount}</h3>
          <p>Pending Bookings</p>
          <Link to="/salon/bookings">Manage →</Link>
        </div>
        <div style={{ ...s.card, ...(lowStockCount > 0 ? s.alert : {}) }}>
          <h3>{lowStockCount}</h3>
          <p>Low Stock Products</p>
          <Link to="/salon/reports">View →</Link>
        </div>
      </div>
      <div style={s.links}>
        <Link to="/salon/bookings" style={s.btn}>Bookings</Link>
        <Link to="/salon/services" style={s.btn}>Services</Link>
        <Link to="/salon/inventory" style={s.btn}>Inventory</Link>
        <Link to="/salon/reports" style={s.btn}>Reports</Link>
      </div>
    </div>
  );
}

const s = {
  wrap: { maxWidth: 800, margin: '40px auto', padding: 24 },
  cards: { display: 'flex', gap: 16, marginBottom: 24 },
  card: { flex: 1, border: '1px solid #ddd', borderRadius: 8, padding: 20, textAlign: 'center' },
  alert: { borderColor: '#e74c3c', background: '#fff5f5' },
  links: { display: 'flex', gap: 12 },
  btn: { padding: '10px 20px', background: '#2c3e50', color: '#fff', textDecoration: 'none', borderRadius: 4 },
};

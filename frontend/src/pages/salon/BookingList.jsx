import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = {
  pending: '#f39c12', confirmed: '#27ae60', rejected: '#e74c3c',
  awaiting_client: '#8e44ad', rescheduled: '#2980b9', cancelled: '#95a5a6',
  completed: '#16a085', flagged: '#c0392b',
};

export default function SalonBookingList() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('');
  const [salonId, setSalonId] = useState(null);

  useEffect(() => {
    api.get('/admin/salons/').then(r => {
      const owned = r.data.find(s => s.owner === profile?.id);
      if (owned) {
        setSalonId(owned.id);
        loadBookings(owned.id);
      }
    }).catch(() => {
      api.get('/salons/').then(r => {
        const owned = r.data.find(s => s.owner === profile?.id);
        if (owned) { setSalonId(owned.id); loadBookings(owned.id); }
      }).catch(() => {});
    });
  }, []);

  const loadBookings = (id, st = '') => {
    const url = st ? `/salons/${id}/bookings/?status=${st}` : `/salons/${id}/bookings/`;
    api.get(url).then(r => setBookings(r.data)).catch(() => {});
  };

  const handleFilter = e => {
    setFilter(e.target.value);
    if (salonId) loadBookings(salonId, e.target.value);
  };

  return (
    <div style={s.wrap}>
      <h2>Salon Bookings</h2>
      <select style={s.select} value={filter} onChange={handleFilter}>
        <option value="">All Statuses</option>
        {['pending','confirmed','rejected','awaiting_client','rescheduled','cancelled','completed','flagged'].map(st =>
          <option key={st} value={st}>{st}</option>
        )}
      </select>
      {bookings.length === 0 && <p>No bookings found.</p>}
      {bookings.map(b => (
        <div key={b.id} style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{b.client_email}</strong>
            <span style={{ ...s.badge, background: STATUS_COLORS[b.status] || '#888' }}>{b.status}</span>
          </div>
          <p>{new Date(b.requested_datetime).toLocaleString()}</p>
          <Link to={`/salon/bookings/${b.id}`}>Manage →</Link>
        </div>
      ))}
    </div>
  );
}

const s = {
  wrap: { maxWidth: 700, margin: '40px auto', padding: 24 },
  select: { padding: '8px 12px', fontSize: 14, marginBottom: 16, border: '1px solid #ccc', borderRadius: 4 },
  card: { border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 12 },
  badge: { color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12 },
};

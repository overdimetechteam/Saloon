import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const STATUS_COLORS = {
  pending: '#f39c12', confirmed: '#27ae60', rejected: '#e74c3c',
  awaiting_client: '#8e44ad', rescheduled: '#2980b9', cancelled: '#95a5a6',
  completed: '#16a085', flagged: '#c0392b',
};

export default function ClientBookingList() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api.get('/bookings/').then(r => setBookings(r.data)).catch(() => {});
  }, []);

  return (
    <div style={s.wrap}>
      <h2>My Bookings</h2>
      {bookings.length === 0 && <p>No bookings yet.</p>}
      {bookings.map(b => (
        <div key={b.id} style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{b.salon_name}</strong>
            <span style={{ ...s.badge, background: STATUS_COLORS[b.status] || '#888' }}>{b.status}</span>
          </div>
          <p>{new Date(b.requested_datetime).toLocaleString()}</p>
          <Link to={`/client/bookings/${b.id}`}>Details →</Link>
        </div>
      ))}
    </div>
  );
}

const s = {
  wrap: { maxWidth: 700, margin: '40px auto', padding: 24 },
  card: { border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 12 },
  badge: { color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12 },
};

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const STATUS_COLORS = {
  pending: '#f39c12', confirmed: '#27ae60', rejected: '#e74c3c',
  awaiting_client: '#8e44ad', rescheduled: '#2980b9', cancelled: '#95a5a6',
  completed: '#16a085', flagged: '#c0392b',
};

export default function ClientDashboard() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api.get('/bookings/').then(r => {
      const upcoming = r.data.filter(b => ['pending', 'confirmed', 'rescheduled', 'awaiting_client'].includes(b.status));
      setBookings(upcoming.slice(0, 5));
    }).catch(() => {});
  }, []);

  return (
    <div style={s.wrap}>
      <h2>My Dashboard</h2>
      <h3>Upcoming Bookings</h3>
      {bookings.length === 0 && <p>No upcoming bookings. <Link to="/salons">Browse salons</Link> to book.</p>}
      {bookings.map(b => (
        <div key={b.id} style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{b.salon_name}</strong>
            <span style={{ ...s.badge, background: STATUS_COLORS[b.status] }}>{b.status}</span>
          </div>
          <p>{new Date(b.requested_datetime).toLocaleString()}</p>
          <Link to={`/client/bookings/${b.id}`}>View</Link>
        </div>
      ))}
      <Link to="/client/bookings" style={s.link}>View All Bookings →</Link>
    </div>
  );
}

const s = {
  wrap: { maxWidth: 700, margin: '40px auto', padding: 24 },
  card: { border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 12 },
  badge: { color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12 },
  link: { display: 'inline-block', marginTop: 16, color: '#2c3e50' },
};

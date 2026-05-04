import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { c, shadow, STATUS_META } from '../../styles/theme';

export default function UserDashboard() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings/').then(r => {
      setBookings(r.data.filter(b => !['cancelled','completed'].includes(b.status)).slice(0, 6));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={s.welcomeBanner}>
        <div>
          <h2 style={s.welcomeTitle}>Welcome back, {profile?.full_name?.split(' ')[0]} 👋</h2>
          <p style={s.welcomeSub}>Here are your upcoming appointments</p>
        </div>
        <Link to="/salons" style={s.bookBtn}>+ Book Appointment</Link>
      </div>

      {loading && <p style={s.msg}>Loading…</p>}
      {!loading && bookings.length === 0 && (
        <div style={s.emptyCard}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <h3 style={{ color: c.text, marginBottom: 8 }}>No upcoming appointments</h3>
          <p style={{ color: c.textMuted, marginBottom: 20 }}>Browse our salons and book your first appointment!</p>
          <Link to="/salons" style={s.bookBtn}>Browse Salons</Link>
        </div>
      )}

      <div style={s.grid}>
        {bookings.map(b => {
          const meta = STATUS_META[b.status] || { label: b.status, color: '#888', bg: '#f0f0f0' };
          return (
            <div key={b.id} style={s.card}>
              <div style={s.cardHead}>
                <div>
                  <div style={s.salonLabel}>{b.salon_name}</div>
                  <div style={{ ...s.badge, color: meta.color, background: meta.bg }}>{meta.label}</div>
                </div>
                <div style={s.dateBox}>
                  <div style={s.dateDay}>{new Date(b.requested_datetime).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}</div>
                  <div style={s.dateTime}>{new Date(b.requested_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
              {b.booking_services?.length > 0 && (
                <div style={s.services}>{b.booking_services.map(bs => bs.service_name).join(' · ')}</div>
              )}
              {b.status === 'awaiting_client' && (
                <div style={s.actionHint}>⚠️ Alternative slots available — action required</div>
              )}
              <Link to={`/user/bookings/${b.id}`} style={s.viewLink}>View Details →</Link>
            </div>
          );
        })}
      </div>

      {bookings.length > 0 && (
        <Link to="/user/bookings" style={s.allLink}>View all bookings →</Link>
      )}
    </div>
  );
}

const s = {
  welcomeBanner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: c.surface, borderRadius: 14, padding: '24px 28px', marginBottom: 28, boxShadow: shadow.sm, border: `1px solid ${c.border}`, flexWrap: 'wrap', gap: 14 },
  welcomeTitle: { fontSize: 22, fontWeight: 700, color: c.text, margin: 0, marginBottom: 4 },
  welcomeSub: { color: c.textMuted, fontSize: 14, margin: 0 },
  bookBtn: { padding: '10px 22px', background: c.primary, color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  msg: { textAlign: 'center', color: c.textMuted, padding: '40px 0' },
  emptyCard: { background: c.surface, borderRadius: 16, padding: '60px 40px', textAlign: 'center', boxShadow: shadow.sm, border: `1px solid ${c.border}` },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  card: { background: c.surface, borderRadius: 12, padding: 20, boxShadow: shadow.sm, border: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', gap: 10 },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  salonLabel: { fontWeight: 700, fontSize: 16, color: c.text, marginBottom: 6 },
  badge: { display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  dateBox: { textAlign: 'right', background: c.primarySoft, borderRadius: 8, padding: '6px 10px' },
  dateDay: { fontSize: 13, fontWeight: 700, color: c.primary },
  dateTime: { fontSize: 11, color: c.primary },
  services: { fontSize: 13, color: c.textMuted, padding: '6px 10px', background: c.bg, borderRadius: 6 },
  actionHint: { fontSize: 12, color: c.warning, background: c.warningBg, borderRadius: 6, padding: '6px 10px', fontWeight: 500 },
  viewLink: { fontSize: 13, color: c.primary, textDecoration: 'none', fontWeight: 600 },
  allLink: { display: 'inline-block', marginTop: 20, color: c.primary, textDecoration: 'none', fontWeight: 600, fontSize: 14 },
};

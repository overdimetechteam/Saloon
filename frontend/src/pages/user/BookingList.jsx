import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { c, shadow, STATUS_META } from '../../styles/theme';

const ALL_STATUSES = ['pending','confirmed','awaiting_client','rescheduled','cancelled','completed','flagged'];

export default function UserBookingList() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings/').then(r => setBookings(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const shown = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>My Bookings</h2>
        <div style={s.filters}>
          <button style={{ ...s.chip, ...(filter === 'all' ? s.chipActive : {}) }} onClick={() => setFilter('all')}>All</button>
          {ALL_STATUSES.map(st => (
            <button key={st} style={{ ...s.chip, ...(filter === st ? s.chipActive : {}) }} onClick={() => setFilter(st)}>
              {STATUS_META[st]?.label || st}
            </button>
          ))}
        </div>
      </div>

      {loading && <p style={s.msg}>Loading…</p>}
      {!loading && shown.length === 0 && <div style={s.empty}><p>No bookings found.</p><Link to="/salons" style={s.btn}>Browse Salons</Link></div>}

      <div style={s.list}>
        {shown.map(b => {
          const meta = STATUS_META[b.status] || { label: b.status, color: '#888', bg: '#f0f0f0' };
          return (
            <div key={b.id} style={s.card}>
              <div style={s.leftAccent} />
              <div style={s.cardContent}>
                <div style={s.cardTop}>
                  <div>
                    <div style={s.salonName}>{b.salon_name}</div>
                    <div style={s.dt}>📅 {new Date(b.requested_datetime).toLocaleString()}</div>
                    {b.booking_services?.length > 0 && (
                      <div style={s.svcs}>✂️ {b.booking_services.map(bs => bs.service_name).join(' · ')}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span style={{ ...s.badge, color: meta.color, background: meta.bg }}>{meta.label}</span>
                    <Link to={`/user/bookings/${b.id}`} style={s.detailLink}>Details →</Link>
                  </div>
                </div>
                {b.status === 'awaiting_client' && (
                  <div style={s.actionBanner}>⚠️ The salon has proposed alternative slots. Please select one.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: c.text, marginBottom: 16 },
  filters: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { padding: '6px 14px', borderRadius: 20, border: `1px solid ${c.border}`, background: c.surface, color: c.textMuted, cursor: 'pointer', fontSize: 12, fontWeight: 500 },
  chipActive: { background: c.primarySoft, color: c.primary, borderColor: c.primary },
  msg: { textAlign: 'center', color: c.textMuted, padding: '40px 0' },
  empty: { textAlign: 'center', padding: '60px 0' },
  btn: { display: 'inline-block', marginTop: 12, padding: '10px 22px', background: c.primary, color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: c.surface, borderRadius: 12, boxShadow: shadow.sm, border: `1px solid ${c.border}`, display: 'flex', overflow: 'hidden' },
  leftAccent: { width: 4, background: c.primary, flexShrink: 0 },
  cardContent: { flex: 1, padding: '16px 20px' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  salonName: { fontWeight: 700, fontSize: 16, color: c.text, marginBottom: 4 },
  dt: { fontSize: 13, color: c.textMuted, marginBottom: 4 },
  svcs: { fontSize: 12, color: c.textMuted },
  badge: { display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0 },
  detailLink: { fontSize: 13, color: c.primary, textDecoration: 'none', fontWeight: 600 },
  actionBanner: { marginTop: 12, padding: '8px 12px', background: c.warningBg, color: c.warning, borderRadius: 6, fontSize: 13, fontWeight: 500, border: `1px solid ${c.warningBorder}` },
};

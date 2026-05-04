import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { c, shadow, STATUS_META } from '../../styles/theme';

const STATUSES = ['pending','confirmed','awaiting_client','rescheduled','cancelled','completed','flagged'];

export default function OwnerBookingList() {
  const { salon } = useOwner();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salon) return;
    api.get(`/salons/${salon.id}/bookings/`).then(r => setBookings(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [salon]);

  const shown = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Bookings</h2>
          {pendingCount > 0 && <p style={s.pendingNote}>⚠️ {pendingCount} pending booking{pendingCount > 1 ? 's' : ''} need attention</p>}
        </div>
      </div>

      <div style={s.filters}>
        <button style={{ ...s.chip, ...(filter === 'all' ? s.chipActive : {}) }} onClick={() => setFilter('all')}>All ({bookings.length})</button>
        {STATUSES.map(st => {
          const count = bookings.filter(b => b.status === st).length;
          if (count === 0 && filter !== st) return null;
          return (
            <button key={st} style={{ ...s.chip, ...(filter === st ? s.chipActive : {}) }} onClick={() => setFilter(st)}>
              {STATUS_META[st]?.label || st} ({count})
            </button>
          );
        })}
      </div>

      {loading && <p style={s.msg}>Loading bookings…</p>}
      {!loading && shown.length === 0 && <div style={s.empty}>No bookings found.</div>}

      <div style={s.list}>
        {shown.map(b => {
          const meta = STATUS_META[b.status] || { label: b.status, color: '#888', bg: '#f0f0f0' };
          return (
            <div key={b.id} style={{ ...s.card, borderLeft: `4px solid ${meta.color}` }}>
              <div style={s.cardMain}>
                <div style={s.clientInfo}>
                  <div style={s.avatar}>{b.client_email?.[0]?.toUpperCase()}</div>
                  <div>
                    <div style={s.clientEmail}>{b.client_email}</div>
                    <div style={s.dt}>📅 {new Date(b.requested_datetime).toLocaleString()}</div>
                    {b.booking_services?.length > 0 && (
                      <div style={s.services}>{b.booking_services.map(bs => bs.service_name).join(' · ')}</div>
                    )}
                  </div>
                </div>
                <div style={s.right}>
                  <span style={{ ...s.badge, color: meta.color, background: meta.bg }}>{meta.label}</span>
                  {b.negotiation_round > 0 && <span style={s.round}>Round {b.negotiation_round}</span>}
                  <Link to={`/owner/bookings/${b.id}`} style={s.manageBtn}>{b.status === 'pending' ? 'Manage →' : 'View →'}</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 700, color: c.text, margin: 0, marginBottom: 4 },
  pendingNote: { color: c.warning, fontSize: 13, fontWeight: 500, margin: 0 },
  filters: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { padding: '6px 14px', borderRadius: 20, border: `1px solid ${c.border}`, background: c.surface, color: c.textMuted, cursor: 'pointer', fontSize: 12, fontWeight: 500 },
  chipActive: { background: c.primarySoft, color: c.primary, borderColor: c.primary },
  msg: { textAlign: 'center', color: c.textMuted, padding: '40px 0' },
  empty: { textAlign: 'center', padding: '60px 0', color: c.textMuted, background: c.surface, borderRadius: 12, border: `1px solid ${c.border}` },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: { background: c.surface, borderRadius: 12, boxShadow: shadow.sm, border: `1px solid ${c.border}`, overflow: 'hidden' },
  cardMain: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', gap: 16, flexWrap: 'wrap' },
  clientInfo: { display: 'flex', alignItems: 'center', gap: 14 },
  avatar: { width: 38, height: 38, borderRadius: '50%', background: c.primaryLight, color: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 },
  clientEmail: { fontWeight: 600, fontSize: 14, color: c.text, marginBottom: 3 },
  dt: { fontSize: 12, color: c.textMuted, marginBottom: 2 },
  services: { fontSize: 12, color: c.textMuted },
  right: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  badge: { display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  round: { fontSize: 11, color: c.textMuted },
  manageBtn: { padding: '7px 16px', background: c.primarySoft, color: c.primary, borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700 },
};

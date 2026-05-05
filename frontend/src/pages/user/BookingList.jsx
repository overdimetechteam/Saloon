import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { c, STATUS_META } from '../../styles/theme';

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
      {/* Header */}
      <div style={s.header} className="fade-up">
        <div>
          <h2 style={s.title}>My Bookings</h2>
          <p style={s.sub}>{bookings.length} total appointment{bookings.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/salons" style={s.bookBtn}>+ New Booking</Link>
      </div>

      {/* Filter chips */}
      <div style={s.filters} className="fade-up d1">
        <button
          style={{ ...s.chip, ...(filter === 'all' ? s.chipActive : {}) }}
          onClick={() => setFilter('all')}
        >
          All <span style={s.chipCount}>{bookings.length}</span>
        </button>
        {ALL_STATUSES.map(st => {
          const count = bookings.filter(b => b.status === st).length;
          if (!count && filter !== st) return null;
          const meta = STATUS_META[st];
          return (
            <button
              key={st}
              style={{
                ...s.chip,
                ...(filter === st ? { ...s.chipActive, background: meta?.bg, color: meta?.color, borderColor: meta?.color + '50' } : {}),
              }}
              onClick={() => setFilter(st)}
            >
              {meta?.label || st}
              <span style={{ ...s.chipCount, ...(filter === st ? { background: meta?.color + '20', color: meta?.color } : {}) }}>{count}</span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div style={s.loadStack}>
          {[1,2,3].map(i => <div key={i} style={s.skeleton} className="shimmer" />)}
        </div>
      )}

      {!loading && shown.length === 0 && (
        <div style={s.empty} className="scale-in">
          <div style={{ fontSize: 44, marginBottom: 14 }}>📅</div>
          <h3 style={s.emptyTitle}>No bookings found</h3>
          <p style={{ color: c.textMuted, marginBottom: 20 }}>
            {filter === 'all' ? "You haven't made any bookings yet." : `No ${STATUS_META[filter]?.label} bookings.`}
          </p>
          <Link to="/salons" style={s.bookBtn}>Browse Salons</Link>
        </div>
      )}

      <div style={s.list}>
        {shown.map((b, i) => {
          const meta = STATUS_META[b.status] || { label: b.status, color: '#888', bg: '#f0f0f0', border: '#ddd' };
          const dt = new Date(b.requested_datetime);
          return (
            <div
              key={b.id}
              style={{ ...s.card, borderLeft: `4px solid ${meta.color}` }}
              className={`lift-sm fade-up d${Math.min(i + 1, 5)}`}
            >
              <div style={s.cardLeft}>
                <div style={{ ...s.salonInitial, background: meta.bg, color: meta.color }}>
                  {b.salon_name?.[0]?.toUpperCase()}
                </div>
              </div>

              <div style={s.cardMid}>
                <div style={s.salonName}>{b.salon_name}</div>
                <div style={s.dtRow}>
                  <span style={s.dtIcon}>◷</span>
                  {dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {' · '}
                  {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {b.booking_services?.length > 0 && (
                  <div style={s.svcsRow}>
                    ✂ {b.booking_services.map(bs => bs.service_name).join(' · ')}
                  </div>
                )}
                {b.status === 'awaiting_client' && (
                  <div style={s.actionPill}>⚡ Action required — alternative slots waiting</div>
                )}
              </div>

              <div style={s.cardRight}>
                <span style={{ ...s.badge, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}30` }}>
                  {meta.label}
                </span>
                {b.negotiation_round > 0 && (
                  <span style={s.roundTag}>Round {b.negotiation_round}/5</span>
                )}
                <Link to={`/user/bookings/${b.id}`} style={s.detailBtn}>Details →</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 24, flexWrap: 'wrap', gap: 14,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28, fontWeight: 700, color: c.text, margin: 0, marginBottom: 4,
  },
  sub: { color: c.textMuted, fontSize: 13, margin: 0 },
  bookBtn: {
    padding: '10px 22px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    color: '#fff', borderRadius: 12, fontWeight: 600, fontSize: 14,
    textDecoration: 'none', boxShadow: '0 4px 12px rgba(124,58,237,.3)',
    transition: 'box-shadow .18s ease, transform .18s ease',
  },

  filters: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: {
    padding: '6px 14px', borderRadius: 20,
    border: '1px solid var(--border)', background: 'var(--surface)',
    color: c.textMuted, cursor: 'pointer', fontSize: 12, fontWeight: 500,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    transition: 'all .18s ease',
  },
  chipActive: { background: c.primarySoft, color: c.primary, borderColor: c.primary },
  chipCount: {
    background: '#F3F4F6', color: '#6B7280',
    borderRadius: 20, fontSize: 10, fontWeight: 700,
    padding: '1px 6px', transition: 'all .18s ease',
  },

  loadStack: { display: 'flex', flexDirection: 'column', gap: 12 },
  skeleton: { height: 88, borderRadius: 16 },

  empty: {
    background: 'var(--surface)', borderRadius: 20, padding: '60px 40px',
    textAlign: 'center', border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(124,58,237,.06)',
  },
  emptyTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 20, color: c.text, marginBottom: 8,
  },

  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    background: 'var(--surface)', borderRadius: 16,
    boxShadow: '0 2px 10px rgba(0,0,0,.05)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 0,
    overflow: 'hidden', transition: 'box-shadow .2s ease, transform .2s ease',
  },
  cardLeft: { padding: '20px 16px 20px 20px', flexShrink: 0 },
  salonInitial: {
    width: 42, height: 42, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, fontWeight: 800,
  },
  cardMid: { flex: 1, padding: '16px 12px 16px 0' },
  salonName: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 700, fontSize: 15, color: c.text, marginBottom: 4,
  },
  dtRow: { fontSize: 12, color: c.textMuted, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 },
  dtIcon: { fontSize: 13 },
  svcsRow: { fontSize: 12, color: c.textMuted },
  actionPill: {
    display: 'inline-block', marginTop: 6,
    fontSize: 11, fontWeight: 600, color: '#92400E',
    background: '#FEF3C7', borderRadius: 20, padding: '3px 10px',
    border: '1px solid #FDE68A',
  },
  cardRight: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7,
    padding: '16px 20px', flexShrink: 0,
  },
  badge: { display: 'inline-flex', padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  roundTag: { fontSize: 10, color: c.textLight },
  detailBtn: {
    fontSize: 13, color: c.primary, fontWeight: 700,
    padding: '6px 14px', background: c.primarySoft, borderRadius: 8,
    transition: 'background .15s ease',
  },
};

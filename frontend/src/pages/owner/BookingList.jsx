import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { c, STATUS_META } from '../../styles/theme';

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
      {/* Header */}
      <div style={s.header} className="fade-up">
        <div>
          <div style={s.eyebrow}>Management</div>
          <h2 style={s.title}>Bookings</h2>
          {pendingCount > 0 && (
            <div style={s.pendingAlert}>
              <span style={s.pendingDot} />
              {pendingCount} booking{pendingCount > 1 ? 's' : ''} awaiting your response
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={s.filters} className="fade-up d1">
        <button
          style={{ ...s.chip, ...(filter === 'all' ? s.chipAll : {}) }}
          onClick={() => setFilter('all')}
        >
          All
          <span style={{ ...s.chipBadge, background: filter === 'all' ? '#7C3AED' : '#E5E7EB', color: filter === 'all' ? '#fff' : '#6B7280' }}>
            {bookings.length}
          </span>
        </button>
        {STATUSES.map(st => {
          const count = bookings.filter(b => b.status === st).length;
          if (!count && filter !== st) return null;
          const meta = STATUS_META[st];
          const isActive = filter === st;
          return (
            <button
              key={st}
              style={{
                ...s.chip,
                ...(isActive ? { background: meta?.bg, color: meta?.color, border: `1px solid ${meta?.color}40` } : {}),
              }}
              onClick={() => setFilter(st)}
            >
              {meta?.label || st}
              <span style={{ ...s.chipBadge, background: isActive ? meta?.color : '#E5E7EB', color: isActive ? '#fff' : '#6B7280' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div style={s.loadStack}>
          {[1,2,3,4].map(i => <div key={i} style={s.skeleton} className="shimmer" />)}
        </div>
      )}

      {!loading && shown.length === 0 && (
        <div style={s.empty} className="scale-in">
          <div style={{ fontSize: 40, marginBottom: 12, opacity: .5 }}>📋</div>
          <h3 style={s.emptyTitle}>No bookings found</h3>
          <p style={{ color: c.textMuted }}>
            {filter === 'all' ? 'No bookings yet.' : `No ${STATUS_META[filter]?.label || filter} bookings.`}
          </p>
        </div>
      )}

      <div style={s.list}>
        {shown.map((b, i) => {
          const meta = STATUS_META[b.status] || { label: b.status, color: '#888', bg: '#f0f0f0' };
          const dt = new Date(b.requested_datetime);
          const isPending = b.status === 'pending';
          return (
            <div
              key={b.id}
              style={{ ...s.card, ...(isPending ? s.cardPending : {}) }}
              className={`lift-sm fade-up d${Math.min(i + 1, 5)}`}
            >
              <div style={{ ...s.colorTab, background: meta.color }} />

              <div style={s.clientSection}>
                <div style={{ ...s.avatar, background: meta.bg, color: meta.color }}>
                  {b.client_email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={s.clientEmail}>{b.client_email}</div>
                  <div style={s.clientDt}>
                    ◷ {dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' · '}
                    {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {b.booking_services?.length > 0 && (
                    <div style={s.svcs}>
                      ✂ {b.booking_services.map(bs => bs.service_name).join(' · ')}
                    </div>
                  )}
                </div>
              </div>

              <div style={s.rightSection}>
                <span style={{ ...s.badge, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}30` }}>
                  {meta.label}
                </span>
                {b.negotiation_round > 0 && (
                  <span style={s.roundTag}>Round {b.negotiation_round}/5</span>
                )}
                <Link
                  to={`/owner/bookings/${b.id}`}
                  style={{ ...s.manageBtn, ...(isPending ? s.manageBtnPending : {}) }}
                >
                  {isPending ? '⚡ Respond' : 'View →'}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  header: { marginBottom: 22 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: '#A78BFA', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 5 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#111827', margin: '0 0 8px' },
  pendingAlert: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    fontSize: 12, color: '#92400E', fontWeight: 500,
    background: '#FFFBEB', border: '1px solid #FDE68A',
    borderRadius: 20, padding: '4px 12px',
  },
  pendingDot: {
    width: 7, height: 7, borderRadius: '50%', background: '#D97706', flexShrink: 0,
    animation: 'pulseRing 2s ease infinite',
  },

  filters: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    padding: '6px 14px', borderRadius: 20,
    border: '1px solid #E5E7EB', background: '#fff',
    color: c.textMuted, cursor: 'pointer', fontSize: 12, fontWeight: 500,
    display: 'inline-flex', alignItems: 'center', gap: 7,
    transition: 'all .18s ease',
  },
  chipAll: { background: '#F5F3FF', color: '#7C3AED', borderColor: '#DDD6FE' },
  chipBadge: {
    borderRadius: 20, fontSize: 10, fontWeight: 700,
    padding: '1px 6px', transition: 'all .18s ease',
  },

  loadStack: { display: 'flex', flexDirection: 'column', gap: 12 },
  skeleton: { height: 82, borderRadius: 16 },

  empty: {
    background: '#fff', borderRadius: 20, padding: '60px 40px',
    textAlign: 'center', border: '1px solid #EDE9FE',
    boxShadow: '0 4px 20px rgba(124,58,237,.06)',
  },
  emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: 20, color: c.text, marginBottom: 8 },

  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    background: '#fff', borderRadius: 16,
    boxShadow: '0 2px 10px rgba(0,0,0,.05)',
    border: '1px solid #F3F4F6',
    display: 'flex', alignItems: 'center', overflow: 'hidden',
    transition: 'transform .2s ease, box-shadow .2s ease',
  },
  cardPending: { border: '1px solid #FDE68A', boxShadow: '0 2px 12px rgba(217,119,6,.08)' },

  colorTab: { width: 4, alignSelf: 'stretch', flexShrink: 0 },

  clientSection: { display: 'flex', alignItems: 'center', gap: 14, flex: 1, padding: '16px 18px' },
  avatar: {
    width: 40, height: 40, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, fontWeight: 800, flexShrink: 0,
  },
  clientEmail: { fontWeight: 600, fontSize: 14, color: c.text, marginBottom: 3 },
  clientDt: { fontSize: 12, color: c.textMuted, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 },
  svcs: { fontSize: 11, color: c.textMuted },

  rightSection: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
    padding: '14px 20px', flexShrink: 0,
  },
  badge: { display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  roundTag: { fontSize: 10, color: c.textLight },
  manageBtn: {
    fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 9,
    background: '#F5F3FF', color: '#7C3AED', border: '1px solid #EDE9FE',
    transition: 'background .15s ease',
  },
  manageBtnPending: {
    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    color: '#fff', border: 'none',
    boxShadow: '0 3px 10px rgba(124,58,237,.3)',
  },
};

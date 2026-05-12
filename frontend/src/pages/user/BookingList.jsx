import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { STATUS_META } from '../../styles/theme';
import { useBreakpoint } from '../../hooks/useMobile';

const ALL_STATUSES = ['pending','confirmed','awaiting_client','rescheduled','cancelled','completed','flagged'];

export default function UserBookingList() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate  = useNavigate();
  const { isMobile, isTablet } = useBreakpoint();

  useEffect(() => {
    api.get('/bookings/').then(r => setBookings(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const rebook = async (bookingId) => {
    try {
      const r = await api.post(`/bookings/${bookingId}/rebook/`);
      const { salon_id, service_ids } = r.data;
      navigate(`/user/book/${salon_id}?services=${service_ids.join(',')}`);
    } catch {}
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const shown = search.trim()
    ? filtered.filter(b => b.salon_name?.toLowerCase().includes(search.trim().toLowerCase()))
    : filtered;

  return (
    <div>
      {/* Header */}
      <div style={{ ...s.header, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'flex-start', gap: isMobile ? 16 : 14 }} className="fade-up">
        <div>
          <div style={s.eyebrow}>Your Appointments</div>
          <h2 style={{ ...s.title, fontSize: isMobile ? 24 : isTablet ? 28 : 30 }}>My Bookings</h2>
          <p style={s.sub}>{bookings.length} total appointment{bookings.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/salons" style={{ ...s.bookBtn, alignSelf: isMobile ? 'stretch' : 'flex-start', justifyContent: 'center' }} className="lift-sm">✦ New Booking</Link>
      </div>

      {/* Search */}
      <div style={s.searchWrap} className="fade-up d1">
        <span style={s.searchIcon}>✦</span>
        <input
          style={s.searchInput}
          placeholder="Search by salon name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button style={s.searchClear} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* Filter chips */}
      <div style={s.filters} className="fade-up d1">
        <button
          style={{ ...s.chip, ...(filter === 'all' ? s.chipActive : {}) }}
          onClick={() => setFilter('all')}
        >
          All <span style={{ ...s.chipCount, ...(filter === 'all' ? s.chipCountActive : {}) }}>{bookings.length}</span>
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
          <div style={s.emptyOrb}>◷</div>
          <h3 style={s.emptyTitle}>No bookings found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 15, lineHeight: 1.7 }}>
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
              style={{ ...s.card, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}
              className={`lift-sm fade-up d${Math.min(i + 1, 5)}`}
            >
              {/* Top color accent bar (mobile) / Left bar (desktop) */}
              <div style={isMobile
                ? { height: 3, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}66)`, flexShrink: 0 }
                : { ...s.cardBar, background: `linear-gradient(180deg, ${meta.color}, ${meta.color}66)` }
              } />

              <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: isMobile ? '14px 16px 10px' : 0 }}>
                <div style={{ ...s.cardLeft, padding: isMobile ? '0 14px 0 0' : '18px 14px 18px 18px' }}>
                  <div style={{ ...s.salonInitial, background: meta.bg, color: meta.color, boxShadow: `0 4px 14px ${meta.color}28` }}>
                    {b.salon_name?.[0]?.toUpperCase()}
                  </div>
                </div>

                <div style={{ ...s.cardMid, flex: 1, padding: isMobile ? '0' : '16px 12px 16px 0' }}>
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

                {!isMobile && (
                  <div style={s.cardRight}>
                    <span style={{ ...s.badge, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}30` }}>
                      {meta.label}
                    </span>
                    {b.negotiation_round > 0 && (
                      <span style={s.roundTag}>Round {b.negotiation_round}/5</span>
                    )}
                    {b.status === 'completed' && (
                      <button style={s.rebookBtn} onClick={() => rebook(b.id)}>↩ Book Again</button>
                    )}
                    <Link to={`/user/bookings/${b.id}`} style={s.detailBtn}>Details →</Link>
                  </div>
                )}
              </div>

              {isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 14px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ ...s.badge, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}30` }}>
                    {meta.label}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {b.status === 'completed' && (
                      <button style={s.rebookBtn} onClick={() => rebook(b.id)}>↩ Book Again</button>
                    )}
                    <Link to={`/user/bookings/${b.id}`} style={s.detailBtn}>Details →</Link>
                  </div>
                </div>
              )}
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
    marginBottom: 28, flexWrap: 'wrap', gap: 14,
  },
  eyebrow: {
    fontSize: 10, fontWeight: 700, color: 'var(--brand-label)',
    letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6,
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: 0, marginBottom: 4,
    letterSpacing: '-0.01em',
  },
  sub: { color: 'var(--text-muted)', fontSize: 13, margin: 0 },
  bookBtn: {
    padding: '11px 24px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)',
    color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14,
    textDecoration: 'none', boxShadow: '0 6px 20px rgba(236,72,153,.35)',
    display: 'inline-flex', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start',
  },

  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '11px 18px', marginBottom: 16,
    background: 'var(--surface)', borderRadius: 12,
    border: '1px solid var(--border)',
    boxShadow: '0 2px 8px rgba(124,58,237,.05)',
  },
  searchIcon:  { color: '#7C3AED', fontSize: 13, flexShrink: 0 },
  searchInput: {
    flex: 1, border: 'none', outline: 'none', fontSize: 14,
    background: 'transparent', color: 'var(--text)',
    fontFamily: "'DM Sans', sans-serif",
  },
  searchClear: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: 12, padding: '2px 4px', borderRadius: 4,
  },

  filters: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 26 },
  chip: {
    padding: '7px 14px', borderRadius: 20,
    border: '1px solid var(--border)', background: 'var(--surface)',
    color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    transition: 'all .18s ease',
  },
  chipActive: { background: 'rgba(124,58,237,.08)', color: '#7C3AED', borderColor: '#7C3AED50' },
  chipCount: {
    background: 'var(--surface2)', color: 'var(--text-muted)',
    borderRadius: 20, fontSize: 10, fontWeight: 700,
    padding: '1px 6px', transition: 'all .18s ease',
  },
  chipCountActive: { background: 'rgba(124,58,237,.12)', color: '#7C3AED' },

  loadStack: { display: 'flex', flexDirection: 'column', gap: 12 },
  skeleton: { height: 90, borderRadius: 18 },

  empty: {
    background: 'var(--surface)', borderRadius: 24, padding: '68px 40px',
    textAlign: 'center', border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(124,58,237,.06)',
  },
  emptyOrb: {
    fontSize: 44, marginBottom: 18, color: 'var(--text-light)',
    display: 'block',
  },
  emptyTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 10,
  },

  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    background: 'var(--surface)', borderRadius: 18,
    boxShadow: '0 4px 16px rgba(124,58,237,.07), 0 1px 4px rgba(0,0,0,.04)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center',
    overflow: 'hidden', transition: 'box-shadow .2s ease, transform .2s ease',
  },
  cardBar: { width: 4, alignSelf: 'stretch', flexShrink: 0 },
  cardLeft: { padding: '18px 14px 18px 18px', flexShrink: 0 },
  salonInitial: {
    width: 44, height: 44, borderRadius: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20, fontWeight: 700,
  },
  cardMid: { flex: 1, padding: '16px 12px 16px 0' },
  salonName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 5,
    letterSpacing: '-0.01em',
  },
  dtRow: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 },
  dtIcon: { fontSize: 13 },
  svcsRow: { fontSize: 12, color: 'var(--text-muted)' },
  actionPill: {
    display: 'inline-block', marginTop: 6,
    fontSize: 11, fontWeight: 600, color: '#D97706',
    background: 'rgba(217,119,6,.1)',
    borderRadius: 20, padding: '3px 10px',
    border: '1px solid rgba(217,119,6,.25)',
  },
  cardRight: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
    padding: '16px 20px', flexShrink: 0,
  },
  badge: { display: 'inline-flex', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  roundTag: { fontSize: 10, color: 'var(--text-muted)' },
  rebookBtn: {
    fontSize: 12, color: '#059669', fontWeight: 600,
    padding: '5px 12px', background: '#ECFDF5', border: '1px solid #6EE7B7',
    borderRadius: 8, cursor: 'pointer', transition: 'background .15s ease',
  },
  detailBtn: {
    fontSize: 13, color: '#7C3AED', fontWeight: 700,
    padding: '6px 14px', background: 'rgba(124,58,237,.08)', borderRadius: 8,
    transition: 'background .15s ease',
  },
};

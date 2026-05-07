import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { c, shadow, STATUS_META } from '../../styles/theme';

const HOUR = new Date().getHours();
const GREETING = HOUR < 12 ? 'Good morning' : HOUR < 17 ? 'Good afternoon' : 'Good evening';

export default function UserDashboard() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings/').then(r => {
      setBookings(r.data.filter(b => !['cancelled','completed'].includes(b.status)).slice(0, 6));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div>
      {/* Hero Banner */}
      <div style={s.hero} className="anim-gradient">
        <div style={s.heroGlow} />
        <div style={s.heroContent} className="fade-up">
          <div style={s.greeting}>{GREETING}</div>
          <h1 style={s.heroName}>
            {firstName}<span style={s.wave}>✦</span>
          </h1>
          <p style={s.heroSub}>Ready for your next salon experience?</p>
          <div style={s.heroBtns}>
            <Link to="/salons" style={s.primaryBtn} className="lift-sm">
              ✦ Book Appointment
            </Link>
            <Link to="/user/bookings" style={s.ghostBtn}>
              View all bookings →
            </Link>
          </div>
        </div>
        <div style={s.heroDecor}>
          <span style={s.scissorIcon}>✂</span>
        </div>
      </div>

      {/* Stats strip */}
      <div style={s.statsStrip} className="fade-up d2">
        {[
          { label: 'Total Bookings', value: bookings.length, icon: '◉', color: '#7C3AED' },
          { label: 'Active',  value: bookings.filter(b => ['pending','confirmed'].includes(b.status)).length, icon: '◈', color: '#059669' },
          { label: 'Need Action', value: bookings.filter(b => b.status === 'awaiting_client').length, icon: '⚠', color: '#D97706' },
        ].map(stat => (
          <div key={stat.label} style={s.statItem}>
            <span style={{ ...s.statIcon, color: stat.color }}>{stat.icon}</span>
            <span style={s.statVal}>{stat.value}</span>
            <span style={s.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Bookings section */}
      <div style={s.section}>
        <div style={s.sectionHead}>
          <h2 style={s.sectionTitle}>Upcoming Appointments</h2>
          {bookings.length > 0 && (
            <Link to="/user/bookings" style={s.seeAll}>See all →</Link>
          )}
        </div>

        {loading && (
          <div style={s.loadGrid}>
            {[1,2,3].map(i => <div key={i} style={s.skeleton} className="shimmer" />)}
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div style={s.emptyCard} className="scale-in">
            <div style={s.emptyOrb}>📅</div>
            <h3 style={s.emptyTitle}>No upcoming appointments</h3>
            <p style={{ color: c.textMuted, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Discover our top salons and book your first appointment today.
            </p>
            <Link to="/salons" style={s.primaryBtn}>Browse Salons</Link>
          </div>
        )}

        <div style={s.grid}>
          {bookings.map((b, i) => {
            const meta = STATUS_META[b.status] || { label: b.status, color: '#888', bg: '#f0f0f0' };
            const dt = new Date(b.requested_datetime);
            return (
              <div
                key={b.id}
                style={s.card}
                className={`lift lift-purple fade-up d${Math.min(i + 1, 5)}`}
              >
                {/* Top accent bar */}
                <div style={{ ...s.cardAccent, background: meta.color }} />

                <div style={s.cardInner}>
                  {/* Date badge */}
                  <div style={s.dateBadge}>
                    <div style={{ ...s.dateBadgeMonth, color: meta.color }}>
                      {dt.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div style={s.dateBadgeDay}>
                      {dt.toLocaleDateString('en-US', { day: '2-digit' })}
                    </div>
                    <div style={s.dateBadgeTime}>
                      {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={s.cardContent}>
                    <div style={s.salonName}>{b.salon_name}</div>
                    {b.booking_services?.length > 0 && (
                      <div style={s.services}>
                        ✂ {b.booking_services.map(bs => bs.service_name).join(' · ')}
                      </div>
                    )}
                    <span style={{ ...s.statusBadge, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}30` }}>
                      {meta.label}
                    </span>
                  </div>
                </div>

                {b.status === 'awaiting_client' && (
                  <div style={s.actionHint}>
                    ⚡ Action required — alternative slots available
                  </div>
                )}

                <Link to={`/user/bookings/${b.id}`} style={s.cardLink}>
                  View Details <span style={s.linkArrow}>→</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const s = {
  hero: {
    borderRadius: 22, padding: '44px 40px',
    background: 'linear-gradient(135deg, #1E0A3C 0%, #3B0764 40%, #6D28D9 75%, #7C3AED 100%)',
    marginBottom: 24, position: 'relative', overflow: 'hidden',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  heroGlow: {
    position: 'absolute', width: 350, height: 350,
    background: 'radial-gradient(circle, rgba(13,148,136,.2) 0%, transparent 70%)',
    top: -80, right: 100, pointerEvents: 'none',
  },
  heroContent: { position: 'relative', zIndex: 2 },
  greeting: { fontSize: 13, color: 'rgba(196,181,253,.8)', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase', fontWeight: 500 },
  heroName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 44, fontWeight: 800, color: '#fff', margin: '0 0 10px',
    lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: 12,
  },
  wave: { fontSize: 22, color: '#F9A8D4', animation: 'floatBob 3s ease-in-out infinite' },
  heroSub: { color: 'rgba(255,255,255,.65)', fontSize: 15, margin: '0 0 28px' },
  heroBtns: { display: 'flex', gap: 12, flexWrap: 'wrap' },

  primaryBtn: {
    padding: '11px 24px',
    background: 'linear-gradient(135deg, #C9A96E 0%, #A07844 100%)',
    color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14,
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
    boxShadow: '0 4px 14px rgba(13,148,136,.4)',
  },
  ghostBtn: {
    padding: '11px 20px', background: 'rgba(255,255,255,.12)',
    color: '#E9D5FF', borderRadius: 12, fontWeight: 500, fontSize: 14,
    textDecoration: 'none', border: '1px solid rgba(255,255,255,.15)',
    transition: 'background .18s ease',
  },
  heroDecor: {
    position: 'relative', zIndex: 2, flexShrink: 0, opacity: 0.15,
  },
  scissorIcon: { fontSize: 120, color: '#fff', display: 'block', lineHeight: 1 },

  statsStrip: {
    display: 'flex', gap: 0,
    background: 'var(--surface)', borderRadius: 16, marginBottom: 28,
    border: '1px solid var(--border)', overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(124,58,237,.06)',
  },
  statItem: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '18px 16px', gap: 4,
    borderRight: '1px solid var(--border)',
  },
  statIcon: { fontSize: 18 },
  statVal: { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: c.text, lineHeight: 1 },
  statLabel: { fontSize: 11, color: c.textMuted, fontWeight: 500, textAlign: 'center' },

  section: {},
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 22, fontWeight: 700, color: c.text, margin: 0,
  },
  seeAll: { fontSize: 13, color: c.primary, fontWeight: 600 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 18 },

  card: {
    background: 'var(--surface)', borderRadius: 18,
    boxShadow: '0 4px 20px rgba(0,0,0,.07)',
    border: '1px solid var(--border)',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
  },
  cardAccent: { height: 3, width: '100%', flexShrink: 0 },
  cardInner: { display: 'flex', gap: 16, padding: '18px 20px 14px', alignItems: 'flex-start' },
  dateBadge: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    background: c.primarySoft, borderRadius: 12, padding: '8px 12px', flexShrink: 0, minWidth: 58,
  },
  dateBadgeMonth: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  dateBadgeDay: { fontSize: 24, fontWeight: 800, color: c.text, lineHeight: 1 },
  dateBadgeTime: { fontSize: 10, color: c.textMuted, marginTop: 2 },
  cardContent: { flex: 1 },
  salonName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 5,
  },
  services: { fontSize: 12, color: c.textMuted, marginBottom: 8, lineHeight: 1.4 },
  statusBadge: {
    display: 'inline-flex', padding: '3px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 700,
  },
  actionHint: {
    padding: '8px 20px',
    background: 'linear-gradient(to right, #FFFBEB, #FEF3C7)',
    fontSize: 12, color: '#92400E', fontWeight: 500,
    borderTop: '1px solid #FDE68A',
  },
  cardLink: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px',
    fontSize: 13, fontWeight: 600, color: c.primary,
    borderTop: '1px solid var(--border)',
    transition: 'background .15s ease',
  },
  linkArrow: { fontSize: 16, transition: 'transform .18s ease' },

  loadGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 18 },
  skeleton: { height: 200, borderRadius: 18 },

  emptyCard: {
    background: 'var(--surface)', borderRadius: 24, padding: '60px 40px',
    textAlign: 'center', border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(124,58,237,.06)',
  },
  emptyOrb: { fontSize: 52, marginBottom: 16 },
  emptyTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 8,
  },
};

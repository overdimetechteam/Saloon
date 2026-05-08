import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { STATUS_META } from '../../styles/theme';
import { useIsMobile } from '../../hooks/useMobile';

const HOUR     = new Date().getHours();
const GREETING = HOUR < 12 ? 'Good morning' : HOUR < 17 ? 'Good afternoon' : 'Good evening';

export default function UserDashboard() {
  const { profile } = useAuth();
  const isMobile    = useIsMobile();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/bookings/')
      .then(r => setBookings(r.data.filter(b => !['cancelled','completed'].includes(b.status)).slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div>
      {/* ── Hero banner ── */}
      <div style={{ ...s.hero, padding: isMobile ? '32px 22px' : '48px 44px', flexDirection: isMobile ? 'column' : 'row' }} className="anim-gradient noise-bg">
        <div style={s.heroGlow1} />
        <div style={s.heroGlow2} />
        <div style={s.heroContent} className="fade-up">
          <div style={s.greeting}>{GREETING}</div>
          <h1 style={s.heroName}>
            {firstName}
            <span style={s.wave}>✦</span>
          </h1>
          <p style={s.heroSub}>Ready for your next salon experience?</p>
          <div style={{ ...s.heroBtns, flexDirection: isMobile ? 'column' : 'row' }}>
            <Link to="/salons" style={{ ...s.primaryBtn, justifyContent: 'center' }} className="lift-sm">
              ✦ Book Appointment
            </Link>
            <Link to="/user/bookings" style={{ ...s.ghostBtn, textAlign: 'center' }}>
              View all bookings →
            </Link>
          </div>
        </div>
        {!isMobile && (
          <div style={s.heroDecor}>
            <span style={s.scissorIcon}>✂</span>
          </div>
        )}
      </div>

      {/* ── Stats strip ── */}
      <div style={s.statsStrip} className="fade-up d2">
        {[
          { label: 'Upcoming',     value: bookings.filter(b => ['pending','confirmed'].includes(b.status)).length, color: '#7C3AED', icon: '◉' },
          { label: 'Need Action',  value: bookings.filter(b => b.status === 'awaiting_client').length,             color: '#D97706', icon: '⚡' },
          { label: 'Total Active', value: bookings.length,                                                          color: '#059669', icon: '◈' },
        ].map((stat, i) => (
          <div key={stat.label} style={{ ...s.statItem, borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ ...s.statIconWrap, color: stat.color, background: stat.color + '14' }}>
              {stat.icon}
            </div>
            <div style={{ ...s.statVal, color: stat.color }}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Bookings section ── */}
      <div style={s.section}>
        <div style={s.sectionHead}>
          <div>
            <div style={s.sectionEyebrow}>Your Schedule</div>
            <h2 style={s.sectionTitle}>Upcoming Appointments</h2>
          </div>
          {bookings.length > 0 && (
            <Link to="/user/bookings" style={s.seeAll}>View all →</Link>
          )}
        </div>

        {loading && (
          <div style={s.loadGrid}>
            {[1,2,3].map(i => <div key={i} style={s.skeleton} className="shimmer" />)}
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div style={s.emptyCard} className="scale-in">
            <div className="empty-icon-wrap">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                <defs>
                  <linearGradient id="dashEmptyG" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7C3AED"/>
                    <stop offset="100%" stopColor="#EC4899"/>
                  </linearGradient>
                </defs>
                <rect x="5" y="10" width="28" height="23" rx="4" stroke="url(#dashEmptyG)" strokeWidth="1.5"/>
                <line x1="5" y1="17" x2="33" y2="17" stroke="url(#dashEmptyG)" strokeWidth="1.5"/>
                <line x1="13" y1="5" x2="13" y2="13" stroke="url(#dashEmptyG)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="25" y1="5" x2="25" y2="13" stroke="url(#dashEmptyG)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 style={s.emptyTitle}>No upcoming appointments</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 28, lineHeight: 1.7 }}>
              Discover our curated salons and book your first appointment today.
            </p>
            <Link to="/salons" style={s.primaryBtn}>Browse Salons</Link>
          </div>
        )}

        <div style={s.grid}>
          {bookings.map((b, i) => {
            const meta = STATUS_META[b.status] || { label: b.status, color: '#888', bg: '#f0f0f0' };
            const dt   = new Date(b.requested_datetime);
            return (
              <div key={b.id} style={s.card} className={`lift lift-purple card-glow fade-up d${Math.min(i + 1, 5)}`}>
                <div style={{ ...s.cardAccent, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}66)` }} />

                <div style={s.cardInner}>
                  {/* Date badge */}
                  <div style={{ ...s.dateBadge, background: meta.bg }}>
                    <div style={{ ...s.dateBadgeMonth, color: meta.color }}>
                      {dt.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div style={{ ...s.dateBadgeDay, color: '#1A0A2E' }}>
                      {dt.toLocaleDateString('en-US', { day: '2-digit' })}
                    </div>
                    <div style={s.dateBadgeTime}>
                      {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div style={s.cardContent}>
                    <div style={s.salonName}>{b.salon_name}</div>
                    {b.booking_services?.length > 0 && (
                      <div style={s.services}>
                        ✂ {b.booking_services.map(bs => bs.service_name).join(' · ')}
                      </div>
                    )}
                    <span style={{ ...s.statusBadge, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}28` }}>
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
    borderRadius: 24, padding: '48px 44px',
    background: 'linear-gradient(145deg, #1A0532 0%, #2D0A5E 30%, #5B21B6 65%, #7C3AED 100%)',
    marginBottom: 24, position: 'relative', overflow: 'hidden',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  heroGlow1: {
    position: 'absolute', width: 380, height: 380, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(236,72,153,.22) 0%, transparent 70%)',
    top: -100, right: 80, pointerEvents: 'none', filter: 'blur(40px)',
  },
  heroGlow2: {
    position: 'absolute', width: 240, height: 240, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(191,155,101,.12) 0%, transparent 70%)',
    bottom: -60, left: 40, pointerEvents: 'none', filter: 'blur(50px)',
  },
  heroContent: { position: 'relative', zIndex: 2 },
  greeting: {
    fontSize: 12, color: 'rgba(196,181,253,.75)',
    letterSpacing: '0.14em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 500,
  },
  heroName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 'clamp(34px, 4vw, 52px)', fontWeight: 700, color: '#fff', margin: '0 0 10px',
    lineHeight: 1.05, display: 'flex', alignItems: 'center', gap: 14,
    letterSpacing: '-0.02em',
  },
  wave: { fontSize: 20, color: '#F9A8D4', animation: 'floatBob 3s ease-in-out infinite' },
  heroSub: { color: 'rgba(255,255,255,.6)', fontSize: 15, margin: '0 0 30px' },
  heroBtns: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  primaryBtn: {
    padding: '12px 26px',
    background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
    color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14,
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7,
    boxShadow: '0 6px 20px rgba(236,72,153,.4)',
  },
  ghostBtn: {
    padding: '12px 20px', background: 'rgba(255,255,255,.1)',
    color: '#E9D5FF', borderRadius: 12, fontWeight: 500, fontSize: 14,
    textDecoration: 'none', border: '1px solid rgba(255,255,255,.14)',
    transition: 'background .18s ease',
  },
  heroDecor: { position: 'relative', zIndex: 2, flexShrink: 0, opacity: .1 },
  scissorIcon: { fontSize: 110, color: '#fff', display: 'block', lineHeight: 1 },

  statsStrip: {
    display: 'flex', gap: 0,
    background: 'var(--surface)', borderRadius: 18, marginBottom: 32,
    border: '1px solid var(--border)', overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(124,58,237,.07)',
  },
  statItem: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '20px 16px', gap: 5,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, marginBottom: 4,
  },
  statVal: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 32, fontWeight: 700, lineHeight: 1,
  },
  statLabel: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center' },

  section: { marginTop: 0 },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 },
  sectionEyebrow: {
    fontSize: 10, fontWeight: 700, color: 'var(--brand-label)',
    letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 5,
  },
  sectionTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em',
  },
  seeAll: { fontSize: 13, color: '#7C3AED', fontWeight: 600, marginBottom: 4 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 18 },
  loadGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 18 },
  skeleton: { height: 210, borderRadius: 20 },

  card: {
    background: 'var(--surface)', borderRadius: 20,
    boxShadow: '0 4px 20px rgba(124,58,237,.07), 0 1px 4px rgba(0,0,0,.04)',
    border: '1px solid var(--border)',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
  },
  cardAccent: { height: 3, width: '100%', flexShrink: 0 },
  cardInner: { display: 'flex', gap: 16, padding: '20px 22px 14px', alignItems: 'flex-start' },
  dateBadge: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    borderRadius: 14, padding: '10px 13px', flexShrink: 0, minWidth: 60,
  },
  dateBadgeMonth: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' },
  dateBadgeDay: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28, fontWeight: 700, lineHeight: 1.1,
  },
  dateBadgeTime: { fontSize: 10, color: 'var(--text-muted)', marginTop: 2 },
  cardContent: { flex: 1 },
  salonName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 5,
    letterSpacing: '-0.01em',
  },
  services: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 9, lineHeight: 1.5 },
  statusBadge: {
    display: 'inline-flex', padding: '3px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 700,
  },
  actionHint: {
    padding: '9px 22px',
    background: 'rgba(217,119,6,.09)',
    fontSize: 12, color: '#D97706', fontWeight: 600,
    borderTop: '1px solid rgba(217,119,6,.2)',
  },
  cardLink: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '13px 22px', fontSize: 13, fontWeight: 600,
    color: '#7C3AED', borderTop: '1px solid var(--border)',
    transition: 'background .15s ease',
  },
  linkArrow: { fontSize: 16 },

  emptyCard: {
    background: 'var(--surface)', borderRadius: 24, padding: '68px 40px',
    textAlign: 'center', border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(124,58,237,.06)',
  },
  emptyTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 10,
  },
};

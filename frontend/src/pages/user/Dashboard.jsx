import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { STATUS_META } from '../../styles/theme';
import { useBreakpoint } from '../../hooks/useMobile';
import { safeFirstName } from '../../utils/profile';

const HOUR     = new Date().getHours();
const GREETING = HOUR < 12 ? 'Good morning' : HOUR < 17 ? 'Good afternoon' : 'Good evening';

const FAV_PALETTE = [
  'linear-gradient(135deg, #0D9488 0%, #14B8A8 100%)',
  'linear-gradient(135deg, #0B3832 0%, #0D9488 100%)',
  'linear-gradient(135deg, #0D9488 0%, #D4AF37 100%)',
  'linear-gradient(135deg, #D4AF37 0%, #0D9488 100%)',
];

const HERO_SYMBOLS = [
  { e: '✂', top: '10%', right: '2%',  sz: 22, dur: 24, del: 0    },
  { e: '✦', top: '30%', right: '8%',  sz: 17, dur: 20, del: -6   },
  { e: '✿', top: '55%', right: '3%',  sz: 19, dur: 26, del: -10  },
  { e: '♡', top: '75%', right: '12%', sz: 16, dur: 22, del: -14  },
  { e: '✧', top: '15%', right: '20%', sz: 14, dur: 30, del: -4   },
  { e: '◇', top: '40%', right: '26%', sz: 18, dur: 18, del: -8   },
  { e: '✽', top: '65%', right: '16%', sz: 15, dur: 21, del: -12  },
  { e: '✸', top: '20%', right: '36%', sz: 12, dur: 17, del: -3   },
  { e: '✂', top: '85%', right: '20%', sz: 20, dur: 28, del: -18  },
];

export default function UserDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useBreakpoint();
  const [bookings,   setBookings]   = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [offers,     setOffers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [favLoading, setFavLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings/')
      .then(r => setBookings(r.data.filter(b => !['cancelled','completed'].includes(b.status)).slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.get('/client/favourites/')
      .then(r => setFavourites(r.data.slice(0, 8)))
      .catch(() => {})
      .finally(() => setFavLoading(false));
    api.get('/offers/active/')
      .then(r => setOffers(r.data))
      .catch(() => {});
  }, []);

  const firstName = safeFirstName(profile?.full_name, profile?.email);

  const upcoming   = bookings.filter(b => ['pending','confirmed'].includes(b.status)).length;
  const needAction = bookings.filter(b => b.status === 'awaiting_client').length;
  const total      = bookings.length;

  return (
    <div>
      {/* ── Hero banner with embedded stats ── */}
      <div style={{ ...s.hero, padding: isMobile ? '28px 20px 24px' : '44px 44px 32px', flexDirection: isMobile ? 'column' : 'row' }} className="anim-gradient noise-bg">
        <div style={s.heroGlow1} />
        <div style={s.heroGlow2} />
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
          {HERO_SYMBOLS.map((em, i) => (
            <span key={i} style={{ position: 'absolute', top: em.top, right: em.right, fontSize: em.sz, color: '#fff', animation: `salonEmojiFloat ${em.dur}s linear ${em.del}s infinite`, userSelect: 'none' }}>{em.e}</span>
          ))}
        </div>
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

          {/* Mobile: compact stats row below buttons */}
          {isMobile && (
            <div style={s.heroStatsMobile}>
              {[
                { label: 'Upcoming',     value: loading ? '–' : upcoming,   icon: '◉', accent: '#99F6E4' },
                { label: 'Need Action',  value: loading ? '–' : needAction, icon: '⚡', accent: '#FDE68A' },
                { label: 'Total Active', value: loading ? '–' : total,      icon: '◈', accent: '#99F6E4' },
              ].map((stat, i) => (
                <div key={stat.label} style={{ ...s.heroStatMobileItem, borderLeft: i > 0 ? '1px solid rgba(255,255,255,.12)' : 'none' }}>
                  <span style={{ ...s.heroStatMobileVal }}>{stat.value}</span>
                  <span style={s.heroStatMobileLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: stats column on the right side */}
        {!isMobile && (
          <div style={s.heroStatsCol} className="fade-up d2">
            {[
              { label: 'Upcoming',     value: loading ? '–' : upcoming,   icon: '◉', accent: '#99F6E4' },
              { label: 'Need Action',  value: loading ? '–' : needAction, icon: '⚡', accent: '#FDE68A' },
              { label: 'Total Active', value: loading ? '–' : total,      icon: '◈', accent: '#99F6E4' },
            ].map((stat, i) => (
              <div key={stat.label} style={{ ...s.heroStatRow, borderTop: i > 0 ? '1px solid rgba(255,255,255,.08)' : 'none' }}>
                <div style={{ ...s.heroStatIcon, color: stat.accent, background: stat.accent + '18' }}>{stat.icon}</div>
                <div>
                  <div style={s.heroStatVal}>{stat.value}</div>
                  <div style={s.heroStatLabel}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Favourites section — replaces where stats strip was ── */}
      <div style={s.favSection} className="fade-up d2">
        <div style={s.sectionHead}>
          <div>
            <div style={s.sectionEyebrow}>Saved</div>
            <h2 style={s.sectionTitle}>Favourites</h2>
          </div>
          {favourites.length > 0 && (
            <Link to="/user/favourites" style={s.seeAll}>View all →</Link>
          )}
        </div>

        {favLoading && (
          <div style={s.favScroll}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ width: 130, height: 126, borderRadius: 16, flexShrink: 0 }} className="shimmer" />
            ))}
          </div>
        )}

        {!favLoading && favourites.length === 0 && (
          <div style={s.favEmpty}>
            <span style={{ fontSize: 22, color: '#C9A96E', opacity: .35 }}>♡</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Save salons you love while browsing</span>
            <Link to="/salons" style={{ ...s.primaryBtn, fontSize: 12, padding: '8px 18px', display: 'inline-flex' }}>Browse Salons</Link>
          </div>
        )}

        {!favLoading && favourites.length > 0 && (
          <div style={s.favScroll}>
            {favourites.map((fav, i) => (
              <Link key={fav.id} to={`/salons/${fav.id}`} style={s.favCard} className="lift-sm">
                <div style={{ ...s.favAvatar, background: FAV_PALETTE[i % FAV_PALETTE.length], overflow: 'hidden', padding: 0 }}>
                  {fav.logo_url
                    ? <img src={fav.logo_url} alt={fav.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 10 }} />
                    : fav.name[0]
                  }
                </div>
                <div style={s.favName}>{fav.name}</div>
                <div style={s.favCity}>{fav.address_city}</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Active Offers Banner ── */}
      {offers.length > 0 && (
        <div style={s.offersSection} className="fade-up d2">
          <div style={s.offersHead}>
            <div>
              <div style={s.sectionEyebrow}>Limited Time</div>
              <h2 style={{ ...s.sectionTitle, marginBottom: 0 }}>Ongoing Offers</h2>
            </div>
          </div>
          <div style={s.offersScroll}>
            {offers.map((o, i) => {
              const colors = ['#0D9488','#D4AF37','#0B7A70','#D4AF37'];
              const color  = colors[i % colors.length];
              const daysLeft = Math.ceil((new Date(o.end_date) - new Date()) / 86400000);
              return (
                <Link key={o.id} to={`/salons/${o.salon}`} style={{ ...s.offerCard, borderTop: `3px solid ${color}` }} className="lift-sm">
                  <div style={{ ...s.offerDiscount, color }}>
                    {o.offer_type === 'custom'
                      ? <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Custom Deal</span>
                      : <>{o.discount_value}{o.discount_type === 'percentage' ? '%' : ' LKR'} <span style={s.offLabel}>off</span></>
                    }
                  </div>
                  <div style={s.offerTitle}>{o.title}</div>
                  <div style={s.offerSalon}>{o.salon_name}</div>
                  {o.note && <div style={s.offerNote}>{o.note}</div>}
                  <div style={{ ...s.offerExpiry, color: daysLeft <= 3 ? '#DC2626' : 'var(--text-muted)' }}>
                    {daysLeft <= 0 ? 'Expires today' : `${daysLeft}d left`}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Action required banner ── */}
      {needAction > 0 && (
        <div style={s.actionBanner} className="fade-up d2">
          <span style={s.actionBannerIcon}>⚡</span>
          <div style={{ flex: 1 }}>
            <span style={s.actionBannerText}>
              {needAction === 1
                ? 'A salon has proposed a new time for your booking.'
                : `${needAction} salons have proposed new times for your bookings.`}
            </span>
          </div>
          <Link to="/user/bookings?filter=awaiting_client" style={s.actionBannerBtn}>
            Review & Confirm →
          </Link>
        </div>
      )}

      {/* ── Upcoming Appointments — full width ── */}
      <div style={s.apptSection} className="fade-up d3">
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
          <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {[1,2,3].map(i => <div key={i} style={s.skeleton} className="shimmer" />)}
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div style={s.emptyCard} className="scale-in">
            <div className="empty-icon-wrap">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                <defs>
                  <linearGradient id="dashEmptyG" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0D9488"/>
                    <stop offset="100%" stopColor="#0D9488"/>
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

        <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {bookings.map((b, i) => {
            const meta = STATUS_META[b.status] || { label: b.status, color: '#888', bg: '#f0f0f0' };
            const dt   = new Date(b.requested_datetime.slice(0, 19));
            return (
              <div key={b.id} style={{ ...s.card, cursor: 'pointer' }} className={`lift lift-purple card-glow fade-up d${Math.min(i + 1, 5)}`} onClick={() => navigate(`/user/bookings/${b.id}`)}>
                <div style={{ ...s.cardAccent, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}66)` }} />

                <div style={s.cardInner}>
                  <div style={{ ...s.dateBadge, background: `${meta.color}18` }}>
                    <div style={{ ...s.dateBadgeMonth, color: meta.color }}>
                      {dt.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div style={{ ...s.dateBadgeDay, color: 'var(--text)' }}>
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
                    <span style={{ ...s.statusBadge, color: meta.color, background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}>
                      {meta.label}
                    </span>
                  </div>
                </div>

                {b.status === 'awaiting_client' && (
                  <div style={s.actionHint}>
                    ⚡ Action required — alternative slots available
                  </div>
                )}

                <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
                  <button
                    style={{ flex: 1, padding: '11px 22px', fontSize: 13, fontWeight: 600, color: '#0D9488', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    onClick={e => { e.stopPropagation(); navigate(`/salons/${b.salon}`); }}
                  >
                    ↗ Go to Salon
                  </button>
                </div>
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
    borderRadius: 24, padding: '44px 44px 32px',
    background: 'linear-gradient(145deg, #0D0D16, #1A1A24, #0B3832, #0D9488)',
    marginBottom: 28, position: 'relative', overflow: 'hidden',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  heroGlow1: {
    position: 'absolute', width: 380, height: 380, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(13,148,136,.22) 0%, transparent 70%)',
    top: -100, right: 80, pointerEvents: 'none', filter: 'blur(40px)',
  },
  heroGlow2: {
    position: 'absolute', width: 240, height: 240, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(212,175,55,.12) 0%, transparent 70%)',
    bottom: -60, left: 40, pointerEvents: 'none', filter: 'blur(50px)',
  },
  heroContent: { position: 'relative', zIndex: 2, flex: 1, minWidth: 0 },
  greeting: { fontSize: 12, color: 'rgba(153,246,228,.75)', letterSpacing: '0.14em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 500 },
  heroName: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(34px, 4vw, 52px)', fontWeight: 700, color: '#fff', margin: '0 0 10px', lineHeight: 1.05, display: 'flex', alignItems: 'center', gap: 14, letterSpacing: '-0.02em' },
  wave:    { fontSize: 20, color: '#C9A96E', animation: 'floatBob 3s ease-in-out infinite' },
  heroSub: { color: 'rgba(255,255,255,.6)', fontSize: 15, margin: '0 0 26px' },
  heroBtns:{ display: 'flex', gap: 12, flexWrap: 'wrap' },
  primaryBtn: { padding: '12px 26px', background: 'linear-gradient(135deg, #0D9488 0%, #0D9488 100%)', color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7, boxShadow: '0 6px 20px rgba(13,148,136,.4)' },
  ghostBtn:   { padding: '12px 20px', background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.8)', borderRadius: 12, fontWeight: 500, fontSize: 14, textDecoration: 'none', border: '1px solid rgba(255,255,255,.14)', transition: 'background .18s ease' },
  /* Desktop: stats column on right side of hero */
  heroStatsCol: {
    position: 'relative', zIndex: 2, flexShrink: 0, minWidth: 0,
    display: 'flex', flexDirection: 'column',
    background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 18, overflow: 'hidden', minWidth: 180,
  },
  heroStatRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 20px',
  },
  heroStatIcon: {
    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
  },
  heroStatVal: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 26, fontWeight: 800, lineHeight: 1, color: '#fff',
  },
  heroStatLabel: {
    fontSize: 9, color: 'rgba(255,255,255,.5)',
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2,
  },

  /* Mobile: compact stats strip below buttons */
  heroStatsMobile: {
    display: 'flex', marginTop: 20, paddingTop: 16,
    borderTop: '1px solid rgba(255,255,255,.1)',
  },
  heroStatMobileItem: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 2, padding: '0 12px',
  },
  heroStatMobileVal: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 24, fontWeight: 800, lineHeight: 1, color: '#fff',
  },
  heroStatMobileLabel: {
    fontSize: 8, color: 'rgba(255,255,255,.45)',
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
  },

  /* Favourites section */
  favSection: { marginBottom: 28 },
  favScroll: {
    display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8,
    scrollbarWidth: 'none',
  },
  favCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: '16px 14px 12px', background: 'var(--surface)', borderRadius: 16,
    border: '1px solid var(--border)', textDecoration: 'none',
    minWidth: 120, flexShrink: 0, textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,.04)',
    transition: 'transform .2s ease, box-shadow .2s ease',
  },
  favAvatar: {
    width: 50, height: 50, borderRadius: 13, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22, fontWeight: 700, color: '#fff',
  },
  favName: {
    fontWeight: 700, fontSize: 12, color: 'var(--text)',
    maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  favCity: { fontSize: 10, color: 'var(--text-muted)' },
  favEmpty: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '16px 20px', background: 'var(--surface)', borderRadius: 14,
    border: '1px solid var(--border)',
  },

  offersSection: { marginBottom: 28 },
  offersHead:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  offersScroll:  { display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none' },
  offerCard: {
    background: 'var(--surface)', borderRadius: 16, padding: '16px 18px', flexShrink: 0,
    minWidth: 200, maxWidth: 240, border: '1px solid var(--border)',
    boxShadow: '0 2px 10px rgba(0,0,0,.05)', textDecoration: 'none',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  offerDiscount: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 700, lineHeight: 1 },
  offLabel:      { fontSize: 12, fontWeight: 600 },
  offerTitle:    { fontWeight: 700, fontSize: 14, color: 'var(--text)', marginTop: 4, lineHeight: 1.3 },
  offerSalon:    { fontSize: 12, color: 'var(--text-muted)' },
  offerNote:     { fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 },
  offerExpiry:   { fontSize: 11, fontWeight: 700, marginTop: 6 },

  actionBanner: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 20px', marginBottom: 24, borderRadius: 14,
    background: 'rgba(212,175,55,.08)', border: '1px solid rgba(212,175,55,.25)',
    flexWrap: 'wrap',
  },
  actionBannerIcon: { fontSize: 18, color: '#D4AF37', flexShrink: 0 },
  actionBannerText: { fontSize: 14, color: 'var(--text)', fontWeight: 500 },
  actionBannerBtn: {
    marginLeft: 'auto', flexShrink: 0,
    padding: '8px 18px', fontSize: 13, fontWeight: 700, color: '#D4AF37',
    background: 'rgba(212,175,55,.12)', borderRadius: 9,
    border: '1px solid rgba(212,175,55,.3)', textDecoration: 'none',
    fontFamily: "'DM Sans', sans-serif",
  },

  apptSection: { marginBottom: 48 },

  sectionHead:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionEyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 5 },
  sectionTitle:   { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' },
  seeAll: { fontSize: 13, color: '#0D9488', fontWeight: 600, marginBottom: 4 },

  grid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 },
  skeleton: { height: 210, borderRadius: 20 },

  card: { background: 'var(--surface)', borderRadius: 20, boxShadow: '0 4px 20px rgba(13,148,136,.07), 0 1px 4px rgba(0,0,0,.04)', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  cardAccent: { height: 3, width: '100%', flexShrink: 0 },
  cardInner:  { display: 'flex', gap: 16, padding: '20px 22px 14px', alignItems: 'flex-start' },
  dateBadge:  { display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 14, padding: '10px 13px', flexShrink: 0, minWidth: 60 },
  dateBadgeMonth: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' },
  dateBadgeDay:   { fontFamily: "'DM Sans', sans-serif", fontSize: 26, fontWeight: 700, lineHeight: 1.1 },
  dateBadgeTime:  { fontSize: 10, color: 'var(--text-muted)', marginTop: 2 },
  cardContent: { flex: 1 },
  salonName:   { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 5, letterSpacing: '-0.01em' },
  services:    { fontSize: 12, color: 'var(--text-muted)', marginBottom: 9, lineHeight: 1.5 },
  statusBadge: { display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  actionHint:  { padding: '9px 22px', background: 'rgba(212,175,55,.09)', fontSize: 12, color: '#D4AF37', fontWeight: 600, borderTop: '1px solid rgba(212,175,55,.2)' },
  cardLink:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 22px', fontSize: 13, fontWeight: 600, color: '#0D9488', borderTop: '1px solid var(--border)', transition: 'background .15s ease' },
  linkArrow:   { fontSize: 16 },

  emptyCard: { background: 'var(--surface)', borderRadius: 24, padding: '68px 40px', textAlign: 'center', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(13,148,136,.06)' },
  emptyTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 10 },
};

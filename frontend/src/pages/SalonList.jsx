import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useBreakpoint } from '../hooks/useMobile';
import { safeFirstName } from '../utils/profile';
import QuickSearchModal from '../components/QuickSearchModal';

const PALETTE = [
  ['#0D9488', '#14B8A8'],
  ['#0D9488', '#2DD4BF'],
  ['#D4AF37', '#E8C87A'],
  ['#0B7A70', '#14B8A8'],
  ['#D4AF37', '#B8932A'],
  ['#0D9488', '#5EEAD4'],
];

function SalonCard({ salon, i, isFav, col, numCols, isMobile }) {
  const [c1, c2] = PALETTE[i % PALETTE.length];
  const isOpen   = salon.status === 'active';
  const xInit    = numCols === 1 ? 0 : col === 0 ? -60 : col === numCols - 1 ? 60 : 0;
  const coverPhoto = salon.cover_photo_url || salon.cover_photo || null;

  if (isMobile) {
    /* ── Mobile: horizontal list row (Fresha-style) ── */
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }}
      >
        <Link to={`/salons/${salon.id}`} style={{ ...s.rowCard, ...(isFav ? s.cardFav : {}) }}>
          {/* Thumbnail */}
          <div style={{ ...s.rowThumb, background: `linear-gradient(145deg, ${c1}, ${c2})`, overflow: 'hidden', flexShrink: 0 }}>
            {coverPhoto
              ? <img src={coverPhoto} alt={salon.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : salon.logo_url
                ? <img src={salon.logo_url} alt={salon.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <span style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{salon.name[0].toUpperCase()}</span>
            }
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.25, fontFamily: "'Cormorant Garamond',Georgia,serif", flex: 1, minWidth: 0 }}>
                {salon.name}
              </h3>
              {isFav && <span style={{ fontSize: 12, color: '#D4AF37', flexShrink: 0 }}>★</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isOpen ? '#14B8A8' : '#9CA3AF', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: isOpen ? '#0D9488' : 'var(--text-muted)', fontWeight: 600 }}>
                {isOpen ? 'Open' : 'Closed'}
              </span>
              {salon.address_city && (
                <>
                  <span style={{ color: 'var(--border)', fontSize: 10 }}>·</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📍 {salon.address_city}{salon.address_district ? `, ${salon.address_district}` : ''}
                  </span>
                </>
              )}
            </div>

            {salon.contact_number && salon.contact_number.length <= 20 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                📞 {salon.contact_number}
              </div>
            )}
          </div>

          {/* Right arrow */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c1} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, alignSelf: 'center' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </motion.div>
    );
  }

  /* ── Desktop: vertical photo card ── */
  return (
    <motion.div
      initial={{ opacity: 0, x: xInit }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <Link to={`/salons/${salon.id}`} style={{ ...s.card, ...(isFav ? s.cardFav : {}), flex: 1 }}>
        {/* Photo banner */}
        <div style={{ ...s.banner, overflow: 'hidden', position: 'relative', background: coverPhoto ? '#000' : `linear-gradient(135deg, ${c1}22 0%, ${c2}0F 100%)` }}>
          {coverPhoto
            ? <img src={coverPhoto} alt={salon.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.88 }} />
            : <div style={{ ...s.orb, background: `radial-gradient(circle, ${c1}33 0%, transparent 70%)` }} />
          }
          {/* Status badge (top right) */}
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            {isFav && <span style={s.favStar}>★ Saved</span>}
            <span style={{
              ...s.statusBadge,
              background: isOpen ? 'rgba(13,148,136,.85)' : 'rgba(30,30,30,.75)',
              color: isOpen ? '#fff' : 'rgba(255,255,255,.65)',
              border: 'none', backdropFilter: 'blur(8px)',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: isOpen ? '#5EEAD4' : '#9CA3AF', display: 'inline-block', flexShrink: 0 }} />
              {isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          {/* Logo overlay (bottom left) */}
          {salon.logo_url && (
            <div style={{ position: 'absolute', bottom: 10, left: 14, width: 42, height: 42, borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,.25)', background: '#fff' }}>
              <img src={salon.logo_url} alt={salon.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
        </div>

        <div style={{ ...s.cardBody }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <h3 style={{ ...s.salonName, marginBottom: 0, flex: 1 }}>{salon.name}</h3>
            {isFav && <span style={s.favStarInline}>★</span>}
          </div>
          <div style={s.salonLoc}>
            <span style={{ color: c1, fontSize: 11 }}>◎</span>
            {salon.address_city}{salon.address_district ? `, ${salon.address_district}` : ''}
          </div>
          {salon.contact_number && salon.contact_number.length <= 25 && (
            <span style={s.phone}>📞 {salon.contact_number}</span>
          )}
        </div>

        <div style={{ ...s.cardCta, borderTopColor: `${c1}22`, color: c1 }}>
          <span>Explore Salon</span>
          <span style={{ fontSize: 16 }}>→</span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function SalonList() {
  const { profile }            = useAuth();
  const { isMobile, isTablet } = useBreakpoint();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') || '';

  const [salons, setSalons]   = useState([]);
  const [favIds, setFavIds]   = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [quickSearch, setQS]  = useState(false);

  const fetchSalons = () => {
    setLoading(true);
    setFetchError(false);
    api.get(`/salons/?name=${search}`)
      .then(r => { setSalons(r.data); setFetchError(false); })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSalons(); }, [search]);

  useEffect(() => {
    if (profile?.role !== 'client') return;
    api.get('/client/favourites/')
      .then(r => setFavIds(new Set(r.data.map(s => s.id))))
      .catch(() => {});
  }, [profile]);

  const isClient = profile?.role === 'client';
  const numCols  = isMobile ? 1 : isTablet ? 2 : 3;

  const favGroup       = isClient ? salons.filter(sl => favIds.has(sl.id))  : [];
  const otherGroup     = isClient ? salons.filter(sl => !favIds.has(sl.id)) : salons;
  const hasFavs        = favGroup.length > 0;

  const displayedCount = favGroup.length + otherGroup.length;
  const gridCols    = isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)';

  return (
    <div style={s.page}>

      {/* ── Hero — shown only to guests ── */}
      {!profile && (
        <div
          style={{
            ...s.hero,
            padding: isMobile ? '48px 16px 56px' : isTablet ? '64px 28px 80px' : '88px 40px 112px',
          }}
          className="anim-gradient noise-bg"
        >
          <div style={s.glow1} />
          <div style={s.glow2} />
          <div style={s.heroContent} className="fade-up">
            <div style={s.eyebrow}>
              <span style={{ color: '#D4AF37', fontSize: 10 }}>✦</span>
              Discover · Book · Glow
            </div>
            <h1 style={{ ...s.heroTitle, fontSize: isMobile ? 32 : isTablet ? 44 : 'clamp(34px,4.8vw,58px)' }}>
              Find Your Perfect<br />
              <em style={s.heroItalic}>Salon Experience</em>
            </h1>
            <p style={{ ...s.heroSub, fontSize: isMobile ? 13 : 16 }}>
              Browse curated premium salons and book your next beauty appointment in seconds.
            </p>
            <div style={{ ...s.heroSearch, maxWidth: isMobile ? '100%' : 480 }} className="fade-up d2 search-bar-wrap">
              <span className="search-icon" style={{ color: '#0D9488', fontSize: isMobile ? 12 : 14, flexShrink: 0 }}>✦</span>
              <input
                className="hero-search"
                style={{ ...s.heroSearchInput, fontSize: isMobile ? 13 : 15 }}
                placeholder="Search by salon name…"
                value={search}
                onChange={e => setSearchParams(e.target.value ? { q: e.target.value } : {})}
              />
              {search && (
                <button style={s.clearBtn} onClick={() => setSearchParams({})}>✕</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Signed-in banner ── */}
      {profile && (
        <div style={{
          ...s.signedInBanner,
          padding: isMobile ? '22px 16px 18px' : isTablet ? '28px 24px 24px' : '36px 40px 28px',
        }}
          className="anim-gradient">
          <div style={s.glow1} />
          <div style={s.glow2} />
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 680, margin: '0 auto', textAlign: 'center' }} className="fade-up">
            <div style={s.eyebrow}>
              <span style={{ color: '#D4AF37', fontSize: 10 }}>✦</span>
              {salons.length > 0 ? `${salons.length} salons available` : 'Discover · Book · Glow'}
            </div>
            <h2 style={{ ...s.heroTitle, fontSize: isMobile ? 23 : isTablet ? 28 : 34, marginBottom: 14 }}>
              Welcome back,{' '}
              <em style={s.heroItalic}>{safeFirstName(profile.full_name, profile.email)}</em>
            </h2>
            <div style={{ ...s.heroSearch, maxWidth: isMobile ? '100%' : 500, margin: '0 auto', padding: isMobile ? '8px 12px' : '10px 16px' }} className="search-bar-wrap">
              <span className="search-icon" style={{ color: '#0D9488', fontSize: isMobile ? 12 : 14, flexShrink: 0 }}>✦</span>
              <input
                className="hero-search"
                style={{ ...s.heroSearchInput, fontSize: isMobile ? 13 : 15 }}
                placeholder="Search by salon name…"
                value={search}
                onChange={e => setSearchParams(e.target.value ? { q: e.target.value } : {})}
              />
              {search && (
                <button style={s.clearBtn} onClick={() => setSearchParams({})}>✕</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky strip — Book Now only ── */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: isMobile ? '9px 16px' : '10px 24px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 64, zIndex: 90,
      }}>
        <button
          onClick={() => setQS(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: isMobile ? '9px 28px' : '9px 28px',
            borderRadius: 30, fontSize: 14, fontWeight: 700,
            border: 'none',
            background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 100%)',
            color: '#fff', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 3px 14px rgba(13,148,136,.4)',
            letterSpacing: '0.01em',
          }}
        >
          <span style={{ fontSize: 11 }}>✦</span>
          Book Now!
        </button>
      </div>

      {search && !loading && (
        <p style={{ ...s.resultsNote, padding: isMobile ? '8px 12px 0' : '10px 40px 0' }}>
          {displayedCount} result{displayedCount !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* ── Grid ── */}
      <div style={{
        ...s.grid,
        gridTemplateColumns: gridCols,
        gap: isMobile ? 8 : 20,
        padding: isMobile ? '12px 12px 72px' : isTablet ? '20px 16px 72px' : '28px 40px 88px',
      }}>

        {loading && [1,2,3,4,5,6].map(i => (
          <div key={i} style={{ ...s.skeleton, height: isMobile ? 92 : 280, borderRadius: isMobile ? 16 : 20 }} className="shimmer" />
        ))}

        {!loading && fetchError && (
          <div style={{ ...s.empty, gridColumn: '1 / -1', borderColor: 'rgba(220,38,38,.2)' }} className="scale-in">
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚡</div>
            <h3 style={s.emptyTitle}>Connection error</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              Could not reach the server. Check your connection and try again.
            </p>
            <button
              onClick={fetchSalons}
              style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #0D9488, #14B8A8)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 14px rgba(13,148,136,.3)', fontFamily: "'DM Sans', sans-serif" }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !fetchError && displayedCount === 0 && (
          <div style={{ ...s.empty, gridColumn: '1 / -1' }} className="scale-in">
            <div className="empty-icon-wrap">
              <svg width="36" height="36" viewBox="0 0 38 38" fill="none">
                <defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0D9488"/>
                  <stop offset="100%" stopColor="#0D9488"/>
                </linearGradient></defs>
                <circle cx="13" cy="13" r="7.5" stroke="url(#eg)" strokeWidth="1.5"/>
                <line x1="19" y1="19" x2="33" y2="5" stroke="url(#eg)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 style={s.emptyTitle}>No salons found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 0 }}>
              {search ? `Nothing matched "${search}". Try a different term.` : 'No salons available yet.'}
            </p>
          </div>
        )}

        {/* ── Favourites section header ── */}
        {!loading && hasFavs && (
          <div style={{ ...s.sectionLabel, gridColumn: '1 / -1' }}>
            <span style={s.sectionStar}>★</span>
            <span>Your Favourites</span>
            <span style={s.sectionCount}>{favGroup.length}</span>
          </div>
        )}

        {!loading && favGroup.map((salon, i) => (
          <SalonCard key={salon.id} salon={salon} i={i} isFav={true} col={i % numCols} numCols={numCols} isMobile={isMobile} />
        ))}

        {/* ── Divider between sections ── */}
        {!loading && hasFavs && otherGroup.length > 0 && (
          <div style={{ ...s.sectionLabel, gridColumn: '1 / -1', marginTop: 8 }}>
            <span style={{ ...s.sectionStar, color: 'var(--text-muted)' }}>◈</span>
            <span style={{ color: 'var(--text-muted)' }}>More Salons</span>
            <span style={{ ...s.sectionCount, background: 'var(--surface2)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>{otherGroup.length}</span>
          </div>
        )}

        {!loading && otherGroup.map((salon, i) => (
          <SalonCard key={salon.id} salon={salon} i={i + (hasFavs ? favGroup.length : 0)} isFav={false} col={i % numCols} numCols={numCols} isMobile={isMobile} />
        ))}
      </div>

      {quickSearch && <QuickSearchModal onClose={() => setQS(false)} />}
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' },

  /* ── Hero (guests only) ── */
  hero: {
    background: 'linear-gradient(145deg, #0D0D16, #1A1A24, #0B3832, #0D9488)',
    textAlign: 'center', position: 'relative', overflow: 'hidden',
  },
  /* ── Compact banner (signed-in users) ── */
  signedInBanner: {
    background: 'linear-gradient(145deg, #0D0D16, #1A1A24, #0B3832, #0D9488)',
    textAlign: 'center', position: 'relative', overflow: 'hidden',
  },
  glow1: {
    position: 'absolute', width: 420, height: 420, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(212,175,55,.18) 0%, transparent 70%)',
    top: -100, right: -40, pointerEvents: 'none', filter: 'blur(40px)',
  },
  glow2: {
    position: 'absolute', width: 320, height: 320, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(13,148,136,.18) 0%, transparent 70%)',
    bottom: -60, left: 60, pointerEvents: 'none', filter: 'blur(50px)',
  },
  heroContent: { position: 'relative', zIndex: 2, maxWidth: 660, margin: '0 auto' },
  eyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase',
    color: 'rgba(153,246,228,.75)', marginBottom: 24,
    background: 'rgba(255,255,255,.07)', padding: '7px 18px', borderRadius: 30,
    border: '1px solid rgba(255,255,255,.1)',
  },
  heroTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontWeight: 700, color: '#fff', margin: '0 0 18px',
    lineHeight: 1.12, letterSpacing: '-0.02em',
  },
  heroItalic: { fontStyle: 'italic', color: '#99F6E4' },
  heroSub: {
    color: 'rgba(255,255,255,.65)', lineHeight: 1.65,
    maxWidth: 500, margin: '0 auto 36px',
  },
  heroSearch: {
    display: 'flex', alignItems: 'center',
    background: 'rgba(255,255,255,.97)',
    borderRadius: 60, padding: '13px 20px', gap: 12, margin: '0 auto',
    boxShadow: '0 12px 48px rgba(0,0,0,.22), 0 4px 16px rgba(13,148,136,.15)',
  },
  heroSearchInput: {
    border: 'none', outline: 'none', fontSize: 15, flex: 1,
    background: 'transparent', color: '#111827',
    fontFamily: "'DM Sans', sans-serif",
  },

  /* ── Signed-in mobile/tablet search ── */
  topSearch: {
    padding: '11px 14px',
    background: 'var(--surface)', borderBottom: '1px solid var(--border)',
  },
  topSearchBox: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--surface2)', borderRadius: 12,
    padding: '9px 14px', border: '1px solid var(--border)',
  },
  searchInput: {
    border: 'none', outline: 'none', background: 'transparent',
    flex: 1, fontSize: 14, color: 'var(--text)',
    fontFamily: "'DM Sans', sans-serif",
  },
  clearBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: 12, padding: '1px 4px',
  },

  /* ── Filter strip ── */
  filterStrip: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 8,
    background: 'var(--surface)', borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 64, zIndex: 90,
  },
  chip: {
    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-muted)', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontFamily: "'DM Sans', sans-serif", transition: 'all .15s ease',
  },
  chipOn:      { background: 'rgba(13,148,136,.08)', color: '#0D9488', borderColor: 'rgba(13,148,136,.3)' },
  chipBadge:   { background: 'var(--surface2)', color: 'var(--text-muted)', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '1px 5px' },
  chipBadgeOn: { background: 'rgba(13,148,136,.12)', color: '#0D9488' },
  sortLabel:   { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.14em' },

  resultsNote: { fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 },

  /* ── Grid ── */
  grid: {
    display: 'grid', gap: 20,
    maxWidth: 1280, margin: '0 auto',
  },
  skeleton: { height: 280, borderRadius: 20 },

  /* Mobile row card */
  rowCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'var(--surface)', borderRadius: 16,
    border: '1px solid var(--border)', textDecoration: 'none',
    padding: '10px 14px 10px 10px',
    transition: 'background .15s ease',
  },
  rowThumb: {
    width: 72, height: 72, borderRadius: 12, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  card: {
    background: 'var(--surface)', borderRadius: 20, overflow: 'hidden',
    border: '1px solid var(--border)',
    boxShadow: '0 2px 10px rgba(0,0,0,.04)',
    display: 'flex', flexDirection: 'column', textDecoration: 'none',
    transition: 'transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s ease, border-color .2s ease',
  },
  banner: {
    height: 148, padding: '14px 16px',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    position: 'relative', overflow: 'hidden',
  },
  orb: {
    position: 'absolute', width: 180, height: 180, borderRadius: '50%',
    top: -60, right: -40, pointerEvents: 'none',
  },
  avatar: {
    width: 60, height: 60, borderRadius: 18, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28, fontWeight: 700, color: '#fff', position: 'relative', zIndex: 1,
  },
  statusBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 11, fontWeight: 600, borderRadius: 20,
    padding: '4px 10px', alignSelf: 'flex-start', position: 'relative', zIndex: 1,
  },
  cardBody: { padding: '14px 18px 12px', flex: 1 },
  salonName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20, fontWeight: 700, color: 'var(--text)',
    marginBottom: 7, letterSpacing: '-0.01em',
  },
  salonLoc: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 13, color: 'var(--text-muted)', marginBottom: 8,
  },
  phone: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 12, color: 'var(--text-muted)',
    background: 'var(--surface2)', borderRadius: 20,
    padding: '3px 10px', border: '1px solid var(--border)',
  },
  cardFav: {
    border: '1.5px solid rgba(212,175,55,.3)',
    boxShadow: '0 4px 18px rgba(212,175,55,.1)',
  },
  cardCta: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '11px 18px', borderTop: '1px solid',
    fontWeight: 700, fontSize: 13,
  },
  favStar: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10, fontWeight: 800, color: '#D4AF37',
    background: 'rgba(212,175,55,.15)', borderRadius: 20,
    padding: '3px 9px', border: '1px solid rgba(212,175,55,.3)',
    letterSpacing: '0.04em',
  },
  favStarInline: {
    fontSize: 14, color: '#D4AF37', flexShrink: 0,
  },
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: '#D4AF37',
    paddingBottom: 4,
  },
  sectionStar: { fontSize: 15, color: '#D4AF37' },
  sectionCount: {
    fontSize: 10, fontWeight: 800, color: '#D4AF37',
    background: 'rgba(212,175,55,.12)', borderRadius: 20,
    padding: '2px 8px', border: '1px solid rgba(212,175,55,.25)',
    marginLeft: 2,
  },

  empty: {
    textAlign: 'center', padding: '80px 40px',
    background: 'var(--surface)', borderRadius: 20,
    border: '1px solid var(--border)',
  },
  emptyTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 24, color: 'var(--text)', marginBottom: 10,
  },
};

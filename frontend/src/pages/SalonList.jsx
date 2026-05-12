import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useBreakpoint } from '../hooks/useMobile';

const PALETTE = [
  ['#7C3AED', '#A78BFA'],
  ['#0D9488', '#2DD4BF'],
  ['#D97706', '#FCD34D'],
  ['#2563EB', '#93C5FD'],
  ['#DC2626', '#FCA5A5'],
  ['#059669', '#6EE7B7'],
];

export default function SalonList() {
  const { profile }            = useAuth();
  const { isMobile, isTablet } = useBreakpoint();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') || '';

  const [salons, setSalons]             = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort]                 = useState('default');
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/salons/?name=${search}`)
      .then(r => setSalons(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  const displayed = salons
    .filter(sl => statusFilter === 'all' || sl.status === statusFilter)
    .sort((a, b) => {
      if (sort === 'az') return a.name.localeCompare(b.name);
      if (sort === 'za') return b.name.localeCompare(a.name);
      return 0;
    });

  const openCount   = salons.filter(sl => sl.status === 'active').length;
  const closedCount = salons.length - openCount;
  const isNarrow    = isMobile || isTablet;
  const gridCols    = isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)';
  const hPad        = isMobile ? '10px 14px' : isTablet ? '11px 20px' : '12px 40px';

  return (
    <div style={s.page}>

      {/* ── Hero — shown only to guests ── */}
      {!profile && (
        <div
          style={{ ...s.hero, padding: isMobile ? '52px 20px 72px' : isTablet ? '72px 28px 96px' : '88px 40px 112px' }}
          className="anim-gradient noise-bg"
        >
          <div style={s.glow1} />
          <div style={s.glow2} />
          <div style={s.heroContent} className="fade-up">
            <div style={s.eyebrow}>
              <span style={{ color: '#BF9B65', fontSize: 10 }}>✦</span>
              Discover · Book · Glow
            </div>
            <h1 style={{ ...s.heroTitle, fontSize: isMobile ? 32 : isTablet ? 44 : 'clamp(34px,4.8vw,58px)' }}>
              Find Your Perfect<br />
              <em style={s.heroItalic}>Salon Experience</em>
            </h1>
            <p style={{ ...s.heroSub, fontSize: isMobile ? 13 : 16 }}>
              Browse curated premium salons and book your next beauty appointment in seconds.
            </p>
            <div style={{ ...s.heroSearch, maxWidth: isMobile ? '100%' : 480 }} className="fade-up d2">
              <span style={{ color: '#7C3AED', fontSize: 15, flexShrink: 0 }}>✦</span>
              <input
                className="hero-search"
                style={s.heroSearchInput}
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

      {/* ── Mobile / tablet search — shown to signed-in users only ── */}
      {profile && isNarrow && (
        <div style={s.topSearch}>
          <div style={s.topSearchBox}>
            <span style={{ color: '#7C3AED', fontSize: 14, flexShrink: 0 }}>✦</span>
            <input
              style={s.searchInput}
              placeholder="Search salons…"
              value={search}
              onChange={e => setSearchParams(e.target.value ? { q: e.target.value } : {})}
            />
            {search && (
              <button style={s.clearBtn} onClick={() => setSearchParams({})}>✕</button>
            )}
          </div>
        </div>
      )}

      {/* ── Sticky filter + sort strip ── */}
      <div style={{ ...s.filterStrip, padding: hPad }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {[
            { key: 'all',      label: 'All',      count: null         },
            { key: 'active',   label: '● Open',   count: openCount    },
            { key: 'inactive', label: '○ Closed', count: closedCount  },
          ].map(f => (
            <button
              key={f.key}
              style={{ ...s.chip, ...(statusFilter === f.key ? s.chipOn : {}) }}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
              {f.count !== null && (
                <span style={{ ...s.chipBadge, ...(statusFilter === f.key ? s.chipBadgeOn : {}) }}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {!isMobile && <span style={s.sortLabel}>SORT</span>}
          {[
            { key: 'default', label: 'Default' },
            { key: 'az',      label: 'A – Z'   },
            { key: 'za',      label: 'Z – A'   },
          ].map(opt => (
            <button
              key={opt.key}
              style={{ ...s.chip, ...(sort === opt.key ? s.chipOn : {}) }}
              onClick={() => setSort(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {search && !loading && (
        <p style={{ ...s.resultsNote, padding: isMobile ? '8px 14px 0' : '10px 40px 0' }}>
          {displayed.length} result{displayed.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* ── Grid ── */}
      <div style={{
        ...s.grid,
        gridTemplateColumns: gridCols,
        padding: isMobile ? '16px 12px 72px' : isTablet ? '20px 16px 72px' : '28px 40px 88px',
      }}>

        {loading && [1,2,3,4,5,6].map(i => (
          <div key={i} style={s.skeleton} className="shimmer" />
        ))}

        {!loading && displayed.length === 0 && (
          <div style={{ ...s.empty, gridColumn: '1 / -1' }} className="scale-in">
            <div className="empty-icon-wrap">
              <svg width="36" height="36" viewBox="0 0 38 38" fill="none">
                <defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7C3AED"/>
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

        {!loading && displayed.map((salon, i) => {
          const [c1, c2] = PALETTE[i % PALETTE.length];
          const isOpen   = salon.status === 'active';
          return (
            <Link
              key={salon.id}
              to={`/salons/${salon.id}`}
              style={s.card}
              className={`fade-up d${Math.min(i + 1, 5)}`}
            >
              <div style={{ ...s.banner, background: `linear-gradient(135deg, ${c1}1F 0%, ${c2}0D 100%)` }}>
                <div style={{ ...s.orb, background: `radial-gradient(circle, ${c1}33 0%, transparent 70%)` }} />
                <div style={{ ...s.avatar, background: `linear-gradient(145deg, ${c1} 0%, ${c2} 100%)`, boxShadow: `0 8px 28px ${c1}55` }}>
                  {salon.name[0].toUpperCase()}
                </div>
                <span style={{
                  ...s.statusBadge,
                  background: isOpen ? 'rgba(52,211,153,.15)' : 'rgba(107,114,128,.1)',
                  color:      isOpen ? '#059669' : '#6B7280',
                  border:     `1px solid ${isOpen ? '#6EE7B766' : '#D1D5DB'}`,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: isOpen ? '#34D399' : '#9CA3AF', display: 'inline-block', flexShrink: 0 }} />
                  {isOpen ? 'Open' : 'Closed'}
                </span>
              </div>

              <div style={s.cardBody}>
                <h3 style={s.salonName}>{salon.name}</h3>
                <div style={s.salonLoc}>
                  <span style={{ color: c1, fontSize: 11 }}>◎</span>
                  {salon.address_city}{salon.address_district ? `, ${salon.address_district}` : ''}
                </div>
                {salon.contact_number && (
                  <span style={s.phone}>📞 {salon.contact_number}</span>
                )}
              </div>

              <div style={{ ...s.cardCta, borderTopColor: `${c1}22`, color: c1 }}>
                <span>Explore Salon</span>
                <span style={{ fontSize: 16 }}>→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)' },

  /* ── Hero (guests only) ── */
  hero: {
    background: 'linear-gradient(145deg, #1A0532 0%, #2D0A5E 30%, #5B21B6 65%, #7C3AED 100%)',
    textAlign: 'center', position: 'relative', overflow: 'hidden',
  },
  glow1: {
    position: 'absolute', width: 420, height: 420, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(236,72,153,.18) 0%, transparent 70%)',
    top: -100, right: -40, pointerEvents: 'none', filter: 'blur(40px)',
  },
  glow2: {
    position: 'absolute', width: 320, height: 320, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,.18) 0%, transparent 70%)',
    bottom: -60, left: 60, pointerEvents: 'none', filter: 'blur(50px)',
  },
  heroContent: { position: 'relative', zIndex: 2, maxWidth: 660, margin: '0 auto' },
  eyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase',
    color: 'rgba(196,181,253,.75)', marginBottom: 24,
    background: 'rgba(255,255,255,.07)', padding: '7px 18px', borderRadius: 30,
    border: '1px solid rgba(255,255,255,.1)',
  },
  heroTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontWeight: 700, color: '#fff', margin: '0 0 18px',
    lineHeight: 1.12, letterSpacing: '-0.02em',
  },
  heroItalic: { fontStyle: 'italic', color: '#C4B5FD' },
  heroSub: {
    color: 'rgba(255,255,255,.65)', lineHeight: 1.65,
    maxWidth: 500, margin: '0 auto 36px',
  },
  heroSearch: {
    display: 'flex', alignItems: 'center',
    background: 'rgba(255,255,255,.97)',
    borderRadius: 60, padding: '13px 20px', gap: 12, margin: '0 auto',
    boxShadow: '0 12px 48px rgba(0,0,0,.22), 0 4px 16px rgba(124,58,237,.15)',
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
  chipOn:      { background: 'rgba(124,58,237,.08)', color: '#7C3AED', borderColor: 'rgba(124,58,237,.3)' },
  chipBadge:   { background: 'var(--surface2)', color: 'var(--text-muted)', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '1px 5px' },
  chipBadgeOn: { background: 'rgba(124,58,237,.12)', color: '#7C3AED' },
  sortLabel:   { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.14em' },

  resultsNote: { fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 },

  /* ── Grid ── */
  grid: {
    display: 'grid', gap: 20,
    maxWidth: 1280, margin: '0 auto',
  },
  skeleton: { height: 280, borderRadius: 20 },

  card: {
    background: 'var(--surface)', borderRadius: 20, overflow: 'hidden',
    border: '1px solid var(--border)',
    boxShadow: '0 2px 10px rgba(0,0,0,.04)',
    display: 'flex', flexDirection: 'column', textDecoration: 'none',
    transition: 'transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s ease, border-color .2s ease',
  },
  banner: {
    height: 108, padding: '14px 16px',
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
  cardCta: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '11px 18px', borderTop: '1px solid',
    fontWeight: 700, fontSize: 13,
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

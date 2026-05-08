import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useMobile';

const PALETTE = ['#7C3AED','#9B59E8','#EC4899','#BE185D','#A78BFA','#8B5CF6'];

export default function SalonList() {
  const { isDark } = useTheme();
  const isMobile   = useIsMobile();
  const [salons, setSalons]   = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/salons/?name=${search}`)
      .then(r => setSalons(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div style={s.page}>
      {/* ── Hero ── */}
      <div style={{ ...s.hero, padding: isMobile ? '60px 22px 90px' : '88px 40px 120px', textAlign: 'center' }} className="anim-gradient noise-bg">
        {/* Decorative radial glows */}
        <div style={s.glow1} />
        <div style={s.glow2} />

        <div style={s.heroContent} className="fade-up">
          <div style={s.eyebrow}>
            <span style={s.eyebrowDot}>✦</span>
            Discover · Book · Glow
          </div>
          <h1 style={s.heroTitle}>
            Find Your Perfect<br />
            <em style={s.heroTitleItalic}>Salon Experience</em>
          </h1>
          <p style={s.heroSub}>
            Browse curated premium salons and book your next beauty appointment in seconds.
          </p>

          {/* Search */}
          <div style={{ ...s.searchWrap, background: isDark ? 'var(--surface2)' : 'rgba(255,255,255,.97)', border: isDark ? '1px solid var(--border)' : '1px solid transparent' }} className="fade-up d2">
            <span style={s.searchIcon}>✦</span>
            <input
              className="hero-search"
              style={{ ...s.searchInput, color: isDark ? 'var(--text)' : '#111827', background: 'transparent' }}
              placeholder="Search by salon name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div style={s.results}>
        {search && (
          <p style={s.resultsLabel} className="fade-in">
            {loading
              ? 'Searching…'
              : `${salons.length} result${salons.length !== 1 ? 's' : ''} for "${search}"`}
          </p>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div style={s.grid}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={s.skeleton} className="shimmer" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && salons.length === 0 && (
          <div style={s.empty} className="scale-in">
            <div className="empty-icon-wrap">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                <defs>
                  <linearGradient id="emptyG1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7C3AED"/>
                    <stop offset="100%" stopColor="#EC4899"/>
                  </linearGradient>
                </defs>
                <circle cx="13" cy="13" r="7.5" stroke="url(#emptyG1)" strokeWidth="1.5"/>
                <circle cx="25" cy="25" r="7.5" stroke="url(#emptyG1)" strokeWidth="1.5"/>
                <line x1="19" y1="19" x2="33" y2="5" stroke="url(#emptyG1)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 style={s.emptyTitle}>No salons found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 0 }}>Try a different search term.</p>
          </div>
        )}

        {/* Cards */}
        {!loading && (
          <div style={s.grid}>
            {salons.map((salon, i) => {
              const color = PALETTE[i % PALETTE.length];
              return (
                <div
                  key={salon.id}
                  style={s.card}
                  className={`lift-sm lift-purple card-glow fade-up d${Math.min(i + 1, 5)}`}
                >
                  {/* Card banner */}
                  <div style={{ ...s.cardBanner, background: `linear-gradient(145deg, ${color}18 0%, ${color}08 100%)` }}>
                    <div style={{ ...s.salonAvatar, background: `linear-gradient(145deg, ${color} 0%, ${color}CC 100%)`, boxShadow: `0 8px 24px ${color}40` }}>
                      {salon.name[0].toUpperCase()}
                    </div>
                    <div style={{ ...s.categoryDot, background: color, boxShadow: `0 0 8px ${color}80` }} />
                  </div>

                  <div style={s.cardBody}>
                    <h3 style={s.salonName}>{salon.name}</h3>
                    <div style={s.salonLoc}>
                      <span style={{ ...s.locDot, background: color }}>◎</span>
                      {salon.address_city}{salon.address_district ? `, ${salon.address_district}` : ''}
                    </div>
                    {salon.contact_number && (
                      <div style={s.contactChip}>
                        <span style={{ fontSize: 10 }}>📞</span> {salon.contact_number}
                      </div>
                    )}
                  </div>

                  <Link to={`/salons/${salon.id}`} style={{ ...s.viewBtn, color }}>
                    <span>Explore Salon</span>
                    <span style={s.arrow}>→</span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)' },

  hero: {
    background: 'linear-gradient(145deg, #1A0532 0%, #2D0A5E 30%, #5B21B6 65%, #7C3AED 100%)',
    padding: '88px 40px 120px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute', width: 420, height: 420, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(236,72,153,.18) 0%, transparent 70%)',
    top: -100, right: -40, pointerEvents: 'none',
    filter: 'blur(40px)',
  },
  glow2: {
    position: 'absolute', width: 320, height: 320, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,.18) 0%, transparent 70%)',
    bottom: -60, left: 60, pointerEvents: 'none',
    filter: 'blur(50px)',
  },

  heroContent: { position: 'relative', zIndex: 2, maxWidth: 660, margin: '0 auto' },
  eyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase',
    color: 'rgba(196,181,253,.75)', marginBottom: 24,
    background: 'rgba(255,255,255,.07)', padding: '7px 18px', borderRadius: 30,
    border: '1px solid rgba(255,255,255,.1)',
  },
  eyebrowDot: { color: '#BF9B65', fontSize: 10 },
  heroTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 'clamp(32px, 4.8vw, 58px)', fontWeight: 700, color: '#fff', margin: '0 0 18px',
    lineHeight: 1.12, letterSpacing: '-0.02em',
  },
  heroTitleItalic: { fontStyle: 'italic', color: '#F9A8D4' },
  heroSub: {
    color: 'rgba(255,255,255,.65)', fontSize: 17, marginBottom: 40,
    lineHeight: 1.65, maxWidth: 500, margin: '0 auto 40px',
  },

  searchWrap: {
    display: 'flex', alignItems: 'center',
    background: 'rgba(255,255,255,.97)',
    borderRadius: 60, padding: '14px 22px', gap: 12,
    maxWidth: 500, margin: '0 auto',
    boxShadow: '0 12px 48px rgba(0,0,0,.22), 0 4px 16px rgba(124,58,237,.15)',
  },
  searchIcon: { color: '#7C3AED', fontSize: 15, flexShrink: 0 },
  searchInput: {
    border: 'none', outline: 'none', fontSize: 15, flex: 1,
    background: 'transparent', color: '#111827',
    fontFamily: "'DM Sans', sans-serif",
  },
  clearBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#9CA3AF', fontSize: 13, padding: '2px 4px', borderRadius: 4,
  },

  results: {
    maxWidth: 1240, margin: '-52px auto 0',
    padding: '0 16px 80px',
    position: 'relative', zIndex: 10,
  },
  resultsLabel: {
    fontSize: 13, color: 'var(--text-muted)', marginBottom: 22, marginTop: 6,
    fontStyle: 'italic',
  },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  skeleton: { height: 270, borderRadius: 22 },

  card: {
    background: 'var(--surface)', borderRadius: 22, overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(124,58,237,.07), 0 1px 4px rgba(0,0,0,.04)',
    border: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    transition: 'border-color .2s ease',
  },
  cardBanner: { padding: '24px 24px 16px', position: 'relative' },
  salonAvatar: {
    width: 56, height: 56, borderRadius: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 24, fontWeight: 700, color: '#fff',
  },
  categoryDot: {
    width: 9, height: 9, borderRadius: '50%',
    position: 'absolute', top: 18, right: 18,
  },
  cardBody: { padding: '4px 24px 18px', flex: 1 },
  salonName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 19, fontWeight: 700, color: 'var(--text)', marginBottom: 8,
    letterSpacing: '-0.01em',
  },
  salonLoc: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 13, color: 'var(--text-muted)', marginBottom: 10,
  },
  locDot: { fontSize: 11 },
  contactChip: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 12, color: 'var(--text-muted)',
    background: 'var(--surface2)', borderRadius: 20,
    padding: '4px 12px', border: '1px solid var(--border)',
  },
  viewBtn: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 24px', fontWeight: 600, fontSize: 14,
    borderTop: '1px solid var(--border)',
    transition: 'background .18s ease',
  },
  arrow: { fontSize: 16, transition: 'transform .2s ease' },

  empty: {
    textAlign: 'center', padding: '88px 40px',
    background: 'var(--surface)', borderRadius: 24,
    boxShadow: '0 4px 20px rgba(124,58,237,.06)',
    border: '1px solid var(--border)',
  },
  emptyTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 26, color: 'var(--text)', marginBottom: 10,
  },
};

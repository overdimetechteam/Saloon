import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { c, shadow } from '../styles/theme';

export default function SalonList() {
  const [salons, setSalons] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/salons/?name=${search}`)
      .then(r => setSalons(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  const PALETTE = ['#7C3AED','#EC4899','#2563EB','#059669','#D97706','#DC2626'];

  return (
    <div style={s.page}>
      {/* Hero */}
      <div style={s.hero} className="anim-gradient">
        <div style={s.heroOverlay} />
        <div style={s.heroContent} className="fade-up">
          <div style={s.heroEyebrow}>Discover · Book · Glow</div>
          <h1 style={s.heroTitle}>
            Find Your Perfect<br />
            <em style={s.heroTitleItalic}>Salon Experience</em>
          </h1>
          <p style={s.heroSub}>Browse curated salons and book your next beauty appointment in seconds.</p>
          <div style={s.searchWrap} className="fade-up d2">
            <span style={s.searchIcon}>✦</span>
            <input
              style={s.searchInput}
              placeholder="Search salons by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>

        {/* Decorative blobs */}
        <div style={s.blob1} />
        <div style={s.blob2} />
      </div>

      {/* Results */}
      <div style={s.results}>
        {search && (
          <p style={s.resultsLabel} className="fade-in">
            {loading ? 'Searching…' : `${salons.length} result${salons.length !== 1 ? 's' : ''} for "${search}"`}
          </p>
        )}

        {!loading && salons.length === 0 && (
          <div style={s.empty} className="scale-in">
            <div style={s.emptyIcon}>🔍</div>
            <h3 style={s.emptyTitle}>No salons found</h3>
            <p style={{ color: c.textMuted }}>Try a different search term.</p>
          </div>
        )}

        <div style={s.grid}>
          {salons.map((salon, i) => {
            const color = PALETTE[i % PALETTE.length];
            return (
              <div key={salon.id} style={s.card} className={`lift-sm lift-purple fade-up d${Math.min(i + 1, 5)}`}>
                <div style={{ ...s.cardBanner, background: `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)` }}>
                  <div style={{ ...s.salonAvatar, background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)` }}>
                    {salon.name[0].toUpperCase()}
                  </div>
                  <div style={{ ...s.categoryDot, background: color }} />
                </div>
                <div style={s.cardBody}>
                  <h3 style={s.salonName}>{salon.name}</h3>
                  <div style={s.salonLoc}>
                    <span style={s.locIcon}>◎</span>
                    {salon.address_city}{salon.address_district ? `, ${salon.address_district}` : ''}
                  </div>
                  <div style={s.contactRow}>
                    {salon.contact_number && (
                      <span style={s.contactChip}>📞 {salon.contact_number}</span>
                    )}
                  </div>
                </div>
                <Link to={`/salons/${salon.id}`} style={{ ...s.viewBtn, borderColor: color + '33', color }}>
                  View Salon
                  <span style={s.arrow}>→</span>
                </Link>
              </div>
            );
          })}
        </div>

        {loading && (
          <div style={s.loadingRow}>
            {[1,2,3].map(i => (
              <div key={i} style={s.skeleton} className="shimmer" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: c.bg },

  hero: {
    background: 'linear-gradient(135deg, #1E0A3C 0%, #3B0764 40%, #6D28D9 75%, #7C3AED 100%)',
    padding: '80px 40px 110px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at 60% 40%, rgba(236,72,153,.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroContent: { position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto' },
  heroEyebrow: {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase',
    color: 'rgba(196,181,253,.8)', marginBottom: 20,
  },
  heroTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 52, fontWeight: 800, color: '#fff', margin: '0 0 16px',
    lineHeight: 1.15,
  },
  heroTitleItalic: { fontStyle: 'italic', color: '#F9A8D4' },
  heroSub: { color: 'rgba(255,255,255,.7)', fontSize: 16, marginBottom: 36, lineHeight: 1.6 },

  searchWrap: {
    display: 'flex', alignItems: 'center',
    background: 'rgba(255,255,255,.98)',
    borderRadius: 50, padding: '14px 22px', gap: 12,
    maxWidth: 480, margin: '0 auto',
    boxShadow: '0 8px 40px rgba(0,0,0,.25)',
    transition: 'box-shadow .2s ease',
  },
  searchIcon: { color: '#7C3AED', fontSize: 16, flexShrink: 0 },
  searchInput: {
    border: 'none', outline: 'none', fontSize: 15, flex: 1,
    background: 'transparent', color: '#111827',
    fontFamily: 'inherit',
  },
  clearBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#9CA3AF', fontSize: 13, padding: '2px 4px', borderRadius: 4,
    transition: 'color .15s ease',
  },

  blob1: {
    position: 'absolute', width: 300, height: 300, borderRadius: '50%',
    background: 'rgba(124,58,237,.12)', top: -80, right: -60,
    filter: 'blur(60px)', pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', width: 250, height: 250, borderRadius: '50%',
    background: 'rgba(236,72,153,.1)', bottom: -40, left: 80,
    filter: 'blur(50px)', pointerEvents: 'none',
  },

  results: {
    maxWidth: 1200, margin: '-48px auto 0', padding: '0 32px 80px',
    position: 'relative', zIndex: 10,
  },
  resultsLabel: { fontSize: 13, color: '#6B7280', marginBottom: 20, marginTop: 4 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 },

  card: {
    background: 'var(--surface)', borderRadius: 18, overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,.07)',
    border: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
  },
  cardBanner: { padding: '22px 22px 14px', position: 'relative' },
  salonAvatar: {
    width: 52, height: 52, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, fontWeight: 800, color: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,.15)',
  },
  categoryDot: {
    width: 8, height: 8, borderRadius: '50%',
    position: 'absolute', top: 16, right: 16,
  },
  cardBody: { padding: '4px 22px 16px', flex: 1 },
  salonName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 6,
  },
  salonLoc: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 },
  locIcon: { fontSize: 12 },
  contactRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  contactChip: {
    fontSize: 11, color: 'var(--text-muted)',
    background: 'var(--surface2)', borderRadius: 20,
    padding: '3px 10px', border: '1px solid var(--border)',
  },

  viewBtn: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 22px', fontWeight: 600, fontSize: 14,
    borderTop: '1px solid', textDecoration: 'none',
    transition: 'background .18s ease, padding-left .18s ease',
  },
  arrow: { fontSize: 16, transition: 'transform .18s ease' },

  empty: {
    textAlign: 'center', padding: '80px 40px',
    background: 'var(--surface)', borderRadius: 20,
    boxShadow: '0 4px 20px rgba(0,0,0,.06)',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--text)', marginBottom: 8 },

  loadingRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 },
  skeleton: { height: 260, borderRadius: 18 },
};

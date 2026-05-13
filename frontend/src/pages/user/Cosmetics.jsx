import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useBreakpoint } from '../../hooks/useMobile';

const CATS = ['All', 'Hair Care', 'Skin Care', 'Nail Care', 'Other'];

const CAT_COLORS = {
  'Hair Care': '#8B5CF6',
  'Skin Care': '#10B981',
  'Nail Care': '#0D9488',
  'Other':     '#F59E0B',
};

const CAT_ICONS = {
  'Hair Care': '💇',
  'Skin Care': '✨',
  'Nail Care': '💅',
  'Other':     '🛍',
};

export default function Cosmetics() {
  const { isMobile, isTablet } = useBreakpoint();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeCat, setActiveCat] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/cosmetics/')
      .then(r => setProducts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    const matchCat = activeCat === 'All' || p.category === activeCat;
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q) || p.salon_name.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const salons = [...new Set(filtered.map(p => p.salon_name))];

  return (
    <div style={s.page}>

      {/* Hero */}
      <div style={{ ...s.hero, padding: isMobile ? '36px 20px 32px' : '52px 48px 44px' }}>
        <div style={s.heroGlow1} />
        <div style={s.heroGlow2} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640 }}>
          <div style={s.eyebrow}>Beauty & Care</div>
          <h1 style={{ ...s.heroTitle, fontSize: isMobile ? 30 : 42 }}>
            Explore our Cosmetics
          </h1>
          <p style={s.heroSub}>
            Premium beauty products available from our partner salons — browse and discover your next favourite.
          </p>
          <div style={{ position: 'relative', maxWidth: 420 }}>
            <span style={s.searchIcon}>🔍</span>
            <input
              style={s.searchInput}
              placeholder="Search products, brands or salons…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={{ ...s.body, padding: isMobile ? '24px 16px 48px' : isTablet ? '28px 24px 48px' : '36px 48px 64px' }}>

        {/* Category filter */}
        <div style={s.catRow}>
          {CATS.map(cat => {
            const color = cat === 'All' ? '#7C3AED' : (CAT_COLORS[cat] || '#7C3AED');
            const isActive = cat === activeCat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                style={{
                  ...s.catBtn,
                  background: isActive ? color : 'var(--surface)',
                  color: isActive ? '#fff' : color,
                  border: `1.5px solid ${isActive ? color : color + '40'}`,
                  boxShadow: isActive ? `0 4px 14px ${color}35` : 'none',
                }}
              >
                {cat !== 'All' && <span>{CAT_ICONS[cat]} </span>}
                {cat}
              </button>
            );
          })}
        </div>

        {/* Count */}
        {!loading && (
          <div style={s.countRow}>
            <span style={s.countText}>
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              {activeCat !== 'All' ? ` in ${activeCat}` : ''}
              {search ? ` matching "${search}"` : ''}
            </span>
          </div>
        )}

        {loading ? (
          <div style={s.loaderWrap}>
            <div style={s.loaderSpinner} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.emptyWrap}>
            <div style={s.emptyIcon}>🛍</div>
            <div style={s.emptyTitle}>No products found</div>
            <div style={s.emptySub}>Try adjusting your search or category filter.</div>
          </div>
        ) : (
          salons.map(salonName => {
            const salonProducts = filtered.filter(p => p.salon_name === salonName);
            const salonId = salonProducts[0]?.salon;
            return (
              <div key={salonName} style={s.salonSection}>
                <div style={s.salonHeader}>
                  <div style={s.salonAvatar}>{salonName[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={s.salonName}>{salonName}</div>
                    <div style={s.salonCount}>{salonProducts.length} product{salonProducts.length !== 1 ? 's' : ''} available</div>
                  </div>
                  <Link to={`/salons/${salonId}`} style={s.salonLink}>View Salon →</Link>
                </div>

                <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                  {salonProducts.map(p => {
                    const color = CAT_COLORS[p.category] || '#7C3AED';
                    return (
                      <div key={p.id} style={s.card} className="lift-sm fade-up">
                        <div style={{ ...s.cardTop, background: `${color}18` }}>
                          <span style={{ fontSize: 28 }}>{CAT_ICONS[p.category] || '🛍'}</span>
                          <span style={{ ...s.catTag, color, background: `${color}18`, border: `1px solid ${color}30` }}>
                            {p.category}
                          </span>
                        </div>
                        <div style={s.cardBody}>
                          <div style={s.productName}>{p.name}</div>
                          {p.brand && <div style={s.brandName}>{p.brand}</div>}
                          <div style={s.priceRow}>
                            <span style={{ ...s.price, color }}>LKR {Number(p.selling_price).toLocaleString()}</span>
                            <span style={s.unit}>/ {p.unit_of_measure}</span>
                          </div>
                          <div style={{ ...s.stockRow, color: p.current_stock > 5 ? '#059669' : p.current_stock > 0 ? '#D97706' : '#DC2626' }}>
                            {p.current_stock > 5 ? '● In Stock' : p.current_stock > 0 ? `● Only ${p.current_stock} left` : '● Out of Stock'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const s = {
  page: { background: 'var(--bg)', minHeight: '100vh' },

  hero: {
    background: 'linear-gradient(135deg, #1a0533 0%, #3B0764 35%, #7C3AED 70%, #EC4899 100%)',
    position: 'relative', overflow: 'hidden',
  },
  heroGlow1: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top left, rgba(236,72,153,.3) 0%, transparent 60%)', pointerEvents: 'none' },
  heroGlow2: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at bottom right, rgba(245,158,11,.2) 0%, transparent 50%)', pointerEvents: 'none' },
  eyebrow: { fontSize: 10, fontWeight: 700, color: 'rgba(255,209,226,.8)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 },
  heroTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, color: '#fff', margin: '0 0 12px', lineHeight: 1.1, letterSpacing: '-0.01em' },
  heroSub: { color: 'rgba(255,255,255,.65)', fontSize: 15, margin: '0 0 28px', lineHeight: 1.65 },
  searchIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' },
  searchInput: {
    width: '100%', padding: '12px 14px 12px 42px',
    border: '1.5px solid rgba(255,255,255,.2)',
    borderRadius: 12, fontSize: 14,
    background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(8px)',
    color: '#fff', outline: 'none', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
  },

  body: { maxWidth: 1200, margin: '0 auto' },

  catRow: { display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4, marginBottom: 28 },
  catBtn: {
    padding: '8px 18px', borderRadius: 24, cursor: 'pointer',
    fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
    fontFamily: "'DM Sans', sans-serif", transition: 'all .2s ease',
    flexShrink: 0,
  },

  countRow: { marginBottom: 16 },
  countText: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 },

  loaderWrap: { display: 'flex', justifyContent: 'center', padding: '80px 0' },
  loaderSpinner: { width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(236,72,153,.15)', borderTopColor: '#EC4899', animation: 'spinSlow .7s linear infinite' },

  emptyWrap: { textAlign: 'center', padding: '80px 20px' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 },
  emptySub: { fontSize: 14, color: 'var(--text-muted)' },

  salonSection: { marginBottom: 48 },
  salonHeader: {
    display: 'flex', alignItems: 'center', gap: 14,
    marginBottom: 18, padding: '14px 20px',
    background: 'var(--surface)', borderRadius: 14,
    border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
    flexWrap: 'wrap',
  },
  salonAvatar: {
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
    background: 'linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20, fontWeight: 700,
  },
  salonName: { fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 2, fontFamily: "'Cormorant Garamond', Georgia, serif" },
  salonCount: { fontSize: 12, color: 'var(--text-muted)' },
  salonLink: { padding: '7px 16px', fontSize: 12, fontWeight: 700, color: '#EC4899', background: 'rgba(236,72,153,.08)', borderRadius: 8, border: '1px solid rgba(236,72,153,.2)', textDecoration: 'none', marginLeft: 'auto', flexShrink: 0 },

  grid: { display: 'grid', gap: 16 },
  card: {
    background: 'var(--surface)', borderRadius: 16,
    border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,.06)',
    overflow: 'hidden',
  },
  cardTop: { padding: '20px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  catTag: { fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.05em' },
  cardBody: { padding: '4px 18px 18px' },
  productName: { fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 3, lineHeight: 1.4 },
  brandName: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 },
  price: { fontWeight: 800, fontSize: 16 },
  unit: { fontSize: 11, color: 'var(--text-muted)' },
  stockRow: { fontSize: 11, fontWeight: 700, letterSpacing: '0.03em' },
};

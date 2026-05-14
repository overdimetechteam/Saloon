import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useBreakpoint } from '../hooks/useMobile';
import { useCart } from '../context/CartContext';

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

const STATUS_META = {
  active:        { label: 'In Stock',       color: '#059669', bg: 'rgba(5,150,105,.12)'  },
  low_stock:     { label: 'Low Stock',       color: '#D97706', bg: 'rgba(217,119,6,.12)'  },
  out_of_stock:  { label: 'Out of Stock',    color: '#DC2626', bg: 'rgba(220,38,38,.12)'  },
  expiring_soon: { label: 'Expiring Soon',   color: '#7C3AED', bg: 'rgba(124,58,237,.12)' },
};

export default function SalonCosmetics() {
  const { id } = useParams();
  const { isMobile, isTablet } = useBreakpoint();
  const { addItem, totalItems, setCartOpen } = useCart();
  const [salonName, setSalonName] = useState('');
  const [products, setProducts]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [activeCat, setActiveCat] = useState('All');
  const [search, setSearch]       = useState('');
  const [addedKey, setAddedKey]   = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/salons/${id}/cosmetics/`)
      .then(r => {
        setSalonName(r.data.salon_name);
        setProducts(r.data.products);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const filtered = products.filter(p => {
    const matchCat = activeCat === 'All' || p.category === activeCat;
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q)
      || (p.brand || '').toLowerCase().includes(q)
      || (p.sku || '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  if (notFound) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🛍</div>
      <div style={{ fontSize: 22, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, color: 'var(--text)' }}>Cosmetics not available</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>This salon hasn't enabled their cosmetics section.</div>
      <Link to={`/salons/${id}`} style={{ padding: '10px 22px', borderRadius: 10, background: '#7C3AED', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>← Back to Salon</Link>
    </div>
  );

  return (
    <div style={s.page}>

      {/* Hero */}
      <div style={{ ...s.hero, padding: isMobile ? '36px 20px 32px' : '52px 48px 44px' }}>
        <div style={s.heroGlow1} />
        <div style={s.heroGlow2} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to={`/salons/${id}`} style={s.backLink}>← Back to Salon</Link>
          <div style={s.eyebrow}>Beauty & Care</div>
          {loading
            ? <div style={{ ...s.heroTitle, fontSize: isMobile ? 28 : 38, color: 'rgba(255,255,255,.4)' }}>Loading…</div>
            : <h1 style={{ ...s.heroTitle, fontSize: isMobile ? 28 : 38 }}>
                {salonName} — <em style={s.heroItalic}>Cosmetics</em>
              </h1>
          }
          <p style={s.heroSub}>
            Browse beauty &amp; care products available at this salon.
          </p>
          <div style={{ position: 'relative', maxWidth: 420 }}>
            <span style={s.searchIcon}>🔍</span>
            <input
              style={s.searchInput}
              placeholder="Search products, brands, SKUs…"
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
            const color = cat === 'All' ? '#EC4899' : (CAT_COLORS[cat] || '#EC4899');
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
          <>
          <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {filtered.map(p => {
              const color  = CAT_COLORS[p.category] || '#EC4899';
              const meta   = STATUS_META[p.status] || STATUS_META.active;
              const isOut  = p.status === 'out_of_stock';
              const wasAdded = addedKey === p.id;
              return (
                <div key={p.id} style={s.card} className="lift-sm fade-up">
                  {/* Image or icon top */}
                  {p.first_image_url ? (
                    <div style={{ position: 'relative' }}>
                      <img src={p.first_image_url} alt={p.name} style={s.cardImg} />
                      <span style={{ ...s.catTag, position: 'absolute', top: 10, right: 10, color, background: `${color}dd`, border: 'none', color: '#fff' }}>
                        {CAT_ICONS[p.category]} {p.category}
                      </span>
                    </div>
                  ) : (
                    <div style={{ ...s.cardTop, background: `${color}18` }}>
                      <span style={{ fontSize: 28 }}>{CAT_ICONS[p.category] || '🛍'}</span>
                      <span style={{ ...s.catTag, color, background: `${color}18`, border: `1px solid ${color}30` }}>
                        {p.category}
                      </span>
                    </div>
                  )}
                  <div style={s.cardBody}>
                    <div style={s.productName}>{p.name}</div>
                    {p.brand && <div style={s.brandName}>{p.brand}</div>}
                    {p.sku && <div style={s.skuTag}>SKU: {p.sku}</div>}
                    {p.shade_variant && <div style={s.attrRow}>🎨 {p.shade_variant}</div>}
                    {p.size && <div style={s.attrRow}>📦 {p.size}</div>}
                    {p.skin_type && <div style={s.attrRow}>✨ {p.skin_type}</div>}
                    <div style={s.priceRow}>
                      <span style={{ ...s.price, color }}>LKR {Number(p.selling_price).toLocaleString()}</span>
                      <span style={s.unit}>/ {p.unit_of_measure}</span>
                    </div>
                    <div style={{ ...s.statusBadge, color: meta.color, background: meta.bg }}>
                      ● {meta.label}
                    </div>
                    {p.expiry_date && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                        Exp: {p.expiry_date}
                      </div>
                    )}
                    <div style={s.cardActions}>
                      <Link to={`/salons/${id}/cosmetics/${p.id}`} style={s.detailBtn}>
                        View Details
                      </Link>
                      <button
                        style={{
                          ...s.addCartBtn,
                          background: isOut ? '#E5E7EB' : wasAdded ? '#059669' : color,
                          color: isOut ? '#9CA3AF' : '#fff',
                          cursor: isOut ? 'not-allowed' : 'pointer',
                        }}
                        disabled={isOut}
                        onClick={() => {
                          if (isOut) return;
                          addItem({ ...p, salon_id: p.salon_id || parseInt(id), salonName }, 1, '');
                          setAddedKey(p.id);
                          setTimeout(() => setAddedKey(null), 2000);
                        }}
                      >
                        {isOut ? 'Out of Stock' : wasAdded ? '✓ Added' : '+ Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating cart button */}
          {totalItems > 0 && (
            <button style={s.floatCart} onClick={() => setCartOpen(true)}>
              🛒 {totalItems} item{totalItems !== 1 ? 's' : ''} in cart
            </button>
          )}
          </>
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
  backLink: { display: 'inline-block', fontSize: 12, color: 'rgba(255,255,255,.65)', marginBottom: 14, textDecoration: 'none', fontWeight: 600, letterSpacing: '0.03em' },
  eyebrow: { fontSize: 10, fontWeight: 700, color: 'rgba(255,209,226,.8)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 },
  heroTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, color: '#fff', margin: '0 0 12px', lineHeight: 1.1, letterSpacing: '-0.01em' },
  heroItalic: { fontStyle: 'italic', color: '#FCD34D' },
  heroSub: { color: 'rgba(255,255,255,.65)', fontSize: 15, margin: '0 0 28px', lineHeight: 1.65 },
  searchIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' },
  searchInput: {
    width: '100%', padding: '12px 14px 12px 42px',
    border: '1.5px solid rgba(255,255,255,.2)', borderRadius: 12, fontSize: 14,
    background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(8px)',
    color: '#fff', outline: 'none', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
  },

  body: { maxWidth: 1200, margin: '0 auto' },
  catRow: { display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4, marginBottom: 28 },
  catBtn: {
    padding: '8px 18px', borderRadius: 24, cursor: 'pointer',
    fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
    fontFamily: "'DM Sans', sans-serif", transition: 'all .2s ease', flexShrink: 0,
  },
  countRow: { marginBottom: 16 },
  countText: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 },

  loaderWrap: { display: 'flex', justifyContent: 'center', padding: '80px 0' },
  loaderSpinner: { width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(236,72,153,.15)', borderTopColor: '#EC4899', animation: 'spinSlow .7s linear infinite' },

  emptyWrap: { textAlign: 'center', padding: '80px 20px' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 },
  emptySub: { fontSize: 14, color: 'var(--text-muted)' },

  grid: { display: 'grid', gap: 16 },
  card: {
    background: 'var(--surface)', borderRadius: 16,
    border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,.06)', overflow: 'hidden',
  },
  cardTop: { padding: '20px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  catTag: { fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.05em' },
  cardBody: { padding: '4px 18px 18px' },
  productName: { fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 3, lineHeight: 1.4 },
  brandName: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 },
  skuTag: { fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 6 },
  attrRow: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: 4, margin: '10px 0 6px' },
  price: { fontWeight: 800, fontSize: 16 },
  unit: { fontSize: 11, color: 'var(--text-muted)' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.03em' },

  cardImg: { width: '100%', height: 160, objectFit: 'cover', display: 'block' },
  cardActions: { display: 'flex', gap: 8, marginTop: 12 },
  detailBtn: {
    flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8,
    border: '1.5px solid var(--border)', background: 'var(--bg)',
    color: 'var(--text)', textDecoration: 'none', fontSize: 12, fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
  },
  addCartBtn: {
    flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
    fontSize: 12, fontWeight: 800, fontFamily: "'DM Sans', sans-serif",
    transition: 'opacity .2s ease',
  },
  floatCart: {
    position: 'fixed', bottom: 28, right: 28,
    padding: '14px 24px', borderRadius: 40,
    background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
    color: '#fff', border: 'none', fontSize: 14, fontWeight: 800,
    cursor: 'pointer', zIndex: 500,
    boxShadow: '0 8px 28px rgba(124,58,237,.45)',
    fontFamily: "'DM Sans', sans-serif",
  },
};

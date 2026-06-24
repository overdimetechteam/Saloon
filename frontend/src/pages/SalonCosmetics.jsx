import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useBreakpoint } from '../hooks/useMobile';
import { useCart } from '../context/CartContext';

const CATS = ['All', 'Hair Care', 'Skin Care', 'Nail Care', 'Other'];

const CAT_COLORS = {
  'Hair Care': '#C96B51',
  'Skin Care': '#D4AF37',
  'Nail Care': '#0D9488',
  'Other':     '#B8932A',
};

const CAT_ICONS = {
  'Hair Care': '💇',
  'Skin Care': '✨',
  'Nail Care': '💅',
  'Other':     '🛍',
};

const STATUS_META = {
  active:        { label: 'In Stock',     color: '#0D9488', bg: 'rgba(13,148,136,.12)'  },
  low_stock:     { label: 'Low Stock',    color: '#D4AF37', bg: 'rgba(212,175,55,.12)'  },
  out_of_stock:  { label: 'Out of Stock', color: '#DC2626', bg: 'rgba(220,38,38,.12)'   },
  expiring_soon: { label: 'Expiring',     color: '#F97316', bg: 'rgba(249,115,22,.12)'  },
};

/* ─── Gallery Slider ─── */
function GallerySlider({ images, isMobile }) {
  const [idx, setIdx]       = useState(0);
  const [startX, setStartX] = useState(null);
  const timer               = useRef(null);
  const n                   = images.length;

  useEffect(() => {
    if (n <= 1) return;
    timer.current = setInterval(() => setIdx(i => (i + 1) % n), 3500);
    return () => clearInterval(timer.current);
  }, [n]);

  const go = dir => {
    clearInterval(timer.current);
    setIdx(i => (i + dir + n) % n);
    timer.current = setInterval(() => setIdx(i => (i + 1) % n), 3500);
  };

  if (n === 0) return null;

  const h = isMobile ? 148 : 240;

  return (
    <div
      style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', height: h, background: 'rgba(0,0,0,.25)', userSelect: 'none' }}
      onPointerDown={e => setStartX(e.clientX)}
      onPointerUp={e => {
        if (startX !== null) {
          const dx = e.clientX - startX;
          if (Math.abs(dx) > 35) go(dx < 0 ? 1 : -1);
          setStartX(null);
        }
      }}
    >
      {images.map((img, i) => (
        <img
          key={i}
          src={img}
          alt=""
          draggable={false}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: i === idx ? 1 : 0,
            transition: 'opacity .55s ease',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Bottom gradient */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.35) 0%, transparent 55%)', pointerEvents: 'none' }} />

      {/* Dots */}
      {n > 1 && (
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 2 }}>
          {images.map((_, i) => (
            <div
              key={i}
              onClick={() => { clearInterval(timer.current); setIdx(i); timer.current = setInterval(() => setIdx(j => (j + 1) % n), 3500); }}
              style={{
                width: i === idx ? 18 : 6, height: 6, borderRadius: 3,
                background: i === idx ? '#fff' : 'rgba(255,255,255,.45)',
                cursor: 'pointer', transition: 'all .3s ease',
              }}
            />
          ))}
        </div>
      )}

      {/* Arrow buttons — desktop only */}
      {n > 1 && !isMobile && (
        <>
          <button onClick={() => go(-1)} style={arrowBtn('left')}>‹</button>
          <button onClick={() => go(1)}  style={arrowBtn('right')}>›</button>
        </>
      )}
    </div>
  );
}

const arrowBtn = side => ({
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  [side]: 12, width: 34, height: 34, borderRadius: '50%',
  background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)',
  border: 'none', color: '#fff', fontSize: 22,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 3,
});

/* ─── Star rating ─── */
function Stars({ n }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i <= n ? '#D4AF37' : 'none'} stroke="#D4AF37" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Main page ─── */
export default function SalonCosmetics() {
  const { id } = useParams();
  const { isMobile, isTablet } = useBreakpoint();
  const { addItem, totalItems, setCartOpen } = useCart();

  const [salonName, setSalonName] = useState('');
  const [products,  setProducts]  = useState([]);
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [activeCat, setActiveCat] = useState('All');
  const [search,    setSearch]    = useState('');
  const [addedKey,  setAddedKey]  = useState(null);

  const [galleryImages, setGalleryImages] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/salons/${id}/cosmetics/`),
      api.get(`/salons/${id}/reviews/`).catch(() => ({ data: [] })),
      api.get(`/salons/${id}/cosmetics-gallery/`).catch(() => ({ data: [] })),
    ]).then(([cosRes, revRes, galRes]) => {
      setSalonName(cosRes.data.salon_name);
      setProducts(cosRes.data.products);
      const rev = revRes.data?.results ?? revRes.data ?? [];
      setReviews(Array.isArray(rev) ? rev : []);
      const galData = Array.isArray(galRes.data) ? galRes.data : [];
      if (galData.length > 0) {
        setGalleryImages(galData.map(g => g.image_url).filter(Boolean));
      }
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  /* Fall back to product images when no gallery images are set */
  const displayGallery = galleryImages.length > 0
    ? galleryImages
    : products.filter(p => p.first_image_url).map(p => p.first_image_url).slice(0, 8);

  const filtered = products.filter(p => {
    if (p.status === 'expired') return false;
    const matchCat    = activeCat === 'All' || p.category === activeCat;
    const q           = search.toLowerCase();
    const matchSearch = !q
      || p.name.toLowerCase().includes(q)
      || (p.brand || '').toLowerCase().includes(q)
      || (p.sku  || '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  if (notFound) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🛍</div>
      <div style={{ fontSize: 22, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, color: 'var(--text)' }}>Cosmetics not available</div>
      <Link to={`/salons/${id}`} style={{ padding: '10px 22px', borderRadius: 10, background: '#0D9488', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>← Back to Salon</Link>
    </div>
  );

  const cols         = isMobile ? 2 : isTablet ? 3 : 4;
  const avatarColors = ['#0D9488', '#C96B51', '#D4AF37', '#8B5CF6', '#3B82F6', '#EC4899'];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: totalItems > 0 ? (isMobile ? 110 : 80) : 40 }}>

      {/* ── Full-bleed Hero ── */}
      <div style={{
        background: 'linear-gradient(145deg, #1A0D09 0%, #4A1F12 35%, #C96B51 70%, #D4AF37 100%)',
        position: 'relative', overflow: 'hidden',
        padding: isMobile ? '18px 14px 20px' : '36px 48px 32px',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top left, rgba(201,107,81,.3) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at bottom right, rgba(212,175,55,.2) 0%, transparent 50%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: isMobile ? 'none' : 760, margin: '0 auto' }}>

          {/* Top bar: back + eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 10 : 14 }}>
            <Link to={`/salons/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,.7)', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.02em' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Salon
            </Link>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,220,200,.8)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              Beauty &amp; Care
            </span>
          </div>

          {/* Title */}
          {loading
            ? <div style={{ height: isMobile ? 26 : 36, background: 'rgba(255,255,255,.1)', borderRadius: 8, marginBottom: 12, width: '65%' }} />
            : <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 23 : 34, fontWeight: 700, color: '#fff', margin: `0 0 ${isMobile ? 12 : 18}px`, lineHeight: 1.15 }}>
                {salonName} —&nbsp;<em style={{ fontStyle: 'italic', color: '#FCD34D' }}>Cosmetics</em>
              </h1>
          }

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: isMobile ? 12 : 18 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, pointerEvents: 'none' }}>🔍</span>
            <input
              style={{
                width: '100%', padding: isMobile ? '9px 12px 9px 34px' : '11px 14px 11px 36px',
                border: '1.5px solid rgba(255,255,255,.22)', borderRadius: 10, fontSize: 13,
                background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(8px)',
                color: '#fff', outline: 'none', boxSizing: 'border-box',
                fontFamily: "'DM Sans', sans-serif",
              }}
              placeholder="Search products, brands, SKUs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Gallery slider */}
          {loading
            ? <div style={{ height: isMobile ? 148 : 240, borderRadius: 14, background: 'rgba(0,0,0,.2)' }} />
            : <GallerySlider images={displayGallery} isMobile={isMobile} />
          }
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: isMobile ? '16px 12px' : '28px 32px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4, marginBottom: 16 }}>
          {CATS.map(cat => {
            const color = cat === 'All' ? '#C96B51' : (CAT_COLORS[cat] || '#C96B51');
            const on    = cat === activeCat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                style={{
                  padding: '7px 15px', borderRadius: 22, cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                  fontFamily: "'DM Sans', sans-serif", transition: 'all .18s ease',
                  background: on ? color : 'var(--surface)',
                  color: on ? '#fff' : color,
                  border: `1.5px solid ${on ? color : color + '40'}`,
                  boxShadow: on ? `0 4px 12px ${color}35` : 'none',
                }}
              >
                {cat !== 'All' && <span style={{ marginRight: 3 }}>{CAT_ICONS[cat]}</span>}
                {cat}
              </button>
            );
          })}
        </div>

        {!loading && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 12 }}>
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            {activeCat !== 'All' ? ` in ${activeCat}` : ''}
            {search ? ` matching "${search}"` : ''}
          </div>
        )}

        {/* Product grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 10 : 16 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ background: 'var(--surface)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ aspectRatio: '1/1', background: 'var(--border)' }} />
                <div style={{ padding: '10px 10px 14px' }}>
                  <div style={{ height: 12, background: 'var(--border)', borderRadius: 6, marginBottom: 6 }} />
                  <div style={{ height: 10, background: 'var(--border)', borderRadius: 6, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🛍</div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No products found</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Try adjusting your search or category filter.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 10 : 16 }}>
            {filtered.map(p => {
              const color    = CAT_COLORS[p.category] || '#C96B51';
              const meta     = STATUS_META[p.status]  || STATUS_META.active;
              const isOut    = p.status === 'out_of_stock';
              const wasAdded = addedKey === p.id;

              return (
                <div key={p.id} className="lift-sm" style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                  {/* Square image */}
                  <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: `${color}10`, flexShrink: 0 }}>
                    {p.first_image_url
                      ? <img src={p.first_image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 28 : 36 }}>
                          {CAT_ICONS[p.category] || '🛍'}
                        </div>
                    }
                    {/* Status */}
                    <div style={{ position: 'absolute', top: 6, left: 6, background: meta.bg, color: meta.color, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, backdropFilter: 'blur(4px)' }}>
                      ● {meta.label}
                    </div>
                    {/* Eye */}
                    <Link
                      to={`/salons/${id}/cosmetics/${p.id}`}
                      style={{ position: 'absolute', top: 6, right: 6, width: 27, height: 27, borderRadius: '50%', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    </Link>
                    {/* Category */}
                    <div style={{ position: 'absolute', bottom: 6, left: 6, background: `${color}dd`, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>
                      {CAT_ICONS[p.category]} {p.category}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: isMobile ? '8px 9px 10px' : '10px 12px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, marginBottom: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.name}
                    </div>
                    {p.brand && (
                      <div style={{ fontSize: isMobile ? 10 : 11, color: 'var(--text-muted)', marginBottom: 2 }}>{p.brand}</div>
                    )}
                    <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color, marginTop: 'auto', paddingTop: 6, marginBottom: isMobile ? 7 : 10 }}>
                      LKR {Number(p.selling_price).toLocaleString()}
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: isMobile ? 5 : 7 }}>
                      <Link
                        to={`/salons/${id}/cosmetics/${p.id}`}
                        style={{
                          flex: 1, textAlign: 'center', padding: isMobile ? '6px 0' : '7px 0',
                          borderRadius: 8, border: '1.5px solid var(--border)',
                          background: 'var(--bg)', color: 'var(--text)',
                          textDecoration: 'none', fontSize: isMobile ? 11 : 12, fontWeight: 700,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        View
                      </Link>
                      <button
                        disabled={isOut}
                        onClick={() => {
                          if (isOut) return;
                          addItem({ ...p, salon_id: p.salon_id || parseInt(id), salonName }, 1, '');
                          setAddedKey(p.id);
                          setTimeout(() => setAddedKey(null), 2000);
                        }}
                        style={{
                          flex: 1, padding: isMobile ? '6px 0' : '7px 0',
                          borderRadius: 8, border: 'none',
                          background: isOut ? '#E5E7EB' : wasAdded ? '#0D9488' : color,
                          color: isOut ? '#9CA3AF' : '#fff',
                          fontSize: isMobile ? 11 : 12, fontWeight: 800,
                          cursor: isOut ? 'not-allowed' : 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                          transition: 'background .2s ease',
                        }}
                      >
                        {isOut ? 'Out' : wasAdded ? '✓' : '+ Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Reviews ── */}
        {reviews.length > 0 && (
          <div style={{ marginTop: isMobile ? 40 : 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: '#D4AF37', flexShrink: 0 }} />
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 22 : 26, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Customer Reviews
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>({reviews.length})</span>
            </div>

            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 8 }}>
              {reviews.slice(0, 10).map((rv, i) => {
                const name     = rv.reviewer_name || rv.user_name || 'A';
                const initials = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                const bg       = avatarColors[i % avatarColors.length];
                return (
                  <div key={rv.id || i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: isMobile ? '14px' : '18px 20px', minWidth: isMobile ? 220 : 260, maxWidth: isMobile ? 220 : 260, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, marginBottom: 3 }}>{name}</div>
                        <Stars n={rv.rating || 5} />
                      </div>
                    </div>
                    {rv.comment && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{rv.comment}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Floating cart — above bottom nav on mobile ── */}
      {totalItems > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          style={{
            position: 'fixed',
            bottom: isMobile ? 72 : 24,
            right: isMobile ? 14 : 24,
            padding: isMobile ? '9px 15px' : '11px 20px',
            borderRadius: 30, border: 'none',
            background: 'linear-gradient(135deg, #C96B51, #D4AF37)',
            color: '#fff', fontSize: isMobile ? 12 : 13, fontWeight: 800,
            cursor: 'pointer', zIndex: 500,
            boxShadow: '0 6px 20px rgba(201,107,81,.45)',
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          🛒 {totalItems} item{totalItems !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}

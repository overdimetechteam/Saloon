import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useBreakpoint } from '../hooks/useMobile';

const CAT_COLORS = {
  'Hair Care': '#C96B51',
  'Skin Care': '#D4AF37',
  'Nail Care': '#0D9488',
  'Other':     '#B8932A',
};

const STATUS_META = {
  active:        { label: 'In Stock',      color: '#0D9488', bg: 'rgba(13,148,136,.12)' },
  low_stock:     { label: 'Low Stock',     color: '#D4AF37', bg: 'rgba(212,175,55,.12)'  },
  out_of_stock:  { label: 'Out of Stock',  color: '#DC2626', bg: 'rgba(220,38,38,.12)'  },
  expiring_soon: { label: 'Expiring Soon', color: '#F97316', bg: 'rgba(249,115,22,.12)' },
  expired:       { label: 'Expired',       color: '#DC2626', bg: 'rgba(220,38,38,.12)'  },
};

/* ─── Interactive star picker ─── */
function StarPicker({ value, onChange, readonly = false, size = 24 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= (hover || value);
        return (
          <svg
            key={i}
            width={size} height={size}
            viewBox="0 0 24 24"
            fill={filled ? '#D4AF37' : 'none'}
            stroke={filled ? '#D4AF37' : '#CBD5E1'}
            strokeWidth="1.8"
            style={{ cursor: readonly ? 'default' : 'pointer', transition: 'transform .1s ease', transform: hover === i && !readonly ? 'scale(1.15)' : 'scale(1)' }}
            onClick={() => !readonly && onChange(i)}
            onMouseEnter={() => !readonly && setHover(i)}
            onMouseLeave={() => !readonly && setHover(0)}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      })}
    </div>
  );
}

/* ─── Rating distribution bar ─── */
function RatingBar({ star, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, width: 18, textAlign: 'right' }}>{star}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="#D4AF37" stroke="#D4AF37" strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .6s ease' }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 24, textAlign: 'right' }}>{count}</span>
    </div>
  );
}

/* ─── Collapsible info tab ─── */
function InfoTab({ label, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--surface)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.02em' }}>{label}</span>
        </span>
        <span style={{ fontSize: 14, color: 'var(--text-muted)', transition: 'transform .2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: '4px 18px 16px', background: 'var(--bg)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ProductDetail() {
  const { id, productId } = useParams();
  const { isMobile } = useBreakpoint();
  const { addItem, setCartOpen } = useCart();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [product,   setProduct]   = useState(null);
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [variant,   setVariant]   = useState('');
  const [qty,       setQty]       = useState(1);
  const [added,     setAdded]     = useState(false);

  /* review form state */
  const [myRating,   setMyRating]   = useState(0);
  const [myComment,  setMyComment]  = useState('');
  const [myPhotos,   setMyPhotos]   = useState([]);
  const [previews,   setPreviews]   = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [reviewMsg,  setReviewMsg]  = useState(null);
  const photoRef = useRef(null);

  const isClient = profile?.role === 'client';

  const loadReviews = () =>
    api.get(`/salons/${id}/cosmetics/${productId}/reviews/`)
      .then(r => setReviews(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});

  useEffect(() => {
    api.get(`/salons/${id}/cosmetics/${productId}/`)
      .then(r => {
        setProduct(r.data);
        setVariant(r.data.shade_variant || '');
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    loadReviews();
  }, [id, productId]);

  const pickPhotos = e => {
    const files = Array.from(e.target.files).slice(0, 5);
    setMyPhotos(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removePhoto = i => {
    URL.revokeObjectURL(previews[i]);
    setMyPhotos(p => p.filter((_, j) => j !== i));
    setPreviews(p => p.filter((_, j) => j !== i));
  };

  const submitReview = async e => {
    e.preventDefault();
    if (!myRating) return setReviewMsg({ type: 'err', text: 'Please select a star rating.' });
    setSubmitting(true);
    setReviewMsg(null);
    const fd = new FormData();
    fd.append('rating', myRating);
    fd.append('comment', myComment);
    myPhotos.forEach((f, i) => fd.append(`photo_${i + 1}`, f));
    try {
      await api.post(`/salons/${id}/cosmetics/${productId}/reviews/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMyRating(0); setMyComment(''); setMyPhotos([]); setPreviews([]);
      if (photoRef.current) photoRef.current.value = '';
      setReviewMsg({ type: 'ok', text: 'Review submitted — thank you!' });
      loadReviews();
    } catch (err) {
      setReviewMsg({ type: 'err', text: err.response?.data?.detail || 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || product.status === 'out_of_stock' || product.status === 'expired') return;
    addItem({
      id: product.id, salonId: product.salon_id, salonName: product.salon_name,
      name: product.name, brand: product.brand, sku: product.sku,
      category: product.category, shade_variant: product.shade_variant,
      size: product.size, unit_of_measure: product.unit_of_measure,
      selling_price: product.selling_price, current_stock: product.current_stock,
      first_image_url: product.images?.[0] || null,
    }, qty, variant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const avatarColors = ['#0D9488', '#C96B51', '#D4AF37', '#8B5CF6', '#3B82F6', '#EC4899'];

  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(13,148,136,.15)', borderTopColor: '#0D9488', animation: 'spinSlow .7s linear infinite' }} />
    </div>
  );

  /* ─── Not found ─── */
  if (notFound) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🛍</div>
      <div style={{ fontSize: 20, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, color: 'var(--text)' }}>Product not found</div>
      <Link to={`/salons/${id}/cosmetics`} style={{ padding: '10px 22px', borderRadius: 10, background: '#0D9488', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>← Back to Cosmetics</Link>
    </div>
  );

  const color        = CAT_COLORS[product.category] || '#C96B51';
  const meta         = STATUS_META[product.status]  || STATUS_META.active;
  const images       = product.images || [];
  const isUnavailable = product.status === 'out_of_stock' || product.status === 'expired';

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 72 }}>

      {/* ── Breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '14px 14px' : '18px 32px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <Link to={`/salons/${id}`} style={{ fontSize: 12, color: '#0D9488', textDecoration: 'none', fontWeight: 600 }}>Salon</Link>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>/</span>
        <Link to={`/salons/${id}/cosmetics`} style={{ fontSize: 12, color: '#0D9488', textDecoration: 'none', fontWeight: 600 }}>Cosmetics</Link>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{product.name}</span>
      </div>

      {/* ── Main two-column layout ── */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 0 : 48, padding: isMobile ? '16px 14px' : '36px 32px', maxWidth: 1100, margin: '0 auto', alignItems: 'flex-start' }}>

        {/* ── LEFT: Image gallery ── */}
        <div style={{ width: isMobile ? '100%' : 400, flexShrink: 0 }}>
          <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', marginBottom: 12, background: `${color}10` }}>
            {images.length > 0
              ? <img src={images[activeImg]} alt={product.name} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>🛍</div>
            }
            <div style={{ position: 'absolute', top: 14, right: 14, background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>
              ● {meta.label}
            </div>
            {reviews.length > 0 && (
              <div style={{ position: 'absolute', bottom: 14, left: 14, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#D4AF37" stroke="#D4AF37" strokeWidth="1.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {product.rating_avg} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {images.map((url, i) => (
                <img
                  key={i} src={url} alt=""
                  onClick={() => setActiveImg(i)}
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, cursor: 'pointer', border: i === activeImg ? `2.5px solid ${color}` : '2px solid transparent', transition: 'border .15s ease' }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Product info & all sections ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Category badge */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, color, background: `${color}15`, border: `1px solid ${color}30`, letterSpacing: '0.05em' }}>
              {product.category}{product.subcategory ? ` · ${product.subcategory}` : ''}
            </span>
          </div>

          {/* Name */}
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 26 : 32, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', lineHeight: 1.2 }}>
            {product.name}
          </h1>
          {product.brand && <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>{product.brand}</div>}
          {product.sku   && <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: 16 }}>SKU: {product.sku}</div>}

          {/* Price + inline rating summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ fontSize: isMobile ? 26 : 30, fontWeight: 900, color, letterSpacing: '-0.01em' }}>
              LKR {Number(product.selling_price).toLocaleString()}
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 6 }}>/ {product.unit_of_measure}</span>
            </div>
            {reviews.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StarPicker value={Math.round(product.rating_avg || 0)} readonly size={16} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {product.rating_avg} ({reviews.length})
                </span>
              </div>
            )}
          </div>

          {/* Attribute grid */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(155px,1fr))', gap: 8, marginBottom: 20 }}>
            {product.shade_variant       && <InfoRow label="Shade / Variant"      value={product.shade_variant} />}
            {product.size                && <InfoRow label="Size"                 value={product.size} />}
            {product.skin_type           && <InfoRow label="Skin Type"            value={product.skin_type} />}
            {product.hair_type           && <InfoRow label="Hair Type"            value={product.hair_type} />}
            {product.pao                 && <InfoRow label="Period After Opening" value={product.pao} />}
            {product.country_of_origin   && <InfoRow label="Country"             value={product.country_of_origin} />}
            {product.manufacturing_date  && <InfoRow label="Manufactured"        value={product.manufacturing_date} />}
            {product.expiry_date         && <InfoRow label="Expires"             value={product.expiry_date} />}
            {product.certifications      && <InfoRow label="Certifications"      value={product.certifications} />}
            {product.supplier            && <InfoRow label="Supplier"            value={product.supplier} />}
          </div>

          {/* Expiry warning */}
          {product.status === 'expired' && (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.25)', color: '#DC2626', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              ⚠ This product is no longer available — its expiry date has passed.
            </div>
          )}

          {/* Variant selector */}
          {product.shade_variant && (
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Choose variant</label>
              <input style={{ ...s.input, marginTop: 6 }} value={variant} onChange={e => setVariant(e.target.value)} placeholder={`e.g. ${product.shade_variant}`} />
            </div>
          )}

          {/* Quantity picker */}
          {product.status !== 'expired' && (
            <div style={{ marginBottom: 24 }}>
              <label style={s.label}>Quantity</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <button style={s.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', minWidth: 30, textAlign: 'center' }}>{qty}</span>
                <button style={{ ...s.qtyBtn, opacity: qty >= product.current_stock ? 0.4 : 1 }} onClick={() => qty < product.current_stock && setQty(q => q + 1)}>+</button>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>{product.current_stock} available</span>
              </div>
            </div>
          )}

          {/* Add to cart */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button
              style={{ flex: 1, padding: '14px 0', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: "'DM Sans',sans-serif", transition: 'opacity .2s ease', cursor: isUnavailable ? 'not-allowed' : 'pointer', background: isUnavailable ? '#D1D5DB' : (added ? '#0D9488' : `linear-gradient(135deg,${color},#D4AF37)`) }}
              disabled={isUnavailable}
              onClick={handleAddToCart}
            >
              {product.status === 'expired' ? 'No Longer Available' : product.status === 'out_of_stock' ? 'Out of Stock' : added ? '✓ Added to Cart' : '🛒 Add to Cart'}
            </button>
            {!isUnavailable && (
              <button style={{ padding: '14px 20px', border: '1.5px solid var(--border)', borderRadius: 12, background: 'var(--surface)', color: 'var(--text)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }} onClick={() => setCartOpen(true)}>
                View Cart
              </button>
            )}
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 36 }}>
            Sold by <Link to={`/salons/${id}`} style={{ color, fontWeight: 700, textDecoration: 'none' }}>{product.salon_name}</Link>
          </div>

          {/* ════════════════════════════
              DESCRIPTION SECTION
          ════════════════════════════ */}
          {(product.ingredients || product.how_to_use || product.notes) && (
            <section style={{ marginBottom: 36 }}>
              <SectionHeading color={color}>About this Product</SectionHeading>

              {product.ingredients && (
                <InfoTab label="Ingredients" icon="🧪">
                  <p style={s.bodyText}>{product.ingredients}</p>
                </InfoTab>
              )}

              {product.how_to_use && (
                <InfoTab label="How to Use" icon="✨">
                  <p style={s.bodyText}>{product.how_to_use}</p>
                </InfoTab>
              )}

              {product.notes && (
                <InfoTab label="Additional Notes" icon="📋" defaultOpen={false}>
                  <p style={s.bodyText}>{product.notes}</p>
                </InfoTab>
              )}
            </section>
          )}

          {/* ════════════════════════════
              RATINGS & REVIEWS SECTION
          ════════════════════════════ */}
          <section>
            <SectionHeading color="#D4AF37">Ratings & Reviews</SectionHeading>

            {/* Summary card with poll bars */}
            {reviews.length > 0 ? (
              <div style={{ display: 'flex', gap: 24, marginBottom: 28, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: isMobile ? 16 : '20px 28px' }}>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 54, fontWeight: 900, color, lineHeight: 1, marginBottom: 6 }}>{product.rating_avg ?? '—'}</div>
                  <StarPicker value={Math.round(product.rating_avg || 0)} readonly size={18} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ flex: 1 }}>
                  {ratingBreakdown.map(({ star, count }) => (
                    <RatingBar key={star} star={star} count={count} total={reviews.length} color={color} />
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, marginBottom: 28 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>⭐</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>No reviews yet</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Be the first to share your experience</div>
              </div>
            )}

            {/* ── Write a review form (clients only) ── */}
            {isClient && (
              <div style={{ background: 'var(--surface)', border: `1.5px solid ${color}30`, borderRadius: 16, padding: isMobile ? 16 : '20px 24px', marginBottom: 28 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Write a Review</div>

                {reviewMsg && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13, fontWeight: 600, background: reviewMsg.type === 'ok' ? 'rgba(13,148,136,.08)' : 'rgba(220,38,38,.06)', border: `1px solid ${reviewMsg.type === 'ok' ? 'rgba(13,148,136,.25)' : 'rgba(220,38,38,.2)'}`, color: reviewMsg.type === 'ok' ? '#0D9488' : '#ef4444' }}>
                    {reviewMsg.type === 'ok' ? '✓' : '⚠'} {reviewMsg.text}
                  </div>
                )}

                <form onSubmit={submitReview}>
                  {/* Star selector */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={s.label}>Your Rating</label>
                    <div style={{ marginTop: 10 }}>
                      <StarPicker value={myRating} onChange={setMyRating} size={32} />
                      {myRating > 0 && (
                        <div style={{ fontSize: 13, color, fontWeight: 700, marginTop: 8 }}>
                          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][myRating]}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={s.label}>Your Review <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)', fontSize: 11 }}>(optional)</span></label>
                    <textarea
                      style={{ ...s.input, height: 88, resize: 'vertical', marginTop: 6 }}
                      placeholder="Share what you loved, how it worked for you…"
                      value={myComment}
                      onChange={e => setMyComment(e.target.value)}
                      maxLength={800}
                    />
                  </div>

                  {/* Photo upload */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={s.label}>Photos <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)', fontSize: 11 }}>(up to 5)</span></label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {previews.map((src, i) => (
                        <div key={i} style={{ position: 'relative', width: 66, height: 66, borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--border)' }}>
                          <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => removePhoto(i)} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,.65)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                      ))}
                      {previews.length < 5 && (
                        <button type="button" onClick={() => photoRef.current?.click()} style={{ width: 66, height: 66, borderRadius: 10, border: '1.5px dashed var(--border)', background: 'var(--bg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-muted)' }}>
                          <span style={{ fontSize: 20 }}>📷</span>
                          <span style={{ fontSize: 9, fontWeight: 700 }}>Add Photo</span>
                        </button>
                      )}
                    </div>
                    <input ref={photoRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={pickPhotos} />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ padding: '12px 28px', background: `linear-gradient(135deg,${color},#D4AF37)`, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, fontFamily: "'DM Sans',sans-serif", boxShadow: `0 4px 14px ${color}40` }}
                  >
                    {submitting ? 'Submitting…' : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}

            {/* ── Review list ── */}
            {reviews.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {reviews.map((rv, i) => {
                  const initials = (rv.client_name || 'A').trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                  const bg = avatarColors[i % avatarColors.length];
                  return (
                    <div key={rv.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: isMobile ? 14 : '18px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: rv.comment ? 10 : 0 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 3 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{rv.client_name || 'Anonymous'}</span>
                            <StarPicker value={rv.rating} readonly size={13} />
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {new Date(rv.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      {rv.comment && (
                        <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, margin: '0 0 10px 52px' }}>
                          "{rv.comment}"
                        </p>
                      )}
                      {rv.photos?.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 52 }}>
                          {rv.photos.map((src, j) => (
                            <img
                              key={j} src={src} alt=""
                              style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer' }}
                              onClick={() => window.open(src, '_blank')}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function SectionHeading({ color, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 3, height: 20, borderRadius: 2, background: color, flexShrink: 0 }} />
      <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{children}</h2>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 12px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, lineHeight: 1.3 }}>{value}</span>
    </div>
  );
}

const s = {
  label:   { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' },
  input:   { width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans',sans-serif" },
  qtyBtn:  { width: 36, height: 36, border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--surface)', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: 'var(--text)' },
  bodyText:{ fontSize: 13, color: 'var(--text)', lineHeight: 1.75, margin: '10px 0 0', whiteSpace: 'pre-line' },
};

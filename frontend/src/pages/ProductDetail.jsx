import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useBreakpoint } from '../hooks/useMobile';

const CAT_COLORS = {
  'Hair Care': '#8B5CF6',
  'Skin Care': '#10B981',
  'Nail Care': '#0D9488',
  'Other': '#F59E0B',
};

const STATUS_META = {
  active:        { label: 'In Stock',     color: '#059669', bg: 'rgba(5,150,105,.12)' },
  low_stock:     { label: 'Low Stock',    color: '#D97706', bg: 'rgba(217,119,6,.12)'  },
  out_of_stock:  { label: 'Out of Stock', color: '#DC2626', bg: 'rgba(220,38,38,.12)'  },
  expiring_soon: { label: 'Expiring Soon',color: '#7C3AED', bg: 'rgba(124,58,237,.12)' },
};

export default function ProductDetail() {
  const { id, productId } = useParams();
  const { isMobile } = useBreakpoint();
  const { addItem, setCartOpen } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [variant, setVariant] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.get(`/salons/${id}/cosmetics/${productId}/`)
      .then(r => {
        setProduct(r.data);
        setVariant(r.data.shade_variant || '');
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, productId]);

  const handleAddToCart = () => {
    if (!product || product.status === 'out_of_stock') return;
    addItem(
      {
        id: product.id,
        salonId: product.salon_id,
        salonName: product.salon_name,
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        category: product.category,
        shade_variant: product.shade_variant,
        size: product.size,
        unit_of_measure: product.unit_of_measure,
        selling_price: product.selling_price,
        current_stock: product.current_stock,
        first_image_url: product.images?.[0] || null,
      },
      qty,
      variant,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div style={s.spinner} />
    </div>
  );

  if (notFound) return (
    <div style={s.notFound}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🛍</div>
      <div style={s.notFoundTitle}>Product not found</div>
      <Link to={`/salons/${id}/cosmetics`} style={s.backLink}>← Back to Cosmetics</Link>
    </div>
  );

  const color = CAT_COLORS[product.category] || '#EC4899';
  const meta = STATUS_META[product.status] || STATUS_META.active;
  const images = product.images || [];
  const isOutOfStock = product.status === 'out_of_stock';

  return (
    <div style={s.page}>

      {/* Hero breadcrumb */}
      <div style={s.breadcrumb}>
        <Link to={`/salons/${id}`} style={s.breadLink}>Salon</Link>
        <span style={s.breadSep}>/</span>
        <Link to={`/salons/${id}/cosmetics`} style={s.breadLink}>Cosmetics</Link>
        <span style={s.breadSep}>/</span>
        <span style={{ color: 'var(--text)' }}>{product.name}</span>
      </div>

      <div style={{ ...s.main, flexDirection: isMobile ? 'column' : 'row' }}>

        {/* Image gallery */}
        <div style={{ ...s.gallery, width: isMobile ? '100%' : 420, flexShrink: 0 }}>
          <div style={s.mainImgWrap}>
            {images.length > 0 ? (
              <img src={images[activeImg]} alt={product.name} style={s.mainImg} />
            ) : (
              <div style={{ ...s.mainImgPlaceholder, background: `${color}18` }}>
                <span style={{ fontSize: 72 }}>🛍</span>
              </div>
            )}
            <div style={{ ...s.statusOverlay, color: meta.color, background: meta.bg }}>
              ● {meta.label}
            </div>
          </div>
          {images.length > 1 && (
            <div style={s.thumbRow}>
              {images.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  style={{ ...s.thumb, border: i === activeImg ? `2px solid ${color}` : '2px solid transparent' }}
                  onClick={() => setActiveImg(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div style={s.info}>
          <div style={{ ...s.catTag, color, background: `${color}15`, border: `1px solid ${color}30` }}>
            {product.category}{product.subcategory ? ` · ${product.subcategory}` : ''}
          </div>

          <h1 style={s.name}>{product.name}</h1>
          {product.brand && <div style={s.brand}>{product.brand}</div>}
          {product.sku && <div style={s.sku}>SKU: {product.sku}</div>}

          <div style={{ ...s.price, color }}>{`LKR ${Number(product.selling_price).toLocaleString()}`}</div>
          <div style={s.priceUnit}>per {product.unit_of_measure}</div>

          {/* Attributes */}
          <div style={s.attrsGrid}>
            {product.shade_variant && <InfoRow label="Shade / Variant" value={product.shade_variant} />}
            {product.size && <InfoRow label="Size" value={product.size} />}
            {product.skin_type && <InfoRow label="Skin Type" value={product.skin_type} />}
            {product.pao && <InfoRow label="PAO" value={product.pao} />}
            {product.country_of_origin && <InfoRow label="Country" value={product.country_of_origin} />}
            {product.barcode && <InfoRow label="Barcode" value={product.barcode} />}
            {product.manufacturing_date && <InfoRow label="Manufactured" value={product.manufacturing_date} />}
            {product.expiry_date && <InfoRow label="Expires" value={product.expiry_date} />}
            {product.certifications && <InfoRow label="Certifications" value={product.certifications} />}
            {product.supplier && <InfoRow label="Supplier" value={product.supplier} />}
          </div>

          {product.notes && (
            <div style={s.notes}>
              <div style={s.notesLabel}>Notes</div>
              <div style={s.notesText}>{product.notes}</div>
            </div>
          )}

          {/* Variant input */}
          {product.shade_variant && (
            <div style={s.variantBlock}>
              <label style={s.variantLabel}>Choose variant</label>
              <input
                style={s.variantInput}
                value={variant}
                onChange={e => setVariant(e.target.value)}
                placeholder={`e.g. ${product.shade_variant}`}
              />
            </div>
          )}

          {/* Quantity */}
          <div style={s.qtyBlock}>
            <label style={s.variantLabel}>Quantity</label>
            <div style={s.qtyRow}>
              <button style={s.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span style={s.qtyVal}>{qty}</span>
              <button
                style={{ ...s.qtyBtn, opacity: qty >= product.current_stock ? 0.4 : 1 }}
                onClick={() => qty < product.current_stock && setQty(q => q + 1)}
              >+</button>
              <span style={s.stockNote}>{product.current_stock} available</span>
            </div>
          </div>

          {/* Add to cart */}
          <div style={s.ctaRow}>
            <button
              style={{
                ...s.addBtn,
                background: isOutOfStock ? '#D1D5DB' : (added ? '#059669' : `linear-gradient(135deg, ${color}, #EC4899)`),
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              }}
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              {isOutOfStock ? 'Out of Stock' : added ? '✓ Added to Cart' : '🛒 Add to Cart'}
            </button>
            {!isOutOfStock && (
              <button
                style={s.cartViewBtn}
                onClick={() => { setCartOpen(true); }}
              >
                View Cart
              </button>
            )}
          </div>

          <div style={s.salonNote}>
            Sold by <Link to={`/salons/${id}`} style={{ color, fontWeight: 700, textDecoration: 'none' }}>{product.salon_name}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

const s = {
  page: { background: 'var(--bg)', minHeight: '100vh', paddingBottom: 64 },
  spinner: { width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(124,58,237,.15)', borderTopColor: '#7C3AED', animation: 'spinSlow .7s linear infinite' },
  notFound: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 },
  notFoundTitle: { fontSize: 20, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, color: 'var(--text)' },
  backLink: { padding: '10px 22px', borderRadius: 10, background: '#7C3AED', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 },

  breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderBottom: '1px solid var(--border)' },
  breadLink: { fontSize: 13, color: '#7C3AED', textDecoration: 'none', fontWeight: 600 },
  breadSep: { color: 'var(--text-muted)', fontSize: 13 },

  main: { display: 'flex', gap: 48, padding: '36px 32px', maxWidth: 1100, margin: '0 auto', alignItems: 'flex-start' },

  gallery: {},
  mainImgWrap: { position: 'relative', borderRadius: 20, overflow: 'hidden', marginBottom: 12 },
  mainImg: { width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' },
  mainImgPlaceholder: { width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statusOverlay: {
    position: 'absolute', top: 14, right: 14,
    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
  },
  thumbRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  thumb: { width: 64, height: 64, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' },

  info: { flex: 1, minWidth: 0 },
  catTag: { display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginBottom: 14, letterSpacing: '0.05em' },
  name: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', lineHeight: 1.2 },
  brand: { fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 },
  sku: { fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: 16 },
  price: { fontSize: 30, fontWeight: 900, letterSpacing: '-0.01em', marginBottom: 2 },
  priceUnit: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 },

  attrsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginBottom: 20 },
  notes: { padding: '14px 16px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 20 },
  notesLabel: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 },
  notesText: { fontSize: 13, color: 'var(--text)', lineHeight: 1.6 },

  variantBlock: { marginBottom: 16 },
  variantLabel: { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 },
  variantInput: {
    width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 14, background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
  },

  qtyBlock: { marginBottom: 24 },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 36, height: 36, border: '1.5px solid var(--border)', borderRadius: 8,
    background: 'var(--surface)', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: 'var(--text)',
  },
  qtyVal: { fontSize: 16, fontWeight: 800, color: 'var(--text)', minWidth: 30, textAlign: 'center' },
  stockNote: { fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 },

  ctaRow: { display: 'flex', gap: 12, marginBottom: 16 },
  addBtn: {
    flex: 1, padding: '14px 0', border: 'none', borderRadius: 12,
    color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: "'DM Sans', sans-serif",
    transition: 'opacity .2s ease',
  },
  cartViewBtn: {
    padding: '14px 20px', border: '1.5px solid var(--border)', borderRadius: 12,
    background: 'var(--surface)', color: 'var(--text)', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  },

  salonNote: { fontSize: 13, color: 'var(--text-muted)' },
};

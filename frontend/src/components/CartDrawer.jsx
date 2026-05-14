import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CAT_COLORS = {
  'Hair Care': '#8B5CF6',
  'Skin Care': '#10B981',
  'Nail Care': '#0D9488',
  'Other': '#F59E0B',
};

export default function CartDrawer() {
  const { items, cartOpen, setCartOpen, removeItem, updateQty, totalItems, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  if (!cartOpen) return null;

  const handleCheckout = () => {
    setCartOpen(false);
    navigate('/user/checkout');
  };

  return createPortal(
    <div style={s.overlay} onClick={() => setCartOpen(false)}>
      <div style={s.drawer} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <span style={s.cartIcon}>🛒</span>
            <span style={s.title}>Your Cart</span>
            {totalItems > 0 && <span style={s.badge}>{totalItems}</span>}
          </div>
          <button style={s.closeBtn} onClick={() => setCartOpen(false)}>✕</button>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛍</div>
            <div style={s.emptyTitle}>Your cart is empty</div>
            <div style={s.emptySub}>Browse cosmetics and add products to get started.</div>
          </div>
        ) : (
          <>
            <div style={s.itemsList}>
              {items.map(item => {
                const color = CAT_COLORS[item.category] || '#EC4899';
                return (
                  <div key={item._key} style={s.item}>
                    {item.first_image_url ? (
                      <img src={item.first_image_url} alt={item.name} style={s.itemImg} />
                    ) : (
                      <div style={{ ...s.itemImgPlaceholder, background: `${color}22` }}>
                        <span style={{ fontSize: 22 }}>🛍</span>
                      </div>
                    )}
                    <div style={s.itemInfo}>
                      <div style={s.itemName}>{item.name}</div>
                      {item.brand && <div style={s.itemBrand}>{item.brand}</div>}
                      {item.variantNote && <div style={s.itemVariant}>Variant: {item.variantNote}</div>}
                      <div style={s.itemPrice}>LKR {(Number(item.selling_price) * item.quantity).toLocaleString()}</div>
                      <div style={s.itemMeta}>LKR {Number(item.selling_price).toLocaleString()} / {item.unit_of_measure}</div>
                    </div>
                    <div style={s.itemRight}>
                      <div style={s.qtyRow}>
                        <button style={s.qtyBtn} onClick={() => updateQty(item._key, item.quantity - 1)}>−</button>
                        <span style={s.qty}>{item.quantity}</span>
                        <button
                          style={{ ...s.qtyBtn, opacity: item.quantity >= item.current_stock ? 0.4 : 1 }}
                          onClick={() => item.quantity < item.current_stock && updateQty(item._key, item.quantity + 1)}
                        >+</button>
                      </div>
                      <button style={s.removeBtn} onClick={() => removeItem(item._key)}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={s.footer}>
              <div style={s.subtotalRow}>
                <span style={s.subtotalLabel}>Subtotal</span>
                <span style={s.subtotalValue}>LKR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={s.taxNote}>Tax & delivery calculated at checkout</div>
              <button style={s.checkoutBtn} onClick={handleCheckout}>
                Proceed to Checkout →
              </button>
              <button style={s.clearBtn} onClick={clearCart}>Clear cart</button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9000,
    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
    display: 'flex', justifyContent: 'flex-end',
  },
  drawer: {
    width: 420, maxWidth: '95vw', height: '100vh',
    background: 'var(--surface)', display: 'flex', flexDirection: 'column',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.25)',
  },

  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid var(--border)',
    background: 'linear-gradient(135deg, #1a0533, #3B0764)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  cartIcon: { fontSize: 20 },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#fff' },
  badge: {
    background: '#EC4899', color: '#fff', borderRadius: 20,
    fontSize: 11, fontWeight: 800, padding: '2px 8px', minWidth: 22, textAlign: 'center',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
    width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700,
  },

  empty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' },
  emptyTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6 },
  emptySub: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 },

  itemsList: { flex: 1, overflowY: 'auto', padding: '16px 0' },
  item: {
    display: 'flex', gap: 14, alignItems: 'flex-start',
    padding: '14px 20px', borderBottom: '1px solid var(--border)',
  },
  itemImg: { width: 64, height: 64, objectFit: 'cover', borderRadius: 10, flexShrink: 0 },
  itemImgPlaceholder: {
    width: 64, height: 64, borderRadius: 10, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 2, lineHeight: 1.3 },
  itemBrand: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 },
  itemVariant: { fontSize: 11, color: '#7C3AED', fontStyle: 'italic', marginBottom: 4 },
  itemPrice: { fontWeight: 800, fontSize: 14, color: '#EC4899' },
  itemMeta: { fontSize: 10, color: 'var(--text-muted)', marginTop: 2 },
  itemRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28, height: 28, border: '1.5px solid var(--border)', borderRadius: 6,
    background: 'var(--bg)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--text)',
  },
  qty: { fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 20, textAlign: 'center' },
  removeBtn: {
    background: 'none', border: 'none', color: '#DC2626', fontSize: 11,
    cursor: 'pointer', fontWeight: 600, padding: 0,
  },

  footer: {
    padding: '20px 24px', borderTop: '1px solid var(--border)',
    background: 'var(--bg)',
  },
  subtotalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  subtotalLabel: { fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 },
  subtotalValue: { fontSize: 18, fontWeight: 800, color: 'var(--text)' },
  taxNote: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 },
  checkoutBtn: {
    width: '100%', padding: '14px 0',
    background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 800, cursor: 'pointer',
    marginBottom: 10, fontFamily: "'DM Sans', sans-serif",
  },
  clearBtn: {
    width: '100%', padding: '10px 0',
    background: 'none', border: '1.5px solid var(--border)',
    color: 'var(--text-muted)', borderRadius: 12, fontSize: 13,
    fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  },
};

import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';

export default function OwnerSales() {
  const { salon } = useOwner();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ product: '', quantity: 1, unit_price: '' }]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    if (!salon) return;
    api.get(`/salons/${salon.id}/sales/`).then(r => setSales(r.data)).catch(() => {});
    api.get(`/salons/${salon.id}/products/`).then(r => setProducts(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, [salon]);

  const setItem = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const addItem = () => setItems(prev => [...prev, { product: '', quantity: 1, unit_price: '' }]);

  const autoPrice = (i, productId) => {
    const p = products.find(p => p.id === Number(productId));
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, product: productId, unit_price: p ? p.selling_price : '' } : it));
  };

  const submit = async e => {
    e.preventDefault(); setError('');
    try {
      await api.post(`/salons/${salon.id}/sales/`, {
        items: items.map(it => ({ product: Number(it.product), quantity: Number(it.quantity), unit_price: it.unit_price })),
      });
      load(); setShowForm(false); setItems([{ product: '', quantity: 1, unit_price: '' }]);
      setMsg('Sale recorded successfully!'); setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Error');
    }
  };

  const saleTotal = items => items?.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unit_price || 0)), 0).toFixed(2);

  return (
    <div>
      <div style={s.pageHeader} className="fade-up">
        <div>
          <div style={s.eyebrow}>Point of Sale</div>
          <h2 style={s.title}>Sales</h2>
          <p style={s.sub}>Record product sales to clients</p>
        </div>
        <button style={s.primaryBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Record Sale'}
        </button>
      </div>

      {msg && <div style={s.alertOk}>{msg}</div>}
      {error && <div style={s.alertErr}>{error}</div>}

      {showForm && (
        <div style={s.formCard} className="fade-up">
          <div style={s.formTitle}>New Sale</div>
          <form onSubmit={submit}>
            <div style={s.itemsTable}>
              <div style={s.itemsHead}>
                <span style={{ flex: 3 }}>Product</span>
                <span style={{ flex: 1, textAlign: 'center' }}>Qty</span>
                <span style={{ flex: 1, textAlign: 'right' }}>Unit Price</span>
                <span style={{ flex: 1, textAlign: 'right' }}>Subtotal</span>
              </div>
              {items.map((it, i) => {
                const subtotal = (Number(it.quantity) * Number(it.unit_price || 0)).toFixed(2);
                return (
                  <div key={i} style={s.itemRow}>
                    <select style={{ ...s.input, flex: 3 }} value={it.product} onChange={e => autoPrice(i, e.target.value)} required>
                      <option value="">— Select Product —</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.current_stock})</option>)}
                    </select>
                    <input style={{ ...s.input, flex: 1, textAlign: 'center' }} type="number" min={1} value={it.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} required />
                    <input style={{ ...s.input, flex: 1, textAlign: 'right' }} type="number" step="0.01" value={it.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)} required />
                    <span style={{ flex: 1, textAlign: 'right', fontWeight: 700, color: '#7C3AED', paddingRight: 8, fontSize: 14, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>LKR {subtotal}</span>
                  </div>
                );
              })}
            </div>
            <div style={s.formActions}>
              <button type="button" style={s.addItemBtn} onClick={addItem}>+ Add Item</button>
              <div style={s.totalRow}>
                <span style={s.totalLabel}>Total</span>
                <span style={s.totalVal}>LKR {items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unit_price || 0)), 0).toFixed(2)}</span>
              </div>
              <button type="submit" style={s.submitBtn}>✓ Record Sale</button>
            </div>
          </form>
        </div>
      )}

      <div style={s.list}>
        {sales.map(sale => (
          <div key={sale.id} style={s.saleCard} className="fade-up">
            <div style={s.saleHead}>
              <div>
                <span style={s.saleId}>Sale #{sale.id}</span>
                <span style={s.saleDate}> · {new Date(sale.created_at).toLocaleString()}</span>
              </div>
              <span style={s.saleTotal}>LKR {saleTotal(sale.items)}</span>
            </div>
            <div style={s.saleItems}>
              {sale.items?.map(it => (
                <div key={it.id} style={s.saleItem}>
                  <span style={s.saleItemName}>{it.product_name}</span>
                  <span style={s.saleItemQty}>×{it.quantity}</span>
                  <span style={s.saleItemPrice}>LKR {it.unit_price}</span>
                  <span style={s.saleItemSub}>= LKR {(it.quantity * it.unit_price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {sales.length === 0 && (
          <div style={s.empty} className="scale-in">
            <div style={s.emptyOrb}>🛍</div>
            <h3 style={s.emptyTitle}>No sales recorded yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Use "+ Record Sale" to log a product sale.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26, flexWrap: 'wrap', gap: 14 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: '#A78BFA', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' },
  sub: { color: 'var(--text-muted)', fontSize: 13, margin: 0 },
  primaryBtn: {
    padding: '11px 22px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #EC4899 100%)',
    color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer',
    fontWeight: 700, fontSize: 13, boxShadow: '0 6px 18px rgba(124,58,237,.35)',
    fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
  },
  alertOk: { background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  alertErr: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  formCard: {
    background: 'var(--surface)', borderRadius: 20, padding: 26,
    border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(124,58,237,.08)',
    marginBottom: 28,
  },
  formTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.01em' },
  input: {
    padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 13, boxSizing: 'border-box', color: 'var(--text)', background: 'var(--input-bg)',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
  },
  itemsTable: { border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  itemsHead: {
    display: 'flex', gap: 8, padding: '9px 12px', background: 'var(--surface2)',
    fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  itemRow: { display: 'flex', gap: 8, padding: '8px 12px', alignItems: 'center', borderTop: '1px solid var(--border)' },
  formActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  addItemBtn: {
    padding: '9px 18px', background: 'rgba(37,99,235,.1)', color: '#2563EB',
    border: '1px solid rgba(37,99,235,.2)', borderRadius: 10, cursor: 'pointer',
    fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
  },
  totalRow: { display: 'flex', alignItems: 'center', gap: 10 },
  totalLabel: { fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' },
  totalVal: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 24, fontWeight: 700, color: '#7C3AED',
  },
  submitBtn: {
    padding: '11px 28px',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer',
    fontWeight: 700, fontSize: 13, boxShadow: '0 4px 14px rgba(5,150,105,.3)',
    fontFamily: "'DM Sans', sans-serif",
  },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  saleCard: {
    background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
    boxShadow: '0 4px 16px rgba(124,58,237,.06)', overflow: 'hidden',
  },
  saleHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 22px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)',
  },
  saleId: { fontWeight: 700, fontSize: 14, color: 'var(--text)' },
  saleDate: { fontSize: 13, color: 'var(--text-muted)' },
  saleTotal: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontWeight: 700, fontSize: 18, color: '#059669',
  },
  saleItems: { padding: '10px 22px' },
  saleItem: { display: 'flex', gap: 12, alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' },
  saleItemName: { flex: 2, fontSize: 13, color: 'var(--text)', fontWeight: 500 },
  saleItemQty: { fontWeight: 700, color: '#7C3AED' },
  saleItemPrice: { fontSize: 12, color: 'var(--text-muted)' },
  saleItemSub: { fontSize: 13, fontWeight: 700, color: 'var(--text)', marginLeft: 'auto' },
  empty: {
    background: 'var(--surface)', borderRadius: 22, padding: '64px 40px',
    textAlign: 'center', border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(124,58,237,.06)',
  },
  emptyOrb: { fontSize: 36, marginBottom: 16, display: 'block' },
  emptyTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, color: 'var(--text)', marginBottom: 8 },
};
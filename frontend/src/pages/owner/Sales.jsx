import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { c, shadow } from '../../styles/theme';

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
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.title}>Sales</h2>
          <p style={s.sub}>Record product sales to clients</p>
        </div>
        <button style={s.primaryBtn} onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Record Sale'}</button>
      </div>

      {msg && <div style={s.success}>{msg}</div>}
      {error && <div style={s.alert}>{error}</div>}

      {showForm && (
        <div style={s.formCard}>
          <h4 style={s.formTitle}>New Sale</h4>
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
                    <span style={{ flex: 1, textAlign: 'right', fontWeight: 700, color: c.primary, paddingRight: 8, fontSize: 14 }}>LKR {subtotal}</span>
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
              <button type="submit" style={s.submitBtn}>Record Sale</button>
            </div>
          </form>
        </div>
      )}

      <div style={s.list}>
        {sales.map(sale => (
          <div key={sale.id} style={s.saleCard}>
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
        {sales.length === 0 && <div style={s.empty}>No sales recorded yet.</div>}
      </div>
    </div>
  );
}

const s = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 14 },
  title: { fontSize: 26, fontWeight: 700, color: c.text, margin: 0, marginBottom: 4 },
  sub: { color: c.textMuted, fontSize: 14, margin: 0 },
  primaryBtn: { padding: '10px 22px', background: c.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  success: { background: c.successBg, border: `1px solid ${c.successBorder}`, color: c.success, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  alert: { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.error, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  formCard: { background: c.surface, borderRadius: 14, padding: 24, border: `1px solid ${c.border}`, boxShadow: shadow.sm, marginBottom: 28 },
  formTitle: { fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 16 },
  input: { padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, boxSizing: 'border-box' },
  itemsTable: { border: `1px solid ${c.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 14 },
  itemsHead: { display: 'flex', gap: 8, padding: '8px 12px', background: c.bg, fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' },
  itemRow: { display: 'flex', gap: 8, padding: '8px 12px', alignItems: 'center', borderTop: `1px solid ${c.border}` },
  formActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  addItemBtn: { padding: '8px 16px', background: c.infoBg, color: c.info, border: `1px solid ${c.infoBorder}`, borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  totalRow: { display: 'flex', alignItems: 'center', gap: 10 },
  totalLabel: { fontSize: 14, fontWeight: 600, color: c.textSub },
  totalVal: { fontSize: 20, fontWeight: 800, color: c.primary },
  submitBtn: { padding: '11px 28px', background: c.success, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  saleCard: { background: c.surface, borderRadius: 12, border: `1px solid ${c.border}`, boxShadow: shadow.sm, overflow: 'hidden' },
  saleHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${c.border}`, background: c.bg },
  saleId: { fontWeight: 700, fontSize: 14, color: c.text },
  saleDate: { fontSize: 13, color: c.textMuted },
  saleTotal: { fontWeight: 800, fontSize: 16, color: c.success },
  saleItems: { padding: '10px 20px' },
  saleItem: { display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${c.border}` },
  saleItemName: { flex: 2, fontSize: 13, color: c.text },
  saleItemQty: { fontWeight: 700, color: c.primary },
  saleItemPrice: { fontSize: 12, color: c.textMuted },
  saleItemSub: { fontSize: 13, fontWeight: 600, color: c.text, marginLeft: 'auto' },
  empty: { padding: '60px', textAlign: 'center', color: c.textMuted, background: c.surface, borderRadius: 14, border: `1px solid ${c.border}` },
};

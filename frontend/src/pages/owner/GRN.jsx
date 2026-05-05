import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { c, shadow } from '../../styles/theme';

export default function OwnerGRN() {
  const { salon } = useOwner();
  const [grns, setGrns] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplier, setSupplier] = useState('');
  const [items, setItems] = useState([{ product: '', quantity_received: 1, unit_cost: '' }]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    if (!salon) return;
    api.get(`/salons/${salon.id}/grn/`).then(r => setGrns(r.data)).catch(() => {});
    api.get(`/salons/${salon.id}/products/`).then(r => setProducts(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, [salon]);

  const setItem = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const addItem = () => setItems(prev => [...prev, { product: '', quantity_received: 1, unit_cost: '' }]);
  const removeItem = i => setItems(prev => prev.filter((_, idx) => idx !== i));

  const submit = async e => {
    e.preventDefault(); setError('');
    try {
      await api.post(`/salons/${salon.id}/grn/`, {
        supplier_name: supplier,
        items: items.map(it => ({ product: Number(it.product), quantity_received: Number(it.quantity_received), unit_cost: it.unit_cost })),
      });
      load(); setShowForm(false); setSupplier(''); setItems([{ product: '', quantity_received: 1, unit_cost: '' }]);
      setMsg('GRN created as draft. Confirm it to update stock.'); setTimeout(() => setMsg(''), 4000);
    } catch (err) { setError(JSON.stringify(err.response?.data) || 'Error'); }
  };

  const confirm = async id => {
    try {
      await api.post(`/salons/${salon.id}/grn/${id}/confirm/`);
      load(); setMsg('GRN confirmed — stock updated!'); setTimeout(() => setMsg(''), 4000);
    } catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  return (
    <div>
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.title}>Goods Received Notes</h2>
          <p style={s.sub}>Record incoming stock from suppliers</p>
        </div>
        <button style={s.primaryBtn} onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New GRN'}</button>
      </div>

      {msg && <div style={s.success}>{msg}</div>}
      {error && <div style={s.alert}>{error}</div>}

      {showForm && (
        <div style={s.formCard}>
          <h4 style={s.formTitle}>Create New GRN</h4>
          <form onSubmit={submit}>
            <label style={s.label}>Supplier Name *</label>
            <input style={s.input} placeholder="e.g. Beauty Supplies Ltd" value={supplier} onChange={e => setSupplier(e.target.value)} required />

            <div style={s.itemsHeader}>
              <span style={s.label}>Items</span>
              <button type="button" style={s.addItemBtn} onClick={addItem}>+ Add Item</button>
            </div>
            <div style={s.itemsTable}>
              <div style={s.itemsHead}>
                <span style={{ flex: 3 }}>Product</span>
                <span style={{ flex: 1, textAlign: 'center' }}>Qty</span>
                <span style={{ flex: 1, textAlign: 'right' }}>Unit Cost</span>
                <span style={{ width: 32 }} />
              </div>
              {items.map((it, i) => (
                <div key={i} style={s.itemRow}>
                  <select style={{ ...s.input, flex: 3, marginBottom: 0 }} value={it.product} onChange={e => setItem(i, 'product', e.target.value)} required>
                    <option value="">— Select Product —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.brand || 'no brand'})</option>)}
                  </select>
                  <input style={{ ...s.input, flex: 1, marginBottom: 0, textAlign: 'center' }} type="number" min={1} value={it.quantity_received} onChange={e => setItem(i, 'quantity_received', e.target.value)} required />
                  <input style={{ ...s.input, flex: 1, marginBottom: 0, textAlign: 'right' }} type="number" step="0.01" placeholder="0.00" value={it.unit_cost} onChange={e => setItem(i, 'unit_cost', e.target.value)} required />
                  {items.length > 1 && <button type="button" style={s.rmBtn} onClick={() => removeItem(i)}>✕</button>}
                </div>
              ))}
            </div>
            <button type="submit" style={s.submitBtn}>Create Draft GRN</button>
          </form>
        </div>
      )}

      <div style={s.list}>
        {grns.map(grn => (
          <div key={grn.id} style={s.grnCard}>
            <div style={s.grnHead}>
              <div>
                <span style={s.refNum}>{grn.reference_number}</span>
                <span style={s.supplier}> · {grn.supplier_name}</span>
              </div>
              <div style={s.grnRight}>
                <span style={{ ...s.statusBadge, ...(grn.status === 'confirmed' ? s.confirmed : s.draft) }}>{grn.status}</span>
                <span style={s.grnDate}>{new Date(grn.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div style={s.grnItems}>
              {grn.items?.map(it => (
                <div key={it.id} style={s.grnItem}>
                  <span style={s.itemName}>{it.product_name}</span>
                  <span style={s.itemQty}>×{it.quantity_received}</span>
                  <span style={s.itemCost}>LKR {it.unit_cost} each</span>
                </div>
              ))}
            </div>
            {grn.status === 'draft' && (
              <div style={s.grnFooter}>
                <button style={s.confirmBtn} onClick={() => confirm(grn.id)}>✓ Confirm GRN (Update Stock)</button>
              </div>
            )}
          </div>
        ))}
        {grns.length === 0 && <div style={s.empty}>No GRNs yet. Create one to record received stock.</div>}
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
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: c.textSub, marginBottom: 6, marginTop: 14 },
  input: { width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 14, boxSizing: 'border-box', marginBottom: 4 },
  itemsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 8 },
  addItemBtn: { padding: '5px 12px', background: c.infoBg, color: c.info, border: `1px solid ${c.infoBorder}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  itemsTable: { border: `1px solid ${c.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 16 },
  itemsHead: { display: 'flex', gap: 8, padding: '8px 12px', background: c.bg, fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' },
  itemRow: { display: 'flex', gap: 8, padding: '8px 12px', alignItems: 'center', borderTop: `1px solid ${c.border}` },
  rmBtn: { width: 28, height: 28, background: c.errorBg, color: c.error, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  submitBtn: { padding: '11px 28px', background: c.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  list: { display: 'flex', flexDirection: 'column', gap: 14 },
  grnCard: { background: c.surface, borderRadius: 14, border: `1px solid ${c.border}`, boxShadow: shadow.sm, overflow: 'hidden' },
  grnHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${c.border}` },
  refNum: { fontWeight: 800, fontSize: 15, color: c.primary, fontFamily: 'monospace' },
  supplier: { fontSize: 14, color: c.textSub },
  grnRight: { display: 'flex', alignItems: 'center', gap: 12 },
  statusBadge: { padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  confirmed: { background: c.successBg, color: c.success },
  draft: { background: c.warningBg, color: c.warning },
  grnDate: { fontSize: 12, color: c.textMuted },
  grnItems: { padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 6 },
  grnItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: `1px solid ${c.border}` },
  itemName: { flex: 1, fontSize: 14, color: c.text },
  itemQty: { fontWeight: 700, fontSize: 14, color: c.primary },
  itemCost: { fontSize: 13, color: c.textMuted },
  grnFooter: { padding: '12px 20px', background: c.bg, borderTop: `1px solid ${c.border}` },
  confirmBtn: { padding: '9px 20px', background: c.success, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  empty: { padding: '60px', textAlign: 'center', color: c.textMuted, background: c.surface, borderRadius: 14, border: `1px solid ${c.border}` },
};

import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';

export default function OwnerGRN() {
  const { salon } = useOwner();
  const [grns, setGrns] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplier, setSupplier] = useState('');
  const [items, setItems] = useState([{ product: '', quantity_received: 1, unit_cost: '', expiry_date: '' }]);
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
  const addItem = () => setItems(prev => [...prev, { product: '', quantity_received: 1, unit_cost: '', expiry_date: '' }]);
  const removeItem = i => setItems(prev => prev.filter((_, idx) => idx !== i));

  const submit = async e => {
    e.preventDefault(); setError('');
    try {
      await api.post(`/salons/${salon.id}/grn/`, {
        supplier_name: supplier,
        items: items.map(it => ({
          product: Number(it.product),
          quantity_received: Number(it.quantity_received),
          unit_cost: it.unit_cost,
          ...(it.expiry_date ? { expiry_date: it.expiry_date } : {}),
        })),
      });
      load();
      setShowForm(false);
      setSupplier('');
      setItems([{ product: '', quantity_received: 1, unit_cost: '', expiry_date: '' }]);
      setMsg('GRN created as draft. Confirm it to update stock.');
      setTimeout(() => setMsg(''), 4000);
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
      <div style={s.pageHeader} className="fade-up">
        <div>
          <div style={s.eyebrow}>Receiving</div>
          <h2 style={s.title}>Goods Received Notes</h2>
          <p style={s.sub}>Record incoming stock from suppliers</p>
        </div>
        <button style={s.primaryBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ New GRN'}
        </button>
      </div>

      {msg && <div style={s.alertOk}>{msg}</div>}
      {error && <div style={s.alertErr}>{error}</div>}

      {showForm && (
        <div style={s.formCard} className="fade-up">
          <div style={s.formTitle}>Create New GRN</div>
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
                <span style={{ flex: 1.5, textAlign: 'center' }}>Expiry Date</span>
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
                  <input style={{ ...s.input, flex: 1.5, marginBottom: 0 }} type="date" value={it.expiry_date} onChange={e => setItem(i, 'expiry_date', e.target.value)} />
                  {items.length > 1 && (
                    <button type="button" style={s.rmBtn} onClick={() => removeItem(i)}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <button type="submit" style={s.submitBtn}>✓ Create Draft GRN</button>
          </form>
        </div>
      )}

      <div style={s.list}>
        {grns.map(grn => (
          <div key={grn.id} style={s.grnCard} className="fade-up">
            <div style={s.grnHead}>
              <div>
                <span style={s.refNum}>{grn.reference_number}</span>
                <span style={s.supplier}> · {grn.supplier_name}</span>
              </div>
              <div style={s.grnRight}>
                <span style={grn.status === 'confirmed' ? s.confirmed : s.draft}>{grn.status}</span>
                <span style={s.grnDate}>{new Date(grn.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div style={s.grnItems}>
              {grn.items?.map(it => (
                <div key={it.id} style={s.grnItem}>
                  <span style={s.itemName}>{it.product_name}</span>
                  <span style={s.itemQty}>×{it.quantity_received}</span>
                  <span style={s.itemCost}>LKR {it.unit_cost} each</span>
                  {it.expiry_date && (
                    <span style={s.itemExpiry}>Exp: {it.expiry_date}</span>
                  )}
                </div>
              ))}
            </div>
            {grn.status === 'confirmed' && grn.batches?.length > 0 && (
              <div style={s.batchSection}>
                <div style={s.batchLabel}>Batch IDs Created</div>
                <div style={s.batchList}>
                  {grn.batches.map(b => (
                    <div key={b.id} style={s.batchChip}>
                      <span style={s.batchId}>{b.batch_number}</span>
                      <span style={s.batchProduct}>{b.product_name}</span>
                      <span style={s.batchCost}>LKR {Number(b.unit_cost).toLocaleString()}</span>
                      {b.expiry_date && <span style={s.batchExpiry}>Exp: {b.expiry_date}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {grn.status === 'draft' && (
              <div style={s.grnFooter}>
                <button style={s.confirmBtn} onClick={() => confirm(grn.id)}>✓ Confirm GRN (Update Stock)</button>
              </div>
            )}
          </div>
        ))}
        {grns.length === 0 && (
          <div style={s.empty} className="scale-in">
            <div style={s.emptyOrb}>📦</div>
            <h3 style={s.emptyTitle}>No GRNs yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Create one to record received stock.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26, flexWrap: 'wrap', gap: 14 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' },
  sub: { color: 'var(--text-muted)', fontSize: 13, margin: 0 },
  primaryBtn: {
    padding: '11px 22px',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer',
    fontWeight: 700, fontSize: 13, boxShadow: '0 6px 18px rgba(13,148,136,.35)',
    fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
  },
  alertOk: { background: '#F0FDFA', border: '1px solid #99F6E4', color: '#0D9488', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  alertErr: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  formCard: {
    background: 'var(--surface)', borderRadius: 20, padding: 26,
    border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(13,148,136,.08)',
    marginBottom: 28,
  },
  formTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.01em' },
  label: { display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, marginTop: 14 },
  input: {
    width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 13, boxSizing: 'border-box', marginBottom: 4,
    color: 'var(--text)', background: 'var(--input-bg)',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
  },
  itemsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 8 },
  addItemBtn: {
    padding: '6px 14px', background: 'rgba(13,148,136,.1)', color: '#0D9488',
    border: '1px solid rgba(13,148,136,.2)', borderRadius: 8, cursor: 'pointer',
    fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
  },
  itemsTable: { border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 18 },
  itemsHead: {
    display: 'flex', gap: 8, padding: '9px 12px', background: 'var(--surface2)',
    fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  itemRow: { display: 'flex', gap: 8, padding: '8px 12px', alignItems: 'center', borderTop: '1px solid var(--border)' },
  rmBtn: {
    width: 30, height: 30, background: 'rgba(220,38,38,.1)', color: '#DC2626',
    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  submitBtn: {
    padding: '11px 28px',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer',
    fontWeight: 700, fontSize: 13, boxShadow: '0 4px 14px rgba(13,148,136,.35)',
    fontFamily: "'DM Sans', sans-serif",
  },
  list: { display: 'flex', flexDirection: 'column', gap: 14 },
  grnCard: {
    background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)',
    boxShadow: '0 4px 16px rgba(13,148,136,.06)', overflow: 'hidden',
  },
  grnHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 22px', borderBottom: '1px solid var(--border)',
  },
  refNum: { fontWeight: 800, fontSize: 15, color: '#0D9488', fontFamily: 'monospace', letterSpacing: '0.04em' },
  supplier: { fontSize: 14, color: 'var(--text-muted)' },
  grnRight: { display: 'flex', alignItems: 'center', gap: 12 },
  confirmed: { padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#F0FDFA', color: '#0D9488', border: '1px solid rgba(13,148,136,.2)' },
  draft: { padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#FBF3D0', color: '#92400E', border: '1px solid rgba(212,175,55,.3)' },
  grnDate: { fontSize: 12, color: 'var(--text-muted)' },
  grnItems: { padding: '12px 22px', display: 'flex', flexDirection: 'column', gap: 6 },
  grnItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0', borderBottom: '1px solid var(--border)' },
  itemName: { flex: 1, fontSize: 14, color: 'var(--text)', fontWeight: 500 },
  itemQty: { fontWeight: 700, fontSize: 14, color: '#0D9488' },
  itemCost: { fontSize: 13, color: 'var(--text-muted)' },
  itemExpiry: { fontSize: 11, fontWeight: 600, color: '#D4AF37', background: 'rgba(212,175,55,.1)', padding: '2px 8px', borderRadius: 6 },
  batchSection: { padding: '12px 22px', background: 'rgba(13,148,136,.04)', borderTop: '1px solid var(--border)' },
  batchLabel: { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 },
  batchList: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  batchChip: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--surface)', borderRadius: 8, padding: '6px 12px',
    border: '1px solid var(--border)',
  },
  batchId: { fontFamily: 'monospace', fontSize: 11, fontWeight: 800, color: '#0D9488' },
  batchProduct: { fontSize: 12, color: 'var(--text)', fontWeight: 500 },
  batchCost: { fontSize: 12, fontWeight: 700, color: 'var(--text)' },
  batchExpiry: { fontSize: 10, fontWeight: 600, color: '#D4AF37' },
  grnFooter: { padding: '13px 22px', background: 'var(--surface2)', borderTop: '1px solid var(--border)' },
  confirmBtn: {
    padding: '9px 22px',
    background: 'linear-gradient(135deg, #0D9488 0%, #0B7A70 100%)',
    color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
    fontWeight: 700, fontSize: 13, boxShadow: '0 4px 12px rgba(13,148,136,.3)',
    fontFamily: "'DM Sans', sans-serif",
  },
  empty: {
    background: 'var(--surface)', borderRadius: 22, padding: '64px 40px',
    textAlign: 'center', border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(13,148,136,.06)',
  },
  emptyOrb: { fontSize: 36, marginBottom: 16, display: 'block' },
  emptyTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, color: 'var(--text)', marginBottom: 8 },
};

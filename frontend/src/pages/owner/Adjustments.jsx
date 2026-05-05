import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { c, shadow } from '../../styles/theme';

const REASONS = ['damaged', 'wastage', 'theft', 'stocktake', 'promotional'];
const REASON_META = {
  damaged:    { icon: '💔', color: c.error },
  wastage:    { icon: '🗑️', color: '#9333EA' },
  theft:      { icon: '🔒', color: '#DC2626' },
  stocktake:  { icon: '📋', color: '#2563EB' },
  promotional:{ icon: '🎁', color: '#16A34A' },
};

export default function OwnerAdjustments() {
  const { salon } = useOwner();
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ product: '', quantity_change: '', reason: 'stocktake', notes: '' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    if (!salon) return;
    api.get(`/salons/${salon.id}/adjustments/`).then(r => setAdjustments(r.data)).catch(() => {});
    api.get(`/salons/${salon.id}/products/`).then(r => setProducts(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, [salon]);

  const f = k => e => setForm({ ...form, [k]: e.target.value });

  const submit = async e => {
    e.preventDefault(); setError('');
    try {
      await api.post(`/salons/${salon.id}/adjustments/`, { ...form, product: Number(form.product), quantity_change: Number(form.quantity_change) });
      load(); setForm({ product: '', quantity_change: '', reason: 'stocktake', notes: '' });
      setMsg('Stock adjustment recorded.'); setTimeout(() => setMsg(''), 4000);
    } catch (err) { setError(JSON.stringify(err.response?.data) || 'Error'); }
  };

  const selectedProduct = products.find(p => p.id === Number(form.product));

  return (
    <div>
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.title}>Stock Adjustments</h2>
          <p style={s.sub}>Correct stock levels for damage, waste, theft, or count discrepancies</p>
        </div>
      </div>

      {msg && <div style={s.success}>{msg}</div>}
      {error && <div style={s.alert}>{error}</div>}

      <div style={s.layout}>
        <div style={s.formCard}>
          <h4 style={s.formTitle}>New Adjustment</h4>
          <form onSubmit={submit}>
            <label style={s.label}>Product *</label>
            <select style={s.input} value={form.product} onChange={f('product')} required>
              <option value="">— Select a product —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (current: {p.current_stock} {p.unit_of_measure})</option>)}
            </select>

            {selectedProduct && (
              <div style={s.stockInfo}>Current Stock: <strong style={{ color: c.primary }}>{selectedProduct.current_stock} {selectedProduct.unit_of_measure}</strong></div>
            )}

            <label style={s.label}>Quantity Change *</label>
            <input style={s.input} type="number" placeholder="Use negative to deduct (e.g. -5)" value={form.quantity_change} onChange={f('quantity_change')} required />
            {form.quantity_change && selectedProduct && (
              <div style={{ ...s.stockInfo, color: Number(form.quantity_change) < 0 ? c.error : c.success }}>
                New stock will be: <strong>{selectedProduct.current_stock + Number(form.quantity_change)} {selectedProduct.unit_of_measure}</strong>
              </div>
            )}

            <label style={s.label}>Reason *</label>
            <div style={s.reasonGrid}>
              {REASONS.map(r => {
                const meta = REASON_META[r];
                return (
                  <label key={r} style={{ ...s.reasonCard, ...(form.reason === r ? { ...s.reasonSelected, borderColor: meta.color } : {}) }}>
                    <input type="radio" name="reason" value={r} checked={form.reason === r} onChange={f('reason')} style={{ display: 'none' }} />
                    <span style={s.reasonIcon}>{meta.icon}</span>
                    <span style={{ ...s.reasonLabel, color: form.reason === r ? meta.color : c.textSub }}>{r}</span>
                  </label>
                );
              })}
            </div>

            <label style={s.label}>Notes <span style={s.opt}>(optional)</span></label>
            <textarea style={{ ...s.input, resize: 'vertical' }} rows={3} placeholder="Additional details…" value={form.notes} onChange={f('notes')} />

            <button style={s.submitBtn} type="submit">Submit Adjustment</button>
          </form>
        </div>

        <div style={s.historyCol}>
          <h4 style={s.histTitle}>Adjustment History</h4>
          <div style={s.histList}>
            {adjustments.map(a => {
              const meta = REASON_META[a.reason] || { icon: '•', color: c.textMuted };
              const positive = a.quantity_change > 0;
              return (
                <div key={a.id} style={s.histCard}>
                  <div style={s.histHead}>
                    <span style={s.histIcon}>{meta.icon}</span>
                    <div style={s.histInfo}>
                      <div style={s.histProduct}>{a.product_name}</div>
                      <div style={s.histReason}>{a.reason}</div>
                    </div>
                    <span style={{ ...s.histChange, color: positive ? c.success : c.error }}>
                      {positive ? '+' : ''}{a.quantity_change}
                    </span>
                  </div>
                  {a.notes && <p style={s.histNotes}>{a.notes}</p>}
                  <div style={s.histDate}>{new Date(a.adjusted_at).toLocaleString()}</div>
                </div>
              );
            })}
            {adjustments.length === 0 && <p style={{ color: c.textMuted, textAlign: 'center', padding: '30px 0' }}>No adjustments yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  pageHeader: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 700, color: c.text, margin: 0, marginBottom: 4 },
  sub: { color: c.textMuted, fontSize: 14, margin: 0 },
  success: { background: c.successBg, border: `1px solid ${c.successBorder}`, color: c.success, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  alert: { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.error, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  layout: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'flex-start' },
  formCard: { background: c.surface, borderRadius: 14, padding: 24, border: `1px solid ${c.border}`, boxShadow: shadow.sm },
  formTitle: { fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: c.textSub, marginBottom: 6, marginTop: 14 },
  opt: { fontWeight: 400, color: c.textLight },
  input: { width: '100%', padding: '10px 12px', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  stockInfo: { marginTop: 6, fontSize: 13, color: c.textMuted, padding: '6px 10px', background: c.bg, borderRadius: 6 },
  reasonGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 4 },
  reasonCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 6px', border: `2px solid ${c.border}`, borderRadius: 8, cursor: 'pointer', background: '#fff' },
  reasonSelected: { background: c.primarySoft },
  reasonIcon: { fontSize: 20 },
  reasonLabel: { fontSize: 11, fontWeight: 600, textTransform: 'capitalize', textAlign: 'center' },
  submitBtn: { marginTop: 20, width: '100%', padding: '12px', background: c.primary, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  historyCol: { background: c.surface, borderRadius: 14, padding: 20, border: `1px solid ${c.border}`, boxShadow: shadow.sm },
  histTitle: { fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 16 },
  histList: { display: 'flex', flexDirection: 'column', gap: 10 },
  histCard: { border: `1px solid ${c.border}`, borderRadius: 10, padding: '12px 14px' },
  histHead: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
  histIcon: { fontSize: 18, flexShrink: 0 },
  histInfo: { flex: 1 },
  histProduct: { fontWeight: 600, fontSize: 13, color: c.text },
  histReason: { fontSize: 11, color: c.textMuted, textTransform: 'capitalize' },
  histChange: { fontWeight: 800, fontSize: 16, flexShrink: 0 },
  histNotes: { fontSize: 12, color: c.textMuted, margin: '4px 0', paddingLeft: 28 },
  histDate: { fontSize: 11, color: c.textLight, paddingLeft: 28, marginTop: 4 },
};

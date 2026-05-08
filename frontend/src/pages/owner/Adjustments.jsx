import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';

const REASONS = ['damaged', 'wastage', 'theft', 'stocktake', 'promotional'];
const REASON_META = {
  damaged:    { icon: '💔', color: '#DC2626' },
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
      <div style={s.pageHeader} className="fade-up">
        <div>
          <div style={s.eyebrow}>Control</div>
          <h2 style={s.title}>Stock Adjustments</h2>
          <p style={s.sub}>Correct stock levels for damage, waste, theft, or count discrepancies</p>
        </div>
      </div>

      {msg && <div style={s.alertOk}>{msg}</div>}
      {error && <div style={s.alertErr}>{error}</div>}

      <div style={s.layout}>
        <div style={s.formCard} className="fade-up">
          <div style={s.formTitle}>New Adjustment</div>
          <form onSubmit={submit}>
            <label style={s.label}>Product *</label>
            <select style={s.input} value={form.product} onChange={f('product')} required>
              <option value="">— Select a product —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (current: {p.current_stock} {p.unit_of_measure})</option>)}
            </select>

            {selectedProduct && (
              <div style={s.stockInfo}>
                Current Stock: <strong style={{ color: '#7C3AED' }}>{selectedProduct.current_stock} {selectedProduct.unit_of_measure}</strong>
              </div>
            )}

            <label style={s.label}>Quantity Change *</label>
            <input style={s.input} type="number" placeholder="Use negative to deduct (e.g. -5)" value={form.quantity_change} onChange={f('quantity_change')} required />
            {form.quantity_change && selectedProduct && (
              <div style={{ ...s.stockInfo, color: Number(form.quantity_change) < 0 ? '#DC2626' : '#059669' }}>
                New stock will be: <strong>{selectedProduct.current_stock + Number(form.quantity_change)} {selectedProduct.unit_of_measure}</strong>
              </div>
            )}

            <label style={s.label}>Reason *</label>
            <div style={s.reasonGrid}>
              {REASONS.map(r => {
                const meta = REASON_META[r];
                return (
                  <label key={r} style={{ ...s.reasonCard, ...(form.reason === r ? { ...s.reasonSelected, borderColor: meta.color, background: meta.color + '12' } : {}) }}>
                    <input type="radio" name="reason" value={r} checked={form.reason === r} onChange={f('reason')} style={{ display: 'none' }} />
                    <span style={s.reasonIcon}>{meta.icon}</span>
                    <span style={{ ...s.reasonLabel, color: form.reason === r ? meta.color : 'var(--text-muted)' }}>{r}</span>
                  </label>
                );
              })}
            </div>

            <label style={s.label}>
              Notes <span style={s.opt}>(optional)</span>
            </label>
            <textarea style={{ ...s.input, resize: 'vertical' }} rows={3} placeholder="Additional details…" value={form.notes} onChange={f('notes')} />

            <button style={s.submitBtn} type="submit">✓ Submit Adjustment</button>
          </form>
        </div>

        <div style={s.historyCol} className="fade-up d1">
          <div style={s.histTitle}>Adjustment History</div>
          <div style={s.histList}>
            {adjustments.map(a => {
              const meta = REASON_META[a.reason] || { icon: '•', color: 'var(--text-muted)' };
              const positive = a.quantity_change > 0;
              return (
                <div key={a.id} style={s.histCard}>
                  <div style={s.histHead}>
                    <span style={s.histIcon}>{meta.icon}</span>
                    <div style={s.histInfo}>
                      <div style={s.histProduct}>{a.product_name}</div>
                      <div style={s.histReason}>{a.reason}</div>
                    </div>
                    <span style={{ ...s.histChange, color: positive ? '#059669' : '#DC2626' }}>
                      {positive ? '+' : ''}{a.quantity_change}
                    </span>
                  </div>
                  {a.notes && <p style={s.histNotes}>{a.notes}</p>}
                  <div style={s.histDate}>{new Date(a.adjusted_at).toLocaleString()}</div>
                </div>
              );
            })}
            {adjustments.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0', fontSize: 13 }}>No adjustments yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  pageHeader: { marginBottom: 26 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' },
  sub: { color: 'var(--text-muted)', fontSize: 13, margin: 0 },
  alertOk: { background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  alertErr: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  layout: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'flex-start' },
  formCard: {
    background: 'var(--surface)', borderRadius: 20, padding: 26,
    border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(124,58,237,.08)',
  },
  formTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.01em' },
  label: { display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, marginTop: 16 },
  opt: { fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none' },
  input: {
    width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 13, boxSizing: 'border-box', color: 'var(--text)', background: 'var(--input-bg)',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
  },
  stockInfo: {
    marginTop: 6, fontSize: 13, color: 'var(--text-muted)',
    padding: '7px 12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)',
  },
  reasonGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 6 },
  reasonCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
    padding: '10px 6px', border: '2px solid var(--border)', borderRadius: 11, cursor: 'pointer',
    background: 'var(--surface2)', transition: 'all .15s ease',
  },
  reasonSelected: {},
  reasonIcon: { fontSize: 20 },
  reasonLabel: { fontSize: 10, fontWeight: 700, textTransform: 'capitalize', textAlign: 'center', letterSpacing: '0.04em' },
  submitBtn: {
    marginTop: 22, width: '100%', padding: '12px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #EC4899 100%)',
    color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer',
    fontWeight: 700, fontSize: 14, boxShadow: '0 4px 14px rgba(124,58,237,.35)',
    fontFamily: "'DM Sans', sans-serif",
  },
  historyCol: {
    background: 'var(--surface)', borderRadius: 20, padding: 22,
    border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(124,58,237,.06)',
  },
  histTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16, letterSpacing: '-0.01em' },
  histList: { display: 'flex', flexDirection: 'column', gap: 10 },
  histCard: { border: '1px solid var(--border)', borderRadius: 12, padding: '13px 15px' },
  histHead: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
  histIcon: { fontSize: 18, flexShrink: 0 },
  histInfo: { flex: 1 },
  histProduct: { fontWeight: 600, fontSize: 13, color: 'var(--text)' },
  histReason: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' },
  histChange: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, fontSize: 20, flexShrink: 0 },
  histNotes: { fontSize: 12, color: 'var(--text-muted)', margin: '4px 0', paddingLeft: 28 },
  histDate: { fontSize: 11, color: 'var(--text-muted)', paddingLeft: 28, marginTop: 4 },
};
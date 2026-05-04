import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const REASONS = ['damaged', 'wastage', 'theft', 'stocktake', 'promotional'];

export default function AdjustmentsPage() {
  const { profile } = useAuth();
  const [salonId, setSalonId] = useState(null);
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ product: '', quantity_change: '', reason: 'damaged', notes: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/salons/').then(r => {
      const owned = r.data.find(s => s.owner === profile?.id);
      if (owned) init(owned.id);
    }).catch(() => {
      api.get('/salons/').then(r => {
        const owned = r.data.find(s => s.owner === profile?.id);
        if (owned) init(owned.id);
      }).catch(() => {});
    });
  }, []);

  const init = id => {
    setSalonId(id);
    api.get(`/salons/${id}/adjustments/`).then(r => setAdjustments(r.data)).catch(() => {});
    api.get(`/salons/${id}/products/`).then(r => setProducts(r.data)).catch(() => {});
  };

  const f = k => e => setForm({ ...form, [k]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/salons/${salonId}/adjustments/`, { ...form, product: Number(form.product), quantity_change: Number(form.quantity_change) });
      api.get(`/salons/${salonId}/adjustments/`).then(r => setAdjustments(r.data));
      setForm({ product: '', quantity_change: '', reason: 'damaged', notes: '' });
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Error');
    }
  };

  return (
    <div style={s.wrap}>
      <h2>Stock Adjustments</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={submit} style={s.form}>
        <select style={s.input} value={form.product} onChange={f('product')} required>
          <option value="">— Select Product —</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.current_stock})</option>)}
        </select>
        <input style={s.input} type="number" placeholder="Quantity Change (negative to deduct)" value={form.quantity_change} onChange={f('quantity_change')} required />
        <select style={s.input} value={form.reason} onChange={f('reason')}>
          {REASONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <textarea style={s.input} rows={2} placeholder="Notes (optional)" value={form.notes} onChange={f('notes')} />
        <button style={s.btn} type="submit">Submit Adjustment</button>
      </form>

      <h4>History</h4>
      {adjustments.map(a => (
        <div key={a.id} style={s.card}>
          <p><strong>{a.product_name}</strong> — {a.quantity_change > 0 ? '+' : ''}{a.quantity_change} ({a.reason})</p>
          {a.notes && <p style={{ color: '#666' }}>{a.notes}</p>}
          <small>{new Date(a.adjusted_at).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}

const s = {
  wrap: { maxWidth: 700, margin: '40px auto', padding: 24 },
  form: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 },
  input: { padding: '8px 12px', fontSize: 14, border: '1px solid #ccc', borderRadius: 4 },
  btn: { padding: '8px 16px', background: '#2c3e50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', alignSelf: 'flex-start' },
  card: { border: '1px solid #ddd', borderRadius: 8, padding: 14, marginBottom: 10 },
};

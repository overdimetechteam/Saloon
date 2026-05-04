import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function GRNPage() {
  const { profile } = useAuth();
  const [salonId, setSalonId] = useState(null);
  const [grns, setGrns] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplier, setSupplier] = useState('');
  const [items, setItems] = useState([{ product: '', quantity_received: 1, unit_cost: '' }]);
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
    api.get(`/salons/${id}/grn/`).then(r => setGrns(r.data)).catch(() => {});
    api.get(`/salons/${id}/products/`).then(r => setProducts(r.data)).catch(() => {});
  };

  const setItem = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const addItem = () => setItems(prev => [...prev, { product: '', quantity_received: 1, unit_cost: '' }]);
  const removeItem = i => setItems(prev => prev.filter((_, idx) => idx !== i));

  const submit = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/salons/${salonId}/grn/`, {
        supplier_name: supplier,
        items: items.map(it => ({ product: Number(it.product), quantity_received: Number(it.quantity_received), unit_cost: it.unit_cost })),
      });
      api.get(`/salons/${salonId}/grn/`).then(r => setGrns(r.data));
      setSupplier('');
      setItems([{ product: '', quantity_received: 1, unit_cost: '' }]);
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Error');
    }
  };

  const confirm = async id => {
    try {
      await api.post(`/salons/${salonId}/grn/${id}/confirm/`);
      api.get(`/salons/${salonId}/grn/`).then(r => setGrns(r.data));
    } catch (err) {
      setError(err.response?.data?.detail || 'Error');
    }
  };

  return (
    <div style={s.wrap}>
      <h2>Goods Received Notes (GRN)</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h4>Create New GRN</h4>
      <form onSubmit={submit} style={s.form}>
        <input style={s.input} placeholder="Supplier Name" value={supplier} onChange={e => setSupplier(e.target.value)} required />
        {items.map((it, i) => (
          <div key={i} style={s.itemRow}>
            <select style={s.input} value={it.product} onChange={e => setItem(i, 'product', e.target.value)} required>
              <option value="">— Product —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input style={{ ...s.input, flex: '0 0 80px' }} type="number" min={1} value={it.quantity_received} onChange={e => setItem(i, 'quantity_received', e.target.value)} required />
            <input style={{ ...s.input, flex: '0 0 100px' }} type="number" step="0.01" placeholder="Unit Cost" value={it.unit_cost} onChange={e => setItem(i, 'unit_cost', e.target.value)} required />
            {items.length > 1 && <button type="button" onClick={() => removeItem(i)} style={s.rmBtn}>✕</button>}
          </div>
        ))}
        <button type="button" style={s.addBtn} onClick={addItem}>+ Add Item</button>
        <button type="submit" style={s.btn}>Create GRN</button>
      </form>

      <h4>GRN History</h4>
      {grns.map(grn => (
        <div key={grn.id} style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{grn.reference_number}</strong>
            <span style={{ ...s.badge, background: grn.status === 'confirmed' ? '#27ae60' : '#f39c12' }}>{grn.status}</span>
          </div>
          <p>Supplier: {grn.supplier_name} | {new Date(grn.created_at).toLocaleDateString()}</p>
          {grn.items?.map(it => <p key={it.id} style={{ margin: 0 }}>— {it.product_name} x{it.quantity_received} @ LKR {it.unit_cost}</p>)}
          {grn.status === 'draft' && <button style={s.btn} onClick={() => confirm(grn.id)}>Confirm GRN</button>}
        </div>
      ))}
    </div>
  );
}

const s = {
  wrap: { maxWidth: 800, margin: '40px auto', padding: 24 },
  form: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 },
  input: { padding: '8px 12px', fontSize: 14, border: '1px solid #ccc', borderRadius: 4, flex: 1 },
  itemRow: { display: 'flex', gap: 8, alignItems: 'center' },
  btn: { padding: '8px 16px', background: '#2c3e50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', alignSelf: 'flex-start', marginTop: 4 },
  addBtn: { padding: '6px 12px', background: '#3498db', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', alignSelf: 'flex-start' },
  rmBtn: { padding: '6px 10px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  card: { border: '1px solid #ddd', borderRadius: 8, padding: 14, marginBottom: 12 },
  badge: { color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12, height: 'fit-content' },
};

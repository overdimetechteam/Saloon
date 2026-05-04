import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function SalesPage() {
  const { profile } = useAuth();
  const [salonId, setSalonId] = useState(null);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ product: '', quantity: 1, unit_price: '' }]);
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
    api.get(`/salons/${id}/sales/`).then(r => setSales(r.data)).catch(() => {});
    api.get(`/salons/${id}/products/`).then(r => setProducts(r.data)).catch(() => {});
  };

  const setItem = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const addItem = () => setItems(prev => [...prev, { product: '', quantity: 1, unit_price: '' }]);

  const autoPrice = (i, productId) => {
    const p = products.find(p => p.id === Number(productId));
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, product: productId, unit_price: p ? p.selling_price : '' } : it));
  };

  const submit = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/salons/${salonId}/sales/`, {
        items: items.map(it => ({ product: Number(it.product), quantity: Number(it.quantity), unit_price: it.unit_price })),
      });
      api.get(`/salons/${salonId}/sales/`).then(r => setSales(r.data));
      setItems([{ product: '', quantity: 1, unit_price: '' }]);
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Error');
    }
  };

  return (
    <div style={s.wrap}>
      <h2>Record Sale</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={submit} style={s.form}>
        {items.map((it, i) => (
          <div key={i} style={s.itemRow}>
            <select style={s.input} value={it.product} onChange={e => autoPrice(i, e.target.value)} required>
              <option value="">— Product —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.current_stock})</option>)}
            </select>
            <input style={{ ...s.input, flex: '0 0 80px' }} type="number" min={1} value={it.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} required />
            <input style={{ ...s.input, flex: '0 0 110px' }} type="number" step="0.01" placeholder="Price" value={it.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)} required />
          </div>
        ))}
        <button type="button" style={s.addBtn} onClick={addItem}>+ Add Item</button>
        <button type="submit" style={s.btn}>Record Sale</button>
      </form>

      <h4>Sale History</h4>
      {sales.map(sale => (
        <div key={sale.id} style={s.card}>
          <p><strong>Sale #{sale.id}</strong> — {new Date(sale.created_at).toLocaleString()}</p>
          {sale.items?.map(it => <p key={it.id} style={{ margin: 0 }}>— {it.product_name} x{it.quantity} @ LKR {it.unit_price}</p>)}
        </div>
      ))}
    </div>
  );
}

const s = {
  wrap: { maxWidth: 800, margin: '40px auto', padding: 24 },
  form: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 },
  input: { padding: '8px 12px', fontSize: 14, border: '1px solid #ccc', borderRadius: 4, flex: 1 },
  itemRow: { display: 'flex', gap: 8 },
  btn: { padding: '8px 16px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', alignSelf: 'flex-start' },
  addBtn: { padding: '6px 12px', background: '#3498db', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', alignSelf: 'flex-start' },
  card: { border: '1px solid #ddd', borderRadius: 8, padding: 14, marginBottom: 10 },
};

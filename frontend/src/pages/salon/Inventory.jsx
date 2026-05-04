import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Hair Care', 'Skin Care', 'Nail Care', 'Other'];

export default function Inventory() {
  const { profile } = useAuth();
  const [salonId, setSalonId] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', brand: '', category: 'Hair Care', unit_of_measure: '', cost_price: '', selling_price: '', reorder_level: 0 });
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get('/admin/salons/').then(r => {
      const owned = r.data.find(s => s.owner === profile?.id);
      if (owned) { setSalonId(owned.id); loadProducts(owned.id); }
    }).catch(() => {
      api.get('/salons/').then(r => {
        const owned = r.data.find(s => s.owner === profile?.id);
        if (owned) { setSalonId(owned.id); loadProducts(owned.id); }
      }).catch(() => {});
    });
  }, []);

  const loadProducts = id => api.get(`/salons/${id}/products/`).then(r => setProducts(r.data)).catch(() => {});

  const f = k => e => setForm({ ...form, [k]: e.target.value });

  const save = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/salons/${salonId}/products/`, form);
      loadProducts(salonId);
      setShowForm(false);
      setForm({ name: '', brand: '', category: 'Hair Care', unit_of_measure: '', cost_price: '', selling_price: '', reorder_level: 0 });
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Error');
    }
  };

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Inventory</h2>
        <button style={s.btn} onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Product'}</button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {showForm && (
        <form onSubmit={save} style={s.form}>
          <input style={s.input} placeholder="Product Name" value={form.name} onChange={f('name')} required />
          <input style={s.input} placeholder="Brand" value={form.brand} onChange={f('brand')} />
          <select style={s.input} value={form.category} onChange={f('category')}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input style={s.input} placeholder="Unit (e.g. ml, pcs)" value={form.unit_of_measure} onChange={f('unit_of_measure')} required />
          <input style={s.input} type="number" step="0.01" placeholder="Cost Price" value={form.cost_price} onChange={f('cost_price')} required />
          <input style={s.input} type="number" step="0.01" placeholder="Selling Price" value={form.selling_price} onChange={f('selling_price')} required />
          <input style={s.input} type="number" placeholder="Reorder Level" value={form.reorder_level} onChange={f('reorder_level')} />
          <button style={s.btn} type="submit">Save Product</button>
        </form>
      )}
      <table style={s.table}>
        <thead><tr>{['Name','Brand','Category','Stock','Reorder','Cost','Price'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} style={p.current_stock <= p.reorder_level ? { background: '#fff5f5' } : {}}>
              <td style={s.td}>{p.name}</td>
              <td style={s.td}>{p.brand}</td>
              <td style={s.td}>{p.category}</td>
              <td style={s.td}>{p.current_stock} {p.unit_of_measure}</td>
              <td style={s.td}>{p.reorder_level}</td>
              <td style={s.td}>LKR {p.cost_price}</td>
              <td style={s.td}>LKR {p.selling_price}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 && <p>No products yet.</p>}
    </div>
  );
}

const s = {
  wrap: { maxWidth: 900, margin: '40px auto', padding: 24 },
  form: { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, padding: 16, border: '1px solid #ddd', borderRadius: 8 },
  input: { padding: '8px 12px', fontSize: 14, border: '1px solid #ccc', borderRadius: 4, flex: '1 1 200px' },
  btn: { padding: '8px 16px', background: '#2c3e50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 16 },
  th: { background: '#f4f4f4', padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #ddd' },
  td: { padding: '8px 12px', borderBottom: '1px solid #eee' },
};

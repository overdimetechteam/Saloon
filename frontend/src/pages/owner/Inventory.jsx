import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { c, shadow } from '../../styles/theme';

const CATS = ['Hair Care', 'Skin Care', 'Nail Care', 'Other'];
const CAT_COLORS = { 'Hair Care': '#8B5CF6', 'Skin Care': '#10B981', 'Nail Care': '#EC4899', 'Other': '#6B7280' };

export default function OwnerInventory() {
  const { salon } = useOwner();
  const [products, setProducts] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', brand: '', category: 'Hair Care', unit_of_measure: '', cost_price: '', selling_price: '', reorder_level: 0 });
  const [error, setError] = useState('');

  const load = () => salon && api.get(`/salons/${salon.id}/products/`).then(r => setProducts(r.data)).catch(() => {});
  useEffect(() => { load(); }, [salon]);

  const f = k => e => setForm({ ...form, [k]: e.target.value });

  const save = async e => {
    e.preventDefault(); setError('');
    try {
      await api.post(`/salons/${salon.id}/products/`, form);
      load(); setShow(false);
      setForm({ name: '', brand: '', category: 'Hair Care', unit_of_measure: '', cost_price: '', selling_price: '', reorder_level: 0 });
    } catch (err) { setError(JSON.stringify(err.response?.data) || 'Error'); }
  };

  const lowStock = products.filter(p => p.current_stock <= p.reorder_level);

  return (
    <div>
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.title}>Inventory</h2>
          {lowStock.length > 0 && <p style={s.lowWarn}>⚠️ {lowStock.length} product{lowStock.length > 1 ? 's' : ''} below reorder level</p>}
        </div>
        <div style={s.headerBtns}>
          <Link to="/owner/inventory/grn" style={s.outlineBtn}>+ Receive Stock</Link>
          <Link to="/owner/inventory/sales" style={s.outlineBtn}>Record Sale</Link>
          <button style={s.primaryBtn} onClick={() => setShow(!show)}>{show ? 'Cancel' : '+ New Product'}</button>
        </div>
      </div>

      {show && (
        <div style={s.formCard}>
          <h4 style={s.formTitle}>Add New Product</h4>
          {error && <div style={s.alert}>{error}</div>}
          <form onSubmit={save} style={s.form}>
            <div style={s.formRow}>
              <div style={s.formCol}>
                <label style={s.label}>Product Name *</label>
                <input style={s.input} value={form.name} onChange={f('name')} required />
              </div>
              <div style={s.formCol}>
                <label style={s.label}>Brand</label>
                <input style={s.input} value={form.brand} onChange={f('brand')} />
              </div>
              <div style={s.formCol}>
                <label style={s.label}>Category</label>
                <select style={s.input} value={form.category} onChange={f('category')}>
                  {CATS.map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </div>
              <div style={s.formCol}>
                <label style={s.label}>Unit</label>
                <input style={s.input} placeholder="ml, pcs, kg…" value={form.unit_of_measure} onChange={f('unit_of_measure')} required />
              </div>
              <div style={s.formCol}>
                <label style={s.label}>Cost Price</label>
                <input style={s.input} type="number" step="0.01" value={form.cost_price} onChange={f('cost_price')} required />
              </div>
              <div style={s.formCol}>
                <label style={s.label}>Selling Price</label>
                <input style={s.input} type="number" step="0.01" value={form.selling_price} onChange={f('selling_price')} required />
              </div>
              <div style={s.formCol}>
                <label style={s.label}>Reorder Level</label>
                <input style={s.input} type="number" value={form.reorder_level} onChange={f('reorder_level')} />
              </div>
            </div>
            <button style={s.saveBtn} type="submit">Save Product</button>
          </form>
        </div>
      )}

      <div style={s.tableCard}>
        <table style={s.table}>
          <thead>
            <tr>{['Product','Category','Stock','Reorder','Cost','Price'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {products.map(p => {
              const isLow = p.current_stock <= p.reorder_level;
              return (
                <tr key={p.id} style={isLow ? { background: c.errorBg } : {}}>
                  <td style={s.td}>
                    <div style={s.productName}>{p.name}</div>
                    {p.brand && <div style={s.productBrand}>{p.brand}</div>}
                  </td>
                  <td style={s.td}><span style={{ ...s.catTag, color: CAT_COLORS[p.category] || c.primary, background: (CAT_COLORS[p.category] || c.primary) + '18' }}>{p.category}</span></td>
                  <td style={s.td}>
                    <span style={{ fontWeight: 700, color: isLow ? c.error : c.success }}>{p.current_stock}</span>
                    <span style={{ color: c.textMuted, fontSize: 12 }}> {p.unit_of_measure}</span>
                    {isLow && <div style={{ fontSize: 10, color: c.error, fontWeight: 600, marginTop: 2 }}>LOW STOCK</div>}
                  </td>
                  <td style={s.td}>{p.reorder_level}</td>
                  <td style={s.td}>LKR {p.cost_price}</td>
                  <td style={s.td}><span style={{ fontWeight: 700, color: c.primary }}>LKR {p.selling_price}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && <div style={s.empty}>No products added yet. Click "+ New Product" to get started.</div>}
      </div>
    </div>
  );
}

const s = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 14 },
  title: { fontSize: 26, fontWeight: 700, color: c.text, margin: 0, marginBottom: 4 },
  lowWarn: { color: c.error, fontSize: 13, fontWeight: 500, margin: 0 },
  headerBtns: { display: 'flex', gap: 10 },
  outlineBtn: { padding: '9px 18px', border: `1px solid ${c.border}`, borderRadius: 8, textDecoration: 'none', color: c.text, fontSize: 13, fontWeight: 500 },
  primaryBtn: { padding: '9px 20px', background: c.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  formCard: { background: c.surface, borderRadius: 14, padding: 24, border: `1px solid ${c.border}`, boxShadow: shadow.sm, marginBottom: 24 },
  formTitle: { fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 16 },
  alert: { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.error, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 },
  form: {},
  formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 },
  formCol: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: 12, fontWeight: 600, color: c.textSub, marginBottom: 5 },
  input: { padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13 },
  saveBtn: { padding: '10px 24px', background: c.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  tableCard: { background: c.surface, borderRadius: 14, border: `1px solid ${c.border}`, boxShadow: shadow.sm, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', background: c.bg, borderBottom: `2px solid ${c.border}` },
  td: { padding: '14px 16px', borderBottom: `1px solid ${c.border}`, verticalAlign: 'top' },
  productName: { fontWeight: 600, fontSize: 14, color: c.text },
  productBrand: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  catTag: { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  empty: { padding: '50px', textAlign: 'center', color: c.textMuted, fontSize: 14 },
};

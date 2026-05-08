import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';

const CATS = ['Hair Care', 'Skin Care', 'Nail Care', 'Other'];
const CAT_COLORS = { 'Hair Care': '#8B5CF6', 'Skin Care': '#10B981', 'Nail Care': '#0D9488', 'Other': '#6B7280' };

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
      <div style={s.pageHeader} className="fade-up">
        <div>
          <div style={s.eyebrow}>Stock</div>
          <h2 style={s.title}>Inventory</h2>
          {lowStock.length > 0 && (
            <p style={s.lowWarn}>⚠ {lowStock.length} product{lowStock.length > 1 ? 's' : ''} below reorder level</p>
          )}
        </div>
        <div style={s.headerBtns}>
          <Link to="/owner/inventory/grn" style={s.outlineBtn}>+ Receive Stock</Link>
          <Link to="/owner/inventory/sales" style={s.outlineBtn}>Record Sale</Link>
          <button style={s.primaryBtn} onClick={() => setShow(!show)}>{show ? '✕ Cancel' : '+ New Product'}</button>
        </div>
      </div>

      {show && (
        <div style={s.formCard} className="fade-up">
          <div style={s.formTitle}>Add New Product</div>
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
            <button style={s.saveBtn} type="submit">✓ Save Product</button>
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
              const catColor = CAT_COLORS[p.category] || '#7C3AED';
              return (
                <tr key={p.id} style={isLow ? { background: 'rgba(220,38,38,.04)' } : {}}>
                  <td style={s.td}>
                    <div style={s.productName}>{p.name}</div>
                    {p.brand && <div style={s.productBrand}>{p.brand}</div>}
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.catTag, color: catColor, background: catColor + '18', border: `1px solid ${catColor}30` }}>{p.category}</span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontWeight: 700, color: isLow ? '#DC2626' : '#059669' }}>{p.current_stock}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> {p.unit_of_measure}</span>
                    {isLow && <div style={{ fontSize: 10, color: '#DC2626', fontWeight: 700, marginTop: 2, letterSpacing: '0.04em' }}>LOW STOCK</div>}
                  </td>
                  <td style={s.td}>{p.reorder_level}</td>
                  <td style={s.td}>LKR {p.cost_price}</td>
                  <td style={s.td}><span style={{ fontWeight: 700, color: '#7C3AED' }}>LKR {p.selling_price}</span></td>
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
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26, flexWrap: 'wrap', gap: 14 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' },
  lowWarn: { color: '#DC2626', fontSize: 13, fontWeight: 600, margin: 0 },
  headerBtns: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  outlineBtn: {
    padding: '10px 18px', border: '1.5px solid var(--border)', borderRadius: 11,
    textDecoration: 'none', color: 'var(--text)', fontSize: 13, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
  },
  primaryBtn: {
    padding: '10px 22px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer',
    fontWeight: 700, fontSize: 13, boxShadow: '0 6px 18px rgba(124,58,237,.35)',
    fontFamily: "'DM Sans', sans-serif",
  },
  formCard: {
    background: 'var(--surface)', borderRadius: 20, padding: 26,
    border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(124,58,237,.08)',
    marginBottom: 24,
  },
  formTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.01em',
  },
  alert: {
    background: '#FEF2F2', border: '1px solid #FCA5A5',
    color: '#DC2626', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16,
  },
  form: {},
  formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 18 },
  formCol: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  input: {
    padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 13, color: 'var(--text)', background: 'var(--input-bg)',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
    width: '100%', boxSizing: 'border-box',
  },
  saveBtn: {
    padding: '11px 28px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer',
    fontWeight: 700, fontSize: 13, boxShadow: '0 4px 14px rgba(124,58,237,.35)',
    fontFamily: "'DM Sans', sans-serif",
  },
  tableCard: {
    background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(124,58,237,.06)', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
    background: 'var(--surface2)', borderBottom: '2px solid var(--border)',
  },
  td: { padding: '14px 16px', borderBottom: '1px solid var(--border)', verticalAlign: 'top' },
  productName: { fontWeight: 600, fontSize: 14, color: 'var(--text)' },
  productBrand: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  catTag: { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  empty: { padding: '50px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 },
};
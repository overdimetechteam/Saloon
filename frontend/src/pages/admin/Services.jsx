import { useState, useEffect } from 'react';
import api from '../../api/axios';

const CATEGORIES = ['Hair', 'Nails', 'Skin', 'Makeup'];

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: '', category: 'Hair', description: '', default_duration_minutes: 60, default_price: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get('/services/').then(r => setServices(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const f = k => e => setForm({ ...form, [k]: e.target.value });

  const save = async e => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/services/${editing}/`, form);
      } else {
        await api.post('/services/', form);
      }
      load();
      setForm({ name: '', category: 'Hair', description: '', default_duration_minutes: 60, default_price: '' });
      setEditing(null);
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Error');
    }
  };

  const del = async id => {
    if (!confirm('Delete this service?')) return;
    await api.delete(`/services/${id}/`);
    load();
  };

  const edit = svc => {
    setEditing(svc.id);
    setForm({ name: svc.name, category: svc.category, description: svc.description, default_duration_minutes: svc.default_duration_minutes, default_price: svc.default_price });
  };

  return (
    <div style={s.wrap}>
      <h2>Global Service Catalogue</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={save} style={s.form}>
        <input style={s.input} placeholder="Service Name" value={form.name} onChange={f('name')} required />
        <select style={s.input} value={form.category} onChange={f('category')}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <textarea style={s.input} placeholder="Description" rows={2} value={form.description} onChange={f('description')} />
        <input style={s.input} type="number" placeholder="Duration (min)" value={form.default_duration_minutes} onChange={f('default_duration_minutes')} required />
        <input style={s.input} type="number" step="0.01" placeholder="Default Price" value={form.default_price} onChange={f('default_price')} required />
        <button style={s.btn} type="submit">{editing ? 'Update' : 'Create'} Service</button>
        {editing && <button type="button" style={s.cancelBtn} onClick={() => { setEditing(null); setForm({ name: '', category: 'Hair', description: '', default_duration_minutes: 60, default_price: '' }); }}>Cancel Edit</button>}
      </form>
      <table style={s.table}>
        <thead><tr>{['Name','Category','Duration','Price','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
        <tbody>
          {services.map(sv => (
            <tr key={sv.id}>
              <td style={s.td}>{sv.name}</td>
              <td style={s.td}>{sv.category}</td>
              <td style={s.td}>{sv.default_duration_minutes}min</td>
              <td style={s.td}>LKR {sv.default_price}</td>
              <td style={s.td}>
                <button style={s.editBtn} onClick={() => edit(sv)}>Edit</button>
                <button style={s.delBtn} onClick={() => del(sv.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const s = {
  wrap: { maxWidth: 800, margin: '40px auto', padding: 24 },
  form: { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 },
  input: { padding: '8px 12px', fontSize: 14, border: '1px solid #ccc', borderRadius: 4, flex: '1 1 200px' },
  btn: { padding: '8px 16px', background: '#2c3e50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  cancelBtn: { padding: '8px 16px', background: '#95a5a6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f4f4f4', padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #ddd' },
  td: { padding: '8px 12px', borderBottom: '1px solid #eee' },
  editBtn: { marginRight: 6, padding: '4px 10px', background: '#3498db', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  delBtn: { padding: '4px 10px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
};

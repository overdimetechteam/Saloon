import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { c, shadow } from '../../styles/theme';

const CATEGORIES = ['Hair', 'Nails', 'Skin', 'Makeup'];
const CAT_COLORS = { Hair: '#8B5CF6', Nails: '#EC4899', Skin: '#10B981', Makeup: '#F59E0B' };
const EMPTY_FORM = { name: '', category: 'Hair', description: '', default_duration_minutes: 60, default_price: '' };

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = () => api.get('/services/').then(r => setServices(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const f = k => e => setForm({ ...form, [k]: e.target.value });

  const save = async e => {
    e.preventDefault(); setError('');
    try {
      if (editing) {
        await api.put(`/services/${editing}/`, form);
        setMsg('Service updated.');
      } else {
        await api.post('/services/', form);
        setMsg('Service created.');
      }
      load(); setForm(EMPTY_FORM); setEditing(null); setShowForm(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setError(JSON.stringify(err.response?.data) || 'Error'); }
  };

  const del = async id => {
    if (!confirm('Delete this service? It will be removed from all salons.')) return;
    try { await api.delete(`/services/${id}/`); load(); } catch { setError('Cannot delete.'); }
  };

  const edit = svc => {
    setEditing(svc.id);
    setForm({ name: svc.name, category: svc.category, description: svc.description || '', default_duration_minutes: svc.default_duration_minutes, default_price: svc.default_price });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(false); setError(''); };

  const grouped = services.reduce((acc, sv) => {
    const cat = sv.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(sv); return acc;
  }, {});

  return (
    <div>
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.title}>Global Service Catalogue</h2>
          <p style={s.sub}>Manage services available for salons to offer</p>
        </div>
        {!showForm && (
          <button style={s.primaryBtn} onClick={() => setShowForm(true)}>+ New Service</button>
        )}
      </div>

      {msg   && <div style={s.success}>{msg}</div>}
      {error && <div style={s.alert}>{error}</div>}

      {showForm && (
        <div style={s.formCard}>
          <div style={s.formHead}>
            <h4 style={s.formTitle}>{editing ? 'Edit Service' : 'New Service'}</h4>
            <button style={s.cancelBtn} onClick={cancelEdit}>Cancel</button>
          </div>
          <form onSubmit={save}>
            <div style={s.formGrid}>
              <div style={s.formCol}>
                <label style={s.label}>Service Name *</label>
                <input style={s.input} value={form.name} onChange={f('name')} placeholder="e.g. Classic Haircut" required />
              </div>
              <div style={s.formCol}>
                <label style={s.label}>Category *</label>
                <select style={s.input} value={form.category} onChange={f('category')}>
                  {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </div>
              <div style={s.formCol}>
                <label style={s.label}>Duration (minutes) *</label>
                <input style={s.input} type="number" min={5} step={5} value={form.default_duration_minutes} onChange={f('default_duration_minutes')} required />
              </div>
              <div style={s.formCol}>
                <label style={s.label}>Default Price (LKR) *</label>
                <input style={s.input} type="number" step="0.01" placeholder="0.00" value={form.default_price} onChange={f('default_price')} required />
              </div>
              <div style={{ ...s.formCol, gridColumn: '1 / -1' }}>
                <label style={s.label}>Description</label>
                <textarea style={{ ...s.input, resize: 'vertical' }} rows={2} placeholder="Brief description…" value={form.description} onChange={f('description')} />
              </div>
            </div>
            <button style={s.saveBtn} type="submit">{editing ? 'Update Service' : 'Create Service'}</button>
          </form>
        </div>
      )}

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} style={s.catSection}>
          <div style={s.catHeader}>
            <span style={{ ...s.catBadge, color: CAT_COLORS[cat] || c.primary, background: (CAT_COLORS[cat] || c.primary) + '18' }}>{cat}</span>
            <span style={s.catCount}>{items.length} service{items.length > 1 ? 's' : ''}</span>
          </div>
          <div style={s.grid}>
            {items.map(sv => (
              <div key={sv.id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={s.svcName}>{sv.name}</div>
                  <div style={s.cardActions}>
                    <button style={s.editBtn} onClick={() => edit(sv)}>Edit</button>
                    <button style={s.delBtn} onClick={() => del(sv.id)}>Delete</button>
                  </div>
                </div>
                {sv.description && <p style={s.desc}>{sv.description}</p>}
                <div style={s.meta}>
                  <span style={s.metaItem}>⏱ {sv.default_duration_minutes} min</span>
                  <span style={s.price}>LKR {sv.default_price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {services.length === 0 && !showForm && (
        <div style={s.empty}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✂️</div>
          <p>No services yet. Create the first one above.</p>
        </div>
      )}
    </div>
  );
}

const s = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 14 },
  title: { fontSize: 26, fontWeight: 700, color: c.text, margin: 0, marginBottom: 4 },
  sub: { color: c.textMuted, fontSize: 14, margin: 0 },
  primaryBtn: { padding: '10px 22px', background: c.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  success: { background: c.successBg, border: `1px solid ${c.successBorder}`, color: c.success, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  alert: { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.error, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  formCard: { background: c.surface, borderRadius: 14, padding: 24, border: `1px solid ${c.border}`, boxShadow: shadow.sm, marginBottom: 28 },
  formHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  formTitle: { fontSize: 16, fontWeight: 700, color: c.text, margin: 0 },
  cancelBtn: { padding: '6px 14px', background: c.bg, color: c.textSub, border: `1px solid ${c.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 16 },
  formCol: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: 12, fontWeight: 600, color: c.textSub, marginBottom: 6 },
  input: { padding: '10px 12px', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  saveBtn: { padding: '11px 28px', background: c.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  catSection: { marginBottom: 28 },
  catHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  catBadge: { padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 },
  catCount: { fontSize: 12, color: c.textMuted },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 },
  card: { background: c.surface, borderRadius: 12, padding: 18, boxShadow: shadow.sm, border: `1px solid ${c.border}` },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  svcName: { fontWeight: 700, fontSize: 15, color: c.text, lineHeight: 1.3 },
  cardActions: { display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 },
  editBtn: { padding: '4px 10px', background: c.infoBg, color: c.info, border: `1px solid ${c.infoBorder}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  delBtn: { padding: '4px 10px', background: c.errorBg, color: c.error, border: `1px solid ${c.errorBorder}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  desc: { fontSize: 12, color: c.textMuted, margin: '0 0 10px', lineHeight: 1.5 },
  meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: `1px solid ${c.border}` },
  metaItem: { fontSize: 12, color: c.textMuted },
  price: { fontWeight: 700, fontSize: 16, color: c.primary },
  empty: { textAlign: 'center', padding: '60px 40px', background: c.surface, borderRadius: 14, border: `1px solid ${c.border}`, color: c.textMuted },
};

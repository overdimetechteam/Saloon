import { useState, useEffect } from 'react';
import api from '../../api/axios';

const CATEGORIES = ['Hair', 'Nails', 'Skin', 'Makeup'];
const CAT_COLORS = { Hair: '#0D9488', Nails: '#D4AF37', Skin: '#0B7A70', Makeup: '#C96B51' };
const EMPTY_FORM = { name: '', category: 'Hair', description: '', default_duration_minutes: 60, default_price: '' };

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

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

  const filteredServices = services.filter(sv => {
    const matchSearch = !search.trim() || sv.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchCat = catFilter === 'all' || sv.category === catFilter;
    return matchSearch && matchCat;
  });

  const grouped = filteredServices.reduce((acc, sv) => {
    const cat = sv.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(sv); return acc;
  }, {});

  return (
    <div>
      <div style={s.pageHeader} className="fade-up">
        <div>
          <div style={s.eyebrow}>Global Catalogue</div>
          <h2 style={s.title}>Services</h2>
          <p style={s.sub}>Manage services available for salons to offer</p>
        </div>
        {!showForm && (
          <button style={s.primaryBtn} onClick={() => setShowForm(true)}>+ New Service</button>
        )}
      </div>

      {msg   && <div style={s.alertOk}>{msg}</div>}
      {error && <div style={s.alertErr}>{error}</div>}

      {/* Search + category filter */}
      {!showForm && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 11, boxShadow: '0 2px 6px rgba(0,0,0,.04)' }}>
            <span style={{ color: '#0D9488', fontSize: 13 }}>✦</span>
            <input
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}
              placeholder="Search services by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }} onClick={() => setSearch('')}>✕</button>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', ...CATEGORIES].map(cat => {
              const color = cat === 'all' ? '#0D9488' : (CAT_COLORS[cat] || '#0D9488');
              const active = catFilter === cat;
              return (
                <button key={cat} onClick={() => setCatFilter(cat)} style={{ padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: `1px solid ${active ? color + '60' : 'var(--border)'}`, background: active ? color + '14' : 'var(--surface)', color: active ? color : 'var(--text-muted)', transition: 'all .15s ease' }}>
                  {cat === 'all' ? 'All' : cat}
                </button>
              );
            })}
          </div>
          {(search || catFilter !== 'all') && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filteredServices.length} result{filteredServices.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}

      {showForm && (
        <div style={s.formCard} className="fade-up">
          <div style={s.formHead}>
            <div style={s.formTitle}>{editing ? 'Edit Service' : 'New Service'}</div>
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
            <button style={s.saveBtn} type="submit">
              {editing ? '✓ Update Service' : '✓ Create Service'}
            </button>
          </form>
        </div>
      )}

      {Object.entries(grouped).map(([cat, items]) => {
        const color = CAT_COLORS[cat] || '#0D9488';
        return (
          <div key={cat} style={s.catSection}>
            <div style={s.catHeader}>
              <span style={{ ...s.catBadge, color, background: color + '14', border: `1px solid ${color}30` }}>{cat}</span>
              <span style={s.catCount}>{items.length} service{items.length > 1 ? 's' : ''}</span>
            </div>
            <div style={s.grid}>
              {items.map(sv => (
                <div key={sv.id} style={s.card} className="fade-up">
                  <div style={{ ...s.cardAccent, background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
                  <div style={s.cardBody}>
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
                      <span style={{ ...s.price, color }}>LKR {sv.default_price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {!showForm && filteredServices.length === 0 && (
        <div style={s.empty} className="scale-in">
          <div style={s.emptyOrb}>{services.length === 0 ? '✂' : '🔍'}</div>
          <h3 style={s.emptyTitle}>{services.length === 0 ? 'No services yet' : 'No results found'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            {services.length === 0 ? 'Create the global service catalogue above.' : 'Try a different search term or category.'}
          </p>
        </div>
      )}
    </div>
  );
}

const s = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26, flexWrap: 'wrap', gap: 14 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' },
  sub: { color: 'var(--text-muted)', fontSize: 13, margin: 0 },
  primaryBtn: {
    padding: '11px 22px',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer',
    fontWeight: 700, fontSize: 13, boxShadow: '0 6px 18px rgba(13,148,136,.35)',
    fontFamily: "'DM Sans', sans-serif",
  },
  alertOk: { background: '#F0FDFA', border: '1px solid #99F6E4', color: '#0D9488', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  alertErr: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  formCard: {
    background: 'var(--surface)', borderRadius: 20, padding: 26,
    border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(13,148,136,.08)',
    marginBottom: 28,
  },
  formHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  formTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' },
  cancelBtn: {
    padding: '7px 16px', background: 'var(--surface2)', color: 'var(--text-muted)',
    border: '1px solid var(--border)', borderRadius: 9, cursor: 'pointer',
    fontSize: 13, fontFamily: "'DM Sans', sans-serif",
  },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 18 },
  formCol: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  input: {
    padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 13, boxSizing: 'border-box', color: 'var(--text)', background: 'var(--input-bg)',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
  },
  saveBtn: {
    padding: '11px 28px',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer',
    fontWeight: 700, fontSize: 13, boxShadow: '0 4px 14px rgba(13,148,136,.35)',
    fontFamily: "'DM Sans', sans-serif",
  },
  catSection: { marginBottom: 30 },
  catHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  catBadge: { padding: '5px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700 },
  catCount: { fontSize: 12, color: 'var(--text-muted)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 },
  card: { background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(13,148,136,.06)' },
  cardAccent: { height: 3, width: '100%' },
  cardBody: { padding: '16px 18px' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  svcName: { fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.3 },
  cardActions: { display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 },
  editBtn: {
    padding: '4px 10px', background: 'rgba(13,148,136,.1)', color: '#0D9488',
    border: '1px solid rgba(13,148,136,.2)', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700,
  },
  delBtn: {
    padding: '4px 10px', background: '#FEF2F2', color: '#DC2626',
    border: '1px solid rgba(220,38,38,.25)', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700,
  },
  desc: { fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.5 },
  meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' },
  metaItem: { fontSize: 12, color: 'var(--text-muted)' },
  price: { fontWeight: 700, fontSize: 16 },
  empty: {
    background: 'var(--surface)', borderRadius: 22, padding: '64px 40px',
    textAlign: 'center', border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(13,148,136,.06)',
  },
  emptyOrb: { fontSize: 36, marginBottom: 16, display: 'block', color: 'var(--text-muted)' },
  emptyTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, color: 'var(--text)', marginBottom: 8 },
};
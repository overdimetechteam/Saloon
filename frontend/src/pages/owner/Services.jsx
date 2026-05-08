import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';

const CAT_COLORS = { Hair: '#8B5CF6', Nails: '#0D9488', Skin: '#10B981', Makeup: '#F59E0B', Other: '#2563EB' };
const CATEGORIES = ['Hair', 'Nails', 'Skin', 'Makeup'];

function EditModal({ ss, onSave, onClose }) {
  const [price, setPrice]       = useState(ss.custom_price ?? ss.effective_price ?? '');
  const [duration, setDuration] = useState(ss.custom_duration ?? ss.effective_duration ?? '');
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');

  const save = async () => {
    setLoading(true); setErr('');
    try {
      await onSave(ss.id, { custom_price: Number(price), custom_duration: Number(duration) });
      onClose();
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to save.');
    } finally { setLoading(false); }
  };

  return (
    <div style={m.overlay}>
      <div style={m.box} className="scale-in">
        <h3 style={m.title}>Edit — {ss.service_name}</h3>
        {err && <div style={m.err}>{err}</div>}
        <label style={m.label}>Custom Price (LKR)
          <input style={m.input} type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} />
        </label>
        <label style={m.label}>Custom Duration (min)
          <input style={m.input} type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} />
        </label>
        <div style={m.btnRow}>
          <button style={m.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={m.saveBtn} onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

export default function OwnerServices() {
  const { salon } = useOwner();
  const [attached, setAttached] = useState([]);
  const [all, setAll]           = useState([]);
  const [toAdd, setToAdd]       = useState('');
  const [error, setError]       = useState('');
  const [msg, setMsg]           = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Hair', price: '', duration: '' });
  const [creating, setCreating] = useState(false);

  const reload = () => {
    if (!salon) return;
    api.get(`/salons/${salon.id}/services/`).then(r => setAttached(r.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/services/').then(r => setAll(r.data)).catch(() => {});
    reload();
  }, [salon]);

  const attachedIds = new Set(attached.map(ss => ss.service));
  const available   = all.filter(s => !attachedIds.has(s.id));

  const flash = text => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const attach = async () => {
    if (!toAdd || !salon) return;
    setError('');
    try {
      await api.post(`/salons/${salon.id}/services/`, { service: Number(toAdd) });
      reload(); flash('Service attached!'); setToAdd('');
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error');
    }
  };

  const detach = async ssId => {
    try {
      await api.delete(`/salons/${salon.id}/services/${ssId}/`);
      setAttached(prev => prev.filter(ss => ss.id !== ssId));
      flash('Service removed.');
    } catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  const saveEdit = async (ssId, data) => {
    await api.patch(`/salons/${salon.id}/services/${ssId}/`, data);
    reload();
    flash('Service updated.');
  };

  const createCustom = async () => {
    if (!form.name || !form.price || !form.duration) return setError('All fields are required.');
    setCreating(true); setError('');
    try {
      await api.post(`/salons/${salon.id}/services/custom/`, {
        name: form.name, category: form.category,
        price: Number(form.price), duration: Number(form.duration),
      });
      reload();
      flash('Custom service created!');
      setForm({ name: '', category: 'Hair', price: '', duration: '' });
      setShowCreate(false);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create service.');
    } finally { setCreating(false); }
  };

  const grouped = attached.reduce((acc, ss) => {
    const cat = ss.service_category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ss);
    return acc;
  }, {});

  return (
    <div>
      {editTarget && (
        <EditModal
          ss={editTarget}
          onSave={saveEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      <div style={s.pageHeader} className="fade-up">
        <div>
          <div style={s.eyebrow}>Catalogue</div>
          <h2 style={s.title}>Services</h2>
        </div>
        <div style={s.headerRight}>
          <div style={s.addRow}>
            <select style={s.select} value={toAdd} onChange={e => setToAdd(e.target.value)}>
              <option value="">— Attach from catalogue —</option>
              {available.map(sv => <option key={sv.id} value={sv.id}>{sv.name} ({sv.category})</option>)}
            </select>
            <button style={{ ...s.addBtn, opacity: !toAdd ? 0.6 : 1 }} onClick={attach} disabled={!toAdd}>
              Attach
            </button>
          </div>
          <button style={s.createBtn} onClick={() => setShowCreate(o => !o)}>
            {showCreate ? '✕ Cancel' : '+ Create Custom'}
          </button>
        </div>
      </div>

      {/* Create custom service form */}
      {showCreate && (
        <div style={s.createCard} className="scale-in">
          <div style={s.createTitle}>Create a Custom Service</div>
          <div style={s.createGrid}>
            <label style={s.fLabel}>Service Name
              <input style={s.fInput} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Signature Hair Treatment" />
            </label>
            <label style={s.fLabel}>Category
              <select style={s.fInput} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label style={s.fLabel}>Price (LKR)
              <input style={s.fInput} type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" />
            </label>
            <label style={s.fLabel}>Duration (min)
              <input style={s.fInput} type="number" min="1" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="30" />
            </label>
          </div>
          <button style={{ ...s.addBtn, opacity: creating ? 0.7 : 1, marginTop: 6 }} onClick={createCustom} disabled={creating}>
            {creating ? 'Creating…' : '✦ Create Service'}
          </button>
        </div>
      )}

      {error && <div style={s.alertErr}>{error}</div>}
      {msg   && <div style={s.alertOk}>{msg}</div>}

      {attached.length === 0 && (
        <div style={s.empty} className="scale-in">
          <div style={s.emptyOrb}>✂</div>
          <h3 style={s.emptyTitle}>No services yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            Attach services from the catalogue or create your own above.
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([cat, items]) => {
        const color = CAT_COLORS[cat] || '#7C3AED';
        return (
          <div key={cat} style={s.catSection}>
            <div style={s.catHeader}>
              <span style={{ ...s.catBadge, color, background: color + '14', border: `1px solid ${color}30` }}>{cat}</span>
              <span style={s.catCount}>{items.length} service{items.length > 1 ? 's' : ''}</span>
            </div>
            <div style={s.grid}>
              {items.map(ss => {
                const isCustom = !!ss.service_is_private;
                return (
                  <div key={ss.id} style={s.card} className="fade-up">
                    <div style={{ ...s.cardAccent, background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
                    <div style={s.cardBody}>
                      <div style={s.cardTop}>
                        <div>
                          <div style={s.svcName}>{ss.service_name}</div>
                          {isCustom && (
                            <span style={s.customTag}>Custom</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={s.editBtn} onClick={() => setEditTarget(ss)}>Edit</button>
                          <button style={s.detachBtn} onClick={() => detach(ss.id)}>Remove</button>
                        </div>
                      </div>
                      <div style={s.meta}>
                        <span style={s.metaItem}>⏱ {ss.effective_duration} min</span>
                        <span style={{ ...s.price, color }}>LKR {ss.effective_price}</span>
                      </div>
                      {ss.custom_price != null && (
                        <div style={s.customNote}>Custom price set</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const s = {
  pageHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 28, flexWrap: 'wrap', gap: 14,
  },
  eyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title:   { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' },
  headerRight: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  addRow:  { display: 'flex', gap: 10, alignItems: 'center' },
  select:  { padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 11, fontSize: 14, color: 'var(--text)', background: 'var(--input-bg)', fontFamily: "'DM Sans', sans-serif", outline: 'none', minWidth: 220 },
  addBtn: {
    padding: '10px 22px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer',
    fontWeight: 700, fontSize: 14, boxShadow: '0 4px 14px rgba(124,58,237,.3)',
    fontFamily: "'DM Sans', sans-serif",
  },
  createBtn: {
    padding: '10px 22px',
    background: 'var(--surface)', color: '#7C3AED',
    border: '1.5px solid rgba(124,58,237,.3)', borderRadius: 11, cursor: 'pointer',
    fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  },
  createCard: {
    background: 'var(--surface)', borderRadius: 18, padding: '22px 24px',
    border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(124,58,237,.08)',
    marginBottom: 24,
  },
  createTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 18, letterSpacing: '-0.01em' },
  createGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 8 },
  fLabel:  { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  fInput:  { padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)', background: 'var(--input-bg)', outline: 'none', fontFamily: "'DM Sans', sans-serif" },
  alertErr: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  alertOk:  { background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  empty: { textAlign: 'center', padding: '64px 40px', background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(124,58,237,.06)' },
  emptyOrb:   { fontSize: 36, marginBottom: 16, display: 'block', color: 'var(--text-muted)' },
  emptyTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 },
  catSection: { marginBottom: 30 },
  catHeader:  { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  catBadge:   { padding: '5px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700 },
  catCount:   { fontSize: 12, color: 'var(--text-muted)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 },
  card: { background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(124,58,237,.06)', border: '1px solid var(--border)' },
  cardAccent: { height: 3, width: '100%' },
  cardBody:   { padding: '16px 18px' },
  cardTop:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  svcName:    { fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.3, marginBottom: 4 },
  customTag:  { fontSize: 10, fontWeight: 700, color: '#0D9488', background: 'rgba(13,148,136,.1)', border: '1px solid rgba(13,148,136,.25)', borderRadius: 10, padding: '2px 8px', display: 'inline-block' },
  editBtn:    { padding: '4px 10px', background: 'rgba(124,58,237,.08)', color: '#7C3AED', border: '1px solid rgba(124,58,237,.2)', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600, flexShrink: 0 },
  detachBtn:  { padding: '4px 10px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600, flexShrink: 0 },
  meta:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  metaItem:   { fontSize: 12, color: 'var(--text-muted)' },
  price:      { fontWeight: 700, fontSize: 16 },
  customNote: { marginTop: 8, fontSize: 11, color: '#7C3AED', background: 'rgba(124,58,237,.08)', borderRadius: 6, padding: '2px 8px', display: 'inline-block', border: '1px solid rgba(124,58,237,.2)' },
};

const m = {
  overlay: { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  box:     { background: 'var(--surface)', borderRadius: 20, maxWidth: 420, width: '100%', padding: '26px 28px', boxShadow: '0 20px 60px rgba(0,0,0,.3)' },
  title:   { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 20 },
  err:     { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 10, padding: '9px 14px', fontSize: 13, marginBottom: 16 },
  label:   { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 },
  input:   { padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)', background: 'var(--input-bg)', outline: 'none', fontFamily: "'DM Sans', sans-serif" },
  btnRow:  { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  cancelBtn: { padding: '9px 20px', background: 'var(--surface2)', color: 'var(--text-sub)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontWeight: 500, fontSize: 13, fontFamily: "'DM Sans', sans-serif" },
  saveBtn:   { padding: '9px 20px', background: 'linear-gradient(135deg, #7C3AED, #0D9488)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 12px rgba(124,58,237,.3)' },
};

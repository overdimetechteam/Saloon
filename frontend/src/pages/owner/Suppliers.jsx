import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';

const BLANK = { name: '', contact_person: '', phone: '', email: '', address: '' };

export default function Suppliers() {
  const { salon } = useOwner();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [open, setOpen]           = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(BLANK);
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');
  const [deleting, setDeleting]   = useState(null);

  const load = useCallback(async () => {
    if (!salon?.id) return;
    try {
      const res = await api.get(`/salons/${salon.id}/suppliers/`);
      setSuppliers(res.data);
    } finally {
      setLoading(false);
    }
  }, [salon?.id]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(BLANK); setErr(''); setOpen(true); };
  const openEdit = (sup) => { setEditing(sup); setForm({ name: sup.name, contact_person: sup.contact_person, phone: sup.phone, email: sup.email, address: sup.address }); setErr(''); setOpen(true); };
  const close    = () => { setOpen(false); setErr(''); };
  const f        = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) { setErr('Supplier name is required.'); return; }
    setSaving(true); setErr('');
    try {
      if (editing) {
        const res = await api.put(`/salons/${salon.id}/suppliers/${editing.id}/`, form);
        setSuppliers(p => p.map(s => s.id === editing.id ? res.data : s));
      } else {
        const res = await api.post(`/salons/${salon.id}/suppliers/`, form);
        setSuppliers(p => [...p, res.data]);
      }
      close();
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const del = async (sup) => {
    if (!window.confirm(`Delete "${sup.name}"? This cannot be undone.`)) return;
    setDeleting(sup.id);
    try {
      await api.delete(`/salons/${salon.id}/suppliers/${sup.id}/`);
      setSuppliers(p => p.filter(s => s.id !== sup.id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {/* ── Page header ── */}
      <div style={s.pageHeader} className="fade-up">
        <div>
          <div style={s.eyebrow}>Inventory</div>
          <h2 style={s.title}>Supplier List</h2>
          <p style={s.sub}>Manage your product suppliers</p>
        </div>
        <button style={s.primaryBtn} onClick={openAdd}>+ Add Supplier</button>
      </div>

      {/* ── Supplier cards ── */}
      {loading ? (
        <div style={s.empty} className="scale-in">
          <div style={s.emptyOrb}>⏳</div>
          <h3 style={s.emptyTitle}>Loading…</h3>
        </div>
      ) : suppliers.length === 0 ? (
        <div style={s.empty} className="scale-in">
          <div style={s.emptyOrb}>🏭</div>
          <h3 style={s.emptyTitle}>No suppliers yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            Add your first supplier to use them in products and GRNs.
          </p>
        </div>
      ) : (
        <div style={s.list} className="fade-up">
          {suppliers.map(sup => (
            <div key={sup.id} style={s.card} className="card-glow">
              <div style={s.cardHead}>
                <div>
                  <div style={s.supName}>{sup.name}</div>
                  {sup.contact_person && (
                    <div style={s.supContact}>Contact: {sup.contact_person}</div>
                  )}
                </div>
                <div style={s.cardActions}>
                  <button style={s.editBtn} onClick={() => openEdit(sup)}>Edit</button>
                  <button
                    style={s.delBtn}
                    onClick={() => del(sup)}
                    disabled={deleting === sup.id}
                  >
                    {deleting === sup.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
              {(sup.phone || sup.email || sup.address) && (
                <div style={s.cardBody}>
                  {sup.phone   && <span style={s.meta}>📞 {sup.phone}</span>}
                  {sup.email   && <span style={s.meta}>✉ {sup.email}</span>}
                  {sup.address && <span style={s.meta}>📍 {sup.address}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {open && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && close()}>
          <div style={s.modal} className="modal-in">
            <div style={s.mHeader}>
              <div>
                <div style={s.mEyebrow}>Inventory</div>
                <div style={s.mTitle}>{editing ? 'Edit Supplier' : 'Add Supplier'}</div>
              </div>
              <button style={s.mClose} onClick={close}>✕</button>
            </div>

            {err && <div style={s.alertErr}>{err}</div>}

            <div style={s.mForm}>
              <label style={s.mLabel}>Supplier Name *</label>
              <input style={s.mInput} value={form.name} onChange={f('name')} placeholder="e.g. Beauty Depot" />

              <label style={s.mLabel}>Contact Person</label>
              <input style={s.mInput} value={form.contact_person} onChange={f('contact_person')} placeholder="e.g. John Silva" />

              <div style={s.mRow}>
                <div style={{ flex: 1 }}>
                  <label style={s.mLabel}>Phone</label>
                  <input style={s.mInput} value={form.phone} onChange={f('phone')} placeholder="+94 77 000 0000" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.mLabel}>Email</label>
                  <input style={s.mInput} value={form.email} onChange={f('email')} placeholder="supplier@email.com" type="email" />
                </div>
              </div>

              <label style={s.mLabel}>Address</label>
              <input style={s.mInput} value={form.address} onChange={f('address')} placeholder="123 Main St, Colombo" />

              <div style={s.mFooter}>
                <button style={s.mCancel} onClick={close}>Cancel</button>
                <button style={s.mSave} onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : editing ? '✓ Update Supplier' : '+ Save Supplier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26, flexWrap: 'wrap', gap: 14 },
  eyebrow:    { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title:      { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' },
  sub:        { color: 'var(--text-muted)', fontSize: 13, margin: 0 },
  primaryBtn: {
    padding: '11px 22px',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer',
    fontWeight: 700, fontSize: 13, boxShadow: '0 6px 18px rgba(13,148,136,.35)',
    fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
  },

  list: { display: 'flex', flexDirection: 'column', gap: 14 },
  card: {
    background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)',
    boxShadow: '0 4px 16px rgba(13,148,136,.06)', overflow: 'hidden',
  },
  cardHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 22px',
  },
  supName:    { fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 2 },
  supContact: { fontSize: 13, color: 'var(--text-muted)' },
  cardActions: { display: 'flex', gap: 8, flexShrink: 0 },
  editBtn: {
    padding: '7px 16px', background: 'rgba(13,148,136,.1)', color: '#0D9488',
    border: '1px solid rgba(13,148,136,.2)', borderRadius: 9, cursor: 'pointer',
    fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
  },
  delBtn: {
    padding: '7px 16px', background: 'rgba(220,38,38,.08)', color: '#DC2626',
    border: '1px solid rgba(220,38,38,.18)', borderRadius: 9, cursor: 'pointer',
    fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
  },
  cardBody: {
    padding: '10px 22px 14px',
    borderTop: '1px solid var(--border)',
    display: 'flex', flexWrap: 'wrap', gap: '6px 22px',
    background: 'rgba(13,148,136,.03)',
  },
  meta: { fontSize: 13, color: 'var(--text-muted)' },

  empty: {
    background: 'var(--surface)', borderRadius: 22, padding: '64px 40px',
    textAlign: 'center', border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(13,148,136,.06)',
  },
  emptyOrb:   { fontSize: 36, marginBottom: 16, display: 'block' },
  emptyTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, color: 'var(--text)', marginBottom: 8 },

  alertErr: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 },

  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal:   { background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 500, boxShadow: '0 24px 64px rgba(0,0,0,.22)', overflow: 'hidden' },
  mHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '22px 26px 18px', borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
  },
  mEyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 },
  mTitle:   { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 },
  mClose:   { background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 6, marginTop: 2 },
  mForm:    { padding: '20px 26px 26px' },
  mLabel:   { display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, marginTop: 14 },
  mInput:   {
    width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 13, boxSizing: 'border-box', marginBottom: 0,
    color: 'var(--text)', background: 'var(--input-bg)',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
  },
  mRow:     { display: 'flex', gap: 14 },
  mFooter:  { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border)' },
  mCancel:  {
    padding: '10px 20px', background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
    color: 'var(--text)', fontFamily: "'DM Sans', sans-serif",
  },
  mSave: {
    padding: '10px 22px',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
    fontWeight: 700, fontSize: 13, boxShadow: '0 4px 14px rgba(13,148,136,.35)',
    fontFamily: "'DM Sans', sans-serif",
  },
};

import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';

const s = {
  page:    { padding: '32px 24px', maxWidth: 900, margin: '0 auto' },
  header:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  title:   { fontSize: 22, fontWeight: 700, color: '#1a1a1a' },
  addBtn:  { background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  card:    { background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,.08)', padding: '18px 22px', marginBottom: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  name:    { fontWeight: 700, fontSize: 16, color: '#1a1a1a', marginBottom: 4 },
  meta:    { fontSize: 13, color: '#666', lineHeight: 1.6 },
  actions: { display: 'flex', gap: 8, flexShrink: 0 },
  editBtn: { background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
  delBtn:  { background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
  empty:   { textAlign: 'center', color: '#999', padding: '60px 0', fontSize: 15 },

  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal:   { background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 8px 40px rgba(0,0,0,.18)' },
  mTitle:  { fontSize: 18, fontWeight: 700, marginBottom: 22, color: '#1a1a1a' },
  label:   { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 },
  input:   { width: '100%', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 14 },
  row:     { display: 'flex', gap: 12 },
  half:    { flex: 1 },
  foot:    { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 },
  cancel:  { background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 14, cursor: 'pointer', fontWeight: 600 },
  save:    { background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  err:     { color: '#dc2626', fontSize: 13, marginBottom: 12 },
};

const BLANK = { name: '', contact_person: '', phone: '', email: '', address: '' };

export default function Suppliers() {
  const { salon } = useOwner();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

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

  const openAdd = () => { setEditing(null); setForm(BLANK); setErr(''); setOpen(true); };
  const openEdit = (sup) => { setEditing(sup); setForm({ name: sup.name, contact_person: sup.contact_person, phone: sup.phone, email: sup.email, address: sup.address }); setErr(''); setOpen(true); };
  const close = () => setOpen(false);
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) { setErr('Name is required.'); return; }
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
      setErr(e.response?.data?.detail || 'Failed to save supplier.');
    } finally {
      setSaving(false);
    }
  };

  const del = async (sup) => {
    if (!window.confirm(`Delete supplier "${sup.name}"?`)) return;
    await api.delete(`/salons/${salon.id}/suppliers/${sup.id}/`);
    setSuppliers(p => p.filter(s => s.id !== sup.id));
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.title}>Supplier List</div>
        <button style={s.addBtn} onClick={openAdd}>+ Add Supplier</button>
      </div>

      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : suppliers.length === 0 ? (
        <div style={s.empty}>No suppliers yet. Add your first one!</div>
      ) : (
        suppliers.map(sup => (
          <div key={sup.id} style={s.card}>
            <div>
              <div style={s.name}>{sup.name}</div>
              <div style={s.meta}>
                {sup.contact_person && <span>Contact: {sup.contact_person} &nbsp;·&nbsp; </span>}
                {sup.phone && <span>📞 {sup.phone} &nbsp;·&nbsp; </span>}
                {sup.email && <span>✉ {sup.email}</span>}
                {sup.address && <div style={{ marginTop: 2 }}>📍 {sup.address}</div>}
              </div>
            </div>
            <div style={s.actions}>
              <button style={s.editBtn} onClick={() => openEdit(sup)}>Edit</button>
              <button style={s.delBtn} onClick={() => del(sup)}>Delete</button>
            </div>
          </div>
        ))
      )}

      {open && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && close()}>
          <div style={s.modal}>
            <div style={s.mTitle}>{editing ? 'Edit Supplier' : 'Add Supplier'}</div>
            {err && <div style={s.err}>{err}</div>}

            <label style={s.label}>Supplier Name *</label>
            <input style={s.input} value={form.name} onChange={f('name')} placeholder="e.g. Beauty Depot" />

            <label style={s.label}>Contact Person</label>
            <input style={s.input} value={form.contact_person} onChange={f('contact_person')} placeholder="e.g. John Silva" />

            <div style={s.row}>
              <div style={s.half}>
                <label style={s.label}>Phone</label>
                <input style={s.input} value={form.phone} onChange={f('phone')} placeholder="+94 77 000 0000" />
              </div>
              <div style={s.half}>
                <label style={s.label}>Email</label>
                <input style={s.input} value={form.email} onChange={f('email')} placeholder="supplier@email.com" type="email" />
              </div>
            </div>

            <label style={s.label}>Address</label>
            <input style={s.input} value={form.address} onChange={f('address')} placeholder="123 Main St, Colombo" />

            <div style={s.foot}>
              <button style={s.cancel} onClick={close}>Cancel</button>
              <button style={s.save} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Supplier'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

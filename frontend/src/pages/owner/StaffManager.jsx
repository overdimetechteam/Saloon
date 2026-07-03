import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';

const ROLES = ['stylist', 'barber', 'colorist', 'receptionist', 'manager', 'other'];
const ROLE_LABEL = { stylist: 'Stylist', barber: 'Barber', colorist: 'Colorist', receptionist: 'Receptionist', manager: 'Manager', other: 'Other' };

const blankCreate = { full_name: '', role: 'stylist', bio: '', phone: '', login_email: '', password: '' };

const blankReset  = { login_email: '', password: '' };

export default function StaffManager() {
  const { salon } = useOwner();
  const [staff, setStaff]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(blankCreate);
  const [creating, setCreating]   = useState(false);
  const [createErr, setCreateErr] = useState('');
  const [showCreatePw, setShowCreatePw] = useState(false);
  const [showResetPw, setShowResetPw]   = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState(null); // { email, password }

  const [editId, setEditId]       = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const [resetId, setResetId]     = useState(null);
  const [resetForm, setResetForm] = useState(blankReset);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg]   = useState('');

  const load = () => {
    if (!salon) return;
    setLoading(true);
    api.get(`/salons/${salon.id}/staff-members/`)
      .then(r => { setStaff(r.data); setError(''); })
      .catch(() => setError('Failed to load staff.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [salon]);

  const handleCreate = async e => {
    e.preventDefault(); setCreating(true); setCreateErr('');
    try {
      const payload = { ...createForm };
      if (!payload.password) delete payload.password; // let backend auto-generate
      const r = await api.post(`/salons/${salon.id}/staff-members/`, payload);
      setStaff(prev => [...prev, r.data]);
      setShowCreate(false); setCreateForm(blankCreate);
      if (r.data.generated_password) {
        setGeneratedCreds({ email: createForm.login_email, password: r.data.generated_password });
      }
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ');
        setCreateErr(msgs);
      } else {
        setCreateErr('Failed to create staff member.');
      }
    } finally { setCreating(false); }
  };

  const startEdit = m => { setEditId(m.id); setEditForm({ full_name: m.full_name, role: m.role, bio: m.bio || '', phone: m.phone || '', is_active: m.is_active }); };

  const saveEdit = async id => {
    setEditSaving(true);
    try {
      const r = await api.patch(`/salons/${salon.id}/staff-members/${id}/`, editForm);
      setStaff(prev => prev.map(m => m.id === id ? r.data : m));
      setEditId(null);
    } catch { /* silently */ }
    finally { setEditSaving(false); }
  };

  const softDelete = async id => {
    if (!window.confirm('Deactivate this staff member? They will lose login access.')) return;
    await api.delete(`/salons/${salon.id}/staff-members/${id}/`);
    setStaff(prev => prev.map(m => m.id === id ? { ...m, is_active: false } : m));
  };

  const handleReset = async e => {
    e.preventDefault(); setResetting(true); setResetMsg('');
    try {
      await api.patch(`/salons/${salon.id}/staff-members/${resetId}/reset-credentials/`, resetForm);
      setResetMsg('success: Credentials updated successfully.');
      setResetForm(blankReset);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k === 'non_field_errors' ? '' : k + ': '}${Array.isArray(v) ? v[0] : v}`)
          .join(' | ');
        setResetMsg(msgs);
      } else {
        setResetMsg(data?.detail || 'Failed to update credentials.');
      }
    } finally { setResetting(false); }
  };

  if (!salon) return <div style={s.empty}>Loading salon data…</div>;

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <div>
          <h2 style={s.heading}>Staff Profiles</h2>
          <p style={s.sub}>Manage employee accounts and login credentials</p>
        </div>
        <button style={s.addBtn} onClick={() => { setShowCreate(true); setCreateErr(''); }}>
          + Add Staff Member
        </button>
      </div>

      {error && <div style={s.errorBanner}>{error}</div>}

      {/* Create modal */}
      {showCreate && (
        <div style={s.modalBack} onClick={() => setShowCreate(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>Add Staff Member</span>
              <button style={s.closeBtn} onClick={() => setShowCreate(false)}>✕</button>
            </div>
            {createErr && <div style={s.errMsg}>{createErr}</div>}
            <form onSubmit={handleCreate} style={s.form} autoComplete="off">
              {/* Hidden honeypot fields — prevents browser from autofilling staff credentials with saved logins */}
              <input type="text" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
              <input type="password" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
              <div style={s.row2}>
                <Field label="Full Name" required>
                  <input style={s.input} value={createForm.full_name} onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })} required autoComplete="off" />
                </Field>
                <Field label="Role">
                  <select style={s.input} value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Phone">
                <input style={s.input} value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="+1 555 000 0000" autoComplete="off" />
              </Field>
              <Field label="Bio">
                <textarea style={{ ...s.input, minHeight: 72, resize: 'vertical' }} value={createForm.bio} onChange={e => setCreateForm({ ...createForm, bio: e.target.value })} placeholder="Short introduction…" />
              </Field>
              <div style={s.divider} />
              <p style={s.sectionLabel}>Login Credentials</p>
              <div style={s.row2}>
                <Field label="Login Email" required>
                  <input style={s.input} type="email" name="staff-login-email" value={createForm.login_email} onChange={e => setCreateForm({ ...createForm, login_email: e.target.value })} required autoComplete="new-password" />
                </Field>
                <Field label="Password (optional)">
                  <div style={{ position: 'relative' }}>
                    <input style={{ ...s.input, paddingRight: 40 }} type={showCreatePw ? 'text' : 'password'} name="staff-password-new" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} minLength={6} autoComplete="new-password" placeholder="Leave blank to auto-generate" />
                    <button type="button" onClick={() => setShowCreatePw(v => !v)} style={s.eyeBtn}>{showCreatePw ? '🙈' : '👁'}</button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Leave blank — a secure password will be generated and shown to you.</div>
                </Field>
              </div>
              <div style={s.modalFooter}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" style={{ ...s.saveBtn, opacity: creating ? 0.75 : 1 }} disabled={creating}>
                  {creating ? 'Creating…' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset credentials modal */}
      {resetId && (
        <div style={s.modalBack} onClick={() => { setResetId(null); setResetMsg(''); }}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>Reset Credentials</span>
              <button style={s.closeBtn} onClick={() => { setResetId(null); setResetMsg(''); }}>✕</button>
            </div>
            {resetMsg && (
              <div style={resetMsg.startsWith('success:') ? s.successMsg : s.errMsg}>
                {resetMsg.startsWith('success:') ? resetMsg.slice(9).trim() : resetMsg}
              </div>
            )}
            <form onSubmit={handleReset} style={s.form}>
              <Field label="New Login Email (optional)">
                <input style={s.input} type="email" value={resetForm.login_email} onChange={e => setResetForm({ ...resetForm, login_email: e.target.value })} />
              </Field>
              <Field label="New Password (optional)">
                <div style={{ position: 'relative' }}>
                  <input style={{ ...s.input, paddingRight: 40 }} type={showResetPw ? 'text' : 'password'} value={resetForm.password} onChange={e => setResetForm({ ...resetForm, password: e.target.value })} minLength={6} />
                  <button type="button" onClick={() => setShowResetPw(v => !v)} style={s.eyeBtn}>{showResetPw ? '🙈' : '👁'}</button>
                </div>
              </Field>
              <div style={s.modalFooter}>
                <button type="button" style={s.cancelBtn} onClick={() => { setResetId(null); setResetMsg(''); }}>Close</button>
                <button type="submit" style={{ ...s.saveBtn, opacity: resetting ? 0.75 : 1 }} disabled={resetting}>
                  {resetting ? 'Saving…' : 'Update Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated credentials dialog */}
      {generatedCreds && (
        <div style={s.modalBack} onClick={() => setGeneratedCreds(null)}>
          <div style={{ ...s.modal, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>Staff Account Created ✓</span>
              <button style={s.closeBtn} onClick={() => setGeneratedCreds(null)}>✕</button>
            </div>
            <div style={{ padding: '4px 0 16px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Share these login details with your staff member. This password <strong>won't be shown again</strong>.
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '16px 18px', border: '1.5px solid var(--border)', marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</span>
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{generatedCreds.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Password</span>
                <span style={{ fontSize: 14, color: '#0D9488', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.1em' }}>{generatedCreds.password}</span>
              </div>
            </div>
            <button style={{ ...s.saveBtn, width: '100%' }} onClick={() => setGeneratedCreds(null)}>Got it, I've noted these down</button>
          </div>
        </div>
      )}

      {/* Staff list */}
      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : staff.length === 0 ? (
        <div style={s.emptyCard}>
          <div style={s.emptyIcon}>◉</div>
          <div style={s.emptyTitle}>No staff members yet</div>
          <div style={s.emptySub}>Add your first employee to get started.</div>
        </div>
      ) : (
        <div style={s.list}>
          {staff.map(m => (
            <div key={m.id} style={{ ...s.card, opacity: m.is_active ? 1 : 0.55 }}>
              {editId === m.id ? (
                <div style={s.editForm}>
                  <div style={s.row2}>
                    <Field label="Name">
                      <input style={s.input} value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                    </Field>
                    <Field label="Role">
                      <select style={s.input} value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Phone">
                    <input style={s.input} value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                  </Field>
                  <Field label="Bio">
                    <textarea style={{ ...s.input, minHeight: 60, resize: 'vertical' }} value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} />
                  </Field>
                  <label style={s.checkRow}>
                    <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })} />
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Active</span>
                  </label>
                  <div style={s.editActions}>
                    <button style={s.cancelBtn} onClick={() => setEditId(null)}>Cancel</button>
                    <button style={{ ...s.saveBtn, opacity: editSaving ? 0.75 : 1 }} onClick={() => saveEdit(m.id)} disabled={editSaving}>
                      {editSaving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={s.cardInner}>
                  <div style={s.avatar}>
                    {m.photo_url
                      ? <img src={m.photo_url} alt={m.full_name} style={s.avatarImg} />
                      : <div style={s.avatarInitial}>{m.full_name?.[0]?.toUpperCase()}</div>
                    }
                  </div>
                  <div style={s.info}>
                    <div style={s.name}>{m.full_name} {!m.is_active && <span style={s.inactiveBadge}>Inactive</span>}</div>
                    <div style={s.roleBadge}>{ROLE_LABEL[m.role] || m.role}</div>
                    {m.login_email && <div style={s.email}>✉ {m.login_email}</div>}
                    {m.phone       && <div style={s.phone}>☏ {m.phone}</div>}
                    {m.bio         && <div style={s.bio}>{m.bio}</div>}
                  </div>
                  <div style={s.actions}>
                    <button style={s.actionBtn} title="Edit" onClick={() => startEdit(m)}>✎</button>
                    <button style={s.actionBtn} title="Reset credentials" onClick={() => { setResetId(m.id); setResetMsg(''); }}>🔑</button>
                    {m.is_active && (
                      <button style={{ ...s.actionBtn, color: '#EF4444' }} title="Deactivate" onClick={() => softDelete(m.id)}>✕</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  );
}

const s = {
  page: { padding: '28px 24px', maxWidth: 860, margin: '0 auto' },
  topBar: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
  heading: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28, fontWeight: 700, color: 'var(--text)',
    margin: '0 0 4px', letterSpacing: '-0.01em',
  },
  sub: { color: 'var(--text-muted)', fontSize: 14, margin: 0 },
  addBtn: {
    padding: '10px 20px', background: 'linear-gradient(135deg, #0D9488, #14B8A8)',
    color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
    fontSize: 14, fontWeight: 600, boxShadow: '0 4px 14px rgba(13,148,136,.3)',
    fontFamily: "'DM Sans', sans-serif",
  },
  errorBanner: {
    background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626',
    borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 20,
  },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 14, overflow: 'hidden',
  },
  cardInner: { display: 'flex', gap: 16, padding: '18px 20px', alignItems: 'flex-start' },
  avatar: { width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--border)' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarInitial: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0D9488, #14B8A8)', color: '#fff', fontSize: 20, fontWeight: 700,
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 },
  roleBadge: {
    display: 'inline-block', padding: '2px 10px',
    background: 'rgba(13,148,136,.12)', color: '#0D9488',
    borderRadius: 20, fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
  },
  email: { fontSize: 13, color: 'var(--text-muted)', marginTop: 3 },
  phone: { fontSize: 13, color: 'var(--text-muted)', marginTop: 2 },
  bio:   { fontSize: 13, color: 'var(--text-sub)', marginTop: 6, lineHeight: 1.5 },
  inactiveBadge: {
    display: 'inline-block', background: '#FEF2F2', color: '#EF4444',
    borderRadius: 6, fontSize: 10, padding: '1px 7px', marginLeft: 8,
    fontWeight: 600, verticalAlign: 'middle',
  },
  actions: { display: 'flex', gap: 6, flexShrink: 0 },
  actionBtn: {
    width: 32, height: 32, background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, color: 'var(--text-muted)',
  },
  editForm: { padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 },
  editActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 6 },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  empty: { textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontSize: 15 },
  emptyCard: {
    textAlign: 'center', padding: '56px 24px',
    background: 'var(--surface)', border: '1.5px dashed var(--border)', borderRadius: 16,
  },
  emptyIcon: { fontSize: 32, color: 'var(--text-muted)', marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 6 },
  emptySub: { fontSize: 14, color: 'var(--text-muted)' },

  // Modal
  modalBack: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'var(--surface)', borderRadius: 18, maxWidth: 560, width: '100%',
    maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 24px 64px rgba(0,0,0,.22)',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 24px 14px', borderBottom: '1px solid var(--border)',
  },
  modalTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20, fontWeight: 700, color: 'var(--text)',
  },
  closeBtn: {
    width: 30, height: 30, background: 'none', border: '1px solid var(--border)',
    borderRadius: '50%', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  form: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 },
  row2: { display: 'flex', gap: 14, flexWrap: 'wrap' },
  input: {
    padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8,
    fontSize: 14, background: 'var(--input-bg)', color: 'var(--text)',
    outline: 'none', fontFamily: "'DM Sans', sans-serif", width: '100%', boxSizing: 'border-box',
  },
  divider: { height: 1, background: 'var(--border)', margin: '4px 0' },
  sectionLabel: { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 },
  eyeBtn: {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
    color: 'var(--text-muted)', padding: '2px 4px',
  },
  cancelBtn: {
    padding: '10px 18px', background: 'transparent', border: '1px solid var(--border)',
    borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)',
    fontFamily: "'DM Sans', sans-serif",
  },
  saveBtn: {
    padding: '10px 24px', background: 'linear-gradient(135deg, #0D9488, #14B8A8)',
    color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
    fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
  },
  errMsg: {
    margin: '0 24px', background: '#FEF2F2', border: '1px solid #FCA5A5',
    color: '#DC2626', borderRadius: 8, padding: '10px 14px', fontSize: 13,
  },
  successMsg: {
    margin: '0 24px', background: '#F0FDF4', border: '1px solid #86EFAC',
    color: '#16A34A', borderRadius: 8, padding: '10px 14px', fontSize: 13,
  },
};

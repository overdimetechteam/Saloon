import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { looksEncrypted, safeInitials, sanitizeProfile } from '../../utils/profile';
import { useBreakpoint } from '../../hooks/useMobile';

export default function UserSettings() {
  const { profile, updateProfile, logout } = useAuth();
  const { isMobile } = useBreakpoint();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState(null); // { type: 'ok'|'err', text }

  useEffect(() => {
    api.get('/profile/').then(({ data }) => {
      setForm({
        full_name: looksEncrypted(data.full_name) ? '' : (data.full_name || ''),
        phone:     looksEncrypted(data.phone)     ? '' : (data.phone     || ''),
      });
    });
  }, []);

  const save = async e => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const { data } = await api.patch('/profile/', form);
      updateProfile(data);
      setMsg({ type: 'ok', text: 'Profile updated successfully.' });
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.detail || 'Failed to save changes.' });
    } finally { setSaving(false); }
  };

  return (
    <div style={{ ...s.page, ...(isMobile ? { padding: '16px 0' } : {}) }}>
      <div style={s.header}>
        <h1 style={{ ...s.title, ...(isMobile ? { fontSize: 24 } : {}) }}>Account Settings</h1>
        <p style={s.sub}>Manage your personal information</p>
      </div>

      <div style={{ ...s.card, ...(isMobile ? { padding: '20px 16px', borderRadius: 14 } : {}) }}>
        {/* Avatar */}
        <div style={s.avatarRow}>
          <div style={{ ...s.avatar, ...(isMobile ? { width: 52, height: 52, fontSize: 22 } : {}) }}>
            {safeInitials(form.full_name || profile?.full_name, profile?.email)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={s.avatarName}>{form.full_name || profile?.email?.split('@')[0] || '—'}</div>
            <div style={{ ...s.avatarEmail, ...(isMobile ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 'calc(100% - 0px)' } : {}) }}>{profile?.email}</div>
            <div style={s.roleBadge}>Customer</div>
          </div>
        </div>

        <div style={s.divider} />

        <h3 style={s.sectionTitle}>Personal Details</h3>

        {msg && (
          <div style={{ ...s.alert, ...(msg.type === 'ok' ? s.alertOk : s.alertErr) }}>
            {msg.type === 'ok' ? '✓' : '⚠'} {msg.text}
          </div>
        )}

        <form onSubmit={save} style={s.form}>
          <div style={{ ...s.row, ...(isMobile ? { flexDirection: 'column', gap: 14 } : {}) }}>
            <div style={{ ...s.field, ...(isMobile ? { flex: 'none', width: '100%' } : {}) }}>
              <label style={s.label}>Full Name</label>
              <input
                style={s.input}
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Your name"
                required
              />
            </div>
            <div style={{ ...s.field, ...(isMobile ? { flex: 'none', width: '100%' } : {}) }}>
              <label style={s.label}>Phone Number</label>
              <input
                style={s.input}
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+94 77 000 0000"
              />
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Email Address</label>
            <input style={{ ...s.input, ...s.inputDisabled }} value={profile?.email || ''} disabled />
            <span style={s.hint}>Email cannot be changed directly. Contact support.</span>
          </div>

          <div style={{ ...s.actions, ...(isMobile ? { justifyContent: 'stretch' } : {}) }}>
            <button style={{ ...s.btn, opacity: saving ? 0.7 : 1, ...(isMobile ? { width: '100%' } : {}) }} type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Sign out */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              width: '100%', padding: '13px', borderRadius: 12,
              background: 'rgba(220,38,38,.06)', border: '1.5px solid rgba(220,38,38,.18)',
              color: '#ef4444', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { padding: '32px 28px', maxWidth: 720, margin: '0 auto' },
  header: { marginBottom: 28 },
  title: { fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.02em' },
  sub: { fontSize: 14, color: 'var(--text-muted)', margin: 0 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '28px 32px' },
  avatarRow: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'linear-gradient(135deg,#0D9488,#14B8A8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, fontWeight: 700, color: '#fff', flexShrink: 0,
  },
  avatarName: { fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 3 },
  avatarEmail: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 },
  roleBadge: {
    display: 'inline-block', padding: '3px 12px',
    background: 'rgba(13,148,136,.14)', color: '#0D9488',
    borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
  },
  divider: { height: 1, background: 'var(--border)', margin: '4px 0 16px' },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em' },
  alert: { borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 },
  alertOk: { background: 'rgba(13,148,136,.1)', border: '1px solid rgba(13,148,136,.25)', color: '#0D9488' },
  alertErr: { background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)', color: '#ef4444' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  field: { display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 160px', minWidth: 0 },
  label: { fontSize: 12, fontWeight: 700, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input: {
    padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 14, background: 'var(--input-bg)', color: 'var(--text)',
    outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: "'DM Sans',sans-serif",
  },
  inputDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  hint: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },
  actions: { display: 'flex', justifyContent: 'flex-end', paddingTop: 4 },
  btn: {
    padding: '12px 32px', background: 'linear-gradient(135deg,#0D9488,#14B8A8)',
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
  },
};

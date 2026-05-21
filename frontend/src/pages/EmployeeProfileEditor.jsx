import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { uploadProfilePhoto } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function EmployeeProfileEditor() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [staff, setStaff]     = useState(null);
  const [form, setForm]       = useState({ full_name: '', bio: '', phone: '' });
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]         = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/employee/profile/')
      .then(r => {
        setStaff(r.data);
        setForm({ full_name: r.data.full_name, bio: r.data.bio || '', phone: r.data.phone || '' });
      })
      .catch(() => setError('Could not load profile.'));
  }, []);

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true); setMsg(''); setError('');
    try {
      const r = await api.patch('/employee/profile/', form);
      setStaff(r.data);
      setMsg('Profile updated!');
    } catch {
      setError('Failed to save changes.');
    } finally { setSaving(false); }
  };

  const handlePhoto = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setMsg(''); setError('');
    try {
      const r = await uploadProfilePhoto(file);
      setStaff(prev => ({ ...prev, photo_url: r.data.photo_url }));
      setMsg('Photo updated!');
    } catch {
      setError('Failed to upload photo.');
    } finally { setUploading(false); }
  };

  const handleLogout = () => { navigate('/salon-portal'); logout(); };

  if (!staff && !error) {
    return (
      <div style={s.page}>
        <div style={s.loading}>Loading your profile…</div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.mark}>✦</div>
            <h1 style={s.title}>My Profile</h1>
            <p style={s.sub}>{profile?.email}</p>
          </div>
          <button onClick={handleLogout} style={s.logoutBtn}>Sign out</button>
        </div>

        {/* Photo */}
        <div style={s.photoRow}>
          <div style={s.photoWrap} onClick={() => fileRef.current?.click()}>
            {staff?.photo_url
              ? <img src={staff.photo_url} alt="profile" style={s.photo} />
              : <div style={s.photoPlaceholder}>{staff?.full_name?.[0]?.toUpperCase() || '?'}</div>
            }
            <div style={s.photoOverlay}>{uploading ? '…' : '✎'}</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
          <div>
            <div style={s.staffName}>{staff?.full_name}</div>
            <div style={s.staffRole}>{staff?.role}</div>
          </div>
        </div>

        {/* Messages */}
        {msg   && <div style={s.successMsg}>{msg}</div>}
        {error && <div style={s.errorMsg}>{error}</div>}

        {/* Form */}
        <form onSubmit={handleSave} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Full Name</label>
            <input
              style={s.input}
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Phone</label>
            <input
              style={s.input}
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 555 000 0000"
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Bio</label>
            <textarea
              style={{ ...s.input, minHeight: 90, resize: 'vertical' }}
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell clients a little about yourself…"
            />
          </div>

          <button style={{ ...s.btn, opacity: saving ? 0.75 : 1 }} type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg)', padding: 24,
  },
  loading: { color: 'var(--text-muted)', fontSize: 15 },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
    padding: '40px', maxWidth: 480, width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,.12)',
  },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 },
  mark: { fontSize: 18, color: '#0D9488', marginBottom: 6 },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 30, fontWeight: 700, color: 'var(--text)',
    margin: '0 0 4px', letterSpacing: '-0.02em',
  },
  sub: { color: 'var(--text-muted)', fontSize: 13, margin: 0 },
  logoutBtn: {
    padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)',
    borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)',
    fontFamily: "'DM Sans', sans-serif",
  },

  photoRow: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 },
  photoWrap: {
    width: 72, height: 72, borderRadius: '50%', cursor: 'pointer',
    position: 'relative', overflow: 'hidden', flexShrink: 0,
    border: '2px solid var(--border)',
  },
  photo: { width: '100%', height: '100%', objectFit: 'cover' },
  photoPlaceholder: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0D9488, #14B8A8)', color: '#fff',
    fontSize: 26, fontWeight: 700,
  },
  photoOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 16, opacity: 0,
    transition: 'opacity .15s',
    ':hover': { opacity: 1 },
  },
  staffName: { fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 3 },
  staffRole: {
    fontSize: 12, fontWeight: 600, color: '#0D9488',
    textTransform: 'uppercase', letterSpacing: '0.08em',
  },

  successMsg: {
    background: '#F0FDF4', border: '1px solid #86EFAC', color: '#16A34A',
    borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 20,
  },
  errorMsg: {
    background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626',
    borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 20,
  },

  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-sub)' },
  input: {
    padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 14, background: 'var(--input-bg)', color: 'var(--text)',
    outline: 'none', fontFamily: "'DM Sans', sans-serif", width: '100%', boxSizing: 'border-box',
  },
  btn: {
    marginTop: 4, padding: '13px',
    background: 'linear-gradient(135deg, #0D9488, #14B8A8)',
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(13,148,136,.35)',
  },
};

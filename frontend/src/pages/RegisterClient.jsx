import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { c, shadow } from '../styles/theme';

export default function RegisterClient() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', full_name: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const f = k => e => setForm({ ...form, [k]: e.target.value });

  const handle = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await register({ ...form, role: 'client' });
      navigate('/user/dashboard');
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'string' ? data : Object.values(data || {}).flat().join(' '));
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.logo}>✨</div>
          <h1 style={s.title}>Create your account</h1>
          <p style={s.sub}>Book salon appointments with ease</p>
        </div>

        {error && <div style={s.alert}>{error}</div>}

        <form onSubmit={handle} style={s.form}>
          <label style={s.label}>Full Name</label>
          <input style={s.input} placeholder="Jane Doe" value={form.full_name} onChange={f('full_name')} required />
          <label style={s.label}>Email address</label>
          <input style={s.input} type="email" placeholder="jane@example.com" value={form.email} onChange={f('email')} required />
          <label style={s.label}>Phone <span style={s.opt}>(optional)</span></label>
          <input style={s.input} placeholder="+94 77 123 4567" value={form.phone} onChange={f('phone')} />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="Min. 6 characters" value={form.password} onChange={f('password')} required />
          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={s.footer}>Already have an account? <Link to="/login" style={s.link}>Sign in</Link></p>
        <p style={s.footer}>Own a salon? <Link to="/register/owner" style={s.link}>Register your salon</Link></p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: `linear-gradient(135deg, ${c.primarySoft} 0%, #F9FAFB 60%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { background: c.surface, borderRadius: 16, padding: 40, width: '100%', maxWidth: 420, boxShadow: shadow.xl },
  header: { textAlign: 'center', marginBottom: 24 },
  logo: { fontSize: 36, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: 700, color: c.text, margin: 0 },
  sub: { color: c.textMuted, fontSize: 13, marginTop: 4 },
  alert: { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.error, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 },
  form: { display: 'flex', flexDirection: 'column', gap: 2 },
  label: { fontSize: 13, fontWeight: 500, color: c.textSub, marginBottom: 4, marginTop: 10 },
  opt: { color: c.textLight, fontWeight: 400 },
  input: { padding: '11px 14px', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 14, background: c.inputBg, outline: 'none', width: '100%', boxSizing: 'border-box' },
  btn: { marginTop: 18, padding: '12px', background: c.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', width: '100%' },
  footer: { marginTop: 14, textAlign: 'center', fontSize: 13, color: c.textMuted },
  link: { color: c.primary, fontWeight: 600, textDecoration: 'none' },
};

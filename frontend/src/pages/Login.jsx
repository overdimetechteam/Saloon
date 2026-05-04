import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { c, shadow } from '../styles/theme';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'system_admin') navigate('/admin/salons');
      else if (user.role === 'salon_owner') navigate('/owner/dashboard');
      else navigate('/user/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.logo}>💇</div>
          <h1 style={s.title}>Welcome back</h1>
          <p style={s.sub}>Sign in to your SalonSystem account</p>
        </div>

        {error && <div style={s.alert}>{error}</div>}

        <form onSubmit={handle} style={s.form}>
          <label style={s.label}>Email address</label>
          <input style={s.input} type="email" placeholder="you@example.com"
            value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />

          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="••••••••"
            value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={s.footer}>
          <p>New client? <Link to="/register/user" style={s.footerLink}>Create account</Link></p>
          <p style={{ marginTop: 6 }}>Register your salon? <Link to="/register/owner" style={s.footerLink}>Apply here</Link></p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: `linear-gradient(135deg, ${c.primarySoft} 0%, #F9FAFB 60%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { background: c.surface, borderRadius: 16, padding: 40, width: '100%', maxWidth: 420, boxShadow: shadow.xl },
  header: { textAlign: 'center', marginBottom: 28 },
  logo: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 700, color: c.text, margin: 0 },
  sub: { color: c.textMuted, fontSize: 14, marginTop: 6 },
  alert: { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.error, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  form: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 13, fontWeight: 500, color: c.textSub, marginBottom: 4, marginTop: 12 },
  input: { padding: '11px 14px', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 14, background: c.inputBg, outline: 'none', width: '100%', boxSizing: 'border-box' },
  btn: { marginTop: 20, padding: '12px', background: c.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', width: '100%' },
  footer: { marginTop: 24, textAlign: 'center', fontSize: 13, color: c.textMuted },
  footerLink: { color: c.primary, fontWeight: 600, textDecoration: 'none' },
};

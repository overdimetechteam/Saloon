import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function EmployeeLogin() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'employee') {
        setError('This portal is for salon employees only.');
        return;
      }
      navigate('/employee/profile');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <span style={s.mark}>✦</span>
          <span style={s.brand}>BookMyStyle</span>
        </div>
        <h1 style={s.title}>Staff Login</h1>
        <p style={s.sub}>Sign in with your employee credentials</p>

        {error && (
          <div style={s.alert}><span>⚠</span> {error}</div>
        )}

        <form onSubmit={handle} style={s.form} autoComplete="off">
          <div style={s.field}>
            <label style={s.label}>Email address</label>
            <input
              style={s.input}
              type="email"
              placeholder="you@salon.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              autoComplete="off"
              required
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...s.input, paddingRight: 44 }}
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', padding: '2px 4px' }}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <button style={{ ...s.btn, opacity: loading ? 0.75 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In as Staff'}
          </button>
        </form>

        <p style={s.footer}>
          Are you a salon owner? <Link to="/salon-portal" style={s.link}>Salon Portal</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg)', padding: 24,
  },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
    padding: '44px 40px', maxWidth: 420, width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,.12)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 },
  mark: { fontSize: 20, color: '#0D9488' },
  brand: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22, fontWeight: 700, color: 'var(--text)',
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 32, fontWeight: 700, color: 'var(--text)',
    margin: '0 0 6px', letterSpacing: '-0.02em',
  },
  sub: { color: 'var(--text-muted)', fontSize: 14, margin: '0 0 28px' },
  alert: {
    background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626',
    borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 20,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-sub)' },
  input: {
    padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 10,
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
  footer: { marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' },
  link: { color: '#0D9488', fontWeight: 600 },
};

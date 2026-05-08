import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBreakpoint } from '../hooks/useMobile';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const { isMobile, isTablet } = useBreakpoint();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault(); setError(''); setLoading(true);
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
    <div style={{ ...s.page, flexDirection: (isMobile || isTablet) ? 'column' : 'row' }}>
      {/* Left panel — brand / visual (hidden on mobile/tablet, replaced by header strip) */}
      {(isMobile || isTablet) ? (
        <div style={s.mobileBrand}>
          <div style={s.mobileBrandInner}>
            <div style={{ fontSize: 22, color: '#7C3AED', marginBottom: 4 }}>✦</div>
            <div style={s.leftTitle}>Saloon</div>
            <div style={{ ...s.leftTagline, fontSize: 10 }}>Beauty & Wellness</div>
          </div>
          <div style={s.leftBlob1} />
        </div>
      ) : (
        <div style={s.left}>
          <div style={s.leftInner}>
            <div style={s.leftMark}>✦</div>
            <div style={s.leftTitle}>Saloon</div>
            <div style={s.leftTagline}>Beauty & Wellness</div>
            <div style={s.leftDivider} />
            <p style={s.leftQuote}>
              "Where every visit is a luxury, every detail a statement of care."
            </p>
            <div style={s.leftFeatures}>
              {['Premium salon experiences', 'Effortless booking in seconds', 'Trusted by thousands'].map(f => (
                <div key={f} style={s.leftFeature}>
                  <span style={s.leftFeatureDot}>✦</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={s.leftBlob1} />
          <div style={s.leftBlob2} />
        </div>
      )}

      {/* Right panel — form */}
      <div style={{ ...s.right, padding: isMobile ? '28px 20px 40px' : isTablet ? '40px 32px' : '60px 40px' }}>
        <div style={{ ...s.formWrap, maxWidth: (isMobile || isTablet) ? '100%' : 400, width: '100%' }} className="fade-up">
          <div style={s.formHeader}>
            <h1 style={{ ...s.formTitle, fontSize: isMobile ? 28 : isTablet ? 32 : 38 }}>Welcome back</h1>
            <p style={s.formSub}>Sign in to continue your journey</p>
          </div>

          {error && (
            <div style={s.alert}>
              <span style={s.alertIcon}>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handle} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Email address</label>
              <input
                style={s.input}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input
                style={s.input}
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button
              style={{ ...s.btn, opacity: loading ? 0.75 : 1 }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div style={s.footer}>
            <p>New client? <Link to="/register/user" style={s.footerLink}>Create account</Link></p>
            <p style={{ marginTop: 8 }}>Own a salon? <Link to="/register/owner" style={s.footerLink}>Apply here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    background: 'var(--bg)',
  },

  mobileBrand: {
    background: 'linear-gradient(145deg, #1A0532 0%, #2D0A5E 50%, #7C3AED 100%)',
    padding: '32px 22px 28px', textAlign: 'center',
    position: 'relative', overflow: 'hidden', flexShrink: 0,
  },
  mobileBrandInner: { position: 'relative', zIndex: 2 },

  /* ── Left panel ── */
  left: {
    flex: '0 0 42%', maxWidth: 520,
    background: 'linear-gradient(145deg, #1A0532 0%, #2D0A5E 30%, #5B21B6 65%, #7C3AED 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '60px 48px', position: 'relative', overflow: 'hidden',
  },
  leftInner: { position: 'relative', zIndex: 2, color: '#fff' },
  leftMark: {
    fontSize: 32, fontWeight: 900, color: '#7C3AED',
    marginBottom: 12,
    filter: 'drop-shadow(0 0 12px rgba(124,58,237,.5))',
  },
  leftTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 48, fontWeight: 700, color: '#fff',
    lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6,
  },
  leftTagline: {
    fontSize: 11, color: 'rgba(196,181,253,.75)',
    letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500,
  },
  leftDivider: {
    width: 48, height: 2, marginTop: 32, marginBottom: 28,
    background: 'linear-gradient(90deg, #7C3AED, transparent)',
    borderRadius: 2,
  },
  leftQuote: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 19, fontStyle: 'italic', lineHeight: 1.7,
    color: 'rgba(255,255,255,.75)', marginBottom: 40, margin: 0,
  },
  leftFeatures: { marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 },
  leftFeature: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,.7)' },
  leftFeatureDot: { color: '#BF9B65', fontSize: 10 },
  leftBlob1: {
    position: 'absolute', width: 300, height: 300,
    background: 'radial-gradient(circle, rgba(236,72,153,.2) 0%, transparent 70%)',
    top: -80, right: -60, pointerEvents: 'none',
    filter: 'blur(40px)',
  },
  leftBlob2: {
    position: 'absolute', width: 250, height: 250,
    background: 'radial-gradient(circle, rgba(124,58,237,.15) 0%, transparent 70%)',
    bottom: -60, left: 20, pointerEvents: 'none',
    filter: 'blur(50px)',
  },

  /* ── Right panel ── */
  right: {
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '60px 40px',
    background: 'var(--bg)',
  },
  formWrap: { width: '100%', maxWidth: 400 },
  formHeader: { marginBottom: 36 },
  formTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 38, fontWeight: 700, color: 'var(--text)',
    margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1,
  },
  formSub: { color: 'var(--text-muted)', fontSize: 15, marginTop: 8 },

  alert: {
    background: '#FEF2F2', border: '1px solid #FCA5A5',
    color: '#DC2626', borderRadius: 12, padding: '12px 16px',
    fontSize: 13, marginBottom: 24,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  alertIcon: { fontSize: 14, flexShrink: 0 },

  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: {
    fontSize: 13, fontWeight: 600, color: 'var(--text-sub)',
    letterSpacing: '0.01em',
  },
  input: {
    padding: '13px 16px',
    border: '1.5px solid var(--border)',
    borderRadius: 12, fontSize: 15,
    background: 'var(--input-bg)', color: 'var(--text)',
    outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
  },
  btn: {
    marginTop: 4, padding: '14px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 600, cursor: 'pointer', width: '100%',
    boxShadow: '0 6px 20px rgba(124,58,237,.35), inset 0 1px 0 rgba(255,255,255,.15)',
    letterSpacing: '0.01em',
  },
  footer: { marginTop: 28, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' },
  footerLink: { color: '#7C3AED', fontWeight: 600 },
};

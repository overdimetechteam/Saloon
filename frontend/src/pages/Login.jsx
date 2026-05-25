import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBreakpoint } from '../hooks/useMobile';
import api from '../api/axios';

export default function Login() {
  const { login, profile } = useAuth();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || null;
  const { isMobile, isTablet } = useBreakpoint();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');

  const roleRedirect = (role) => {
    if (role === 'system_admin') return '/admin/salons';
    if (role === 'salon_owner') return '/salon-portal';
    if (role === 'employee') return '/employee/profile';
    return nextPath || '/user/dashboard';
  };

  useEffect(() => {
    if (!profile) return;
    navigate(roleRedirect(profile.role), { replace: true });
  }, [profile]);

  const handle = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(roleRedirect(user.role));
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const sendForgot = async e => {
    e.preventDefault(); setForgotLoading(true); setForgotMsg('');
    try {
      await api.post('/auth/forgot-password/', { email: forgotEmail.trim() });
      setForgotMsg('If that email is registered, a reset link has been sent.');
    } catch {
      setForgotMsg('If that email is registered, a reset link has been sent.');
    } finally { setForgotLoading(false); }
  };

  return (
    <div style={{ ...s.page, flexDirection: (isMobile || isTablet) ? 'column' : 'row' }}>
      {/* Left panel — brand / visual (hidden on mobile/tablet, replaced by header strip) */}
      {(isMobile || isTablet) ? (
        <div style={s.mobileBrand}>
          <div style={s.mobileBrandInner}>
            <div style={{ fontSize: 22, color: '#0D9488', marginBottom: 4 }}>✦</div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <label style={s.label}>Password</label>
                <button type="button" onClick={() => setForgotOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#0D9488', fontWeight: 600, padding: 0 }}>
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...s.input, paddingRight: 44 }}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', padding: '2px 4px' }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
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

          {/* Forgot Password Modal */}
          {forgotOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => { setForgotOpen(false); setForgotMsg(''); setForgotEmail(''); }}>
              <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '32px 28px', maxWidth: 400, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,.3)', border: '1px solid var(--border)', animation: 'scaleIn .22s ease both' }} onClick={e => e.stopPropagation()}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.01em' }}>Reset Password</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>Enter the email address associated with your account and we'll send you a reset link.</p>
                {forgotMsg ? (
                  <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', color: '#0D9488', borderRadius: 12, padding: '12px 16px', fontSize: 13, marginBottom: 16 }}>{forgotMsg}</div>
                ) : (
                  <form onSubmit={sendForgot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <input
                      style={{ ...s.input, marginBottom: 0 }}
                      type="email"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                      autoFocus
                    />
                    <button style={{ ...s.btn, opacity: forgotLoading || !forgotEmail.trim() ? 0.7 : 1 }} type="submit" disabled={forgotLoading || !forgotEmail.trim()}>
                      {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                    </button>
                  </form>
                )}
                <button onClick={() => { setForgotOpen(false); setForgotMsg(''); setForgotEmail(''); }} style={{ marginTop: 14, width: '100%', padding: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                  Close
                </button>
              </div>
            </div>
          )}
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
    background: 'linear-gradient(145deg, #0D0D16 0%, #0B3832 50%, #0D9488 100%)',
    padding: '32px 22px 28px', textAlign: 'center',
    position: 'relative', overflow: 'hidden', flexShrink: 0,
  },
  mobileBrandInner: { position: 'relative', zIndex: 2 },

  /* ── Left panel ── */
  left: {
    flex: '0 0 42%', maxWidth: 520,
    background: 'linear-gradient(145deg, #0D0D16, #1A1A24, #0B3832, #0D9488)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '60px 48px', position: 'relative', overflow: 'hidden',
  },
  leftInner: { position: 'relative', zIndex: 2, color: '#fff' },
  leftMark: {
    fontSize: 32, fontWeight: 900, color: '#0D9488',
    marginBottom: 12,
    filter: 'drop-shadow(0 0 12px rgba(13,148,136,.5))',
  },
  leftTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 48, fontWeight: 700, color: '#fff',
    lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6,
  },
  leftTagline: {
    fontSize: 11, color: 'rgba(153,246,228,.75)',
    letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500,
  },
  leftDivider: {
    width: 48, height: 2, marginTop: 32, marginBottom: 28,
    background: 'linear-gradient(90deg, #0D9488, transparent)',
    borderRadius: 2,
  },
  leftQuote: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 19, fontStyle: 'italic', lineHeight: 1.7,
    color: 'rgba(255,255,255,.75)', marginBottom: 40, margin: 0,
  },
  leftFeatures: { marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 },
  leftFeature: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,.7)' },
  leftFeatureDot: { color: '#D4AF37', fontSize: 10 },
  leftBlob1: {
    position: 'absolute', width: 300, height: 300,
    background: 'radial-gradient(circle, rgba(13,148,136,.2) 0%, transparent 70%)',
    top: -80, right: -60, pointerEvents: 'none',
    filter: 'blur(40px)',
  },
  leftBlob2: {
    position: 'absolute', width: 250, height: 250,
    background: 'radial-gradient(circle, rgba(13,148,136,.15) 0%, transparent 70%)',
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
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 600, cursor: 'pointer', width: '100%',
    boxShadow: '0 6px 20px rgba(13,148,136,.35), inset 0 1px 0 rgba(255,255,255,.15)',
    letterSpacing: '0.01em',
  },
  footer: { marginTop: 28, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' },
  footerLink: { color: '#0D9488', fontWeight: 600 },
};

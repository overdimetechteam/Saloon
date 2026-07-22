import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useBreakpoint } from '../hooks/useMobile';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../api/axios';

export default function Login() {
  const { login, socialLogin, profile } = useAuth();
  const { setForcedLight } = useTheme();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || null;
  const { isMobile, isTablet } = useBreakpoint();

  // Force light mode on this page; restore user preference when leaving
  useEffect(() => {
    setForcedLight(true);
    return () => setForcedLight(false);
  }, [setForcedLight]);
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState(''); // set when login rejected for unverified email
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [ownerPicker, setOwnerPicker] = useState(false);

  const roleRedirect = (role) => {
    if (role === 'system_admin') return '/admin/salons';
    if (role === 'employee') return '/employee/profile';
    return nextPath || '/user/dashboard';
  };

  useEffect(() => {
    if (!profile) return;
    if (profile.role === 'salon_owner') { setOwnerPicker(true); return; }
    navigate(roleRedirect(profile.role), { replace: true });
  }, [profile]);

  useEffect(() => {}, []);

  const handle = async e => {
    e.preventDefault(); setError(''); setUnverifiedEmail(''); setResendMsg(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'salon_owner') { setOwnerPicker(true); return; }
      navigate(roleRedirect(user.role));
    } catch (err) {
      if (err.response?.data?.code === 'email_not_verified') {
        setUnverifiedEmail(form.email);
      }
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const resendVerification = async () => {
    setResendLoading(true); setResendMsg('');
    try {
      await api.post('/auth/resend-verification/', { email: unverifiedEmail });
      setResendMsg('Verification email sent! Check your inbox.');
    } catch {
      setResendMsg('Failed to send. Try again.');
    } finally { setResendLoading(false); }
  };

  // ── Google ────────────────────────────────────────────────────────────────
  const googleLogin = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      setSocialLoading('google');
      try {
        const { data } = await api.post('/auth/social/google/', { access_token });
        const user = socialLogin(data);
        if (user.role === 'salon_owner') { setOwnerPicker(true); return; }
        navigate(roleRedirect(user.role));
      } catch (err) {
        setError(err.response?.data?.detail || 'Google sign-in failed.');
      } finally { setSocialLoading(''); }
    },
    onError: () => setError('Google sign-in was cancelled or failed.'),
  });

  // ── Apple ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const clientId = import.meta.env.VITE_APPLE_CLIENT_ID;
    if (!clientId || clientId.startsWith('com.your')) return;
    const script = document.createElement('script');
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.onload = () => {
      window.AppleID?.auth.init({
        clientId,
        scope: 'name email',
        redirectURI: window.location.origin,
        usePopup: true,
      });
    };
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  const handleApple = async () => {
    if (!window.AppleID) {
      setError('Apple Sign In is not available. Ensure VITE_APPLE_CLIENT_ID is configured and the site is served over HTTPS.');
      return;
    }
    setSocialLoading('apple');
    try {
      const resp = await window.AppleID.auth.signIn();
      const id_token = resp.authorization?.id_token;
      const fullName = resp.user
        ? `${resp.user.name?.firstName || ''} ${resp.user.name?.lastName || ''}`.trim()
        : '';
      const { data } = await api.post('/auth/social/apple/', { id_token, full_name: fullName });
      const user = socialLogin(data);
      navigate(roleRedirect(user.role));
    } catch (err) {
      if (err?.error !== 'popup_closed_by_user') {
        setError(err?.response?.data?.detail || 'Apple sign-in failed.');
      }
    } finally { setSocialLoading(''); }
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

  if (ownerPicker) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px 20px' }}>
        <div style={{ maxWidth: 400, width: '100%', background: 'var(--surface)', borderRadius: 24, padding: '44px 36px', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,.12)', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Welcome back!
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 32px' }}>
            You have a salon owner account. Where would you like to go?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => window.location.href = '/owner/dashboard'}
              style={{ padding: '13px', background: 'linear-gradient(135deg, #92701a, #D4AF37)', color: '#1a1200', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 6px 20px rgba(212,175,55,.3)' }}
            >
              ◉ Go to Owner Portal
            </button>
            <button
              onClick={() => navigate('/user/dashboard')}
              style={{ padding: '13px', background: 'linear-gradient(135deg, #0D9488, #14B8A8)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 6px 20px rgba(13,148,136,.3)' }}
            >
              ✦ Browse as Customer
            </button>
            <button
              onClick={() => setOwnerPicker(false)}
              style={{ padding: '11px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 12, fontSize: 14, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...s.page, flexDirection: (isMobile || isTablet) ? 'column' : 'row' }}>
      {/* Left panel — brand / visual (hidden on mobile/tablet, replaced by header strip) */}
      {(isMobile || isTablet) ? (
        <div style={s.mobileBrand}>
          <div style={{ ...s.mobileBrandInner, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: '10px 20px', marginBottom: 8, boxShadow: '0 4px 24px rgba(0,0,0,.35)' }}>
              <img src="/logo.png" alt="BookMyStyle" style={{ width: 100, height: 'auto', display: 'block' }} />
            </div>
            <div style={{ ...s.leftTagline, fontSize: 10 }}>Beauty & Wellness</div>
          </div>
          <div style={s.leftBlob1} />
        </div>
      ) : (
        <div style={s.left}>
          <div style={s.leftInner}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: '16px 30px', boxShadow: '0 0 60px rgba(13,148,136,.45), 0 14px 36px rgba(0,0,0,.45)' }}>
                <img src="/logo.png" alt="BookMyStyle" style={{ width: 180, height: 'auto', display: 'block' }} />
              </div>
            </div>
            <div style={s.leftTitle}>Customer Portal</div>
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
          <button style={s.backBtn} onClick={() => navigate('/portal')}>
            ← Back to portal select
          </button>

          <div style={s.formHeader}>
            <h1 style={{ ...s.formTitle, fontSize: isMobile ? 28 : isTablet ? 32 : 38 }}>Welcome back</h1>
            <p style={s.formSub}>Sign in to continue your journey</p>
          </div>

          {error && (
            <div style={s.alert}>
              <span style={s.alertIcon}>⚠</span> {error}
            </div>
          )}
          {unverifiedEmail && (
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: '12px 16px', fontSize: 13, marginBottom: 16, color: '#92400E' }}>
              {resendMsg || 'Your email is not verified yet.'}
              {!resendMsg && (
                <button onClick={resendVerification} disabled={resendLoading} style={{ marginLeft: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#0D9488', fontWeight: 700, fontSize: 13, padding: 0, textDecoration: 'underline' }}>
                  {resendLoading ? 'Sending…' : 'Resend verification email'}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handle} style={s.form} autoComplete="off">
            <div style={s.field}>
              <label style={s.label}>Email address</label>
              <input
                style={s.input}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                autoComplete="off"
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
                  autoComplete="new-password"
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

          {/* Social login */}
          <div style={s.divider}>
            <span style={s.dividerLine} />
            <span style={s.dividerText}>or continue with</span>
            <span style={s.dividerLine} />
          </div>

          <div style={s.socialRow}>
            <button
              style={{ ...s.socialBtn, opacity: socialLoading === 'google' ? 0.65 : 1 }}
              onClick={() => { setError(''); googleLogin(); }}
              disabled={!!socialLoading}
              title="Sign in with Google"
            >
              {socialLoading === 'google' ? '…' : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908C16.658 14.268 17.64 11.872 17.64 9.2z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
              )}
              <span>Google</span>
            </button>

          </div>

          <div style={s.footer}>
            <p>New client? <Link to={`/register/user${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`} style={s.footerLink}>Create account</Link></p>
          </div>

          {/* Forgot Password Modal */}
          {forgotOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'backdropIn .22s ease both' }} onClick={() => { setForgotOpen(false); setForgotMsg(''); setForgotEmail(''); }}>
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
  backBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, color: 'var(--text-muted)', padding: 0,
    marginBottom: 28, fontFamily: "'DM Sans', sans-serif",
    display: 'flex', alignItems: 'center', gap: 6,
  },
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
  divider: {
    display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 20px',
  },
  dividerLine: {
    flex: 1, height: 1, background: 'var(--border)',
  },
  dividerText: {
    fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap',
    letterSpacing: '0.04em', textTransform: 'uppercase',
  },
  socialRow: {
    display: 'flex', gap: 10, marginBottom: 28,
  },
  socialBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    padding: '11px 8px',
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: 13, fontWeight: 600,
    color: 'var(--text)',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color .15s, background .15s',
  },

  footer: { marginTop: 0, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' },
  footerLink: { color: '#0D9488', fontWeight: 600 },
};

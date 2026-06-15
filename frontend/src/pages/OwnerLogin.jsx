import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../api/axios';

export default function OwnerLogin() {
  const { login, socialLogin, profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  // If already logged in as owner, skip to dashboard
  useEffect(() => {
    if (profile?.role === 'salon_owner') navigate('/salon-portal', { replace: true });
  }, [profile]);

  const handleLogin = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'salon_owner') {
        setError('This portal is for salon owners only. Please use the Customer portal instead.');
        return;
      }
      navigate('/salon-portal');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      setGLoading(true);
      try {
        const { data } = await api.post('/auth/social/google/', { access_token });
        if (data.user?.role !== 'salon_owner') {
          setError('This Google account is not registered as a salon owner. Please register your salon first or use the Customer portal.');
          return;
        }
        socialLogin(data);
        navigate('/salon-portal');
      } catch (err) {
        setError(err.response?.data?.detail || 'Google sign-in failed.');
      } finally { setGLoading(false); }
    },
    onError: () => setError('Google sign-in was cancelled or failed.'),
  });

  return (
    <div style={s.page}>
      {/* Left panel */}
      <div style={s.left}>
        <div style={s.leftInner}>
          <div style={s.leftMark}>◉</div>
          <div style={s.leftTitle}>Owner Portal</div>
          <div style={s.leftTagline}>Salon Management Suite</div>
          <div style={s.leftDivider} />
          <p style={s.leftQuote}>
            "Grow your business, delight your clients, manage your team — all in one place."
          </p>
          <div style={s.leftFeatures}>
            {[
              'Booking & schedule management',
              'Staff, inventory & analytics',
              'Promotions & client insights',
            ].map(f => (
              <div key={f} style={s.leftFeature}>
                <span style={s.leftFeatureDot}>◈</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={s.leftBlob1} />
        <div style={s.leftBlob2} />
      </div>

      {/* Right panel */}
      <div style={s.right}>
        <div style={s.formWrap}>

          {/* Back link */}
          <button style={s.backBtn} onClick={() => navigate('/portal')}>
            ← Back to portal select
          </button>

          <div style={s.formHeader}>
            <div style={s.logoRow}>
              <span style={s.logoMark}>✦</span>
              <span style={s.logoBrand}>BookMyStyle</span>
            </div>
            <h1 style={s.formTitle}>Salon Owner Sign In</h1>
            <p style={s.formSub}>Access your salon management dashboard</p>
          </div>

          {error && (
            <div style={s.alert}><span>⚠</span> {error}</div>
          )}

          <form onSubmit={handleLogin} style={s.form} autoComplete="off">
            <div style={s.field}>
              <label style={s.label}>Email address</label>
              <input
                style={s.input}
                type="email"
                placeholder="owner@yoursalon.com"
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
                  style={s.eyeBtn}
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <button
              style={{ ...s.btn, opacity: loading ? 0.75 : 1 }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In to Owner Portal'}
            </button>
          </form>

          {/* Divider */}
          <div style={s.divider}>
            <span style={s.dividerLine} />
            <span style={s.dividerText}>or continue with</span>
            <span style={s.dividerLine} />
          </div>

          {/* Google */}
          <button
            style={{ ...s.googleBtn, opacity: gLoading ? 0.65 : 1 }}
            onClick={() => { setError(''); googleLogin(); }}
            disabled={gLoading}
          >
            {gLoading ? '…' : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908C16.658 14.268 17.64 11.872 17.64 9.2z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>

          {/* Footer links */}
          <div style={s.footer}>
            <p>
              Don't have an owner account?{' '}
              <Link to="/register/owner" style={s.footerLink}>Register your salon</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

const GOLD = '#D4AF37';

const s = {
  page: { minHeight: '100vh', display: 'flex', background: 'var(--bg)' },

  /* ── Left panel ── */
  left: {
    flex: '0 0 42%', maxWidth: 520,
    background: 'linear-gradient(145deg, #0D0D16, #1a1400, #2a1f00, #92701a)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '60px 48px', position: 'relative', overflow: 'hidden',
  },
  leftInner: { position: 'relative', zIndex: 2, color: '#fff' },
  leftMark: { fontSize: 36, fontWeight: 900, color: GOLD, marginBottom: 14, filter: `drop-shadow(0 0 14px rgba(212,175,55,.5))` },
  leftTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 44, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6,
  },
  leftTagline: { fontSize: 11, color: `rgba(212,175,55,.7)`, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500 },
  leftDivider: { width: 48, height: 2, marginTop: 32, marginBottom: 28, background: `linear-gradient(90deg, ${GOLD}, transparent)`, borderRadius: 2 },
  leftQuote: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 18, fontStyle: 'italic', lineHeight: 1.75, color: 'rgba(255,255,255,.65)', margin: 0,
  },
  leftFeatures: { marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 },
  leftFeature: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,.65)' },
  leftFeatureDot: { color: GOLD, fontSize: 11 },
  leftBlob1: { position: 'absolute', width: 300, height: 300, background: `radial-gradient(circle, rgba(212,175,55,.15) 0%, transparent 70%)`, top: -80, right: -60, pointerEvents: 'none', filter: 'blur(40px)' },
  leftBlob2: { position: 'absolute', width: 250, height: 250, background: `radial-gradient(circle, rgba(212,175,55,.1) 0%, transparent 70%)`, bottom: -60, left: 20, pointerEvents: 'none', filter: 'blur(50px)' },

  /* ── Right panel ── */
  right: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '60px 40px', background: 'var(--bg)',
  },
  formWrap: { width: '100%', maxWidth: 400 },
  backBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, color: 'var(--text-muted)', padding: 0,
    marginBottom: 32, fontFamily: "'DM Sans', sans-serif",
    display: 'flex', alignItems: 'center', gap: 6,
  },
  formHeader: { marginBottom: 28 },
  logoRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 },
  logoMark: { fontSize: 18, color: GOLD, filter: `drop-shadow(0 0 8px rgba(212,175,55,.4))` },
  logoBrand: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20, fontWeight: 700, color: 'var(--text)',
  },
  formTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 34, fontWeight: 700, color: 'var(--text)',
    margin: '0 0 6px', letterSpacing: '-0.02em', lineHeight: 1.1,
  },
  formSub: { color: 'var(--text-muted)', fontSize: 14, margin: 0 },
  alert: {
    background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626',
    borderRadius: 12, padding: '12px 16px', fontSize: 13, marginBottom: 20,
    display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.5,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', letterSpacing: '0.01em' },
  input: {
    padding: '13px 16px', border: '1.5px solid var(--border)', borderRadius: 12,
    fontSize: 15, background: 'var(--input-bg)', color: 'var(--text)',
    outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 14, color: 'var(--text-muted)', padding: '2px 4px',
  },
  btn: {
    marginTop: 4, padding: '14px',
    background: `linear-gradient(135deg, #92701a, ${GOLD})`,
    color: '#1a1200', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%',
    boxShadow: `0 6px 20px rgba(212,175,55,.3), inset 0 1px 0 rgba(255,255,255,.2)`,
    fontFamily: "'DM Sans', sans-serif",
  },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 18px' },
  dividerLine: { flex: 1, height: 1, background: 'var(--border)' },
  dividerText: { fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'uppercase' },
  googleBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: '13px', background: 'var(--surface)', border: '1.5px solid var(--border)',
    borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600,
    color: 'var(--text)', fontFamily: "'DM Sans', sans-serif",
  },
  footer: { marginTop: 28, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' },
  footerLink: { color: GOLD, fontWeight: 600, textDecoration: 'none' },
};

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useMobile';
import api from '../api/axios';

export default function OwnerLogin() {
  const { login, profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [form, setForm]             = useState({ email: '', password: '' });
  const [showPw, setShowPw]         = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPortalChoice, setShowPortalChoice] = useState(false);

  const [showForgot, setShowForgot]     = useState(false);
  const [forgotEmail, setForgotEmail]   = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg]       = useState('');
  const [forgotErr, setForgotErr]       = useState('');

  const handleForgot = async e => {
    e.preventDefault();
    setForgotErr(''); setForgotMsg(''); setForgotLoading(true);
    try {
      const r = await api.post('/auth/forgot-password/', { email: forgotEmail });
      setForgotMsg(r.data.message || 'If that email is registered, a reset link has been sent.');
    } catch {
      setForgotErr('Something went wrong. Please try again.');
    } finally { setForgotLoading(false); }
  };

  const closeForgot = () => {
    setShowForgot(false);
    setForgotEmail(''); setForgotMsg(''); setForgotErr('');
  };

  useEffect(() => {
    if (profile?.role === 'salon_owner') setShowPortalChoice(true);
  }, [profile]);

  const handleLogin = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'salon_owner') {
        setError('This portal is for salon owners only. Please use the Customer portal instead.');
        return;
      }
      setShowPortalChoice(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ ...s.page, flexDirection: isMobile ? 'column' : 'row' }}>

      {/* Mobile branded header */}
      {isMobile && (
        <div style={s.mobileHeader}>
          <div style={s.mobileHeaderBlob} />
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <div style={{ fontSize: 32, color: GOLD, marginBottom: 10, filter: 'drop-shadow(0 0 14px rgba(212,175,55,.5))' }}>◉</div>
            <div style={s.mobileTitle}>Owner Portal</div>
            <div style={s.mobileSub}>SALON MANAGEMENT SUITE</div>
          </div>
        </div>
      )}

      {/* Left panel — desktop only */}
      {!isMobile && <div style={s.left}>
        <div style={s.leftInner}>
          <img src="/logo.png" alt="BookMyStyle" style={{ width: 170, borderRadius: 10, marginBottom: 20 }} />
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
      </div>}

      {/* Right panel */}
      <div style={{ ...s.right, padding: isMobile ? '32px 20px 48px' : '60px 40px' }}>
        <div style={s.formWrap}>

          <button style={s.backBtn} onClick={() => navigate('/salon-portal')}>
            ← Back to portal select
          </button>

          <div style={s.formHeader}>
            <div style={s.logoRow}>
              <img src="/logo.png" alt="BookMyStyle" style={{ height: 36, width: 'auto', borderRadius: 6 }} />
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
                <button type="button" onClick={() => setShowPw(v => !v)} style={s.eyeBtn}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginTop: -6 }}>
              <button
                type="button"
                style={s.forgotLink}
                onClick={() => setShowForgot(true)}
              >
                Forgot your password?
              </button>
            </div>
            <button
              style={{ ...s.btn, opacity: loading ? 0.75 : 1 }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In to Owner Portal'}
            </button>
          </form>

          <div style={s.footer}>
            <p>
              Don't have an owner account?{' '}
              <Link to="/register/owner" style={s.footerLink}>Register your salon</Link>
            </p>
          </div>

        </div>
      </div>
      {/* ── Forgot password modal ── */}
      {showForgot && (
        <div style={p.overlay} onClick={closeForgot}>
          <div style={{ ...p.card, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={p.logoRow}>
              <img src="/logo.png" alt="BookMyStyle" style={{ height: 36, width: 'auto', borderRadius: 6 }} />
            </div>
            <h2 style={p.heading}>Reset Password</h2>
            <p style={{ ...p.sub, marginBottom: forgotMsg ? 20 : 28 }}>
              Enter your owner email and we'll send a reset link.
            </p>

            {forgotMsg ? (
              <>
                <div style={f.successBox}>
                  <div style={f.successIcon}>✓</div>
                  <div style={f.successText}>{forgotMsg}</div>
                </div>
                <p style={f.successNote}>Check your inbox and follow the link to set a new password. The link expires in 24 hours.</p>
                <button style={{ ...f.submitBtn, width: '100%' }} onClick={closeForgot}>Got it</button>
              </>
            ) : (
              <form onSubmit={handleForgot} style={{ width: '100%' }}>
                {forgotErr && (
                  <div style={f.errBox}><span>⚠</span> {forgotErr}</div>
                )}
                <div style={f.field}>
                  <label style={f.label}>Email address</label>
                  <input
                    style={f.input}
                    type="email"
                    placeholder="owner@yoursalon.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button type="button" style={f.cancelBtn} onClick={closeForgot}>Cancel</button>
                  <button
                    type="submit"
                    style={{ ...f.submitBtn, flex: 1, opacity: forgotLoading ? 0.75 : 1 }}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Portal choice modal ── */}
      {showPortalChoice && (
        <div style={p.overlay}>
          <div style={p.card}>
            <div style={p.logoRow}>
              <img src="/logo.png" alt="BookMyStyle" style={{ height: 36, width: 'auto', borderRadius: 6 }} />
            </div>
            <h2 style={p.heading}>Choose Your Portal</h2>
            <p style={p.sub}>How would you like to continue?</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginBottom: 12 }}>
              {/* Super Admin */}
              <button
                style={p.optBtn}
                onClick={() => { window.location.href = '/owner/dashboard'; }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = 'rgba(212,175,55,.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'; e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
              >
                <div style={{ ...p.optIcon, background: 'linear-gradient(135deg,#92701a,#D4AF37)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={p.optTitle}>Super Admin</div>
                  <div style={p.optDesc}>Full salon management dashboard — bookings, services, analytics</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {/* Admin */}
              <button
                style={p.optBtn}
                onClick={() => { window.location.href = '/admin-portal/team'; }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#14B8A8'; e.currentTarget.style.background = 'rgba(13,148,136,.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'; e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
              >
                <div style={{ ...p.optIcon, background: 'linear-gradient(135deg,#0D9488,#14B8A8)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={p.optTitle}>Admin</div>
                  <div style={p.optDesc}>Manage your team members and staff profiles</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14B8A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const GOLD = '#D4AF37';

const p = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20,
  },
  card: {
    background: 'linear-gradient(145deg,#0d0d16,#111120)',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 24, padding: '44px 40px',
    width: '100%', maxWidth: 440,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    boxShadow: '0 40px 100px rgba(0,0,0,.6)',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 },
  logoMark: { fontSize: 18, color: '#14B8A8', filter: 'drop-shadow(0 0 8px rgba(20,184,166,.4))' },
  logoBrand: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em',
  },
  heading: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 30, fontWeight: 700, color: '#ffffff',
    margin: '0 0 8px', letterSpacing: '-0.02em',
  },
  sub: { color: 'rgba(255,255,255,.38)', fontSize: 14, margin: '0 0 28px', fontFamily: "'DM Sans',sans-serif" },
  optBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
    background: 'rgba(255,255,255,.04)', border: '1.5px solid rgba(255,255,255,.1)',
    borderRadius: 16, padding: '16px 18px', cursor: 'pointer',
    transition: 'border-color .15s ease, background .15s ease',
  },
  optIcon: {
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
  },
  optTitle: {
    fontSize: 16, fontWeight: 800, color: '#fff',
    marginBottom: 3, fontFamily: "'DM Sans',sans-serif",
  },
  optDesc: {
    fontSize: 12, color: 'rgba(255,255,255,.4)', lineHeight: 1.4,
    fontFamily: "'DM Sans',sans-serif",
  },
};

const s = {
  page: { minHeight: '100vh', display: 'flex', background: 'var(--bg)' },

  mobileHeader: {
    background: 'linear-gradient(145deg, #0D0D16, #1a1400, #2a1f00)',
    padding: '32px 24px 28px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
  },
  mobileHeaderBlob: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(circle at 70% 30%, rgba(212,175,55,.2) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  mobileTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28, fontWeight: 700, color: '#fff',
    letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4,
  },
  mobileSub: {
    fontSize: 10, color: `rgba(212,175,55,.7)`,
    letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500,
  },

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
  footer: { marginTop: 28, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' },
  footerLink: { color: GOLD, fontWeight: 600, textDecoration: 'none' },
  forgotLink: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, color: `rgba(212,175,55,.7)`, fontFamily: "'DM Sans', sans-serif",
    padding: 0, textDecoration: 'underline', textUnderlineOffset: 3,
  },
};

const f = {
  field: { display: 'flex', flexDirection: 'column', gap: 7, width: '100%' },
  label: { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '0.07em' },
  input: {
    padding: '13px 16px', border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 12,
    fontSize: 15, background: 'rgba(255,255,255,.06)', color: '#fff',
    outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
  },
  errBox: {
    background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)',
    color: '#FCA5A5', borderRadius: 10, padding: '10px 14px',
    fontSize: 13, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center',
  },
  successBox: {
    background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.25)',
    borderRadius: 12, padding: '16px 18px', marginBottom: 14,
    display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', boxSizing: 'border-box',
  },
  successIcon: { fontSize: 18, color: GOLD, flexShrink: 0, fontWeight: 700 },
  successText: { fontSize: 14, color: 'rgba(255,255,255,.75)', lineHeight: 1.55 },
  successNote: { fontSize: 12, color: 'rgba(255,255,255,.35)', lineHeight: 1.6, margin: '0 0 20px', textAlign: 'center' },
  cancelBtn: {
    padding: '13px 18px', background: 'rgba(255,255,255,.06)',
    border: '1.5px solid rgba(255,255,255,.1)', borderRadius: 12,
    cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,.5)',
    fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
  },
  submitBtn: {
    padding: '13px 22px',
    background: `linear-gradient(135deg, #92701a, ${GOLD})`,
    color: '#1a1200', border: 'none', borderRadius: 12,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: `0 6px 20px rgba(212,175,55,.25)`,
  },
};

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useMobile';

export default function AdminLogin() {
  const { login, profile } = useAuth();
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.role === 'system_admin') navigate('/admin/salons', { replace: true });
  }, [profile]);

  const handleLogin = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'system_admin') {
        setError('Access denied. This portal is restricted to system administrators only.');
        return;
      }
      navigate('/admin/salons');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ ...s.page, flexDirection: isMobile ? 'column' : 'row' }}>

      {/* Mobile branded header (replaces left panel) */}
      {isMobile && (
        <div style={s.mobileHeader}>
          <div style={s.mobileHeaderBlob} />
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 48 48" fill="none" style={{ marginBottom: 10 }}>
              <path d="M24 4L6 12v14c0 10.5 7.6 20.3 18 23 10.4-2.7 18-12.5 18-23V12L24 4z"
                fill="rgba(99,102,241,.3)" stroke="#A5B4FC" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M17 24l5 5 9-9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={s.mobileTitle}>Admin Portal</div>
            <div style={s.mobileSub}>SYSTEM ADMINISTRATION</div>
          </div>
        </div>
      )}

      {/* Left panel — desktop only */}
      {!isMobile && <div style={s.left}>
        <div style={s.leftInner}>
          <div style={s.shield}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L6 12v14c0 10.5 7.6 20.3 18 23 10.4-2.7 18-12.5 18-23V12L24 4z"
                fill="rgba(99,102,241,.25)" stroke="#6366F1" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M17 24l5 5 9-9" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={s.leftTitle}>Admin Portal</div>
          <div style={s.leftTagline}>System Administration</div>
          <div style={s.leftDivider} />
          <p style={s.leftQuote}>
            "Restricted access. Authorized personnel only."
          </p>
          <div style={s.leftFeatures}>
            {[
              'Salon approvals & management',
              'Platform-wide service control',
              'User & account oversight',
            ].map(f => (
              <div key={f} style={s.leftFeature}>
                <span style={s.leftFeatureDot}>▸</span>
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

          <Link to="/" style={s.backBtn}>← Back to home</Link>

          <div style={s.formHeader}>
            <div style={s.badgeRow}>
              <span style={s.badge}>RESTRICTED ACCESS</span>
            </div>
            <h1 style={s.formTitle}>Administrator Sign In</h1>
            <p style={s.formSub}>BookMyStyle · System Administration</p>
          </div>

          {error && (
            <div style={s.alert}><span>⚠</span> {error}</div>
          )}

          <form onSubmit={handleLogin} style={s.form} autoComplete="off">
            <div style={s.field}>
              <label style={s.label}>Admin Email</label>
              <input
                style={s.input}
                type="email"
                placeholder="admin@yourdomain.com"
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
            <button style={{ ...s.btn, opacity: loading ? 0.75 : 1 }} type="submit" disabled={loading}>
              {loading ? 'Authenticating…' : '⬡ Sign In to Admin Portal'}
            </button>
          </form>

          <div style={s.notice}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="6.5" cy="6.5" r="6" stroke="#6366F1" strokeWidth="1.2"/>
              <line x1="6.5" y1="4" x2="6.5" y2="7" stroke="#6366F1" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="6.5" cy="9" r="0.8" fill="#6366F1"/>
            </svg>
            <span>Access is logged. Unauthorized login attempts are monitored.</span>
          </div>

        </div>
      </div>
    </div>
  );
}

const INDIGO = '#6366F1';
const INDIGO_LIGHT = '#A5B4FC';

const s = {
  page: { minHeight: '100vh', display: 'flex', background: 'var(--bg)' },

  mobileHeader: {
    background: 'linear-gradient(145deg, #05080F, #0D1130, #1a1a3a)',
    padding: '32px 24px 28px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
  },
  mobileHeaderBlob: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(circle at 70% 30%, rgba(99,102,241,.25) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  mobileTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28, fontWeight: 700, color: '#fff',
    letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4,
  },
  mobileSub: {
    fontSize: 10, color: 'rgba(165,180,252,.7)',
    letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500,
  },

  left: {
    flex: '0 0 42%', maxWidth: 520,
    background: 'linear-gradient(145deg, #05080F, #080C18, #0D1130, #1a1a3a)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '60px 48px', position: 'relative', overflow: 'hidden',
  },
  leftInner: { position: 'relative', zIndex: 2, color: '#fff' },
  shield: { marginBottom: 20 },
  leftTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 44, fontWeight: 700, color: '#fff',
    lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6,
  },
  leftTagline: {
    fontSize: 11, color: 'rgba(165,180,252,.65)',
    letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500,
  },
  leftDivider: {
    width: 48, height: 2, marginTop: 32, marginBottom: 28,
    background: `linear-gradient(90deg, ${INDIGO}, transparent)`, borderRadius: 2,
  },
  leftQuote: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 18, fontStyle: 'italic', lineHeight: 1.75,
    color: 'rgba(255,255,255,.55)', margin: 0,
  },
  leftFeatures: { marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 },
  leftFeature: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,.6)' },
  leftFeatureDot: { color: INDIGO_LIGHT, fontSize: 11 },
  leftBlob1: {
    position: 'absolute', width: 300, height: 300,
    background: `radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 70%)`,
    top: -80, right: -60, pointerEvents: 'none', filter: 'blur(40px)',
  },
  leftBlob2: {
    position: 'absolute', width: 250, height: 250,
    background: `radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 70%)`,
    bottom: -60, left: 20, pointerEvents: 'none', filter: 'blur(50px)',
  },

  right: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '60px 40px', background: 'var(--bg)',
  },
  formWrap: { width: '100%', maxWidth: 400 },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, color: 'var(--text-muted)',
    textDecoration: 'none', marginBottom: 32,
  },
  formHeader: { marginBottom: 28 },
  badgeRow: { marginBottom: 16 },
  badge: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
    color: INDIGO, background: `rgba(99,102,241,.1)`,
    border: `1px solid rgba(99,102,241,.3)`,
    padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase',
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
    background: `linear-gradient(135deg, #4338CA, ${INDIGO})`,
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%',
    boxShadow: `0 6px 20px rgba(99,102,241,.35), inset 0 1px 0 rgba(255,255,255,.15)`,
    fontFamily: "'DM Sans', sans-serif",
  },
  notice: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    marginTop: 24, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6,
    padding: '10px 14px', borderRadius: 10,
    background: `rgba(99,102,241,.06)`, border: `1px solid rgba(99,102,241,.15)`,
  },
};

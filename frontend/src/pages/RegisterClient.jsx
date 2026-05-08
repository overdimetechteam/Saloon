import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBreakpoint } from '../hooks/useMobile';

export default function RegisterClient() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useBreakpoint();
  const [form, setForm]     = useState({ email: '', full_name: '', phone: '', password: '' });
  const [error, setError]   = useState('');
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
    <div style={{ ...s.page, flexDirection: (isMobile || isTablet) ? 'column' : 'row' }}>
      {/* Left panel — hidden on mobile/tablet */}
      {!(isMobile || isTablet) && (
        <div style={s.left}>
          <div style={s.leftInner}>
            <div style={s.leftMark}>✦</div>
            <div style={s.leftTitle}>Join Saloon</div>
            <div style={s.leftTagline}>Beauty & Wellness</div>
            <div style={s.leftDivider} />
            <p style={s.leftQuote}>
              "Book your perfect beauty experience in seconds. Discover, book, and glow."
            </p>
            <div style={s.leftFeatures}>
              {['Discover premium salons', 'Instant appointment booking', 'Your beauty, on your schedule'].map(feat => (
                <div key={feat} style={s.leftFeature}>
                  <span style={s.leftFeatureDot}>✦</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={s.leftBlob1} />
          <div style={s.leftBlob2} />
        </div>
      )}

      {/* Mobile/tablet compact header */}
      {(isMobile || isTablet) && (
        <div style={{ background: 'linear-gradient(145deg, #1A0532 0%, #2D0A5E 50%, #7C3AED 100%)', padding: isMobile ? '28px 20px 22px' : '32px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: 22, color: '#C4B5FD', marginBottom: 6 }}>✦</div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 28 : 34, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>Join Saloon</div>
            <div style={{ fontSize: 10, color: 'rgba(196,181,253,.75)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 6 }}>Beauty & Wellness</div>
          </div>
        </div>
      )}

      {/* Right panel */}
      <div style={{ ...s.right, padding: isMobile ? '28px 20px 40px' : isTablet ? '36px 32px' : '60px 40px' }}>
        <div style={{ ...s.formWrap, maxWidth: (isMobile || isTablet) ? '100%' : 400, width: '100%' }} className="fade-up">
          <div style={s.formHeader}>
            <h1 style={{ ...s.formTitle, fontSize: isMobile ? 26 : isTablet ? 30 : 38 }}>Create account</h1>
            <p style={s.formSub}>Your luxury beauty journey starts here</p>
          </div>

          {error && (
            <div style={s.alert}>
              <span style={s.alertIcon}>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handle} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Full Name</label>
              <input style={s.input} placeholder="Jane Doe" value={form.full_name} onChange={f('full_name')} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Email address</label>
              <input style={s.input} type="email" placeholder="jane@example.com" value={form.email} onChange={f('email')} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>
                Phone <span style={s.opt}>(optional)</span>
              </label>
              <input style={s.input} placeholder="+94 77 123 4567" value={form.phone} onChange={f('phone')} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input style={s.input} type="password" placeholder="Min. 6 characters" value={form.password} onChange={f('password')} required />
            </div>
            <button style={{ ...s.btn, opacity: loading ? 0.75 : 1 }} type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div style={s.footer}>
            <p>Already have an account? <Link to="/login" style={s.footerLink}>Sign in</Link></p>
            <p style={{ marginTop: 8 }}>Own a salon? <Link to="/register/owner" style={s.footerLink}>Register your salon</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', background: 'var(--bg)' },

  left: {
    flex: '0 0 42%', maxWidth: 520,
    background: 'linear-gradient(145deg, #1A0532 0%, #2D0A5E 30%, #5B21B6 65%, #7C3AED 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '60px 48px', position: 'relative', overflow: 'hidden',
  },
  leftInner: { position: 'relative', zIndex: 2, color: '#fff' },
  leftMark: { fontSize: 32, fontWeight: 900, color: '#7C3AED', marginBottom: 12, filter: 'drop-shadow(0 0 12px rgba(124,58,237,.5))' },
  leftTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 44, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6 },
  leftTagline: { fontSize: 11, color: 'rgba(196,181,253,.75)', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500 },
  leftDivider: { width: 48, height: 2, marginTop: 32, marginBottom: 28, background: 'linear-gradient(90deg, #7C3AED, transparent)', borderRadius: 2 },
  leftQuote: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 19, fontStyle: 'italic', lineHeight: 1.7, color: 'rgba(255,255,255,.75)', margin: 0 },
  leftFeatures: { marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 },
  leftFeature: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,.7)' },
  leftFeatureDot: { color: '#BF9B65', fontSize: 10 },
  leftBlob1: { position: 'absolute', width: 300, height: 300, background: 'radial-gradient(circle, rgba(124,58,237,.2) 0%, transparent 70%)', top: -80, right: -60, pointerEvents: 'none', filter: 'blur(40px)' },
  leftBlob2: { position: 'absolute', width: 250, height: 250, background: 'radial-gradient(circle, rgba(124,58,237,.15) 0%, transparent 70%)', bottom: -60, left: 20, pointerEvents: 'none', filter: 'blur(50px)' },

  right: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', background: 'var(--bg)' },
  formWrap: { width: '100%', maxWidth: 400 },
  formHeader: { marginBottom: 32 },
  formTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 38, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 },
  formSub: { color: 'var(--text-muted)', fontSize: 15, marginTop: 8 },

  alert: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '12px 16px', fontSize: 13, marginBottom: 22, display: 'flex', alignItems: 'center', gap: 8 },
  alertIcon: { fontSize: 14, flexShrink: 0 },

  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', letterSpacing: '0.01em' },
  opt: { color: 'var(--text-light)', fontWeight: 400 },
  input: { padding: '13px 16px', border: '1.5px solid var(--border)', borderRadius: 12, fontSize: 15, background: 'var(--input-bg)', color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" },
  btn: { marginTop: 4, padding: '14px', background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #0D9488 100%)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', width: '100%', boxShadow: '0 6px 20px rgba(124,58,237,.35), inset 0 1px 0 rgba(255,255,255,.15)' },
  footer: { marginTop: 28, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' },
  footerLink: { color: '#7C3AED', fontWeight: 600 },
};
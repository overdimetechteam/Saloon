import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBreakpoint } from '../hooks/useMobile';
import { checkPasswordStrength, PASSWORD_REQUIREMENT_TEXT } from '../utils/passwordStrength';
import api from '../api/axios';

export default function RegisterClient() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isMobile, isTablet } = useBreakpoint();
  const [form, setForm]         = useState({ email: '', full_name: '', phone: '', password: '' });
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [verifyEmail, setVerifyEmail]       = useState('');
  const [emailSentOk, setEmailSentOk]       = useState(true);
  const [alreadyExists, setAlreadyExists]   = useState(false);
  const [resendLoading, setResendLoading]   = useState(false);
  const [resendMsg, setResendMsg]           = useState('');
  const [resendErr, setResendErr]           = useState('');
  const f = k => e => setForm({ ...form, [k]: e.target.value });

  const pwStrength = checkPasswordStrength(form.password);

  const handle = async e => {
    e.preventDefault(); setError('');
    if (!pwStrength.valid) return setError(PASSWORD_REQUIREMENT_TEXT);
    setLoading(true);
    try {
      const result = await register({ ...form, role: 'client' });
      if (result.requires_verification) {
        setVerifyEmail(form.email);
        setEmailSentOk(result.email_sent !== false);
        setAlreadyExists(result.already_exists === true);
        return;
      }
      navigate(searchParams.get('next') || '/user/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.email) {
        setError(Array.isArray(data.email) ? data.email[0] : data.email);
      } else {
        setError(typeof data === 'string' ? data : Object.values(data || {}).flat().join(' '));
      }
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResendLoading(true); setResendMsg(''); setResendErr('');
    try {
      const r = await api.post('/auth/resend-verification/', { email: verifyEmail });
      setResendMsg(r.data.message || 'Verification email sent!');
      setEmailSentOk(true);
    } catch (e) {
      setResendErr(e.response?.data?.detail || 'Failed to send. Please try again.');
    } finally { setResendLoading(false); }
  };

  if (verifyEmail) return (
    <div style={s.page}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 20px 56px rgba(13,148,136,.1)' }}>

          <div style={{ fontSize: 48, marginBottom: 18 }}>{emailSentOk ? '📬' : '⚠️'}</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 12px' }}>
            {!emailSentOk ? 'Could not send email' : alreadyExists ? 'Verification resent' : 'Check your email'}
          </h2>

          {emailSentOk ? (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7, margin: '0 0 8px' }}>
                {alreadyExists
                  ? 'This email is already registered but not yet verified. We\'ve resent the link to'
                  : 'We sent a verification link to'}
              </p>
              <p style={{ color: '#0D9488', fontWeight: 700, fontSize: 15, margin: '0 0 24px', wordBreak: 'break-all' }}>{verifyEmail}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, margin: '0 0 24px' }}>
                Click the link in that email to activate your account. Check your spam folder if you don't see it.
              </p>
            </>
          ) : (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, margin: '0 0 8px' }}>
                Your account was created but we couldn't send the verification email to
              </p>
              <p style={{ color: '#0D9488', fontWeight: 700, fontSize: 15, margin: '0 0 16px', wordBreak: 'break-all' }}>{verifyEmail}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, margin: '0 0 24px' }}>
                Click the button below to try sending it again.
              </p>
            </>
          )}

          {/* Resend section */}
          {resendMsg && (
            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#166534', marginBottom: 16 }}>
              ✓ {resendMsg}
            </div>
          )}
          {resendErr && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>
              {resendErr}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!emailSentOk && (
              <button
                onClick={handleResend}
                disabled={resendLoading}
                style={{ padding: '13px 32px', background: 'linear-gradient(135deg,#0D9488,#14B8A8)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: resendLoading ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif" }}
              >
                {resendLoading ? 'Sending…' : '↺ Resend Verification Email'}
              </button>
            )}
            {emailSentOk && !resendMsg && (
              <button
                onClick={handleResend}
                disabled={resendLoading}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0D9488', fontSize: 13, fontWeight: 600, padding: '4px 0', textDecoration: 'underline', fontFamily: "'DM Sans', sans-serif", opacity: resendLoading ? 0.6 : 1 }}
              >
                {resendLoading ? 'Sending…' : "Didn't receive it? Resend"}
              </button>
            )}
            <Link to="/login" style={{ display: 'inline-block', padding: '12px 32px', background: emailSentOk ? 'linear-gradient(135deg,#0D9488,#14B8A8)' : 'transparent', color: emailSentOk ? '#fff' : '#0D9488', border: emailSentOk ? 'none' : '1.5px solid #0D9488', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ ...s.page, flexDirection: (isMobile || isTablet) ? 'column' : 'row' }}>
      {/* Left panel — hidden on mobile/tablet */}
      {!(isMobile || isTablet) && (
        <div style={s.left}>
          <div style={s.leftInner}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px 30px', marginBottom: 22, boxShadow: '0 0 60px rgba(13,148,136,.45), 0 14px 36px rgba(0,0,0,.45)' }}>
              <img src="/logo.png" alt="BookMyStyle" style={{ width: 180, height: 'auto', display: 'block' }} />
            </div>
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
        <div style={{ background: 'linear-gradient(145deg, #0D0D16 0%, #0B3832 50%, #0D9488 100%)', padding: isMobile ? '28px 20px 22px' : '32px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: '10px 20px', marginBottom: 8, display: 'inline-block', boxShadow: '0 4px 24px rgba(0,0,0,.35)' }}>
              <img src="/logo.png" alt="BookMyStyle" style={{ width: 100, height: 'auto', display: 'block' }} />
            </div>
            <div style={{ fontSize: 10, color: 'rgba(153,246,228,.75)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>Beauty & Wellness</div>
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

          <form onSubmit={handle} style={s.form} autoComplete="off">
            <div style={s.field}>
              <label style={s.label}>Full Name</label>
              <input style={s.input} placeholder="Jane Doe" value={form.full_name} onChange={f('full_name')} autoComplete="off" required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Email address</label>
              <input style={s.input} type="email" placeholder="jane@example.com" value={form.email} onChange={f('email')} autoComplete="off" required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Phone</label>
              <input style={s.input} placeholder="+94 77 123 4567" value={form.phone} onChange={f('phone')} autoComplete="off" required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...s.input, paddingRight: 44 }} type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={f('password')} autoComplete="new-password" required minLength={8} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', padding: '2px 4px' }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
              {form.password && (
                <div>
                  <div style={s.pwBarTrack}>
                    <div style={{ ...s.pwBarFill, width: `${(pwStrength.score / 5) * 100}%`, background: pwStrength.color }} />
                  </div>
                  <div style={{ ...s.pwLabel, color: pwStrength.color }}>{pwStrength.label}</div>
                </div>
              )}
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
    background: 'linear-gradient(145deg, #0D0D16, #1A1A24, #0B3832, #0D9488)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '60px 48px', position: 'relative', overflow: 'hidden',
  },
  leftInner: { position: 'relative', zIndex: 2, color: '#fff' },
  leftMark: { fontSize: 32, fontWeight: 900, color: '#0D9488', marginBottom: 12, filter: 'drop-shadow(0 0 12px rgba(13,148,136,.5))' },
  leftTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 44, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6 },
  leftTagline: { fontSize: 11, color: 'rgba(153,246,228,.75)', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500 },
  leftDivider: { width: 48, height: 2, marginTop: 32, marginBottom: 28, background: 'linear-gradient(90deg, #0D9488, transparent)', borderRadius: 2 },
  leftQuote: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 19, fontStyle: 'italic', lineHeight: 1.7, color: 'rgba(255,255,255,.75)', margin: 0 },
  leftFeatures: { marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 },
  leftFeature: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,.7)' },
  leftFeatureDot: { color: '#D4AF37', fontSize: 10 },
  leftBlob1: { position: 'absolute', width: 300, height: 300, background: 'radial-gradient(circle, rgba(13,148,136,.2) 0%, transparent 70%)', top: -80, right: -60, pointerEvents: 'none', filter: 'blur(40px)' },
  leftBlob2: { position: 'absolute', width: 250, height: 250, background: 'radial-gradient(circle, rgba(13,148,136,.15) 0%, transparent 70%)', bottom: -60, left: 20, pointerEvents: 'none', filter: 'blur(50px)' },

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
  pwBarTrack: { marginTop: 8, height: 5, borderRadius: 4, background: 'var(--surface2)', overflow: 'hidden' },
  pwBarFill: { height: '100%', borderRadius: 4, transition: 'width .2s ease, background .2s ease' },
  pwLabel: { fontSize: 11, fontWeight: 600, marginTop: 4 },
  input: { padding: '13px 16px', border: '1.5px solid var(--border)', borderRadius: 12, fontSize: 15, background: 'var(--input-bg)', color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" },
  btn: { marginTop: 4, padding: '14px', background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', width: '100%', boxShadow: '0 6px 20px rgba(13,148,136,.35), inset 0 1px 0 rgba(255,255,255,.15)' },
  footer: { marginTop: 28, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' },
  footerLink: { color: '#0D9488', fontWeight: 600 },
};
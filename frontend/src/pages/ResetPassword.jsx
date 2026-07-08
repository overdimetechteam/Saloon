import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const uid   = searchParams.get('uid')   || '';
  const token = searchParams.get('token') || '';

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState('');
  const [errorCode, setErrorCode] = useState('');   // 'used' | 'expired' | 'invalid' | 'validation'
  const [errorMsg, setErrorMsg]   = useState('');

  const handle = async e => {
    e.preventDefault();
    setErrorCode(''); setErrorMsg(''); setMsg('');
    if (password.length < 6) { setErrorCode('validation'); setErrorMsg('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setErrorCode('validation'); setErrorMsg('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const r = await api.post('/auth/reset-password/', { uid, token, password });
      setMsg(r.data.message);
    } catch (err) {
      const code   = err.response?.data?.code   || 'invalid';
      const detail = err.response?.data?.detail || 'Reset failed. The link may have expired.';
      setErrorCode(code);
      setErrorMsg(detail);
    } finally { setLoading(false); }
  };

  if (!uid || !token) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.stateIcon}>⚠</div>
        <h2 style={s.title}>Invalid Reset Link</h2>
        <p style={s.sub}>This password reset link is missing required parameters.</p>
        <Link to="/owner/login" style={s.btn}>Back to Owner Login</Link>
      </div>
    </div>
  );

  // Terminal error states — expired or already used → don't show the form
  const isTerminal = errorCode === 'expired' || errorCode === 'used' || errorCode === 'invalid';

  return (
    <div style={s.page}>
      <div style={s.card} className="fade-up">
        <div style={s.mark}>✦</div>

        {/* Success */}
        {msg && (
          <>
            <div style={s.stateIcon}>✓</div>
            <h1 style={s.title}>Password Reset</h1>
            <div style={s.alertOk}>{msg}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
              <Link to="/owner/login" style={s.btn}>Owner Login</Link>
              <Link to="/login" style={{ ...s.btn, background: 'linear-gradient(135deg,#1e3a2f,#166534)', boxShadow: 'none' }}>Customer Login</Link>
            </div>
          </>
        )}

        {/* Expired link */}
        {!msg && errorCode === 'expired' && (
          <>
            <div style={s.stateIcon}>⏱</div>
            <h1 style={{ ...s.title, color: '#D4AF37' }}>Link Has Expired</h1>
            <p style={s.sub}>This password reset link has expired. Reset links are valid for 24 hours.</p>
            <div style={s.alertWarn}>
              {errorMsg}
            </div>
            <Link to="/owner/login" style={{ ...s.btn, marginTop: 20, display: 'inline-block' }}
              onClick={e => { e.preventDefault(); window.location.href = '/owner/login'; }}>
              Request a New Link
            </Link>
          </>
        )}

        {/* Already used */}
        {!msg && errorCode === 'used' && (
          <>
            <div style={s.stateIcon}>🔒</div>
            <h1 style={{ ...s.title, color: '#DC2626' }}>Link Already Used</h1>
            <p style={s.sub}>This reset link has already been used. Each link can only be used once.</p>
            <div style={s.alertErr}>{errorMsg}</div>
            <Link to="/owner/login" style={{ ...s.btn, marginTop: 20, display: 'inline-block' }}
              onClick={e => { e.preventDefault(); window.location.href = '/owner/login'; }}>
              Request a New Link
            </Link>
          </>
        )}

        {/* Invalid (tampered / unknown) */}
        {!msg && errorCode === 'invalid' && (
          <>
            <div style={s.stateIcon}>⚠</div>
            <h1 style={s.title}>Invalid Reset Link</h1>
            <p style={s.sub}>This link is not recognised. It may have been tampered with or already expired.</p>
            <div style={s.alertErr}>{errorMsg}</div>
            <Link to="/owner/login" style={{ ...s.btn, marginTop: 20, display: 'inline-block' }}
              onClick={e => { e.preventDefault(); window.location.href = '/owner/login'; }}>
              Request a New Link
            </Link>
          </>
        )}

        {/* Normal form state */}
        {!msg && !isTerminal && (
          <>
            <h1 style={s.title}>Set New Password</h1>
            <p style={s.sub}>Choose a strong password for your account.</p>

            {errorCode === 'validation' && (
              <div style={s.alertErr}><span>⚠</span> {errorMsg}</div>
            )}

            <form onSubmit={handle} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...s.input, paddingRight: 44 }}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', padding: '2px 4px' }}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Confirm Password</label>
                <input
                  style={s.input}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <button style={{ ...s.btn, opacity: loading ? 0.75 : 1, width: '100%', textAlign: 'center', display: 'block' }} type="submit" disabled={loading}>
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg)', padding: '24px 16px',
  },
  card: {
    background: 'var(--surface)', borderRadius: 24, padding: '44px 36px',
    maxWidth: 420, width: '100%',
    boxShadow: '0 8px 40px rgba(13,148,136,.1)', border: '1px solid var(--border)',
  },
  mark: { fontSize: 28, color: '#0D9488', marginBottom: 14, display: 'block', filter: 'drop-shadow(0 0 10px rgba(13,148,136,.45))' },
  stateIcon: { fontSize: 36, marginBottom: 14, display: 'block' },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 30, fontWeight: 700, color: 'var(--text)',
    margin: '0 0 8px', letterSpacing: '-0.02em',
  },
  sub: { fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 },
  alertErr: {
    background: '#FEF2F2', border: '1px solid #FCA5A5',
    color: '#DC2626', borderRadius: 12, padding: '12px 16px',
    fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8,
  },
  alertWarn: {
    background: 'rgba(212,175,55,.08)', border: '1px solid rgba(212,175,55,.3)',
    color: '#D4AF37', borderRadius: 12, padding: '12px 16px',
    fontSize: 13, marginBottom: 4,
  },
  alertOk: {
    background: '#F0FDFA', border: '1px solid #99F6E4',
    color: '#0D9488', borderRadius: 12, padding: '16px 18px', fontSize: 14, fontWeight: 500,
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
  btn: {
    padding: '13px 28px',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(13,148,136,.35)',
    textDecoration: 'none', display: 'inline-block',
  },
};

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const uid   = searchParams.get('uid')   || '';
  const token = searchParams.get('token') || '';

  const [state, setState] = useState('loading'); // loading | success | error
  const [msg, setMsg]     = useState('');

  useEffect(() => {
    if (!uid || !token) { setState('error'); setMsg('Invalid verification link.'); return; }
    api.post('/auth/verify-email/', { uid, token })
      .then(r => { setState('success'); setMsg(r.data.message); })
      .catch(e => { setState('error'); setMsg(e.response?.data?.detail || 'Verification failed.'); });
  }, []);

  return (
    <div style={s.page}>
      <div style={s.card} className="fade-up">
        {state === 'loading' && (
          <>
            <div style={s.spinner} />
            <p style={s.sub}>Verifying your email…</p>
          </>
        )}
        {state === 'success' && (
          <>
            <div style={s.icon}>✓</div>
            <h2 style={s.title}>Email Verified!</h2>
            <p style={s.sub}>{msg}</p>
            <Link to="/login" style={s.btn}>Sign In Now</Link>
          </>
        )}
        {state === 'error' && (
          <>
            <div style={{ ...s.icon, background: '#FEF2F2', color: '#DC2626' }}>✕</div>
            <h2 style={s.title}>Verification Failed</h2>
            <p style={s.sub}>{msg}</p>
            <Link to="/login" style={s.btn}>Back to Login</Link>
          </>
        )}
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
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22,
    padding: '52px 40px', maxWidth: 400, width: '100%', textAlign: 'center',
    boxShadow: '0 20px 56px rgba(13,148,136,.1)',
  },
  spinner: {
    width: 44, height: 44, border: '3px solid var(--border)',
    borderTopColor: '#0D9488', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite', margin: '0 auto 20px',
  },
  icon: {
    width: 56, height: 56, borderRadius: '50%',
    background: 'rgba(13,148,136,.12)', color: '#0D9488',
    fontSize: 24, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28, fontWeight: 700, color: 'var(--text)',
    margin: '0 0 10px', letterSpacing: '-0.02em',
  },
  sub: { color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, margin: '0 0 28px' },
  btn: {
    display: 'inline-block', padding: '13px 36px',
    background: 'linear-gradient(135deg,#0D9488,#14B8A8)',
    color: '#fff', borderRadius: 12, textDecoration: 'none',
    fontWeight: 600, fontSize: 14,
    boxShadow: '0 6px 20px rgba(13,148,136,.35)',
  },
};

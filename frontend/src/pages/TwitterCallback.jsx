import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const roleRedirect = (role) => {
  if (role === 'system_admin') return '/admin/salons';
  if (role === 'salon_owner') return '/salon-portal';
  if (role === 'employee') return '/employee/profile';
  return '/user/dashboard';
};

export default function TwitterCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { socialLogin } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error || !code || !state) {
      navigate('/login?error=twitter_cancelled', { replace: true });
      return;
    }

    api.post('/auth/social/twitter/callback/', { code, state })
      .then(({ data }) => {
        const user = socialLogin(data);
        navigate(roleRedirect(user.role), { replace: true });
      })
      .catch(() => {
        navigate('/login?error=twitter_failed', { replace: true });
      });
  }, []);

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.icon}>𝕏</div>
        <p style={s.text}>Completing sign in…</p>
        <div style={s.spinner} />
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
  },
  card: {
    textAlign: 'center',
    padding: '48px 40px',
    background: 'var(--surface)',
    borderRadius: 24,
    border: '1px solid var(--border)',
    boxShadow: '0 8px 32px rgba(0,0,0,.12)',
  },
  icon: {
    fontSize: 40,
    fontWeight: 900,
    color: 'var(--text)',
    marginBottom: 16,
    fontFamily: 'system-ui, sans-serif',
  },
  text: { fontSize: 15, color: 'var(--text-muted)', marginBottom: 20 },
  spinner: {
    width: 28,
    height: 28,
    border: '3px solid var(--border)',
    borderTopColor: '#0D9488',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  },
};

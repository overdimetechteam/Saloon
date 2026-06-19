import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SalonPortalSelect() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.mark}>✦</div>
        <h1 style={s.title}>BookMyStyle Portal</h1>
        <p style={s.sub}>Choose how you'd like to continue</p>

        <div style={s.options}>
          <button style={s.optionBtn} onClick={() => navigate('/owner/login')}>
            <span style={s.optIcon}>◈</span>
            <div>
              <div style={s.optLabel}>Salon Owner Dashboard</div>
              <div style={s.optDesc}>Manage bookings, staff, services & more</div>
            </div>
          </button>

          <div style={s.divider}>or</div>

          <button
            style={{ ...s.optionBtn, ...s.optionBtnAlt }}
            onClick={() => navigate('/employee/login')}
          >
            <span style={s.optIcon}>◉</span>
            <div>
              <div style={s.optLabel}>Staff Login</div>
              <div style={s.optDesc}>Log in as a salon employee to manage your profile</div>
            </div>
          </button>
        </div>

        {profile && <p style={s.hint}>Logged in as {profile.email}</p>}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg)', padding: 24,
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '48px 40px',
    maxWidth: 460, width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,.12)',
  },
  mark: {
    fontSize: 28, color: '#0D9488',
    filter: 'drop-shadow(0 0 10px rgba(13,148,136,.4))',
    marginBottom: 12,
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 36, fontWeight: 700, color: 'var(--text)',
    margin: '0 0 8px', letterSpacing: '-0.02em',
  },
  sub: { color: 'var(--text-muted)', fontSize: 15, margin: '0 0 36px' },
  options: { display: 'flex', flexDirection: 'column', gap: 0 },
  optionBtn: {
    display: 'flex', alignItems: 'center', gap: 16,
    background: 'var(--surface2)', border: '1.5px solid var(--border)',
    borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
    textAlign: 'left', width: '100%', transition: 'border-color .15s, box-shadow .15s',
  },
  optionBtnAlt: {
    background: 'transparent',
    border: '1.5px solid var(--border)',
  },
  optIcon: { fontSize: 22, color: '#0D9488', flexShrink: 0 },
  optLabel: { fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 },
  optDesc: { fontSize: 13, color: 'var(--text-muted)' },
  divider: {
    textAlign: 'center', padding: '14px 0',
    fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.05em',
  },
  hint: { marginTop: 28, fontSize: 12, color: 'var(--text-muted)' },
};

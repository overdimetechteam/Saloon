import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SalonPortalSelect() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const ownerDest    = profile?.role === 'salon_owner' ? '/owner/dashboard'   : '/owner/login';
  const employeeDest = profile?.role === 'employee'    ? '/employee/profile'  : '/employee/login';

  const handleOwner = () => navigate(ownerDest);
  const handleEmployee = () => navigate(employeeDest);

  const handleSwitch = async () => {
    await logout();
    // stay on this page so the user can pick their portal fresh
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.mark}>✦</div>
        <h1 style={s.title}>BookMyStyle Portal</h1>
        <p style={s.sub}>Choose how you'd like to continue</p>

        {profile && (
          <div style={s.sessionBanner}>
            <span style={s.sessionDot} />
            <span style={s.sessionText}>
              Signed in as <strong>{profile.email || profile.full_name}</strong>
            </span>
            <button style={s.switchBtn} onClick={handleSwitch}>Switch account</button>
          </div>
        )}

        <div style={s.options}>
          <button style={s.optionBtn} onClick={handleOwner}>
            <span style={s.optIcon}>◈</span>
            <div>
              <div style={s.optLabel}>
                {profile?.role === 'salon_owner' ? 'Go to Owner Dashboard' : 'Salon Owner Dashboard'}
              </div>
              <div style={s.optDesc}>
                {profile?.role === 'salon_owner'
                  ? 'Continue to your salon management dashboard'
                  : 'Manage bookings, staff, services & more'}
              </div>
            </div>
            {profile?.role === 'salon_owner' && <span style={s.chevron}>→</span>}
          </button>

          <div style={s.divider}>or</div>

          <button
            style={{ ...s.optionBtn, ...s.optionBtnAlt }}
            onClick={handleEmployee}
          >
            <span style={s.optIcon}>◉</span>
            <div>
              <div style={s.optLabel}>
                {profile?.role === 'employee' ? 'Go to Staff Profile' : 'Staff Login'}
              </div>
              <div style={s.optDesc}>
                {profile?.role === 'employee'
                  ? 'Continue to your employee profile'
                  : 'Log in as a salon employee to manage your profile'}
              </div>
            </div>
            {profile?.role === 'employee' && <span style={s.chevron}>→</span>}
          </button>
        </div>

        <button style={s.back} onClick={() => navigate('/portal')}>← Back</button>
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
  sub: { color: 'var(--text-muted)', fontSize: 15, margin: '0 0 20px' },

  sessionBanner: {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
    justifyContent: 'center',
    background: 'rgba(13,148,136,.08)', border: '1px solid rgba(13,148,136,.2)',
    borderRadius: 10, padding: '10px 14px', marginBottom: 24, fontSize: 13,
  },
  sessionDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#0D9488', flexShrink: 0,
    boxShadow: '0 0 6px rgba(13,148,136,.6)',
  },
  sessionText: { color: 'var(--text-sub)', flex: 1, textAlign: 'left', minWidth: 0 },
  switchBtn: {
    background: 'none', border: '1px solid var(--border)',
    borderRadius: 6, padding: '3px 10px', fontSize: 12,
    color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0,
    fontFamily: "'DM Sans', sans-serif",
  },

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
  chevron: { marginLeft: 'auto', fontSize: 18, color: '#0D9488', flexShrink: 0 },
  divider: {
    textAlign: 'center', padding: '14px 0',
    fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.05em',
  },
  back: {
    marginTop: 28, background: 'none', border: 'none',
    color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
};

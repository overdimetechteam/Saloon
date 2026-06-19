import { Link } from 'react-router-dom';

export default function AdminEmailVerified() {
  return (
    <div style={s.page}>
      <div style={s.card} className="scale-in">
        <div style={s.orb}>✦</div>
        <div style={s.checkCircle}>✓</div>
        <h1 style={s.title}>Email Verified!</h1>
        <p style={s.sub}>
          Your admin notification email has been successfully verified.
          You'll now receive alerts whenever a new salon registers on BookMyStyle.
        </p>
        <Link to="/admin/login" style={s.btn}>
          Log in to Admin Portal →
        </Link>
        <p style={s.hint}>You can manage notification settings inside Admin → Settings</p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(145deg, #0D0D16 0%, #111120 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 20px',
  },
  card: {
    background: '#1a1a2e',
    border: '1px solid rgba(13,148,136,.25)',
    borderRadius: 24,
    padding: '52px 44px',
    maxWidth: 460,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 32px 80px rgba(0,0,0,.6)',
  },
  orb: {
    fontSize: 28, color: '#0D9488',
    marginBottom: 8,
    filter: 'drop-shadow(0 0 16px rgba(13,148,136,.5))',
  },
  checkCircle: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'linear-gradient(135deg, #0D9488, #14B8A8)',
    color: '#fff', fontSize: 30, fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: '0 8px 28px rgba(13,148,136,.4)',
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 32, fontWeight: 700, color: '#fff',
    margin: '0 0 14px', letterSpacing: '-0.01em',
  },
  sub: {
    color: '#9CA3AF', fontSize: 15, lineHeight: 1.7,
    margin: '0 0 32px',
  },
  btn: {
    display: 'inline-block',
    padding: '14px 36px',
    background: 'linear-gradient(135deg, #0D9488, #14B8A8)',
    color: '#fff', borderRadius: 12,
    textDecoration: 'none', fontWeight: 700, fontSize: 15,
    boxShadow: '0 6px 24px rgba(13,148,136,.4)',
    fontFamily: "'DM Sans', sans-serif",
  },
  hint: {
    marginTop: 20, color: 'rgba(94,234,212,.4)', fontSize: 12,
  },
};

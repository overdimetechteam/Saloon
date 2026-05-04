import { Link, useNavigate } from 'react-router-dom';
import { c } from '../styles/theme';

export default function Navbar() {
  return (
    <header style={s.nav}>
      <Link to="/salons" style={s.brand}>
        <span style={s.logo}>💇</span>
        <span style={s.name}>SalonSystem</span>
      </Link>
      <div style={s.links}>
        <Link to="/salons" style={s.link}>Browse Salons</Link>
        <Link to="/login" style={s.linkBtn}>Sign In</Link>
        <Link to="/register/user" style={s.primaryBtn}>Get Started</Link>
      </div>
    </header>
  );
}

const s = {
  nav: { height: 64, background: '#FFFFFF', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  brand: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  logo: { fontSize: 24 },
  name: { fontWeight: 800, fontSize: 20, color: c.text },
  links: { display: 'flex', alignItems: 'center', gap: 12 },
  link: { padding: '6px 14px', textDecoration: 'none', color: c.textMuted, fontSize: 14, fontWeight: 500 },
  linkBtn: { padding: '8px 18px', textDecoration: 'none', color: c.text, fontSize: 14, fontWeight: 500, border: `1px solid ${c.border}`, borderRadius: 8 },
  primaryBtn: { padding: '8px 18px', textDecoration: 'none', color: '#fff', fontSize: 14, fontWeight: 600, background: c.primary, borderRadius: 8 },
};

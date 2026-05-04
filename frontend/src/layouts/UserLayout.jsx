import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { c } from '../styles/theme';

const NAV = [
  { to: '/user/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/user/bookings',  label: 'My Bookings', icon: '📅' },
  { to: '/salons',         label: 'Browse Salons', icon: '🔍' },
];

export default function UserLayout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (profile?.full_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={s.shell}>
      <header style={s.header}>
        <Link to="/salons" style={s.brand}>
          <span style={s.brandIcon}>💇</span>
          <span style={s.brandName}>SalonSystem</span>
        </Link>
        <nav style={s.nav}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to}
              style={({ isActive }) => ({ ...s.navLink, ...(isActive ? s.navLinkActive : {}) })}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={s.userArea}>
          <div style={s.avatar}>{initials}</div>
          <span style={s.userName}>{profile?.full_name?.split(' ')[0]}</span>
          <button style={s.logoutBtn} onClick={handleLogout}>Sign Out</button>
        </div>
      </header>
      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}

const s = {
  shell: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: c.bg },
  header: { height: 64, background: c.surface, borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 32, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  brand: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 },
  brandIcon: { fontSize: 22 },
  brandName: { fontWeight: 700, fontSize: 18, color: c.text },
  nav: { display: 'flex', gap: 4, flex: 1 },
  navLink: { padding: '6px 14px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500, color: c.textMuted },
  navLinkActive: { background: c.primarySoft, color: c.primary },
  userArea: { display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: c.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 },
  userName: { fontSize: 14, fontWeight: 500, color: c.text },
  logoutBtn: { padding: '6px 14px', background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, color: c.textMuted },
  main: { flex: 1, padding: '32px', maxWidth: 1100, margin: '0 auto', width: '100%' },
};

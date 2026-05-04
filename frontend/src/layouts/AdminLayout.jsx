import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { c, shadow } from '../styles/theme';

const NAV = [
  { to: '/admin/salons',         icon: '🏪', label: 'All Salons' },
  { to: '/admin/salons/pending', icon: '⏳', label: 'Pending Approvals' },
  { to: '/admin/services',       icon: '✂️',  label: 'Global Services' },
];

export default function AdminLayout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (profile?.full_name || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <div style={s.brandIcon}>💇</div>
          <div>
            <div style={s.brandName}>SalonSystem</div>
            <div style={s.brandRole}>Admin Portal</div>
          </div>
        </div>

        <div style={s.divider} />

        <nav style={s.nav}>
          <div style={s.navGroup}>NAVIGATION</div>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/admin/salons'}
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}>
              <span style={s.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={s.sidebarFooter}>
          <div style={s.divider} />
          <div style={s.userRow}>
            <div style={s.avatar}>{initials}</div>
            <div style={s.userInfo}>
              <div style={s.userName}>{profile?.full_name}</div>
              <div style={s.userEmail}>{profile?.email}</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: c.bg },
  sidebar: { width: 260, background: c.sidebar, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100, flexShrink: 0 },
  brand: { display: 'flex', alignItems: 'center', gap: 12, padding: '24px 20px' },
  brandIcon: { fontSize: 28, width: 44, height: 44, background: c.primary, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandName: { color: '#FFFFFF', fontWeight: 700, fontSize: 16 },
  brandRole: { color: c.sidebarText, fontSize: 11, marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.05em' },
  divider: { height: 1, background: c.sidebarBorder, margin: '0 20px' },
  nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 },
  navGroup: { fontSize: 10, fontWeight: 600, color: c.sidebarIcon, letterSpacing: '0.08em', padding: '8px 8px 4px', textTransform: 'uppercase' },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: c.sidebarText, textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'all 0.15s' },
  navActive: { background: c.sidebarActive, color: '#FFFFFF' },
  navIcon: { fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 },
  sidebarFooter: { padding: '0 12px 16px' },
  userRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 8px' },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: c.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { color: '#FFFFFF', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { color: c.sidebarText, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  logoutBtn: { width: '100%', padding: '8px 12px', background: 'transparent', border: `1px solid ${c.sidebarBorder}`, color: c.sidebarText, borderRadius: 8, cursor: 'pointer', fontSize: 13, textAlign: 'left', marginTop: 4 },
  main: { marginLeft: 260, flex: 1, minHeight: '100vh', padding: 32, maxWidth: '100%' },
};

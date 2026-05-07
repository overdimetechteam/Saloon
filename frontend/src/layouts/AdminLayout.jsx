import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV = [
  { to: '/admin/salons',         icon: '◈', label: 'All Salons' },
  { to: '/admin/salons/pending', icon: '⏳', label: 'Pending Approvals' },
  { to: '/admin/services',       icon: '◇', label: 'Global Services' },
];

export default function AdminLayout() {
  const { profile, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (profile?.full_name || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <aside style={s.sidebar}>
        {/* Brand */}
        <div style={s.brand}>
          <div style={s.brandIcon}>✦</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.brandName}>SalonSystem</div>
            <div style={s.brandRole}>Admin Portal</div>
          </div>
          <button
            onClick={toggle}
            title={isDark ? 'Light mode' : 'Dark mode'}
            style={s.toggleBtn}
          >
            {isDark ? '☀' : '☾'}
          </button>
        </div>

        <div style={s.divider} />

        {/* Nav */}
        <nav style={s.nav}>
          <div style={s.navGroup}>NAVIGATION</div>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin/salons'}
              className="nav-salon"
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}
            >
              <span style={s.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={s.sidebarFooter}>
          <div style={s.divider} />
          <div style={s.userRow}>
            <div style={s.avatar}>{initials}</div>
            <div style={s.userInfo}>
              <div style={s.userName}>{profile?.full_name}</div>
              <div style={s.userEmail}>{profile?.email}</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>⎋ Sign Out</button>
        </div>
      </aside>

      <main style={s.main}>
        <div className="fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const s = {
  sidebar: {
    width: 260, background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
    display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, height: '100vh',
    zIndex: 100, flexShrink: 0,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10, padding: '22px 16px 14px' },
  brandIcon: {
    fontSize: 16, width: 36, height: 36,
    background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)',
    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 900, flexShrink: 0,
    boxShadow: '0 4px 12px rgba(124,58,237,.35)',
  },
  brandName: { color: '#FFFFFF', fontWeight: 700, fontSize: 15 },
  brandRole: { color: '#7C3AED', fontSize: 9, marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.1em' },
  toggleBtn: {
    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
    background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)',
    color: '#94A3B8', cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginLeft: 'auto',
  },
  divider: { height: 1, background: 'rgba(124,58,237,.15)', margin: '0 16px' },
  nav:      { flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 2 },
  navGroup: {
    fontSize: 9, fontWeight: 700, color: '#6D28D9',
    letterSpacing: '0.12em', padding: '8px 10px 5px', textTransform: 'uppercase',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
    borderRadius: 9, color: '#94A3B8', textDecoration: 'none',
    fontSize: 13, fontWeight: 500, transition: 'all .15s',
  },
  navActive: {
    background: 'linear-gradient(135deg, rgba(124,58,237,.25) 0%, rgba(13,148,136,.1) 100%)',
    color: '#FFFFFF', boxShadow: 'inset 0 0 0 1px rgba(124,58,237,.35)',
  },
  navIcon: { fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 },
  sidebarFooter: { padding: '0 10px 14px' },
  userRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 6px' },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'linear-gradient(135deg, #7C3AED, #0D9488)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  userInfo:  { flex: 1, minWidth: 0 },
  userName:  { color: '#FFFFFF', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { color: '#7C3AED', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  logoutBtn: {
    width: '100%', padding: '8px 12px',
    background: 'transparent', border: '1px solid rgba(124,58,237,.25)',
    color: '#94A3B8', borderRadius: 8, cursor: 'pointer',
    fontSize: 12, textAlign: 'left', marginTop: 4,
    display: 'flex', alignItems: 'center', gap: 7,
  },
  main: {
    marginLeft: 260, flex: 1, minHeight: '100vh',
    padding: 32, background: 'var(--bg)',
  },
};

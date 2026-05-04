import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOwner } from '../context/OwnerContext';
import { c } from '../styles/theme';

const NAV = [
  { to: '/owner/dashboard',              icon: '📊', label: 'Dashboard' },
  { to: '/owner/bookings',               icon: '📅', label: 'Bookings' },
  { to: '/owner/services',               icon: '✂️',  label: 'Services' },
  { to: '/owner/inventory',              icon: '📦', label: 'Products' },
  { to: '/owner/inventory/grn',          icon: '🚚', label: 'Receive Stock (GRN)' },
  { to: '/owner/inventory/sales',        icon: '🛒', label: 'Record Sales' },
  { to: '/owner/inventory/adjustments',  icon: '⚖️',  label: 'Stock Adjustments' },
  { to: '/owner/reports',                icon: '📈', label: 'Reports' },
];

export default function OwnerLayout() {
  const { profile, logout } = useAuth();
  const { salon } = useOwner();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (profile?.full_name || 'O').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <div style={s.brandIcon}>💇</div>
          <div>
            <div style={s.brandName}>{salon?.name || 'My Salon'}</div>
            <div style={s.brandRole}>Owner Portal</div>
          </div>
        </div>

        {salon && (
          <div style={s.salonStatus}>
            <span style={{ ...s.statusDot, background: salon.status === 'active' ? c.success : c.warning }} />
            <span style={s.statusText}>{salon.status === 'active' ? 'Active' : salon.status === 'pending' ? 'Pending Approval' : 'Inactive'}</span>
          </div>
        )}

        <div style={s.divider} />

        <nav style={s.nav}>
          <div style={s.navGroup}>MENU</div>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/owner/dashboard' || item.to === '/owner/inventory'}
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
  brand: { display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 12px' },
  brandIcon: { fontSize: 24, width: 40, height: 40, background: c.accent, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brandName: { color: '#FFFFFF', fontWeight: 700, fontSize: 14, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 },
  brandRole: { color: c.sidebarText, fontSize: 11, marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.05em' },
  salonStatus: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 20px 12px' },
  statusDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  statusText: { fontSize: 11, color: c.sidebarText },
  divider: { height: 1, background: c.sidebarBorder, margin: '0 20px' },
  nav: { flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' },
  navGroup: { fontSize: 10, fontWeight: 600, color: c.sidebarIcon, letterSpacing: '0.08em', padding: '8px 8px 4px', textTransform: 'uppercase' },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, color: c.sidebarText, textDecoration: 'none', fontSize: 13, fontWeight: 500 },
  navActive: { background: c.sidebarActive, color: '#FFFFFF' },
  navIcon: { fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 },
  sidebarFooter: { padding: '0 12px 16px' },
  userRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 8px' },
  avatar: { width: 34, height: 34, borderRadius: '50%', background: c.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { color: '#FFFFFF', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { color: c.sidebarText, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  logoutBtn: { width: '100%', padding: '8px 12px', background: 'transparent', border: `1px solid ${c.sidebarBorder}`, color: c.sidebarText, borderRadius: 8, cursor: 'pointer', fontSize: 13, textAlign: 'left', marginTop: 4 },
  main: { marginLeft: 260, flex: 1, minHeight: '100vh', padding: 32, maxWidth: '100%' },
};

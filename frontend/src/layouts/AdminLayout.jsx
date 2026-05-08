import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV = [
  { to: '/admin/salons',         icon: '◈', label: 'All Salons'       },
  { to: '/admin/salons/pending', icon: '◎', label: 'Pending Approvals' },
  { to: '/admin/services',       icon: '◇', label: 'Global Services'   },
];

export default function AdminLayout() {
  const { profile, logout } = useAuth();
  const { isDark, toggle }  = useTheme();
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
          <button onClick={toggle} title={isDark ? 'Light mode' : 'Dark mode'} style={s.toggleBtn}>
            {isDark ? '☀' : '☾'}
          </button>
        </div>

        <div style={s.divider} />

        {/* Admin badge */}
        <div style={s.adminBadge}>
          <span style={s.adminDot} />
          <span style={s.adminLabel}>System Administrator</span>
        </div>

        {/* Nav */}
        <nav style={s.nav}>
          <div style={s.navGroup}>Navigation</div>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin/salons'}
              className="nav-salon"
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}
            >
              <span style={s.navIcon}>{item.icon}</span>
              <span style={s.navLabel}>{item.label}</span>
              {item.to === '/admin/salons/pending' && <span style={s.pendingPing} />}
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
          <button style={s.logoutBtn} onClick={handleLogout}>
            <span>⎋</span> Sign Out
          </button>
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
    width: 264,
    background: 'linear-gradient(180deg, #0E0720 0%, #080611 100%)',
    display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, height: '100vh',
    zIndex: 100, flexShrink: 0,
    borderRight: '1px solid rgba(124,58,237,.12)',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 11, padding: '24px 18px 16px',
  },
  brandIcon: {
    fontSize: 15, width: 38, height: 38,
    background: 'linear-gradient(145deg, #7C3AED 0%, #9B59E8 45%, #0D9488 100%)',
    borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 900, flexShrink: 0,
    boxShadow: '0 4px 16px rgba(124,58,237,.45), inset 0 1px 0 rgba(255,255,255,.2)',
  },
  brandName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    color: '#FFFFFF', fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em',
  },
  brandRole: {
    color: '#7C3AED', fontSize: 9, marginTop: 2,
    textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600,
  },
  toggleBtn: {
    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
    background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)',
    color: '#A78BFA', cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginLeft: 'auto',
  },
  divider: { height: 1, background: 'rgba(124,58,237,.15)', margin: '0 18px' },
  adminBadge: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px 10px',
  },
  adminDot: {
    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
    background: '#BF9B65', animation: 'subtleGlow 2.5s ease-in-out infinite',
    boxShadow: '0 0 8px rgba(191,155,101,.5)',
  },
  adminLabel: { fontSize: 11, color: '#BF9B65', fontWeight: 600, letterSpacing: '0.06em' },
  nav: { flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2 },
  navGroup: {
    fontSize: 9, fontWeight: 700, color: 'rgba(124,58,237,.6)',
    letterSpacing: '0.14em', padding: '8px 10px 6px', textTransform: 'uppercase',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px',
    borderRadius: 10, color: '#A78BFA', textDecoration: 'none',
    fontSize: 13, fontWeight: 500, position: 'relative',
  },
  navActive: {
    background: 'linear-gradient(135deg, rgba(124,58,237,.22) 0%, rgba(13,148,136,.09) 100%)',
    color: '#FFFFFF',
    boxShadow: 'inset 0 0 0 1px rgba(124,58,237,.3)',
  },
  navIcon:  { fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 },
  navLabel: { flex: 1 },
  pendingPing: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#C9A96E', animation: 'pulseRing 2s ease infinite',
    boxShadow: '0 0 6px rgba(201,169,110,.6)',
  },
  sidebarFooter: { padding: '0 12px 16px', flexShrink: 0 },
  userRow: { display: 'flex', alignItems: 'center', gap: 11, padding: '14px 8px 10px' },
  avatar: {
    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(145deg, #7C3AED, #0D9488)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
  },
  userInfo:  { flex: 1, minWidth: 0 },
  userName:  { color: '#FFFFFF', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { color: '#7C3AED', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 },
  logoutBtn: {
    width: '100%', padding: '9px 13px',
    background: 'transparent', border: '1px solid rgba(124,58,237,.22)',
    color: '#A78BFA', borderRadius: 9, cursor: 'pointer',
    fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, marginTop: 2,
    transition: 'background .18s ease, border-color .18s ease',
  },
  main: {
    marginLeft: 264, flex: 1, minHeight: '100vh',
    padding: '36px 40px', background: 'var(--bg)',
  },
};
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const DASH = {
  client:       '/user/dashboard',
  salon_owner:  '/owner/dashboard',
  system_admin: '/admin/salons',
};

const NAV_LINKS = {
  client:       [{ to: '/user/dashboard', label: 'Dashboard' }, { to: '/user/bookings', label: 'My Bookings' }, { to: '/salons', label: 'Browse Salons' }],
  salon_owner:  [{ to: '/owner/dashboard', label: 'Dashboard' }, { to: '/salons', label: 'Browse Salons' }],
  system_admin: [{ to: '/admin/salons', label: 'Admin Panel' }, { to: '/salons', label: 'Browse Salons' }],
};

export default function Navbar() {
  const { profile, logout } = useAuth();
  const { isDark, toggle }  = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = profile
    ? (profile.full_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : null;
  const dashTo = profile ? (DASH[profile.role] || '/') : null;
  const navLinks = profile ? (NAV_LINKS[profile.role] || []) : [];

  return (
    <header style={{
      height: 68,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px', position: 'sticky', top: 0, zIndex: 200,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      transition: 'background .25s ease',
    }}>
      {/* Brand */}
      <Link to={dashTo || '/salons'} style={s.brand}>
        <div style={s.brandMark}>✦</div>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: 'var(--text)', lineHeight: 1 }}>
            Saloon
          </div>
          <div style={{ fontSize: 9, color: '#A78BFA', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
            Beauty & Wellness
          </div>
        </div>
      </Link>

      {/* Right side */}
      <div style={s.right}>
        {profile ? (
          /* ── Logged-in state ── */
          <>
            <nav style={s.nav}>
              {navLinks.map(item => (
                <Link key={item.to} to={item.to} style={s.navLink}>{item.label}</Link>
              ))}
            </nav>

            <button onClick={toggle} className="theme-toggle" title={isDark ? 'Light mode' : 'Dark mode'}
              style={{ color: isDark ? '#A78BFA' : '#7C3AED' }}>
              {isDark ? '☀' : '☾'}
            </button>

            <div style={{ position: 'relative' }}>
              <div style={s.avatar}>{initials}</div>
              <div style={s.onlineDot} />
            </div>

            <span style={s.userName}>{profile.full_name?.split(' ')[0]}</span>

            <button style={s.logoutBtn} onClick={handleLogout}>Sign Out</button>
          </>
        ) : (
          /* ── Guest state ── */
          <>
            <Link to="/salons" style={s.ghostLink}>Browse Salons</Link>

            <button onClick={toggle} className="theme-toggle" title={isDark ? 'Light mode' : 'Dark mode'}
              style={{ color: isDark ? '#A78BFA' : '#7C3AED' }}>
              {isDark ? '☀' : '☾'}
            </button>

            <Link to="/register/user" style={s.primaryBtn}>Get Started</Link>
          </>
        )}
      </div>
    </header>
  );
}

const s = {
  brand:    { display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' },
  brandMark: {
    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 16, fontWeight: 900,
    boxShadow: '0 4px 12px rgba(124,58,237,.35)',
  },
  right:    { display: 'flex', alignItems: 'center', gap: 10 },
  nav:      { display: 'flex', gap: 2 },
  navLink:  { padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', transition: 'color .18s ease' },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, boxShadow: '0 2px 8px rgba(124,58,237,.3)',
  },
  onlineDot: {
    width: 9, height: 9, borderRadius: '50%', background: '#34D399',
    border: '2px solid var(--surface)',
    position: 'absolute', bottom: 0, right: 0,
  },
  userName: { fontSize: 14, fontWeight: 600, color: 'var(--text)' },
  logoutBtn: {
    padding: '7px 16px', background: 'transparent',
    border: '1px solid var(--border)', borderRadius: 8,
    cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)',
  },
  ghostLink: { padding: '6px 14px', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', borderRadius: 8 },
  primaryBtn: {
    padding: '8px 20px', textDecoration: 'none', color: '#fff',
    fontSize: 14, fontWeight: 600,
    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    borderRadius: 10, boxShadow: '0 4px 12px rgba(124,58,237,.3)',
  },
};

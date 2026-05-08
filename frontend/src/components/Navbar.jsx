import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useMobile';

const DASH = {
  client:       '/user/dashboard',
  salon_owner:  '/owner/dashboard',
  system_admin: '/admin/salons',
};

const NAV_LINKS = {
  client: [
    { to: '/user/dashboard',  label: 'Dashboard'   },
    { to: '/user/bookings',   label: 'My Bookings'  },
    { to: '/user/favourites', label: 'Favourites'   },
  ],
  salon_owner:  [{ to: '/owner/dashboard', label: 'Dashboard'  }],
  system_admin: [{ to: '/admin/salons',    label: 'Admin Panel' }],
};

export default function Navbar() {
  const { profile, logout } = useAuth();
  const { isDark, toggle }  = useTheme();
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = profile
    ? (profile.full_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : null;
  const dashTo   = profile ? (DASH[profile.role] || '/') : null;
  const navLinks = profile ? (NAV_LINKS[profile.role] || []) : [];

  return (
    <header style={{ ...s.header, padding: isMobile ? '0 16px' : '0 40px' }}>
      {/* Brand */}
      <Link to={dashTo || '/salons'} style={s.brand}>
        <div style={s.brandMark}>✦</div>
        <div style={s.brandText}>
          <div style={{ ...s.brandName, fontSize: isMobile ? 18 : 20 }}>Saloon</div>
          {!isMobile && <div style={s.brandTagline}>Beauty & Wellness</div>}
        </div>
      </Link>

      {/* Right side */}
      <div style={s.right}>
        {profile ? (
          <>
            {!isMobile && (
              <>
                <nav style={s.nav}>
                  {navLinks.map(item => (
                    <Link key={item.to} to={item.to} style={s.navLink}>{item.label}</Link>
                  ))}
                </nav>
                <div style={s.divider} />
              </>
            )}
            <button onClick={toggle} className="theme-toggle" title={isDark ? 'Light mode' : 'Dark mode'}
              style={{ color: isDark ? '#A78BFA' : '#7C3AED' }}>
              {isDark ? '☀' : '☾'}
            </button>
            <Link to={dashTo} style={s.avatarWrap} title="Go to dashboard">
              <div style={s.avatar}>{initials}</div>
              <div style={s.onlineDot} />
            </Link>
            {!isMobile && (
              <button style={s.logoutBtn} onClick={handleLogout}>Sign Out</button>
            )}
          </>
        ) : (
          <>
            {!isMobile && (
              <Link to="/salons" style={s.ghostLink}>Browse Salons</Link>
            )}
            <Link to="/login" style={s.ghostLink}>Sign In</Link>
            <button onClick={toggle} className="theme-toggle" title={isDark ? 'Light mode' : 'Dark mode'}
              style={{ color: isDark ? '#A78BFA' : '#7C3AED' }}>
              {isDark ? '☀' : '☾'}
            </button>
            {!isMobile && (
              <Link to="/register/user" style={s.primaryBtn} className="btn-cta">Get Started</Link>
            )}
          </>
        )}
      </div>
    </header>
  );
}

const s = {
  header: {
    height: 64,
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky', top: 0, zIndex: 200,
    boxShadow: '0 1px 0 var(--border), 0 4px 20px rgba(124,58,237,.04)',
    transition: 'background .3s ease',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 12,
    textDecoration: 'none', flexShrink: 0,
  },
  brandMark: {
    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
    background: 'linear-gradient(145deg, #7C3AED 0%, #9B59E8 45%, #EC4899 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 16, fontWeight: 900,
    boxShadow: '0 4px 16px rgba(124,58,237,.4), inset 0 1px 0 rgba(255,255,255,.2)',
  },
  brandText: { display: 'flex', flexDirection: 'column' },
  brandName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontWeight: 700, fontSize: 20, color: 'var(--text)',
    lineHeight: 1, letterSpacing: '-0.01em',
  },
  brandTagline: {
    fontSize: 9, color: 'var(--brand-label)', letterSpacing: '0.18em',
    textTransform: 'uppercase', marginTop: 3, fontWeight: 500,
  },
  right: { display: 'flex', alignItems: 'center', gap: 8 },
  nav: { display: 'flex', gap: 2 },
  navLink: {
    padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
    color: 'var(--text-muted)', transition: 'color .18s ease, background .18s ease',
    textDecoration: 'none',
  },
  divider: { width: 1, height: 22, background: 'var(--border)', margin: '0 4px' },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'linear-gradient(145deg, #7C3AED 0%, #EC4899 100%)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, boxShadow: '0 2px 10px rgba(124,58,237,.35)',
  },
  onlineDot: {
    width: 9, height: 9, borderRadius: '50%', background: '#34D399',
    border: '2px solid var(--surface)',
    position: 'absolute', bottom: 0, right: 0,
  },
  logoutBtn: {
    padding: '7px 16px', background: 'transparent',
    border: '1px solid var(--border)', borderRadius: 8,
    cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)',
    transition: 'border-color .18s ease, color .18s ease',
  },
  ghostLink: {
    padding: '7px 14px', fontSize: 14, fontWeight: 500,
    color: 'var(--text-muted)', borderRadius: 8,
    transition: 'color .18s ease',
  },
  primaryBtn: {
    padding: '9px 22px', textDecoration: 'none', color: '#fff',
    fontSize: 14, fontWeight: 600,
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #EC4899 100%)',
    borderRadius: 10,
    boxShadow: '0 4px 14px rgba(124,58,237,.35), inset 0 1px 0 rgba(255,255,255,.15)',
    transition: 'box-shadow .2s ease, transform .2s ease',
  },
};

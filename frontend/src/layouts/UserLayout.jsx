import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { c } from '../styles/theme';

const NAV = [
  { to: '/user/dashboard', label: 'Dashboard' },
  { to: '/user/bookings',  label: 'My Bookings' },
  { to: '/salons',         label: 'Browse Salons' },
];

export default function UserLayout() {
  const { profile, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (profile?.full_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: isDark
          ? scrolled ? 'rgba(26,22,40,.96)' : 'rgba(13,11,20,.99)'
          : scrolled ? 'rgba(255,255,255,.92)' : 'rgba(255,255,255,0.99)',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
        borderBottom: '1px solid var(--border)',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,.08)' : 'none',
        transition: 'background .3s ease, box-shadow .3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 40px', height: 68, maxWidth: 1280, margin: '0 auto', width: '100%', gap: 32 }}>

          {/* Brand */}
          <Link to="/salons" style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0, textDecoration: 'none' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 16, fontWeight: 900,
              boxShadow: '0 4px 12px rgba(124,58,237,.35)',
            }}>✦</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: 'var(--text)', lineHeight: 1 }}>Saloon</div>
              <div style={{ fontSize: 9, color: '#A78BFA', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Beauty & Wellness</div>
            </div>
          </Link>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
            {NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  padding: '6px 16px', borderRadius: 8, fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#7C3AED' : 'var(--text-muted)',
                  background: isActive
                    ? (isDark ? 'rgba(124,58,237,.18)' : '#F5F3FF')
                    : 'transparent',
                  transition: 'all .18s ease',
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: theme toggle + user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            <button
              onClick={toggle}
              className="theme-toggle"
              title={isDark ? 'Light mode' : 'Dark mode'}
              style={{ color: isDark ? '#A78BFA' : '#7C3AED' }}
            >
              {isDark ? '☀' : '☾'}
            </button>

            <div style={{ position: 'relative' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                boxShadow: '0 2px 8px rgba(124,58,237,.3)',
              }}>{initials}</div>
              <div style={{
                width: 9, height: 9, borderRadius: '50%', background: '#34D399',
                border: '2px solid var(--surface)',
                position: 'absolute', bottom: 0, right: 0,
              }} />
            </div>

            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
              {profile?.full_name?.split(' ')[0]}
            </div>

            <button style={{
              padding: '7px 16px', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 8,
              cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)',
            }} onClick={handleLogout}>Sign Out</button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: '36px 40px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <div className="fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

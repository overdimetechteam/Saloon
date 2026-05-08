import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useMobile';
import api from '../api/axios';

const NAV = [
  { to: '/user/dashboard',  label: 'Dashboard',   icon: '◈' },
  { to: '/user/bookings',   label: 'Bookings',     icon: '◉' },
  { to: '/user/favourites', label: 'Favourites',   icon: '♡' },
  { to: '/salons',          label: 'Explore',      icon: '✦' },
];

const TYPE_ICON = {
  booking_confirmed: '✓',
  booking_awaiting:  '⚡',
  booking_cancelled: '✕',
  general:           '•',
};

function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen]     = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const fetchCount  = () => api.get('/notifications/unread-count/').then(r => setUnread(r.data.count)).catch(() => {});
  const fetchNotifs = () => api.get('/notifications/').then(r => setNotifs(r.data)).catch(() => {});

  useEffect(() => {
    fetchCount();
    const iv = setInterval(fetchCount, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const handleClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = () => { const next = !open; setOpen(next); if (next) fetchNotifs(); };

  const markAllRead = async () => {
    await api.post('/notifications/mark-read/').catch(() => {});
    setUnread(0);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleNotifClick = n => {
    setOpen(false);
    if (!n.is_read) {
      api.patch(`/notifications/${n.id}/read/`).catch(() => {});
      setUnread(prev => Math.max(0, prev - 1));
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    if (n.booking_id) navigate(`/user/bookings/${n.booking_id}`);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={handleOpen} style={nb.bell} title="Notifications">
        🔔
        {unread > 0 && <span style={nb.badge}>{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div style={nb.dropdown}>
          <div style={nb.dropHeader}>
            <span style={nb.dropTitle}>Notifications</span>
            {unread > 0 && <button style={nb.markAll} onClick={markAllRead}>Mark all read</button>}
          </div>
          <div style={nb.list}>
            {notifs.length === 0 && <div style={nb.empty}>You're all caught up ✦</div>}
            {notifs.map(n => (
              <div
                key={n.id}
                style={{ ...nb.item, background: n.is_read ? 'transparent' : 'rgba(124,58,237,.05)' }}
                onClick={() => handleNotifClick(n)}
              >
                <div style={{
                  ...nb.typeIcon,
                  color: n.notif_type === 'booking_confirmed' ? '#059669'
                       : n.notif_type === 'booking_cancelled' ? '#DC2626'
                       : '#D97706',
                  background: n.notif_type === 'booking_confirmed' ? '#ECFDF5'
                            : n.notif_type === 'booking_cancelled' ? '#FEF2F2'
                            : '#FFFBEB',
                }}>
                  {TYPE_ICON[n.notif_type] || '•'}
                </div>
                <div style={nb.itemBody}>
                  <div style={nb.itemMsg}>{n.message}</div>
                  <div style={nb.itemTime}>
                    {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {!n.is_read && <div style={nb.dot} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const nb = {
  bell: {
    position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 18, padding: '5px 7px', borderRadius: 10, lineHeight: 1,
    transition: 'background .18s ease',
  },
  badge: {
    position: 'absolute', top: -2, right: -2,
    background: 'linear-gradient(135deg, #EC4899, #BE185D)', color: '#fff',
    fontSize: 9, fontWeight: 800, borderRadius: 20,
    padding: '1px 4px', minWidth: 14, textAlign: 'center',
    border: '1.5px solid var(--surface)',
    boxShadow: '0 2px 6px rgba(236,72,153,.45)',
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 12px)', right: 0,
    width: 330, background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: 18,
    boxShadow: '0 20px 56px rgba(124,58,237,.12), 0 4px 16px rgba(0,0,0,.08)',
    zIndex: 500, overflow: 'hidden',
  },
  dropHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid var(--border)',
  },
  dropTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 15, fontWeight: 700, color: 'var(--text)',
  },
  markAll: {
    fontSize: 11, color: '#7C3AED', background: '#F5F2FF',
    border: '1px solid #DDD6FE', cursor: 'pointer', fontWeight: 600,
    padding: '3px 10px', borderRadius: 20,
  },
  list: { maxHeight: 380, overflowY: 'auto' },
  empty: {
    padding: '32px 20px', fontSize: 13, color: 'var(--text-muted)',
    textAlign: 'center', fontStyle: 'italic',
  },
  item: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    padding: '13px 20px', cursor: 'pointer',
    borderBottom: '1px solid var(--border)',
    transition: 'background .15s ease',
  },
  typeIcon: {
    width: 28, height: 28, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
  },
  itemBody: { flex: 1 },
  itemMsg:  { fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginBottom: 3 },
  itemTime: { fontSize: 11, color: 'var(--text-muted)' },
  dot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#7C3AED', flexShrink: 0, marginTop: 7,
    boxShadow: '0 0 6px rgba(124,58,237,.5)',
  },
};

export default function UserLayout() {
  const { profile, logout } = useAuth();
  const { isDark, toggle }  = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isMobile  = useIsMobile();
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
          ? scrolled ? 'rgba(16,13,31,.96)' : 'rgba(8,6,17,.99)'
          : scrolled ? 'rgba(255,255,255,.92)' : 'rgba(255,255,255,.99)',
        backdropFilter: scrolled ? 'blur(24px) saturate(1.5)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(1.5)' : 'none',
        borderBottom: '1px solid var(--border)',
        boxShadow: scrolled ? '0 4px 28px rgba(124,58,237,.07)' : 'none',
        transition: 'background .3s ease, box-shadow .3s ease',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 28,
          padding: isMobile ? '0 18px' : '0 40px',
          height: 64,
          maxWidth: 1320, margin: '0 auto', width: '100%',
        }}>
          {/* Brand */}
          <Link to="/salons" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(145deg, #7C3AED 0%, #9B59E8 45%, #EC4899 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 15, fontWeight: 900,
              boxShadow: '0 4px 16px rgba(124,58,237,.4), inset 0 1px 0 rgba(255,255,255,.2)',
            }}>✦</div>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, fontSize: isMobile ? 18 : 20, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.01em' }}>Saloon</div>
              {!isMobile && <div style={{ fontSize: 9, color: '#A78BFA', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 3, fontWeight: 500 }}>Beauty & Wellness</div>}
            </div>
          </Link>

          {/* Desktop nav links */}
          {!isMobile && (
            <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
              {NAV.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    padding: '6px 16px', borderRadius: 9, fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#7C3AED' : 'var(--text-muted)',
                    background: isActive
                      ? (isDark ? 'rgba(124,58,237,.18)' : '#F5F2FF')
                      : 'transparent',
                    transition: 'all .18s ease',
                  })}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10, marginLeft: 'auto' }}>
            <NotificationBell />
            <button onClick={toggle} className="theme-toggle" title={isDark ? 'Light mode' : 'Dark mode'}
              style={{ color: isDark ? '#A78BFA' : '#7C3AED' }}>
              {isDark ? '☀' : '☾'}
            </button>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(145deg, #7C3AED 0%, #EC4899 100%)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, boxShadow: '0 2px 10px rgba(124,58,237,.35)',
              }}>{initials}</div>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: '#34D399',
                border: '2px solid var(--surface)',
                position: 'absolute', bottom: 0, right: 0,
              }} />
            </div>
            {!isMobile && (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  {profile?.full_name?.split(' ')[0]}
                </div>
                <button style={{
                  padding: '7px 16px', background: 'transparent',
                  border: '1px solid var(--border)', borderRadius: 9,
                  cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)',
                  transition: 'border-color .18s ease',
                }} onClick={handleLogout}>Sign Out</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={{
        flex: 1,
        padding: isMobile ? '24px 16px 80px' : '40px 40px',
        maxWidth: 1320, margin: '0 auto', width: '100%',
        boxSizing: 'border-box',
      }}>
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <nav className="bottom-tab-bar">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to}>
              <span className="tab-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

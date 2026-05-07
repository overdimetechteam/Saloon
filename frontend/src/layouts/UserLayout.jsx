import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { c } from '../styles/theme';
import api from '../api/axios';

const NAV = [
  { to: '/user/dashboard',   label: 'Dashboard' },
  { to: '/user/bookings',    label: 'My Bookings' },
  { to: '/user/favourites',  label: 'Favourites' },
  { to: '/salons',           label: 'Browse Salons' },
];

function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const fetchCount = () => api.get('/notifications/unread-count/').then(r => setUnread(r.data.count)).catch(() => {});
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

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifs();
  };

  const markAllRead = async () => {
    await api.post('/notifications/mark-read/').catch(() => {});
    setUnread(0);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleNotifClick = (n) => {
    setOpen(false);
    if (!n.is_read) {
      api.patch(`/notifications/${n.id}/read/`).catch(() => {});
      setUnread(prev => Math.max(0, prev - 1));
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    if (n.booking_id) navigate(`/user/bookings/${n.booking_id}`);
  };

  const TYPE_ICON = { booking_confirmed: '✓', booking_awaiting: '⚡', booking_cancelled: '✕', general: '•' };

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
            {notifs.length === 0 && <div style={nb.empty}>No notifications yet</div>}
            {notifs.map(n => (
              <div key={n.id} style={{ ...nb.item, background: n.is_read ? 'transparent' : 'rgba(124,58,237,.06)' }} onClick={() => handleNotifClick(n)}>
                <div style={{ ...nb.typeIcon, color: n.notif_type === 'booking_confirmed' ? '#059669' : n.notif_type === 'booking_cancelled' ? '#DC2626' : '#D97706' }}>
                  {TYPE_ICON[n.notif_type] || '•'}
                </div>
                <div style={nb.itemBody}>
                  <div style={nb.itemMsg}>{n.message}</div>
                  <div style={nb.itemTime}>{new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
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
    fontSize: 18, padding: '4px 6px', borderRadius: 8, lineHeight: 1,
  },
  badge: {
    position: 'absolute', top: -2, right: -2,
    background: '#DC2626', color: '#fff',
    fontSize: 9, fontWeight: 800, borderRadius: 20,
    padding: '1px 4px', minWidth: 14, textAlign: 'center',
    border: '1.5px solid var(--surface)',
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
    width: 320, background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,.14)',
    zIndex: 500, overflow: 'hidden',
  },
  dropHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px', borderBottom: '1px solid var(--border)',
  },
  dropTitle: { fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: 'var(--text)' },
  markAll: {
    fontSize: 11, color: '#7C3AED', background: 'none', border: 'none',
    cursor: 'pointer', fontWeight: 600, padding: '3px 8px',
    background: '#F5F3FF', borderRadius: 6,
  },
  list: { maxHeight: 380, overflowY: 'auto' },
  empty: { padding: '24px 18px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' },
  item: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '12px 18px', cursor: 'pointer',
    borderBottom: '1px solid var(--border)',
    transition: 'background .15s ease',
  },
  typeIcon: {
    width: 24, height: 24, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, flexShrink: 0,
    background: 'var(--surface2)', marginTop: 2,
  },
  itemBody: { flex: 1 },
  itemMsg: { fontSize: 12, color: 'var(--text)', lineHeight: 1.5, marginBottom: 3 },
  itemTime: { fontSize: 10, color: 'var(--text-muted)' },
  dot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#7C3AED', flexShrink: 0, marginTop: 6,
  },
};

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
              background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 16, fontWeight: 900,
              boxShadow: '0 4px 12px rgba(124,58,237,.35)',
            }}>✦</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: 'var(--text)', lineHeight: 1 }}>Saloon</div>
              <div style={{ fontSize: 9, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Beauty & Wellness</div>
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

          {/* Right: notifications + theme toggle + user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            <NotificationBell />
            <button
              onClick={toggle}
              className="theme-toggle"
              title={isDark ? 'Light mode' : 'Dark mode'}
              style={{ color: isDark ? '#94A3B8' : '#7C3AED' }}
            >
              {isDark ? '☀' : '☾'}
            </button>

            <div style={{ position: 'relative' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)',
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

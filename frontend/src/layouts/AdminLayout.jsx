import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useBreakpoint } from '../hooks/useMobile';
import api from '../api/axios';

const NAV = [
  { to: '/admin/dashboard',      icon: '▤', label: 'Dashboard'         },
  { to: '/admin/salons',         icon: '◈', label: 'All Salons'        },
  { to: '/admin/salons/pending', icon: '◎', label: 'Pending Approvals' },
  { to: '/admin/customers',      icon: '◉', label: 'Customers'         },
  { to: '/admin/services',       icon: '◇', label: 'Global Services'   },
  { to: '/admin/settings',       icon: '⚙', label: 'Settings'          },
];

export default function AdminLayout() {
  const { profile, logout } = useAuth();
  const { isDark, toggle }  = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isMobile, isTablet } = useBreakpoint();
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [notifs, setNotifs]               = useState([]);
  const [showNotifs, setShowNotifs]       = useState(false);
  const notifRef                          = useRef(null);

  const unreadCount = notifs.filter(n => !n.is_read).length;

  const fetchNotifs = () => {
    api.get('/notifications/').then(r => setNotifs(r.data)).catch(() => {});
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    try { await api.patch(`/notifications/${id}/read/`, {}); } catch { /* noop */ }
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    try { await api.post('/notifications/mark-read/', {}); } catch { /* noop */ }
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  function fmtTime(dt) {
    if (!dt) return '';
    const d = new Date(dt), now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // collapse = show icon-only sidebar on tablet
  const collapsed = isTablet;

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/admin/login'); };
  const initials = (profile?.full_name || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const sidebarW = isMobile ? 272 : collapsed ? 68 : 264;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Mobile top bar ── */}
      {(isMobile || isTablet) && (
        <header style={s.mobileHeader}>
          <button style={s.burgerBtn} onClick={() => setDrawerOpen(v => !v)}>
            {[0,1,2].map(i => <span key={i} style={s.burgerLine} />)}
          </button>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>
            Admin Portal
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 17, color: isDark ? '#5EEAD4' : '#0D9488', padding: '6px 8px' }}>
              {isDark ? '☀' : '☾'}
            </button>
            <button onClick={() => setShowNotifs(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '6px 8px', position: 'relative' }}>
              🔔
              {unreadCount > 0 && (
                <span style={{ ...s.notifBadge, top: 4, right: 4 }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
          </div>
        </header>
      )}

      {/* ── Mobile backdrop ── */}
      {(isMobile || isTablet) && drawerOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 99, backdropFilter: 'blur(2px)' }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      {(!(isMobile || isTablet) || drawerOpen) && (
        <aside style={{
          ...s.sidebar,
          width: sidebarW,
          ...(isMobile || isTablet ? {
            position: 'fixed', left: 0, top: 0, zIndex: 110, height: '100vh',
            transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
            width: 272,
          } : {}),
        }}>
          <div style={s.brand}>
            <div style={s.brandIcon}>✦</div>
            {!(collapsed && !(isMobile || isTablet)) && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.brandName}>SalonSystem</div>
                <div style={s.brandRole}>Admin Portal</div>
              </div>
            )}
            {!(isMobile || isTablet) && (
              <button onClick={toggle} title={isDark ? 'Light mode' : 'Dark mode'} style={s.toggleBtn}>
                {isDark ? '☀' : '☾'}
              </button>
            )}
          </div>

          <div style={s.divider} />
          <div style={s.adminBadge}>
            <span style={s.adminDot} />
            <span style={s.adminLabel}>System Administrator</span>
          </div>

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

          <div style={s.sidebarFooter}>
            <div style={s.divider} />

            {/* Notification bell */}
            <div ref={notifRef} style={{ position: 'relative', padding: '10px 12px 0' }}>
              <button
                onClick={() => setShowNotifs(v => !v)}
                style={{ ...s.notifBell, ...(showNotifs ? s.notifBellActive : {}) }}
              >
                <span style={{ fontSize: 16 }}>🔔</span>
                <span style={s.notifLabel}>Notifications</span>
                {unreadCount > 0 && (
                  <span style={s.notifBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    style={s.notifPanel}
                  >
                    <div style={s.notifHeader}>
                      <span style={s.notifTitle}>Notifications</span>
                      {unreadCount > 0 && (
                        <button style={s.markAllBtn} onClick={markAllRead}>Mark all read</button>
                      )}
                    </div>
                    <div style={s.notifList}>
                      {notifs.length === 0 ? (
                        <div style={s.notifEmpty}>No notifications yet</div>
                      ) : (
                        notifs.slice(0, 20).map(n => (
                          <div
                            key={n.id}
                            style={{ ...s.notifItem, ...(n.is_read ? {} : s.notifItemUnread) }}
                            onClick={() => { markRead(n.id); }}
                          >
                            <div style={s.notifDotWrap}>
                              <span style={{ ...s.notifDot, ...(n.is_read ? s.notifDotRead : {}) }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={s.notifMsg}>{n.message}</div>
                              <div style={s.notifTime}>{fmtTime(n.created_at)}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
      )}

      {/* ── Main content ── */}
      <main style={{
        ...s.main,
        marginLeft: (isMobile || isTablet) ? 0 : sidebarW,
        padding: isMobile ? '16px 16px 80px' : isTablet ? '20px 24px 80px' : '36px 40px',
        marginTop: (isMobile || isTablet) ? 56 : 0,
      }}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* ── Mobile bottom tab bar ── */}
      {isMobile && (
        <nav className="bottom-tab-bar">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/admin/salons'}>
              <span className="tab-icon">{item.icon}</span>
              {item.label.split(' ')[0]}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

const s = {
  mobileHeader: {
    position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 98,
    background: 'linear-gradient(180deg, #111120 0%, #0D0D16 100%)',
    borderBottom: '1px solid rgba(13,148,136,.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px',
  },
  burgerBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: 5, padding: '8px 6px',
  },
  burgerLine: {
    display: 'block', width: 22, height: 2,
    background: '#5EEAD4', borderRadius: 2,
  },
  sidebar: {
    background: 'linear-gradient(180deg, #111120 0%, #0D0D16 100%)',
    display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, height: '100vh',
    zIndex: 100, flexShrink: 0,
    borderRight: '1px solid rgba(13,148,136,.12)',
    overflowY: 'auto', overflowX: 'hidden',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 11, padding: '24px 18px 16px',
  },
  brandIcon: {
    fontSize: 15, width: 38, height: 38,
    background: 'linear-gradient(145deg, #0D9488 0%, #14B8A8 100%)',
    borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 900, flexShrink: 0,
    boxShadow: '0 4px 16px rgba(13,148,136,.45), inset 0 1px 0 rgba(255,255,255,.2)',
  },
  brandName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    color: '#FFFFFF', fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em',
  },
  brandRole: {
    color: '#5EEAD4', fontSize: 9, marginTop: 2,
    textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600,
  },
  toggleBtn: {
    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
    background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)',
    color: '#5EEAD4', cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginLeft: 'auto',
  },
  divider: { height: 1, background: 'rgba(13,148,136,.15)', margin: '0 18px' },
  adminBadge: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px 10px' },
  adminDot: {
    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
    background: '#D4AF37', animation: 'subtleGlow 2.5s ease-in-out infinite',
    boxShadow: '0 0 8px rgba(212,175,55,.5)',
  },
  adminLabel: { fontSize: 11, color: '#D4AF37', fontWeight: 600, letterSpacing: '0.06em' },
  nav: { flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2 },
  navGroup: {
    fontSize: 9, fontWeight: 700, color: 'rgba(13,148,136,.6)',
    letterSpacing: '0.14em', padding: '8px 10px 6px', textTransform: 'uppercase',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px',
    borderRadius: 10, color: '#5EEAD4', textDecoration: 'none',
    fontSize: 13, fontWeight: 500, position: 'relative',
  },
  navActive: {
    background: 'rgba(13,148,136,.22)',
    color: '#FFFFFF',
    boxShadow: 'inset 0 0 0 1px rgba(13,148,136,.3)',
  },
  navIcon:  { fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 },
  navLabel: { flex: 1 },
  pendingPing: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#D4AF37', animation: 'pulseRing 2s ease infinite',
    boxShadow: '0 0 6px rgba(212,175,55,.6)',
  },
  sidebarFooter: { padding: '0 12px 16px', flexShrink: 0 },
  userRow: { display: 'flex', alignItems: 'center', gap: 11, padding: '14px 8px 10px' },
  avatar: {
    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(145deg, #0D9488, #14B8A8)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
  },
  userInfo:  { flex: 1, minWidth: 0 },
  userName:  { color: '#FFFFFF', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { color: '#5EEAD4', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 },
  logoutBtn: {
    width: '100%', padding: '10px 13px',
    background: 'transparent', border: '1px solid rgba(13,148,136,.22)',
    color: '#5EEAD4', borderRadius: 9, cursor: 'pointer',
    fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, marginTop: 2,
  },
  main: {
    flex: 1, minHeight: '100vh',
    background: 'var(--bg)',
  },

  notifBell: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 13px', borderRadius: 10, border: '1px solid rgba(13,148,136,.18)',
    background: 'transparent', color: '#5EEAD4', cursor: 'pointer', fontSize: 13,
    fontFamily: "'DM Sans', sans-serif", position: 'relative', transition: 'all .15s',
  },
  notifBellActive: { background: 'rgba(13,148,136,.15)', borderColor: 'rgba(13,148,136,.4)' },
  notifLabel: { flex: 1, textAlign: 'left', fontWeight: 500 },
  notifBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 10,
    background: '#DC2626', color: '#fff',
    fontSize: 10, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 4px', border: '2px solid #0D0D16',
  },
  notifPanel: {
    position: 'absolute', bottom: '110%', left: 0, right: 0,
    background: '#1a1a2e', border: '1px solid rgba(13,148,136,.25)',
    borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,.5)',
    zIndex: 200, overflow: 'hidden',
    minWidth: 320,
  },
  notifHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px 10px', borderBottom: '1px solid rgba(13,148,136,.15)',
  },
  notifTitle: { color: '#fff', fontWeight: 700, fontSize: 13 },
  markAllBtn: {
    background: 'none', border: 'none', color: '#0D9488', fontSize: 11,
    cursor: 'pointer', fontWeight: 600, padding: 0,
    fontFamily: "'DM Sans', sans-serif",
  },
  notifList: { maxHeight: 360, overflowY: 'auto' },
  notifEmpty: { padding: '24px 16px', textAlign: 'center', color: 'rgba(94,234,212,.5)', fontSize: 13 },
  notifItem: {
    display: 'flex', gap: 10, padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,.05)', cursor: 'pointer',
    transition: 'background .12s',
  },
  notifItemUnread: { background: 'rgba(13,148,136,.08)' },
  notifDotWrap: { paddingTop: 4, flexShrink: 0 },
  notifDot: { display: 'block', width: 7, height: 7, borderRadius: '50%', background: '#0D9488' },
  notifDotRead: { background: 'rgba(255,255,255,.15)' },
  notifMsg: { color: '#E5E7EB', fontSize: 12, lineHeight: 1.5, marginBottom: 3 },
  notifTime: { color: 'rgba(94,234,212,.5)', fontSize: 10 },
};

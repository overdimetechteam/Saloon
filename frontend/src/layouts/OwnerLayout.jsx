import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOwner } from '../context/OwnerContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

const NAV = [
  { to: '/owner/dashboard',             icon: '◈', label: 'Dashboard',     group: 'main'  },
  { to: '/owner/bookings',              icon: '◉', label: 'Bookings',      group: 'main'  },
  { to: '/owner/services',              icon: '◇', label: 'Services',      group: 'main'  },
  { to: '/owner/team',                  icon: '✦', label: 'Team',          group: 'main'  },
  { to: '/owner/promotions',            icon: '⬡', label: 'Promotions',    group: 'main'  },
  { to: '/owner/analytics',             icon: '◱', label: 'Analytics',     group: 'main'  },
  { to: '/owner/inventory',             icon: '▦', label: 'Products',      group: 'stock' },
  { to: '/owner/inventory/grn',         icon: '⊕', label: 'Receive Stock', group: 'stock' },
  { to: '/owner/inventory/sales',       icon: '⊘', label: 'Record Sales',  group: 'stock' },
  { to: '/owner/inventory/adjustments', icon: '⊡', label: 'Adjustments',   group: 'stock' },
  { to: '/owner/reports',               icon: '◰', label: 'Reports',       group: 'stock' },
];

const GROUPS = [
  { key: 'main',  label: 'WORKSPACE' },
  { key: 'stock', label: 'INVENTORY' },
];

export default function OwnerLayout() {
  const { profile, logout } = useAuth();
  const { salon } = useOwner();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    const fetchCount = () => api.get('/users/notifications/unread-count/').then(r => setUnreadCount(r.data.count)).catch(() => {});
    fetchCount();
    const iv = setInterval(fetchCount, 30000);
    return () => clearInterval(iv);
  }, []);

  const openNotifs = () => {
    if (!showNotifs) {
      api.get('/users/notifications/').then(r => setNotifs(r.data)).catch(() => {});
    }
    setShowNotifs(v => !v);
  };

  const markAllRead = async () => {
    await api.post('/users/notifications/mark-read/').catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    const handler = e => { if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (profile?.full_name || 'O').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <aside style={{ ...s.sidebar, width: collapsed ? 68 : 248 }}>
        {/* Brand */}
        <div style={s.brandArea}>
          <div style={s.brandIcon} onClick={() => setCollapsed(v => !v)}>✦</div>
          {!collapsed && (
            <div style={s.brandText}>
              <div style={s.brandName}>{salon?.name || 'My Salon'}</div>
              <div style={s.brandSub}>Owner Portal</div>
            </div>
          )}
          {/* Notification bell + theme toggle */}
          {!collapsed && (
            <div style={{ display: 'flex', gap: 6 }}>
              <div ref={bellRef} style={{ position: 'relative' }}>
                <button onClick={openNotifs} style={s.sideToggle} title="Notifications">
                  🔔
                  {unreadCount > 0 && (
                    <span style={s.bellBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
                {showNotifs && (
                  <div style={s.notifDropdown}>
                    <div style={s.notifHeader}>
                      <span style={s.notifTitle}>Notifications</span>
                      {unreadCount > 0 && (
                        <button style={s.markReadBtn} onClick={markAllRead}>Mark all read</button>
                      )}
                    </div>
                    <div style={s.notifList}>
                      {notifs.length === 0 && <div style={s.notifEmpty}>No notifications</div>}
                      {notifs.slice(0, 10).map(n => (
                        <div key={n.id} style={{ ...s.notifItem, ...(n.is_read ? {} : s.notifUnread) }}>
                          {!n.is_read && <span style={s.notifDot} />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={s.notifMsg}>{n.message}</div>
                            <div style={s.notifTime}>{new Date(n.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={toggle}
                title={isDark ? 'Light mode' : 'Dark mode'}
                style={s.sideToggle}
              >
                {isDark ? '☀' : '☾'}
              </button>
            </div>
          )}
        </div>

        {/* Salon status */}
        {!collapsed && salon && (
          <div style={s.statusBar}>
            <span style={{ ...s.statusDot, background: salon.status === 'active' ? '#34D399' : '#FBBF24' }} />
            <span style={s.statusText}>
              {salon.status === 'active' ? 'Live & Accepting' : salon.status === 'pending' ? 'Pending Approval' : 'Inactive'}
            </span>
          </div>
        )}
        {/* Collapsed toggle */}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0 0 8px' }}>
            <button onClick={toggle} title={isDark ? 'Light mode' : 'Dark mode'} style={s.sideToggleCollapsed}>
              {isDark ? '☀' : '☾'}
            </button>
          </div>
        )}

        <div style={s.divider} />

        {/* Navigation */}
        <nav style={s.nav}>
          {GROUPS.map(group => (
            <div key={group.key}>
              {!collapsed && <div style={s.groupLabel}>{group.label}</div>}
              {NAV.filter(n => n.group === group.key).map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/owner/dashboard' || item.to === '/owner/inventory'}
                  className="nav-salon"
                  style={({ isActive }) => ({
                    ...s.navItem,
                    ...(collapsed ? s.navItemCollapsed : {}),
                    ...(isActive ? s.navActive : {}),
                  })}
                  title={collapsed ? item.label : undefined}
                >
                  <span style={s.navIcon}>{item.icon}</span>
                  {!collapsed && <span style={s.navLabel}>{item.label}</span>}
                </NavLink>
              ))}
              {!collapsed && <div style={s.groupDivider} />}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={s.footer}>
          <div style={s.divider} />
          {collapsed ? (
            <div style={s.avatarCollapsed} title={profile?.full_name}>{initials}</div>
          ) : (
            <div style={s.footerInner}>
              <div style={s.footerAvatar}>{initials}</div>
              <div style={s.footerInfo}>
                <div style={s.footerName}>{profile?.full_name}</div>
                <div style={s.footerEmail}>{profile?.email}</div>
              </div>
            </div>
          )}
          <button
            style={{ ...s.logoutBtn, justifyContent: collapsed ? 'center' : 'flex-start' }}
            onClick={handleLogout}
          >
            <span style={s.logoutIcon}>⎋</span>
            {!collapsed && ' Sign Out'}
          </button>
        </div>
      </aside>

      <main style={{ ...s.main, marginLeft: collapsed ? 68 : 248 }}>
        <div className="fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const s = {
  sidebar: {
    background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
    display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, height: '100vh',
    zIndex: 100, flexShrink: 0,
    transition: 'width .25s cubic-bezier(.4,0,.2,1)',
    overflow: 'hidden',
  },

  brandArea: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '22px 14px 14px',
    flexShrink: 0,
  },
  brandIcon: {
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(124,58,237,.45)',
    transition: 'transform .2s ease',
  },
  brandText: { overflow: 'hidden', flex: 1, minWidth: 0 },
  brandName: {
    fontFamily: "'Playfair Display', serif",
    color: '#FFFFFF', fontWeight: 700, fontSize: 14,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  brandSub: { color: '#7C3AED', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 },

  sideToggle: {
    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
    background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)',
    color: '#94A3B8', cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute', top: -5, right: -5,
    background: '#0D9488', color: '#fff',
    fontSize: 9, fontWeight: 800, borderRadius: 20,
    padding: '1px 4px', lineHeight: 1.4, minWidth: 14,
    textAlign: 'center',
  },
  notifDropdown: {
    position: 'absolute', top: 38, right: 0,
    width: 300, background: '#1E1033',
    border: '1px solid rgba(124,58,237,.25)',
    borderRadius: 14, boxShadow: '0 16px 40px rgba(0,0,0,.5)',
    zIndex: 200, overflow: 'hidden',
  },
  notifHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.06)',
  },
  notifTitle: { fontSize: 12, fontWeight: 700, color: '#C4B5FD', textTransform: 'uppercase', letterSpacing: '0.07em' },
  markReadBtn: { fontSize: 11, color: '#94A3B8', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 },
  notifList: { maxHeight: 320, overflowY: 'auto' },
  notifEmpty: { padding: '24px 16px', textAlign: 'center', color: '#6B7280', fontSize: 13 },
  notifItem: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.04)',
  },
  notifUnread: { background: 'rgba(124,58,237,.08)' },
  notifDot: { width: 7, height: 7, borderRadius: '50%', background: '#94A3B8', flexShrink: 0, marginTop: 4 },
  notifMsg: { fontSize: 12, color: '#E5E7EB', lineHeight: 1.5 },
  notifTime: { fontSize: 10, color: '#6B7280', marginTop: 3 },
  sideToggleCollapsed: {
    width: 34, height: 34, borderRadius: 10,
    background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)',
    color: '#94A3B8', cursor: 'pointer', fontSize: 15,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  statusBar: {
    display: 'flex', alignItems: 'center', gap: 7, padding: '0 16px 12px', flexShrink: 0,
  },
  statusDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  statusText: { fontSize: 11, color: '#94A3B8' },

  divider: { height: 1, background: 'rgba(124,58,237,.15)', margin: '0 16px', flexShrink: 0 },

  nav: { flex: 1, padding: '12px 10px', overflowY: 'auto', overflowX: 'hidden' },
  groupLabel: {
    fontSize: 9, fontWeight: 700, color: '#6D28D9',
    letterSpacing: '0.12em', padding: '10px 10px 5px',
  },
  groupDivider: { height: 1, background: 'rgba(255,255,255,.04)', margin: '8px 4px' },

  navItem: {
    display: 'flex', alignItems: 'center', gap: 11,
    padding: '9px 12px', borderRadius: 9,
    color: '#94A3B8', textDecoration: 'none',
    fontSize: 13, fontWeight: 500,
    position: 'relative', whiteSpace: 'nowrap',
  },
  navItemCollapsed: { padding: '10px', justifyContent: 'center' },
  navActive: {
    background: 'linear-gradient(135deg, rgba(124,58,237,.25) 0%, rgba(13,148,136,.1) 100%)',
    color: '#FFFFFF',
    boxShadow: 'inset 0 0 0 1px rgba(124,58,237,.35)',
  },
  navIcon:  { fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 },
  navLabel: { flex: 1 },

  footer: { padding: '0 10px 14px', flexShrink: 0 },
  footerInner: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 6px' },
  footerAvatar: {
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #7C3AED, #0D9488)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700,
  },
  avatarCollapsed: {
    width: 34, height: 34, borderRadius: '50%', margin: '8px auto',
    background: 'linear-gradient(135deg, #7C3AED, #0D9488)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, cursor: 'default',
  },
  footerInfo: { flex: 1, minWidth: 0 },
  footerName:  { color: '#FFFFFF', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  footerEmail: { color: '#7C3AED', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  logoutBtn: {
    width: '100%', padding: '8px 10px',
    background: 'transparent', border: '1px solid rgba(124,58,237,.25)',
    color: '#94A3B8', borderRadius: 8, cursor: 'pointer',
    fontSize: 12, display: 'flex', alignItems: 'center', gap: 7, marginTop: 4,
  },
  logoutIcon: { fontSize: 14 },

  main: {
    flex: 1, minHeight: '100vh', padding: '36px 36px',
    background: 'var(--bg)',
    transition: 'margin-left .25s cubic-bezier(.4,0,.2,1)',
  },
};

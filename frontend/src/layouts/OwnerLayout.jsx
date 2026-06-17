import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useOwner } from '../context/OwnerContext';
import { useTheme } from '../context/ThemeContext';
import { useBreakpoint } from '../hooks/useMobile';
import api from '../api/axios';

const NAV = [
  { to: '/owner/dashboard',             icon: '◈', label: 'Dashboard',     group: 'main'  },
  { to: '/owner/bookings',              icon: '◉', label: 'Bookings',      group: 'main'  },
  { to: '/owner/services',              icon: '◇', label: 'Services',      group: 'main'  },
  { to: '/owner/team',                  icon: '✦', label: 'Team',          group: 'main'  },
  { to: '/owner/staff',                 icon: '◈', label: 'Staff Profiles', group: 'main'  },
  { to: '/owner/promotions',            icon: '⬡', label: 'Promotions',    group: 'main'  },
  { to: '/owner/offers',               icon: '◑', label: 'Offers',         group: 'main'  },
  { to: '/owner/gallery',               icon: '◫', label: 'Gallery',       group: 'main'  },
  { to: '/owner/analytics',             icon: '◱', label: 'Analytics',     group: 'main'  },
  { to: '/owner/subscription',          icon: '◆', label: 'Subscription',  group: 'main'  },
  { to: '/owner/inventory',             icon: '▦', label: 'Products',      group: 'stock' },
  { to: '/owner/inventory/grn',         icon: '⊕', label: 'Receive Stock', group: 'stock' },
  { to: '/owner/inventory/sales',       icon: '⊘', label: 'Record Sales',  group: 'stock' },
  { to: '/owner/inventory/adjustments', icon: '⊡', label: 'Adjustments',   group: 'stock' },
  { to: '/owner/reports',               icon: '◰', label: 'Reports',       group: 'stock' },
  { to: '/owner/settings',              icon: '⚙', label: 'Settings',       group: 'account' },
];

const PLAN_LABELS = { free_trial: 'Free Trial', starter: 'Starter', professional: 'Professional', premium: 'Premium' };
const PLAN_COLORS = { free_trial: '#6B7280', starter: '#14B8A8', professional: '#0D9488', premium: '#D4AF37' };
const PLAN_ICONS  = { free_trial: '🆓', starter: '🚀', professional: '💎', premium: '👑' };

const GROUPS = [
  { key: 'main',    label: 'Workspace' },
  { key: 'stock',   label: 'Inventory' },
  { key: 'account', label: 'Account'   },
];

export default function OwnerLayout() {
  const { profile, logout } = useAuth();
  const { salon }           = useOwner();
  const { isDark, toggle }  = useTheme();
  const navigate            = useNavigate();
  const location            = useLocation();
  const { isMobile, isTablet }  = useBreakpoint();
  const [collapsed, setCollapsed]       = useState(false);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [notifs, setNotifs]             = useState([]);
  const [showNotifs, setShowNotifs]     = useState(false);
  const bellRef = useRef(null);

  // Close drawer on route change (mobile)
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    const fetchCount = () =>
      api.get('/users/notifications/unread-count/').then(r => setUnreadCount(r.data.count)).catch(() => {});
    fetchCount();
    const iv = setInterval(fetchCount, 30000);
    return () => clearInterval(iv);
  }, []);

  const openNotifs = () => {
    if (!showNotifs) api.get('/users/notifications/').then(r => setNotifs(r.data)).catch(() => {});
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

  const handleLogout = async () => { await logout(); navigate('/owner/login'); };
  const initials = (profile?.full_name || 'O').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const sidebarVisible = isMobile ? drawerOpen : true;
  const sidebarWidth   = isMobile ? 272 : (isTablet || collapsed) ? 68 : 252;

  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [reactivateReason, setReactivateReason] = useState('');
  const [reactivateSending, setReactivateSending] = useState(false);
  const [reactivateMsg, setReactivateMsg] = useState('');
  const [reactivateErr, setReactivateErr] = useState('');

  const submitReactivation = async () => {
    setReactivateSending(true);
    setReactivateMsg(''); setReactivateErr('');
    try {
      const res = await api.post('/owner/request-reactivation/', { reason: reactivateReason });
      setReactivateMsg(res.data.detail || 'Request submitted.');
      setReactivateReason('');
    } catch (e) {
      setReactivateErr(e.response?.data?.detail || 'Failed to send request. Please try again.');
    } finally {
      setReactivateSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Mobile top bar */}
      {isMobile && (
        <header style={s.mobileHeader}>
          <button style={s.burgerBtn} onClick={() => setDrawerOpen(v => !v)}>
            <span style={s.burgerLine} />
            <span style={s.burgerLine} />
            <span style={s.burgerLine} />
          </button>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
            {salon?.name || 'BookMyStyle'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: isDark ? '#5EEAD4' : '#0D9488' }}>
              {isDark ? '☀' : '☾'}
            </button>
          </div>
        </header>
      )}

      {/* Backdrop overlay on mobile */}
      {isMobile && drawerOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 99, backdropFilter: 'blur(2px)' }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside style={{
        ...s.sidebar,
        width: sidebarWidth,
        ...(isMobile ? {
          position: 'fixed', left: 0, top: 0, zIndex: 110,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
        } : {
          width: (isTablet || collapsed) ? 68 : 252,
        }),
      }}>

        {/* Brand / header */}
        <div style={s.brandArea}>
          <div style={s.brandIcon} onClick={() => !isMobile && setCollapsed(v => !v)} title={(collapsed || isTablet) ? 'Expand' : 'Collapse'}>✦</div>
          {!(collapsed || isTablet) && (
            <>
              <div style={s.brandText}>
                <div style={s.brandName}>{salon?.name || 'My Salon'}</div>
                <div style={s.brandSub}>Owner Portal</div>
                {salon?.subscription_plan && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 5,
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                    color: PLAN_COLORS[salon.subscription_plan] || '#5EEAD4',
                    background: (PLAN_COLORS[salon.subscription_plan] || '#0D9488') + '1A',
                    borderRadius: 20, padding: '2px 8px',
                    border: `1px solid ${(PLAN_COLORS[salon.subscription_plan] || '#0D9488')}35`,
                  }}>
                    {PLAN_ICONS[salon.subscription_plan]}{' '}
                    {PLAN_LABELS[salon.subscription_plan]}
                    {salon.subscription_days_remaining != null && ` · ${salon.subscription_days_remaining}d`}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                {/* Notification bell */}
                <div ref={bellRef} style={{ position: 'relative' }}>
                  <button onClick={openNotifs} style={s.sideToggle} title="Notifications">
                    🔔
                    {unreadCount > 0 && <span style={s.bellBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
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
                        {notifs.length === 0 && <div style={s.notifEmpty}>No notifications yet</div>}
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
                <button onClick={toggle} title={isDark ? 'Light mode' : 'Dark mode'} style={s.sideToggle}>
                  {isDark ? '☀' : '☾'}
                </button>
              </div>
            </>
          )}
          {(collapsed || isTablet) && !isMobile && (
            <button onClick={toggle} title={isDark ? 'Light mode' : 'Dark mode'} style={{ ...s.sideToggle, margin: '0 auto' }}>
              {isDark ? '☀' : '☾'}
            </button>
          )}
        </div>

        {/* Status pill */}
        {!collapsed && salon && (
          <div style={s.statusPill}>
            <span style={{
              ...s.statusDot,
              background: salon.is_suspended ? '#DC2626' : salon.status === 'active' ? '#14B8A8' : '#D4AF37',
              boxShadow: salon.is_suspended ? '0 0 8px rgba(220,38,38,.5)' : salon.status === 'active' ? '0 0 8px rgba(13,148,136,.5)' : '0 0 8px rgba(212,175,55,.5)',
            }} />
            <span style={{ ...s.statusText, color: salon.is_suspended ? '#FCA5A5' : '#5EEAD4' }}>
              {salon.is_suspended ? 'Suspended' : salon.status === 'active' ? 'Live & Accepting' : salon.status === 'pending' ? 'Pending Approval' : 'Inactive'}
            </span>
          </div>
        )}

        <div style={s.divider} />

        {/* Navigation */}
        <nav style={s.nav}>
          {GROUPS.map(group => (
            <div key={group.key}>
              {!(collapsed || isTablet) && <div style={s.groupLabel}>{group.label}</div>}
              {NAV.filter(n => n.group === group.key).map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/owner/dashboard' || item.to === '/owner/inventory'}
                  className="nav-salon"
                  style={({ isActive }) => ({
                    ...s.navItem,
                    ...((collapsed || isTablet) ? s.navItemCollapsed : {}),
                    ...(isActive ? s.navActive : {}),
                  })}
                  title={(collapsed || isTablet) ? item.label : undefined}
                >
                  <span style={s.navIcon}>{item.icon}</span>
                  {!(collapsed || isTablet) && <span style={s.navLabel}>{item.label}</span>}
                </NavLink>
              ))}
              {!(collapsed || isTablet) && <div style={s.groupDivider} />}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={s.footer}>
          <div style={s.divider} />
          {(collapsed || isTablet) ? (
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
            style={{ ...s.logoutBtn, justifyContent: (collapsed || isTablet) ? 'center' : 'flex-start' }}
            onClick={handleLogout}
          >
            <span style={s.logoutIcon}>⎋</span>
            {!(collapsed || isTablet) && ' Sign Out'}
          </button>
        </div>
      </aside>

      <main style={{
        ...s.main,
        marginLeft: isMobile ? 0 : sidebarWidth,
        padding: isMobile ? '16px 16px 80px' : isTablet ? '20px 20px 80px' : '36px 40px',
        marginTop: isMobile ? 56 : 0,
      }}>
        {/* Suspension banner */}
        {salon?.is_suspended && (
          <div style={s.suspendBanner}>
            <div style={s.suspendBannerInner}>
              <div style={s.suspendIcon}>⏸</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.suspendTitle}>Your salon is temporarily suspended</div>
                <div style={s.suspendSub}>
                  Your salon is not visible to customers and cannot accept new bookings.
                  If you believe this is an error, submit a re-enable request below.
                </div>
              </div>
              <button
                style={s.suspendBtn}
                onClick={() => { setShowReactivateModal(true); setReactivateMsg(''); setReactivateErr(''); }}
              >
                Request Re-enable
              </button>
            </div>
          </div>
        )}

        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } }}
          style={{ minHeight: '100%' }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Re-enable request modal */}
      <AnimatePresence>
        {showReactivateModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={s.modalOverlay}
            onClick={e => { if (e.target === e.currentTarget) setShowReactivateModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={s.modal}
            >
              <div style={s.modalHeader}>
                <div style={s.modalTitleRow}>
                  <span style={s.modalIcon}>⏸</span>
                  <div>
                    <div style={s.modalTitle}>Request Re-enable</div>
                    <div style={s.modalSub}>Explain your situation to the admin for review</div>
                  </div>
                </div>
                <button style={s.modalClose} onClick={() => setShowReactivateModal(false)}>✕</button>
              </div>

              {reactivateMsg ? (
                <div style={s.modalSuccess}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0D9488', marginBottom: 6 }}>Request Submitted</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>{reactivateMsg}</div>
                  <button style={{ ...s.submitBtn, marginTop: 20 }} onClick={() => setShowReactivateModal(false)}>Close</button>
                </div>
              ) : (
                <div style={s.modalBody}>
                  <label style={s.modalLabel}>
                    Message to admin <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    style={s.modalTextarea}
                    rows={5}
                    placeholder="Explain why your salon should be reinstated, provide any relevant context…"
                    value={reactivateReason}
                    onChange={e => setReactivateReason(e.target.value)}
                  />
                  {reactivateErr && <div style={s.modalErr}>{reactivateErr}</div>}
                  <div style={s.modalActions}>
                    <button style={s.cancelBtn} onClick={() => setShowReactivateModal(false)}>Cancel</button>
                    <button
                      style={{ ...s.submitBtn, opacity: reactivateSending ? 0.7 : 1 }}
                      disabled={reactivateSending}
                      onClick={submitReactivation}
                    >
                      {reactivateSending ? 'Sending…' : 'Send Request'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom tab bar — main workspace items */}
      {isMobile && (
        <nav className="bottom-tab-bar owner-bottom-bar">
          {NAV.filter(n => n.group === 'main').slice(0, 5).map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/owner/dashboard'}>
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
  sidebar: {
    background: 'linear-gradient(180deg, #111120 0%, #0D0D16 100%)',
    display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, height: '100vh',
    zIndex: 100, flexShrink: 0,
    transition: 'width .28s cubic-bezier(.4,0,.2,1)',
    overflow: 'visible',
    borderRight: '1px solid rgba(13,148,136,.1)',
  },
  brandArea: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '22px 14px 14px', flexShrink: 0,
  },
  brandIcon: {
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(145deg, #0D9488 0%, #14B8A8 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(13,148,136,.5), inset 0 1px 0 rgba(255,255,255,.2)',
    transition: 'transform .2s ease',
  },
  brandText: { overflow: 'hidden', flex: 1, minWidth: 0 },
  brandName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    color: '#FFFFFF', fontWeight: 700, fontSize: 15,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    letterSpacing: '-0.01em',
  },
  brandSub: {
    color: '#5EEAD4', fontSize: 9, letterSpacing: '0.14em',
    textTransform: 'uppercase', marginTop: 2, fontWeight: 600,
  },
  sideToggle: {
    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
    background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)',
    color: '#5EEAD4', cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute', top: -5, right: -5,
    background: '#0D9488', color: '#fff',
    fontSize: 9, fontWeight: 800, borderRadius: 20,
    padding: '1px 4px', lineHeight: 1.4, minWidth: 14, textAlign: 'center',
    boxShadow: '0 2px 6px rgba(13,148,136,.5)',
  },
  notifDropdown: {
    position: 'absolute', top: 38, left: 0,
    width: 300, background: '#12121C',
    border: '1px solid rgba(13,148,136,.25)',
    borderRadius: 16, boxShadow: '0 20px 48px rgba(0,0,0,.55)',
    zIndex: 200, overflow: 'hidden',
  },
  notifHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.06)',
  },
  notifTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 13, fontWeight: 700, color: '#99F6E4', letterSpacing: '0.02em',
  },
  markReadBtn: { fontSize: 11, color: '#5EEAD4', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 },
  notifList: { maxHeight: 320, overflowY: 'auto' },
  notifEmpty: { padding: '28px 18px', textAlign: 'center', color: '#6B7280', fontSize: 13 },
  notifItem: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '11px 18px', borderBottom: '1px solid rgba(255,255,255,.04)',
  },
  notifUnread: { background: 'rgba(13,148,136,.1)' },
  notifDot: { width: 7, height: 7, borderRadius: '50%', background: '#5EEAD4', flexShrink: 0, marginTop: 5 },
  notifMsg: { fontSize: 12, color: '#E5E7EB', lineHeight: 1.5 },
  notifTime: { fontSize: 10, color: '#6B7280', marginTop: 3 },

  statusPill: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '2px 16px 14px', flexShrink: 0,
  },
  statusDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  statusText: { fontSize: 11, color: '#5EEAD4', fontWeight: 500 },

  divider: { height: 1, background: 'rgba(13,148,136,.14)', margin: '0 14px', flexShrink: 0 },

  nav: { flex: 1, padding: '12px 10px', overflowY: 'auto', overflowX: 'hidden' },
  groupLabel: {
    fontSize: 9, fontWeight: 700, color: 'rgba(13,148,136,.55)',
    letterSpacing: '0.14em', padding: '10px 10px 5px', textTransform: 'uppercase',
  },
  groupDivider: { height: 1, background: 'rgba(255,255,255,.04)', margin: '8px 6px' },

  navItem: {
    display: 'flex', alignItems: 'center', gap: 11,
    padding: '10px 13px', borderRadius: 10,
    color: '#5EEAD4', textDecoration: 'none',
    fontSize: 13, fontWeight: 500,
    position: 'relative', whiteSpace: 'nowrap',
  },
  navItemCollapsed: { padding: '11px', justifyContent: 'center' },
  navActive: {
    background: 'rgba(13,148,136,.22)',
    color: '#FFFFFF',
    boxShadow: 'inset 0 0 0 1px rgba(13,148,136,.3)',
  },
  navIcon:  { fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 },
  navLabel: { flex: 1 },

  footer: { padding: '0 10px 16px', flexShrink: 0 },
  footerInner: { display: 'flex', alignItems: 'center', gap: 10, padding: '13px 6px' },
  footerAvatar: {
    width: 33, height: 33, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(145deg, #0D9488, #14B8A8)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700,
  },
  avatarCollapsed: {
    width: 34, height: 34, borderRadius: '50%', margin: '10px auto',
    background: 'linear-gradient(145deg, #0D9488, #14B8A8)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, cursor: 'default',
  },
  footerInfo: { flex: 1, minWidth: 0 },
  footerName:  { color: '#FFFFFF', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  footerEmail: { color: '#5EEAD4', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 },

  logoutBtn: {
    width: '100%', padding: '9px 10px',
    background: 'transparent', border: '1px solid rgba(13,148,136,.22)',
    color: '#5EEAD4', borderRadius: 9, cursor: 'pointer',
    fontSize: 12, display: 'flex', alignItems: 'center', gap: 7, marginTop: 4,
    transition: 'background .18s ease, border-color .18s ease',
  },
  logoutIcon: { fontSize: 14 },

  main: {
    flex: 1, minHeight: '100vh', padding: '36px 40px',
    background: 'var(--bg)',
    transition: 'margin-left .28s cubic-bezier(.4,0,.2,1)',
  },

  suspendBanner: {
    background: 'linear-gradient(135deg, #450A0A 0%, #7F1D1D 100%)',
    border: '1px solid rgba(220,38,38,.4)',
    borderRadius: 14, marginBottom: 24,
    boxShadow: '0 4px 24px rgba(220,38,38,.2)',
  },
  suspendBannerInner: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '18px 22px', flexWrap: 'wrap',
  },
  suspendIcon: {
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
    background: 'rgba(220,38,38,.25)', border: '1px solid rgba(220,38,38,.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, color: '#FCA5A5',
  },
  suspendTitle: {
    fontWeight: 700, fontSize: 15, color: '#FEE2E2', marginBottom: 4,
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  suspendSub: { fontSize: 12, color: '#FCA5A5', lineHeight: 1.55 },
  suspendBtn: {
    padding: '10px 20px', borderRadius: 9, cursor: 'pointer', flexShrink: 0,
    background: 'rgba(220,38,38,.3)', border: '1px solid rgba(220,38,38,.5)',
    color: '#FEE2E2', fontSize: 13, fontWeight: 700,
    transition: 'background .18s ease',
    fontFamily: "'DM Sans', sans-serif",
  },

  modalOverlay: {
    position: 'fixed', inset: 0, zIndex: 9000,
    background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20,
  },
  modal: {
    background: 'var(--surface)', borderRadius: 20,
    border: '1px solid var(--border)',
    width: '100%', maxWidth: 460,
    boxShadow: '0 32px 80px rgba(0,0,0,.55)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '22px 24px 16px', borderBottom: '1px solid var(--border)',
  },
  modalTitleRow: { display: 'flex', alignItems: 'center', gap: 14 },
  modalIcon: {
    width: 42, height: 42, borderRadius: 12, background: 'rgba(220,38,38,.1)',
    border: '1px solid rgba(220,38,38,.2)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 18, color: '#DC2626', flexShrink: 0,
  },
  modalTitle: { fontWeight: 700, fontSize: 17, color: 'var(--text)', fontFamily: "'Cormorant Garamond', Georgia, serif" },
  modalSub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  modalClose: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', padding: '4px 6px' },
  modalBody: { padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 },
  modalLabel: { fontSize: 13, fontWeight: 600, color: 'var(--text-sub)' },
  modalTextarea: {
    padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: 11,
    fontSize: 13, background: 'var(--input-bg)', color: 'var(--text)',
    resize: 'vertical', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  modalErr: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 },
  cancelBtn: {
    padding: '11px 20px', border: '1.5px solid var(--border)', borderRadius: 10,
    background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
  },
  submitBtn: {
    padding: '11px 24px', background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
    border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
    boxShadow: '0 4px 14px rgba(220,38,38,.4)',
  },
  modalSuccess: {
    padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
  },

  mobileHeader: {
    position: 'fixed', top: 0, left: 0, right: 0, height: 56,
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', zIndex: 100,
    boxShadow: '0 1px 0 var(--border)',
  },
  burgerBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: 5, padding: '8px 4px',
  },
  burgerLine: {
    display: 'block', width: 22, height: 2, borderRadius: 2,
    background: 'var(--text)', transition: 'background .18s ease',
  },
};

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { STATUS_META } from '../../styles/theme';
import { useBreakpoint } from '../../hooks/useMobile';

export default function OwnerDashboard() {
  const { salon, loading: salonLoading } = useOwner();
  const { isMobile, isTablet } = useBreakpoint();
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, lowStock: 0, todayBookings: [] });

  useEffect(() => {
    if (!salon) return;
    Promise.all([
      api.get(`/salons/${salon.id}/bookings/pending/`),
      api.get(`/salons/${salon.id}/bookings/?status=confirmed`),
      api.get(`/salons/${salon.id}/reports/low-stock/`),
      api.get(`/salons/${salon.id}/bookings/`),
    ]).then(([pending, confirmed, low, all]) => {
      const today = new Date().toDateString();
      const todayBookings = all.data.filter(
        b => new Date(b.requested_datetime).toDateString() === today && ['pending','confirmed'].includes(b.status)
      );
      setStats({ pending: pending.data.length, confirmed: confirmed.data.length, lowStock: low.data.length, todayBookings });
    }).catch(() => {});
  }, [salon]);

  if (salonLoading) return (
    <div style={s.loader}>
      <div style={s.loaderSpinner} />
    </div>
  );

  if (!salon) return (
    <div style={s.noSalon} className="scale-in">
      <div style={s.noSalonOrb}>◈</div>
      <h3 style={s.noSalonTitle}>No Salon Registered</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 15, lineHeight: 1.7 }}>Register your salon to unlock your dashboard.</p>
      <Link to="/register/owner" style={s.heroBtn}>Register Salon</Link>
    </div>
  );

  const statCards = [
    {
      label: 'Pending Bookings', value: stats.pending,
      grad: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
      color: '#D97706', border: '#FDE68A66', icon: '⏳',
      to: '/owner/bookings',
    },
    {
      label: 'Confirmed Today', value: stats.confirmed,
      grad: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
      color: '#059669', border: '#6EE7B766', icon: '✓',
      to: '/owner/bookings',
    },
    {
      label: 'Low Stock Alerts', value: stats.lowStock,
      grad: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
      color: '#DC2626', border: '#FCA5A566', icon: '⚠',
      to: '/owner/reports',
    },
    {
      label: "Today's Queue", value: stats.todayBookings.length,
      grad: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      color: '#2563EB', border: '#93C5FD66', icon: '◉',
      to: '/owner/bookings',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ ...s.header, flexDirection: isMobile ? 'column' : 'row' }} className="fade-up">
        <div>
          <div style={s.eyebrow}>Dashboard</div>
          <h2 style={{ ...s.title, fontSize: isMobile ? 24 : isTablet ? 26 : 30 }}>{salon.name}</h2>
          <div style={s.statusRow}>
            <span style={{ ...s.statusDot, background: salon.status === 'active' ? '#34D399' : '#FBBF24', boxShadow: salon.status === 'active' ? '0 0 0 4px rgba(52,211,153,.2)' : '0 0 0 4px rgba(251,191,36,.2)' }} />
            <span style={s.statusText}>
              {salon.status === 'active' ? 'Live & Accepting Bookings' : salon.status === 'pending' ? 'Pending Admin Approval' : 'Currently Inactive'}
            </span>
          </div>
        </div>
        <Link to="/owner/bookings" style={{ ...s.heroBtn, alignSelf: isMobile ? 'stretch' : 'auto', justifyContent: 'center' }} className="fade-up d2 lift-sm">
          View All Bookings →
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ ...s.statGrid, gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
        {statCards.map((sc, i) => (
          <Link
            key={sc.label}
            to={sc.to}
            style={{ ...s.statCard, background: sc.grad, border: `1px solid ${sc.border}` }}
            className={`lift-sm fade-up d${i + 1}`}
          >
            <div style={{ ...s.statIconWrap, color: sc.color, background: sc.color + '18' }}>
              {sc.icon}
            </div>
            <div style={{ ...s.statVal, color: sc.color }}>{sc.value}</div>
            <div style={{ ...s.statLabel, color: sc.color + 'AA' }}>{sc.label}</div>
            <div style={{ ...s.statArrow, color: sc.color }}>→</div>
          </Link>
        ))}
      </div>

      {/* Today's appointments */}
      <div style={s.section} className="fade-up d4">
        <div style={s.sectionHead}>
          <div>
            <div style={s.sectionEyebrow}>Today</div>
            <h3 style={s.sectionTitle}>Today's Appointments</h3>
          </div>
          <span style={s.sectionCount}>{stats.todayBookings.length} scheduled</span>
        </div>

        {stats.todayBookings.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyOrb}>◷</div>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>No appointments scheduled for today.</p>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Client', 'Time', 'Services', 'Status', ''].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.todayBookings.map(b => {
                  const meta = STATUS_META[b.status] || { label: b.status, color: '#888', bg: '#f0f0f0' };
                  return (
                    <tr key={b.id} style={s.tr}>
                      <td style={s.td}>
                        <div style={s.clientRow}>
                          <div style={{ ...s.clientAvatar, background: meta.bg, color: meta.color, boxShadow: `0 3px 10px ${meta.color}28` }}>
                            {b.client_email?.[0]?.toUpperCase()}
                          </div>
                          <span style={s.clientEmail}>{b.client_email}</span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={s.timeChip}>
                          {new Date(b.requested_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={s.svcsText}>{b.booking_services?.map(bs => bs.service_name).join(', ') || '—'}</span>
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}30` }}>
                          {meta.label}
                        </span>
                      </td>
                      <td style={s.td}>
                        <Link to={`/owner/bookings/${b.id}`} style={s.manageBtn}>Manage →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ ...s.quickGrid, gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }} className="fade-up d5">
        {[
          { label: 'Manage Inventory', icon: '▦', to: '/owner/inventory', color: '#7C3AED', sub: 'Stock levels & products' },
          { label: 'Receive Stock', icon: '⊕', to: '/owner/inventory/grn', color: '#059669', sub: 'New goods received' },
          { label: 'Record a Sale', icon: '⊘', to: '/owner/inventory/sales', color: '#2563EB', sub: 'Log retail sales' },
          { label: 'View Reports', icon: '◰', to: '/owner/reports', color: '#D97706', sub: 'Analytics & insights' },
        ].map(a => (
          <Link key={a.label} to={a.to} style={{ ...s.quickCard, borderTop: `3px solid ${a.color}` }} className="lift-sm">
            <div style={{ ...s.quickIconWrap, color: a.color, background: a.color + '14' }}>{a.icon}</div>
            <div>
              <div style={s.quickLabel}>{a.label}</div>
              <div style={s.quickSub}>{a.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const s = {
  loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 },
  loaderSpinner: {
    width: 36, height: 36, borderRadius: '50%',
    border: '3px solid rgba(124,58,237,.15)', borderTopColor: '#7C3AED',
    animation: 'spinSlow .7s linear infinite',
  },
  noSalon: {
    textAlign: 'center', padding: '80px 40px',
    background: 'var(--surface)', borderRadius: 24,
    border: '1px solid var(--border)',
    boxShadow: '0 4px 24px rgba(124,58,237,.08)',
  },
  noSalonOrb: {
    fontSize: 44, marginBottom: 18, color: 'var(--text-muted)', display: 'block',
  },
  noSalonTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 26, color: 'var(--text)', marginBottom: 10,
  },

  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 28, flexWrap: 'wrap', gap: 12,
  },
  eyebrow: {
    fontSize: 10, fontWeight: 700, color: 'var(--brand-label)',
    letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6,
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px',
    letterSpacing: '-0.01em',
  },
  statusRow: { display: 'flex', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: '50%', animation: 'pulseRing 2.5s ease infinite', flexShrink: 0 },
  statusText: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 },

  heroBtn: {
    padding: '11px 24px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #0D9488 100%)',
    color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14,
    textDecoration: 'none', boxShadow: '0 6px 20px rgba(124,58,237,.35)',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  },

  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
  statCard: {
    borderRadius: 20, padding: '22px 22px',
    textDecoration: 'none', display: 'block', position: 'relative',
    transition: 'transform .22s ease, box-shadow .22s ease',
    overflow: 'hidden',
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 17, marginBottom: 14,
  },
  statVal: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 38, fontWeight: 700, lineHeight: 1, marginBottom: 5,
  },
  statLabel: { fontSize: 12, fontWeight: 600, lineHeight: 1.3 },
  statArrow: { position: 'absolute', top: 18, right: 20, fontSize: 17, opacity: .5 },

  section: {
    background: 'var(--surface)', borderRadius: 22, overflow: 'hidden',
    border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(124,58,237,.07)', marginBottom: 24,
  },
  sectionHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 26px 16px', borderBottom: '1px solid var(--border)',
  },
  sectionEyebrow: {
    fontSize: 9, fontWeight: 700, color: 'var(--brand-label)',
    letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 19, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em',
  },
  sectionCount: {
    fontSize: 12, color: 'var(--text-muted)',
    background: 'var(--surface2)', borderRadius: 20, padding: '4px 12px',
    border: '1px solid var(--border)',
  },
  empty: { padding: '44px', textAlign: 'center' },
  emptyOrb: { fontSize: 32, marginBottom: 10, display: 'block', color: 'var(--text-light)', opacity: .6 },

  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '10px 22px', textAlign: 'left',
    fontSize: 9, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    background: 'var(--surface2)', borderBottom: '1px solid var(--border)',
  },
  tr: { transition: 'background .15s ease' },
  td: { padding: '14px 22px', borderBottom: '1px solid var(--border)', fontSize: 13 },
  clientRow: { display: 'flex', alignItems: 'center', gap: 10 },
  clientAvatar: {
    width: 32, height: 32, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 14, fontWeight: 700, flexShrink: 0,
  },
  clientEmail: { fontWeight: 500, color: 'var(--text)', fontSize: 13 },
  timeChip: {
    background: 'rgba(124,58,237,.08)', color: '#7C3AED', borderRadius: 8,
    padding: '3px 10px', fontSize: 12, fontWeight: 700,
    border: '1px solid rgba(124,58,237,.15)',
  },
  svcsText: { fontSize: 12, color: 'var(--text-muted)' },
  badge: { display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  manageBtn: {
    fontSize: 12, color: '#7C3AED', fontWeight: 700,
    background: 'rgba(124,58,237,.08)', borderRadius: 8, padding: '5px 12px',
    border: '1px solid rgba(124,58,237,.15)', transition: 'background .15s ease',
    textDecoration: 'none',
  },

  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 },
  quickCard: {
    background: 'var(--surface)', borderRadius: 16, padding: '18px 20px',
    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14,
    border: '1px solid var(--border)',
    boxShadow: '0 2px 10px rgba(124,58,237,.05)',
    transition: 'transform .2s ease, box-shadow .2s ease',
  },
  quickIconWrap: {
    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18,
  },
  quickLabel: { fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 2 },
  quickSub: { fontSize: 11, color: 'var(--text-muted)' },
};
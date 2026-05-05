import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { c, STATUS_META } from '../../styles/theme';

export default function OwnerDashboard() {
  const { salon, loading: salonLoading } = useOwner();
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
      <div style={{ fontSize: 52, marginBottom: 16 }}>🏪</div>
      <h3 style={s.noSalonTitle}>No Salon Registered</h3>
      <p style={{ color: c.textMuted, marginBottom: 24 }}>Register your salon to unlock your dashboard.</p>
      <Link to="/register/owner" style={s.heroBtn}>Register Salon</Link>
    </div>
  );

  const statCards = [
    {
      label: 'Pending Bookings', value: stats.pending,
      grad: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
      color: '#D97706', border: '#FDE68A', icon: '⏳',
      to: '/owner/bookings',
    },
    {
      label: 'Confirmed Today', value: stats.confirmed,
      grad: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
      color: '#059669', border: '#6EE7B7', icon: '✓',
      to: '/owner/bookings',
    },
    {
      label: 'Low Stock Alerts', value: stats.lowStock,
      grad: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
      color: '#DC2626', border: '#FCA5A5', icon: '⚠',
      to: '/owner/reports',
    },
    {
      label: "Today's Queue", value: stats.todayBookings.length,
      grad: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      color: '#2563EB', border: '#93C5FD', icon: '◉',
      to: '/owner/bookings',
    },
  ];

  return (
    <div>
      {/* Greeting header */}
      <div style={s.header} className="fade-up">
        <div>
          <div style={s.eyebrow}>Dashboard</div>
          <h2 style={s.title}>{salon.name}</h2>
          <div style={s.statusRow}>
            <span style={{ ...s.statusDot, background: salon.status === 'active' ? '#34D399' : '#FBBF24' }} />
            <span style={s.statusText}>
              {salon.status === 'active' ? 'Live & Accepting Bookings' : salon.status === 'pending' ? 'Pending Admin Approval' : 'Currently Inactive'}
            </span>
          </div>
        </div>
        <Link to="/owner/bookings" style={s.heroBtn} className="fade-up d2">
          View All Bookings →
        </Link>
      </div>

      {/* Stat cards */}
      <div style={s.statGrid}>
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
          <h3 style={s.sectionTitle}>Today's Appointments</h3>
          <span style={s.sectionCount}>{stats.todayBookings.length} scheduled</span>
        </div>

        {stats.todayBookings.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 36, marginBottom: 10, opacity: .4 }}>📅</div>
            <p style={{ color: c.textMuted, margin: 0 }}>No appointments scheduled for today.</p>
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
                {stats.todayBookings.map((b, i) => {
                  const meta = STATUS_META[b.status] || { label: b.status, color: '#888', bg: '#f0f0f0' };
                  return (
                    <tr key={b.id} style={s.tr} className="lift-sm">
                      <td style={s.td}>
                        <div style={s.clientRow}>
                          <div style={{ ...s.clientAvatar, background: meta.bg, color: meta.color }}>
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
      <div style={s.quickGrid} className="fade-up d5">
        {[
          { label: 'Manage Inventory', icon: '▦', to: '/owner/inventory', color: '#7C3AED', sub: 'Stock levels & products' },
          { label: 'Receive Stock', icon: '⊕', to: '/owner/inventory/grn', color: '#059669', sub: 'New goods received' },
          { label: 'Record a Sale', icon: '⊘', to: '/owner/inventory/sales', color: '#2563EB', sub: 'Log retail sales' },
          { label: 'View Reports', icon: '◰', to: '/owner/reports', color: '#D97706', sub: 'Analytics & insights' },
        ].map(a => (
          <Link key={a.label} to={a.to} style={{ ...s.quickCard, borderTop: `3px solid ${a.color}` }} className="lift-sm">
            <span style={{ ...s.quickIcon, color: a.color }}>{a.icon}</span>
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
    border: '3px solid #EDE9FE', borderTopColor: '#7C3AED',
    animation: 'spinSlow .7s linear infinite',
  },
  noSalon: {
    textAlign: 'center', padding: '80px 40px',
    background: '#fff', borderRadius: 20,
    border: '1px solid #EDE9FE',
    boxShadow: '0 4px 20px rgba(124,58,237,.08)',
  },
  noSalonTitle: { fontFamily: "'Playfair Display', serif", fontSize: 24, color: c.text, marginBottom: 8 },

  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 28, flexWrap: 'wrap', gap: 12,
  },
  eyebrow: { fontSize: 11, fontWeight: 600, color: '#A78BFA', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#111827', margin: '0 0 8px' },
  statusRow: { display: 'flex', alignItems: 'center', gap: 7 },
  statusDot: { width: 8, height: 8, borderRadius: '50%', animation: 'pulseRing 2.5s ease infinite' },
  statusText: { fontSize: 12, color: c.textMuted, fontWeight: 500 },

  heroBtn: {
    padding: '11px 24px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14,
    textDecoration: 'none', boxShadow: '0 4px 14px rgba(124,58,237,.3)',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  },

  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
  statCard: {
    borderRadius: 18, padding: '20px 22px',
    textDecoration: 'none', display: 'block', position: 'relative',
    transition: 'transform .22s ease, box-shadow .22s ease',
    overflow: 'hidden',
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, marginBottom: 12,
  },
  statVal: { fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 800, lineHeight: 1, marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: 600 },
  statArrow: { position: 'absolute', top: 18, right: 20, fontSize: 18, opacity: .5 },

  section: {
    background: '#fff', borderRadius: 20, overflow: 'hidden',
    border: '1px solid #EDE9FE',
    boxShadow: '0 4px 20px rgba(124,58,237,.07)', marginBottom: 24,
  },
  sectionHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6',
  },
  sectionTitle: { fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: c.text, margin: 0 },
  sectionCount: { fontSize: 12, color: c.textMuted, background: '#F3F4F6', borderRadius: 20, padding: '3px 10px' },
  empty: { padding: '40px', textAlign: 'center' },

  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '10px 20px', textAlign: 'left',
    fontSize: 10, fontWeight: 700, color: c.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.08em',
    background: '#FAFAFA', borderBottom: '1px solid #F3F4F6',
  },
  tr: { transition: 'background .15s ease', cursor: 'default' },
  td: { padding: '14px 20px', borderBottom: '1px solid #F9FAFB', fontSize: 13 },
  clientRow: { display: 'flex', alignItems: 'center', gap: 10 },
  clientAvatar: {
    width: 32, height: 32, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  clientEmail: { fontWeight: 500, color: c.text, fontSize: 13 },
  timeChip: {
    background: '#F5F3FF', color: '#7C3AED', borderRadius: 8,
    padding: '3px 10px', fontSize: 12, fontWeight: 700,
    border: '1px solid #EDE9FE',
  },
  svcsText: { fontSize: 12, color: c.textMuted },
  badge: { display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  manageBtn: {
    fontSize: 12, color: '#7C3AED', fontWeight: 700,
    background: '#F5F3FF', borderRadius: 8, padding: '5px 12px',
    border: '1px solid #EDE9FE', transition: 'background .15s ease',
  },

  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 },
  quickCard: {
    background: '#fff', borderRadius: 14, padding: '16px 18px',
    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14,
    border: '1px solid #E5E7EB',
    boxShadow: '0 2px 8px rgba(0,0,0,.05)',
    transition: 'transform .2s ease, box-shadow .2s ease',
  },
  quickIcon: { fontSize: 22, flexShrink: 0 },
  quickLabel: { fontWeight: 600, fontSize: 13, color: c.text, marginBottom: 2 },
  quickSub: { fontSize: 11, color: c.textMuted },
};

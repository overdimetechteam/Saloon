import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { c, shadow, STATUS_META } from '../../styles/theme';

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
      const todayBookings = all.data.filter(b => new Date(b.requested_datetime).toDateString() === today && ['pending','confirmed'].includes(b.status));
      setStats({ pending: pending.data.length, confirmed: confirmed.data.length, lowStock: low.data.length, todayBookings });
    }).catch(() => {});
  }, [salon]);

  if (salonLoading) return <div style={s.loading}>Loading your dashboard…</div>;
  if (!salon) return (
    <div style={s.noSalon}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
      <h3>No Salon Registered</h3>
      <p style={{ color: c.textMuted }}>Register your salon to get started.</p>
      <Link to="/register/owner" style={s.btn}>Register Salon</Link>
    </div>
  );

  const statCards = [
    { label: 'Pending Bookings', value: stats.pending, color: c.warning, bg: c.warningBg, icon: '⏳', to: '/owner/bookings' },
    { label: 'Confirmed Today', value: stats.confirmed, color: c.success, bg: c.successBg, icon: '✅', to: '/owner/bookings' },
    { label: 'Low Stock Items', value: stats.lowStock, color: c.error, bg: c.errorBg, icon: '⚠️', to: '/owner/reports' },
    { label: "Today's Appointments", value: stats.todayBookings.length, color: c.info, bg: c.infoBg, icon: '📅', to: '/owner/bookings' },
  ];

  return (
    <div>
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.title}>Dashboard</h2>
          <p style={s.sub}>{salon.name} · <span style={{ ...s.statusPill, color: salon.status === 'active' ? c.success : c.warning }}>{salon.status}</span></p>
        </div>
        <Link to="/owner/bookings" style={s.btn}>View All Bookings</Link>
      </div>

      <div style={s.statGrid}>
        {statCards.map(sc => (
          <Link key={sc.label} to={sc.to} style={{ ...s.statCard, borderTopColor: sc.color, textDecoration: 'none' }}>
            <div style={{ ...s.statIcon, background: sc.bg, color: sc.color }}>{sc.icon}</div>
            <div style={s.statVal}>{sc.value}</div>
            <div style={s.statLabel}>{sc.label}</div>
          </Link>
        ))}
      </div>

      <div style={s.section}>
        <h3 style={s.sectionTitle}>Today's Appointments</h3>
        {stats.todayBookings.length === 0 ? (
          <div style={s.empty}>No appointments scheduled for today.</div>
        ) : (
          <table style={s.table}>
            <thead><tr>{['Client','Time','Services','Status','Action'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {stats.todayBookings.map(b => {
                const meta = STATUS_META[b.status] || { label: b.status, color: '#888', bg: '#f0f0f0' };
                return (
                  <tr key={b.id}>
                    <td style={s.td}>{b.client_email}</td>
                    <td style={s.td}>{new Date(b.requested_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={s.td}>{b.booking_services?.map(bs => bs.service_name).join(', ')}</td>
                    <td style={s.td}><span style={{ ...s.badge, color: meta.color, background: meta.bg }}>{meta.label}</span></td>
                    <td style={s.td}><Link to={`/owner/bookings/${b.id}`} style={s.link}>Manage</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const s = {
  loading: { padding: 60, textAlign: 'center', color: c.textMuted },
  noSalon: { textAlign: 'center', padding: '80px 40px', background: c.surface, borderRadius: 16, boxShadow: shadow.sm },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 26, fontWeight: 700, color: c.text, margin: 0, marginBottom: 4 },
  sub: { color: c.textMuted, fontSize: 14, margin: 0 },
  statusPill: { fontWeight: 600, textTransform: 'capitalize' },
  btn: { padding: '10px 22px', background: c.primary, color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 },
  statCard: { background: c.surface, borderRadius: 12, padding: 20, border: `1px solid ${c.border}`, borderTop: `4px solid transparent`, boxShadow: shadow.sm, display: 'flex', flexDirection: 'column', gap: 6 },
  statIcon: { fontSize: 22, width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statVal: { fontSize: 32, fontWeight: 800, color: c.text },
  statLabel: { fontSize: 13, color: c.textMuted, fontWeight: 500 },
  section: { background: c.surface, borderRadius: 14, padding: 24, border: `1px solid ${c.border}`, boxShadow: shadow.sm },
  sectionTitle: { fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 16 },
  empty: { padding: '30px 0', textAlign: 'center', color: c.textMuted, fontSize: 14 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `2px solid ${c.border}` },
  td: { padding: '12px 14px', borderBottom: `1px solid ${c.border}`, fontSize: 14, color: c.text },
  badge: { display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  link: { color: c.primary, textDecoration: 'none', fontWeight: 600, fontSize: 13 },
};

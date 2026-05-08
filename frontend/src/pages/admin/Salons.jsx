import { useState, useEffect } from 'react';
import api from '../../api/axios';

const STATUS_META = {
  pending:  { label: 'Pending',  color: '#D97706', bg: '#FFFBEB', border: 'rgba(217,119,6,.2)'  },
  active:   { label: 'Active',   color: '#059669', bg: '#ECFDF5', border: 'rgba(5,150,105,.2)'  },
  inactive: { label: 'Inactive', color: '#DC2626', bg: '#FEF2F2', border: 'rgba(220,38,38,.2)'  },
};

export default function AdminSalons() {
  const [salons, setSalons] = useState([]);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState('');

  const load = () => api.get('/admin/salons/').then(r => setSalons(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const approve = async id => {
    await api.post(`/salons/${id}/approve/`);
    load(); setMsg('Salon approved.'); setTimeout(() => setMsg(''), 3000);
  };
  const reject = async id => {
    await api.post(`/salons/${id}/reject/`);
    load(); setMsg('Salon rejected.'); setTimeout(() => setMsg(''), 3000);
  };

  const counts = salons.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {});
  const displayed = filter === 'all' ? salons : salons.filter(s => s.status === filter);

  return (
    <div>
      <div style={s.pageHeader} className="fade-up">
        <div>
          <div style={s.eyebrow}>Management</div>
          <h2 style={s.title}>All Salons</h2>
          <p style={s.sub}>View and manage every registered salon</p>
        </div>
      </div>

      {msg && <div style={s.alertOk}>{msg}</div>}

      <div style={s.statsRow} className="fade-up">
        {[
          { key: 'all',      label: 'Total',    val: salons.length,        color: '#7C3AED', bg: 'rgba(124,58,237,.08)', border: 'rgba(124,58,237,.18)', activeBorder: '#7C3AED' },
          { key: 'pending',  label: 'Pending',  val: counts.pending  || 0, color: '#D97706', bg: 'rgba(217,119,6,.08)',  border: 'rgba(217,119,6,.18)',  activeBorder: '#D97706' },
          { key: 'active',   label: 'Active',   val: counts.active   || 0, color: '#059669', bg: 'rgba(5,150,105,.08)', border: 'rgba(5,150,105,.18)',  activeBorder: '#059669' },
          { key: 'inactive', label: 'Inactive', val: counts.inactive || 0, color: '#DC2626', bg: 'rgba(220,38,38,.08)', border: 'rgba(220,38,38,.18)',  activeBorder: '#DC2626' },
        ].map(stat => (
          <button
            key={stat.key}
            style={{
              ...s.statCard,
              background: stat.bg,
              border: filter === stat.key ? `2px solid ${stat.activeBorder}` : `1px solid ${stat.border}`,
              boxShadow: filter === stat.key ? `0 4px 16px ${stat.activeBorder}28` : 'none',
            }}
            onClick={() => setFilter(stat.key)}
          >
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.val}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </button>
        ))}
      </div>

      <div style={s.tableCard}>
        <table style={s.table}>
          <thead>
            <tr>{['Salon','Owner','Location','Contact','Status','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {displayed.map(salon => {
              const meta = STATUS_META[salon.status] || STATUS_META.inactive;
              return (
                <tr key={salon.id} style={s.tr}>
                  <td style={s.td}>
                    <div style={s.salonName}>{salon.name}</div>
                    {salon.business_reg_number && <div style={s.salonReg}>Reg: {salon.business_reg_number}</div>}
                  </td>
                  <td style={s.td}><span style={s.ownerEmail}>{salon.owner_email}</span></td>
                  <td style={s.td}>
                    <div style={s.city}>{salon.address_city}</div>
                    {salon.address_district && <div style={s.district}>{salon.address_district}</div>}
                  </td>
                  <td style={s.td}>
                    {salon.contact_number && <div style={s.contact}>{salon.contact_number}</div>}
                    {salon.email && <div style={s.contact}>{salon.email}</div>}
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>{meta.label}</span>
                  </td>
                  <td style={s.td}>
                    {salon.status === 'pending' && (
                      <div style={s.actions}>
                        <button style={s.approveBtn} onClick={() => approve(salon.id)}>✓ Approve</button>
                        <button style={s.rejectBtn} onClick={() => reject(salon.id)}>✕ Reject</button>
                      </div>
                    )}
                    {salon.status !== 'pending' && <span style={s.noAction}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {displayed.length === 0 && (
          <div style={s.empty}>
            {filter === 'all' ? 'No salons registered yet.' : `No ${filter} salons.`}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  pageHeader: { marginBottom: 26 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' },
  sub: { color: 'var(--text-muted)', fontSize: 13, margin: 0 },
  alertOk: { background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 26 },
  statCard: {
    borderRadius: 16, padding: '18px 22px', cursor: 'pointer', textAlign: 'left',
    transition: 'all .15s ease', fontFamily: "'DM Sans', sans-serif",
  },
  statLabel: { fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  tableCard: {
    background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(124,58,237,.06)', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--surface2)', borderBottom: '2px solid var(--border)' },
  tr: { transition: 'background 0.1s' },
  td: { padding: '14px 16px', borderBottom: '1px solid var(--border)', verticalAlign: 'top' },
  salonName: { fontWeight: 700, fontSize: 14, color: 'var(--text)' },
  salonReg: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' },
  ownerEmail: { fontSize: 13, color: 'var(--text-muted)' },
  city: { fontWeight: 600, fontSize: 13, color: 'var(--text)' },
  district: { fontSize: 12, color: 'var(--text-muted)', marginTop: 1 },
  contact: { fontSize: 12, color: 'var(--text-muted)' },
  badge: { display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  actions: { display: 'flex', gap: 6 },
  approveBtn: {
    padding: '6px 14px', background: '#ECFDF5', color: '#059669',
    border: '1px solid rgba(5,150,105,.25)', borderRadius: 8, cursor: 'pointer',
    fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
  },
  rejectBtn: {
    padding: '6px 14px', background: '#FEF2F2', color: '#DC2626',
    border: '1px solid rgba(220,38,38,.25)', borderRadius: 8, cursor: 'pointer',
    fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
  },
  noAction: { color: 'var(--text-muted)', fontSize: 14 },
  empty: { padding: '50px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 },
};
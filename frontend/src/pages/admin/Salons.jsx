import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { c, shadow } from '../../styles/theme';

const STATUS_META = {
  pending:  { label: 'Pending',  color: c.warning,  bg: c.warningBg  },
  active:   { label: 'Active',   color: c.success,  bg: c.successBg  },
  inactive: { label: 'Inactive', color: c.error,    bg: c.errorBg    },
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
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.title}>All Salons</h2>
          <p style={s.sub}>View and manage every registered salon</p>
        </div>
      </div>

      {msg && <div style={s.success}>{msg}</div>}

      <div style={s.statsRow}>
        {[
          { key: 'all',      label: 'Total',    val: salons.length,        color: c.primary, bg: c.primarySoft },
          { key: 'pending',  label: 'Pending',  val: counts.pending  || 0, color: c.warning, bg: c.warningBg  },
          { key: 'active',   label: 'Active',   val: counts.active   || 0, color: c.success, bg: c.successBg  },
          { key: 'inactive', label: 'Inactive', val: counts.inactive || 0, color: c.error,   bg: c.errorBg    },
        ].map(stat => (
          <button key={stat.key} style={{ ...s.statCard, background: stat.bg, outline: filter === stat.key ? `2px solid ${stat.color}` : 'none' }} onClick={() => setFilter(stat.key)}>
            <div style={{ ...s.statVal, color: stat.color }}>{stat.val}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </button>
        ))}
      </div>

      <div style={s.tableCard}>
        <table style={s.table}>
          <thead>
            <tr>{['Salon', 'Owner', 'Location', 'Contact', 'Status', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
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
                    <span style={{ ...s.badge, color: meta.color, background: meta.bg }}>{meta.label}</span>
                  </td>
                  <td style={s.td}>
                    {salon.status === 'pending' && (
                      <div style={s.actions}>
                        <button style={s.approveBtn} onClick={() => approve(salon.id)}>Approve</button>
                        <button style={s.rejectBtn} onClick={() => reject(salon.id)}>Reject</button>
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
  pageHeader: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 700, color: c.text, margin: 0, marginBottom: 4 },
  sub: { color: c.textMuted, fontSize: 14, margin: 0 },
  success: { background: c.successBg, border: `1px solid ${c.successBorder}`, color: c.success, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 },
  statCard: { borderRadius: 12, padding: '16px 20px', border: `1px solid ${c.border}`, cursor: 'pointer', textAlign: 'left', transition: 'outline 0.1s' },
  statVal: { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 12, color: c.textMuted, marginTop: 6, fontWeight: 500 },
  tableCard: { background: c.surface, borderRadius: 14, border: `1px solid ${c.border}`, boxShadow: shadow.sm, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', background: c.bg, borderBottom: `2px solid ${c.border}` },
  tr: { transition: 'background 0.1s' },
  td: { padding: '14px 16px', borderBottom: `1px solid ${c.border}`, verticalAlign: 'top' },
  salonName: { fontWeight: 700, fontSize: 14, color: c.text },
  salonReg: { fontSize: 11, color: c.textMuted, marginTop: 2, fontFamily: 'monospace' },
  ownerEmail: { fontSize: 13, color: c.textSub },
  city: { fontWeight: 600, fontSize: 13, color: c.text },
  district: { fontSize: 12, color: c.textMuted, marginTop: 1 },
  contact: { fontSize: 12, color: c.textMuted },
  badge: { display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  actions: { display: 'flex', gap: 6 },
  approveBtn: { padding: '6px 14px', background: c.successBg, color: c.success, border: `1px solid ${c.successBorder}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  rejectBtn: { padding: '6px 14px', background: c.errorBg, color: c.error, border: `1px solid ${c.errorBorder}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  noAction: { color: c.textLight, fontSize: 14 },
  empty: { padding: '50px', textAlign: 'center', color: c.textMuted, fontSize: 14 },
};

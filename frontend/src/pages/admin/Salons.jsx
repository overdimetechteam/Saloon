import { useState, useEffect } from 'react';
import api from '../../api/axios';

const STATUS_META = {
  pending:  { label: 'Pending',   color: '#D97706', bg: '#FFFBEB', border: 'rgba(217,119,6,.2)'  },
  active:   { label: 'Active',    color: '#059669', bg: '#ECFDF5', border: 'rgba(5,150,105,.2)'  },
  inactive: { label: 'Inactive',  color: '#DC2626', bg: '#FEF2F2', border: 'rgba(220,38,38,.2)'  },
  suspended:{ label: 'Suspended', color: '#7C3AED', bg: '#F5F3FF', border: 'rgba(124,58,237,.2)' },
};

function ConfirmModal({ title, message, danger, onConfirm, onCancel, loading }) {
  return (
    <div style={m.overlay}>
      <div style={m.box} className="scale-in">
        {danger && <div style={m.dangerBar} />}
        <h3 style={m.title}>{title}</h3>
        <p style={m.msg}>{message}</p>
        <div style={m.btnRow}>
          <button style={m.cancelBtn} onClick={onCancel} disabled={loading}>Cancel</button>
          <button style={{ ...m.confirmBtn, ...(danger ? m.dangerBtn : m.actionBtn) }} onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSalons() {
  const [salons, setSalons] = useState([]);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => api.get('/admin/salons/').then(r => setSalons(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const flash = (text, isErr = false) => {
    if (isErr) { setErr(text); setTimeout(() => setErr(''), 4000); }
    else { setMsg(text); setTimeout(() => setMsg(''), 3000); }
  };

  const doAction = async (fn, successMsg) => {
    setActionLoading(true);
    try { await fn(); load(); flash(successMsg); }
    catch (e) { flash(e.response?.data?.detail || 'Action failed.', true); }
    finally { setActionLoading(false); setModal(null); }
  };

  const approve         = id => doAction(() => api.post(`/salons/${id}/approve/`),         'Salon approved.');
  const reject          = id => doAction(() => api.post(`/salons/${id}/reject/`),          'Salon rejected.');
  const toggleSuspend   = id => doAction(() => api.post(`/salons/${id}/toggle-suspend/`),   'Suspension status updated.');
  const reactivate      = id => doAction(() => api.post(`/salons/${id}/reactivate/`),      'Salon reactivated.');
  const remove          = id => doAction(() => api.delete(`/salons/${id}/remove/`),        'Salon permanently removed.');

  const getSalonMeta = salon => {
    if (salon.status === 'active' && salon.is_suspended) return STATUS_META.suspended;
    return STATUS_META[salon.status] || STATUS_META.inactive;
  };

  const counts = salons.reduce((acc, s) => {
    const key = (s.status === 'active' && s.is_suspended) ? 'suspended' : s.status;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const displayed = (() => {
    if (filter === 'all') return salons;
    if (filter === 'suspended') return salons.filter(s => s.status === 'active' && s.is_suspended);
    if (filter === 'active') return salons.filter(s => s.status === 'active' && !s.is_suspended);
    return salons.filter(s => s.status === filter);
  })();

  const STAT_TABS = [
    { key: 'all',       label: 'Total',     val: salons.length,            color: '#7C3AED', bg: 'rgba(124,58,237,.08)',  border: 'rgba(124,58,237,.18)' },
    { key: 'pending',   label: 'Pending',   val: counts.pending   || 0,    color: '#D97706', bg: 'rgba(217,119,6,.08)',   border: 'rgba(217,119,6,.18)'  },
    { key: 'active',    label: 'Active',    val: counts.active    || 0,    color: '#059669', bg: 'rgba(5,150,105,.08)',   border: 'rgba(5,150,105,.18)'  },
    { key: 'suspended', label: 'Suspended', val: counts.suspended || 0,    color: '#7C3AED', bg: 'rgba(124,58,237,.08)', border: 'rgba(124,58,237,.18)' },
    { key: 'inactive',  label: 'Inactive',  val: counts.inactive  || 0,    color: '#DC2626', bg: 'rgba(220,38,38,.08)',  border: 'rgba(220,38,38,.18)'  },
  ];

  return (
    <div>
      {modal && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          danger={modal.danger}
          loading={actionLoading}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(null)}
        />
      )}

      <div style={s.pageHeader} className="fade-up">
        <div>
          <div style={s.eyebrow}>Management</div>
          <h2 style={s.title}>All Salons</h2>
          <p style={s.sub}>View and manage every registered salon</p>
        </div>
      </div>

      {msg && <div style={s.alertOk}>{msg}</div>}
      {err && <div style={s.alertErr}>{err}</div>}

      <div style={s.statsRow} className="fade-up">
        {STAT_TABS.map(stat => (
          <button
            key={stat.key}
            style={{
              ...s.statCard,
              background: stat.bg,
              border: filter === stat.key ? `2px solid ${stat.color}` : `1px solid ${stat.border}`,
              boxShadow: filter === stat.key ? `0 4px 16px ${stat.color}28` : 'none',
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
            <tr>{['Salon', 'Owner', 'Location', 'Contact', 'Status', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {displayed.map(salon => {
              const meta = getSalonMeta(salon);
              const isActive   = salon.status === 'active' && !salon.is_suspended;
              const isSuspended = salon.status === 'active' && salon.is_suspended;
              const isPending  = salon.status === 'pending';
              const isInactive = salon.status === 'inactive';
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
                    <span style={{ ...s.badge, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                      {meta.label}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={s.actions}>
                      {isPending && (
                        <>
                          <button style={s.approveBtn} onClick={() => approve(salon.id)}>✓ Approve</button>
                          <button style={s.rejectBtn} onClick={() => setModal({
                            title: 'Reject Salon',
                            message: `Reject "${salon.name}"? The owner will be notified.`,
                            danger: true,
                            onConfirm: () => reject(salon.id),
                          })}>✕ Reject</button>
                        </>
                      )}
                      {isActive && (
                        <button style={s.suspendBtn} onClick={() => setModal({
                          title: 'Suspend Salon',
                          message: `Suspend "${salon.name}"? It will be hidden from clients until re-enabled.`,
                          danger: false,
                          onConfirm: () => toggleSuspend(salon.id),
                        })}>⏸ Suspend</button>
                      )}
                      {isSuspended && (
                        <button style={s.enableBtn} onClick={() => toggleSuspend(salon.id)}>▶ Enable</button>
                      )}
                      {isInactive && (
                        <>
                          <button style={s.enableBtn} onClick={() => reactivate(salon.id)}>↑ Reactivate</button>
                          <button style={s.removeBtn} onClick={() => setModal({
                            title: 'Permanently Remove',
                            message: `Remove "${salon.name}" from the system? This cannot be undone.`,
                            danger: true,
                            onConfirm: () => remove(salon.id),
                          })}>✕ Remove</button>
                        </>
                      )}
                      {!isPending && !isActive && !isSuspended && !isInactive && (
                        <span style={s.noAction}>—</span>
                      )}
                    </div>
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
  alertOk:  { background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  alertErr: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 26 },
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
  salonName:  { fontWeight: 700, fontSize: 14, color: 'var(--text)' },
  salonReg:   { fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' },
  ownerEmail: { fontSize: 13, color: 'var(--text-muted)' },
  city:       { fontWeight: 600, fontSize: 13, color: 'var(--text)' },
  district:   { fontSize: 12, color: 'var(--text-muted)', marginTop: 1 },
  contact:    { fontSize: 12, color: 'var(--text-muted)' },
  badge:      { display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  actions:    { display: 'flex', gap: 6, flexWrap: 'wrap' },
  approveBtn: { padding: '6px 14px', background: '#ECFDF5', color: '#059669', border: '1px solid rgba(5,150,105,.25)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  rejectBtn:  { padding: '6px 14px', background: '#FEF2F2', color: '#DC2626', border: '1px solid rgba(220,38,38,.25)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  suspendBtn: { padding: '6px 14px', background: '#F5F3FF', color: '#7C3AED', border: '1px solid rgba(124,58,237,.25)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  enableBtn:  { padding: '6px 14px', background: '#ECFDF5', color: '#059669', border: '1px solid rgba(5,150,105,.25)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  removeBtn:  { padding: '6px 14px', background: '#FEF2F2', color: '#DC2626', border: '1px solid rgba(220,38,38,.25)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  noAction:   { color: 'var(--text-muted)', fontSize: 14 },
  empty:      { padding: '50px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 },
};

const m = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20,
  },
  box: {
    background: 'var(--surface)', borderRadius: 20, maxWidth: 420, width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,.3)', overflow: 'hidden',
  },
  dangerBar: { height: 4, background: 'linear-gradient(90deg, #DC2626, #F87171)', width: '100%' },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '22px 24px 10px' },
  msg:   { fontSize: 14, color: 'var(--text-muted)', margin: '0 24px 24px', lineHeight: 1.6 },
  btnRow: { display: 'flex', gap: 10, padding: '0 24px 22px', justifyContent: 'flex-end' },
  cancelBtn:  { padding: '9px 20px', background: 'var(--surface2)', color: 'var(--text-sub)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontWeight: 500, fontSize: 13, fontFamily: "'DM Sans', sans-serif" },
  confirmBtn: { padding: '9px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: '#fff' },
  dangerBtn:  { background: 'linear-gradient(135deg, #DC2626, #B91C1C)', boxShadow: '0 4px 12px rgba(220,38,38,.35)' },
  actionBtn:  { background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', boxShadow: '0 4px 12px rgba(124,58,237,.35)' },
};

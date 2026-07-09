import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const STATUS_META = {
  pending:   { label: 'Pending',   color: '#D4AF37', bg: 'rgba(212,175,55,.1)',   border: 'rgba(212,175,55,.25)'  },
  active:    { label: 'Active',    color: '#0D9488', bg: 'rgba(13,148,136,.1)',   border: 'rgba(13,148,136,.25)'  },
  inactive:  { label: 'Inactive',  color: '#DC2626', bg: 'rgba(220,38,38,.1)',    border: 'rgba(220,38,38,.25)'   },
  suspended: { label: 'Suspended', color: '#F97316', bg: 'rgba(249,115,22,.1)',   border: 'rgba(249,115,22,.25)'  },
};

const PLAN_META = {
  free_trial:   { label: 'Free Trial',   color: '#6B7280', bg: 'rgba(107,114,128,.1)' },
  starter:      { label: 'Starter',      color: '#2563EB', bg: 'rgba(37,99,235,.1)'   },
  professional: { label: 'Professional', color: '#7C3AED', bg: 'rgba(124,58,237,.1)'  },
  premium:      { label: 'Premium',      color: '#D97706', bg: 'rgba(217,119,6,.1)'   },
};

const TYPE_META = {
  subscription: { label: 'Subscription', color: '#7C3AED', bg: 'rgba(124,58,237,.1)' },
  cosmetics:    { label: 'Cosmetics',    color: '#0D9488', bg: 'rgba(13,148,136,.1)'  },
};

function InfoRow({ label, value }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{value || '—'}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

export default function AdminSalonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/admin/salons/${id}/detail/`)
      .then(r => setData(r.data))
      .catch(() => setErr('Failed to load salon details.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const flash = text => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/salons/${id}/detail/`);
      navigate('/admin/salons', { state: { deleted: true } });
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to delete salon.');
      setTimeout(() => setErr(''), 4000);
      setShowDeleteConfirm(false);
    } finally { setDeleting(false); }
  };

  const doAction = async (fn, successMsg) => {
    setActionLoading(true);
    try { await fn(); flash(successMsg); load(); }
    catch (e) { setErr(e.response?.data?.detail || 'Action failed.'); setTimeout(() => setErr(''), 4000); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div style={s.loader}><div style={s.spin} /></div>;
  if (err && !data) return <div style={s.errBox}>{err}</div>;
  if (!data) return null;

  const salon = data;
  const statusKey = salon.status === 'active' && salon.is_suspended ? 'suspended' : salon.status;
  const meta = STATUS_META[statusKey] || STATUS_META.inactive;
  const sub = salon.subscription;
  const planMeta = sub ? (PLAN_META[sub.plan] || { label: sub.plan, color: '#888', bg: '#f0f0f0' }) : null;

  const isActive    = salon.status === 'active' && !salon.is_suspended;
  const isSuspended = salon.status === 'active' && salon.is_suspended;
  const isPending   = salon.status === 'pending';
  const isInactive  = salon.status === 'inactive';

  return (
    <div>
      {/* Back */}
      <button style={s.back} onClick={() => navigate('/admin/salons')}>← Back to All Salons</button>

      {msg && <div style={s.alertOk}>{msg}</div>}
      {err && <div style={s.alertErr}>{err}</div>}

      {/* Header */}
      <div style={s.header} className="fade-up">
        <div style={s.headerLeft}>
          <div style={s.salonIcon}>{salon.name?.[0]?.toUpperCase() || '?'}</div>
          <div>
            <div style={s.salonName}>{salon.name}</div>
            <div style={s.salonReg}>Reg: {salon.business_reg_number}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ ...s.badge, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>{meta.label}</span>
              {planMeta && <span style={{ ...s.badge, color: planMeta.color, background: planMeta.bg }}>{planMeta.label}</span>}
              {salon.cosmetics_enabled && <span style={{ ...s.badge, color: '#0D9488', background: 'rgba(13,148,136,.1)' }}>Cosmetics</span>}
              {salon.home_visit_enabled && <span style={{ ...s.badge, color: '#6366F1', background: 'rgba(99,102,241,.1)' }}>Home Visits</span>}
            </div>
          </div>
        </div>
        <div style={s.headerActions}>
          {isPending && (
            <>
              <button style={s.approveBtn} disabled={actionLoading} onClick={() => doAction(() => api.post(`/salons/${id}/approve/`), 'Salon approved.')}>✓ Approve</button>
              <button style={s.rejectBtn}  disabled={actionLoading} onClick={() => doAction(() => api.post(`/salons/${id}/reject/`),  'Salon rejected.')}>✕ Reject</button>
            </>
          )}
          {isActive    && <button style={s.suspendBtn} disabled={actionLoading} onClick={() => doAction(() => api.post(`/salons/${id}/toggle-suspend/`), 'Salon suspended.')}>⏸ Suspend</button>}
          {isSuspended && <button style={s.enableBtn}  disabled={actionLoading} onClick={() => doAction(() => api.post(`/salons/${id}/toggle-suspend/`), 'Salon reinstated.')}>▶ Reinstate</button>}
          {isInactive  && <button style={s.enableBtn}  disabled={actionLoading} onClick={() => doAction(() => api.post(`/salons/${id}/reactivate/`),     'Salon reactivated.')}>↑ Reactivate</button>}
          <button style={s.deleteBtn} disabled={actionLoading} onClick={() => setShowDeleteConfirm(true)}>🗑 Delete Salon</button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div style={s.modalBack} onClick={() => setShowDeleteConfirm(false)}>
          <div style={s.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 38, marginBottom: 12 }}>⚠</div>
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>
              Delete Salon?
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 8px' }}>
              You are about to permanently delete <strong style={{ color: 'var(--text)' }}>{salon.name}</strong>.
            </p>
            <p style={{ fontSize: 13, color: '#DC2626', margin: '0 0 28px', lineHeight: 1.6 }}>
              This will remove all associated bookings, services, staff, and data. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button style={s.cancelBtn} onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Cancel</button>
              <button style={{ ...s.confirmDeleteBtn, opacity: deleting ? 0.75 : 1 }} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={s.grid}>
        {/* Left column */}
        <div style={s.colLeft}>
          <Section title="Salon Information">
            <InfoRow label="Owner"          value={`${salon.owner_name || ''} (${salon.owner_email})`} />
            <InfoRow label="Contact"        value={salon.contact_number} />
            <InfoRow label="Email"          value={salon.email} />
            <InfoRow label="Address"        value={[salon.address_street, salon.address_city, salon.address_district, salon.address_postal].filter(Boolean).join(', ')} />
            <InfoRow label="Gender Focus"   value={salon.gender_focus} />
            <InfoRow label="Registered"     value={salon.created_at ? new Date(salon.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
            {salon.facilities?.length > 0 && (
              <div style={s.infoRow}>
                <span style={s.infoLabel}>Facilities</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {salon.facilities.map(f => <span key={f} style={s.chip}>{f}</span>)}
                </div>
              </div>
            )}
          </Section>

          {/* Subscription */}
          <Section title="Subscription">
            {sub ? (
              <div>
                <div style={{ ...s.planBig, background: planMeta?.bg, borderColor: planMeta?.color + '40' }}>
                  <div style={{ ...s.planName, color: planMeta?.color }}>{planMeta?.label || sub.plan}</div>
                  <div style={s.planStatus}>{sub.status} {sub.is_active ? '· Active' : '· Expired'}</div>
                  {sub.days_remaining !== null && (
                    <div style={{ ...s.planDays, color: sub.days_remaining <= 7 ? '#DC2626' : '#0D9488' }}>
                      {sub.days_remaining} days remaining
                    </div>
                  )}
                </div>
                <InfoRow label="Billing Name"    value={sub.billing_name} />
                <InfoRow label="Billing Email"   value={sub.billing_email} />
                <InfoRow label="Amount Paid"     value={sub.amount_paid > 0 ? `LKR ${Number(sub.amount_paid).toLocaleString()}` : 'Free'} />
                <InfoRow label="Transaction Ref" value={sub.transaction_ref} />
                <InfoRow label="Expires"         value={sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
              </div>
            ) : (
              <div style={s.emptyNote}>No subscription record</div>
            )}
          </Section>

          {/* Cosmetics */}
          <Section title="Cosmetics Store">
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ ...s.miniStat, borderColor: salon.cosmetics_enabled ? 'rgba(13,148,136,.25)' : 'var(--border)' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: salon.cosmetics_enabled ? '#0D9488' : 'var(--text-muted)' }}>
                  {salon.cosmetics_enabled ? '✓ Enabled' : '✗ Disabled'}
                </div>
                <div style={s.miniLabel}>Store Status</div>
              </div>
              <div style={s.miniStat}>
                <div style={s.miniVal}>{salon.cosmetics?.product_count ?? '—'}</div>
                <div style={s.miniLabel}>Products</div>
              </div>
              <div style={s.miniStat}>
                <div style={s.miniVal}>LKR {Number(salon.cosmetics?.total_sales_revenue || 0).toLocaleString()}</div>
                <div style={s.miniLabel}>Sales Revenue</div>
              </div>
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div style={s.colRight}>
          {/* Booking stats */}
          <Section title="Booking Statistics">
            <div style={s.statsRow}>
              {[
                { label: 'Total',     val: salon.bookings?.total,     color: '#6366F1' },
                { label: 'Completed', val: salon.bookings?.completed, color: '#0D9488' },
                { label: 'Pending',   val: salon.bookings?.pending,   color: '#D4AF37' },
                { label: 'Cancelled', val: salon.bookings?.cancelled, color: '#DC2626' },
              ].map(({ label, val, color }) => (
                <div key={label} style={s.miniStat}>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{val ?? '—'}</div>
                  <div style={s.miniLabel}>{label}</div>
                </div>
              ))}
            </div>
            {salon.bookings?.revenue > 0 && (
              <div style={s.revenueNote}>
                <span style={{ color: '#0D9488', fontWeight: 700 }}>LKR {Number(salon.bookings.revenue).toLocaleString()}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 6 }}>estimated service revenue</span>
              </div>
            )}
          </Section>

          {/* Services */}
          <Section title={`Services (${salon.services_count ?? salon.services?.length ?? 0})`}>
            {!salon.services?.length ? (
              <div style={s.emptyNote}>No services configured</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={s.table}>
                  <thead>
                    <tr>{['Name', 'Category', 'Price', 'Duration', 'Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {salon.services.map(svc => (
                      <tr key={svc.id} style={s.tr}>
                        <td style={s.td}><span style={{ fontWeight: 600, color: 'var(--text)' }}>{svc.name}</span></td>
                        <td style={s.td}><span style={{ ...s.chip }}>{svc.category}</span></td>
                        <td style={{ ...s.td, fontWeight: 600, color: '#0D9488' }}>LKR {Number(svc.price).toLocaleString()}</td>
                        <td style={s.td}>{svc.duration} min</td>
                        <td style={s.td}>
                          <span style={{ ...s.dot, background: svc.is_active ? '#0D9488' : '#DC2626' }} />
                          {svc.is_active ? 'Active' : 'Off'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* Staff */}
          <Section title={`Staff (${salon.staff_count ?? salon.staff?.length ?? 0})`}>
            {!salon.staff?.length ? (
              <div style={s.emptyNote}>No staff members</div>
            ) : (
              <div style={s.staffGrid}>
                {salon.staff.map(m => (
                  <div key={m.id} style={s.staffCard}>
                    <div style={s.staffAvatar}>{m.name?.[0]?.toUpperCase() || '?'}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{m.role || 'Staff'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Payment history */}
          <Section title="Payment History">
            {!salon.payments?.length ? (
              <div style={s.emptyNote}>No payments recorded</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={s.table}>
                  <thead>
                    <tr>{['Order ID', 'Type', 'Plan', 'Amount', 'Status', 'Date'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {salon.payments.map(p => {
                      const tm = TYPE_META[p.type] || { label: p.type, color: '#888', bg: '#f0f0f0' };
                      const pm = p.plan ? (PLAN_META[p.plan] || { label: p.plan, color: '#888', bg: '#f0f0f0' }) : null;
                      const ok = p.status === 'completed';
                      return (
                        <tr key={p.order_id} style={s.tr}>
                          <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{p.order_id}</td>
                          <td style={s.td}><span style={{ ...s.badge, color: tm.color, background: tm.bg }}>{tm.label}</span></td>
                          <td style={s.td}>{pm ? <span style={{ ...s.badge, color: pm.color, background: pm.bg }}>{pm.label}</span> : '—'}</td>
                          <td style={{ ...s.td, fontWeight: 700, color: ok ? '#0D9488' : 'var(--text-muted)' }}>LKR {Number(p.amount).toLocaleString()}</td>
                          <td style={s.td}>
                            <span style={{ ...s.badge, color: ok ? '#0D9488' : '#DC2626', background: ok ? 'rgba(13,148,136,.1)' : 'rgba(220,38,38,.1)' }}>
                              {p.status}
                            </span>
                          </td>
                          <td style={{ ...s.td, color: 'var(--text-muted)', fontSize: 12 }}>
                            {p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

const s = {
  loader: { display: 'flex', justifyContent: 'center', padding: 80 },
  spin: { width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(13,148,136,.2)', borderTopColor: '#0D9488', animation: 'spinSlow .7s linear infinite' },
  errBox: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '14px 18px', fontSize: 13 },
  alertOk:  { background: '#F0FDFA', border: '1px solid #99F6E4', color: '#0D9488', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 16 },
  alertErr: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 16 },

  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', padding: 0, marginBottom: 22, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" },

  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px 26px', boxShadow: '0 2px 12px rgba(0,0,0,.04)' },
  headerLeft: { display: 'flex', alignItems: 'flex-start', gap: 16 },
  salonIcon: { width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(145deg, #0D9488, #14B8A8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 },
  salonName: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 },
  salonReg: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 3 },
  headerActions: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' },
  badge: { display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 },

  grid: { display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 18, alignItems: 'flex-start' },
  colLeft: { display: 'flex', flexDirection: 'column', gap: 0 },
  colRight: { display: 'flex', flexDirection: 'column', gap: 0 },

  section: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px', marginBottom: 18, boxShadow: '0 2px 10px rgba(0,0,0,.04)' },
  sectionTitle: { fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.06em' },

  infoRow: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' },
  infoLabel: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', minWidth: 110, textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: 2, flexShrink: 0 },
  infoValue: { fontSize: 13, color: 'var(--text)', lineHeight: 1.5 },

  planBig: { borderRadius: 12, border: '1.5px solid', padding: '16px 18px', marginBottom: 14 },
  planName: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700 },
  planStatus: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  planDays: { fontSize: 13, fontWeight: 700, marginTop: 6 },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 8 },
  miniStat: { background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' },
  miniVal: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1 },
  miniLabel: { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 6 },
  revenueNote: { paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 6, fontSize: 13 },

  chip: { display: 'inline-block', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-sub)' },
  dot: { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', marginRight: 5, verticalAlign: 'middle' },

  staffGrid: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  staffCard: { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border)', flex: '0 0 auto' },
  staffAvatar: { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(145deg, #0D9488, #14B8A8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '9px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', background: 'var(--surface2)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' },
  tr: { transition: 'background .1s' },
  td: { padding: '11px 12px', borderBottom: '1px solid var(--border)', fontSize: 13, verticalAlign: 'middle' },

  emptyNote: { color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', padding: '8px 0' },
  approveBtn: { padding: '8px 16px', background: '#F0FDFA', color: '#0D9488', border: '1px solid rgba(13,148,136,.3)', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  rejectBtn:  { padding: '8px 16px', background: '#FEF2F2', color: '#DC2626', border: '1px solid rgba(220,38,38,.3)',  borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  suspendBtn: { padding: '8px 16px', background: 'rgba(249,115,22,.1)', color: '#F97316', border: '1px solid rgba(249,115,22,.3)', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  enableBtn:  { padding: '8px 16px', background: '#F0FDFA', color: '#0D9488', border: '1px solid rgba(13,148,136,.3)', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  deleteBtn:  { padding: '8px 16px', background: '#FEF2F2', color: '#DC2626', border: '1px solid rgba(220,38,38,.3)',  borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  modalBack: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modalCard: {
    background: 'var(--surface)', borderRadius: 20, padding: '40px 36px',
    maxWidth: 420, width: '100%', textAlign: 'center',
    boxShadow: '0 24px 64px rgba(0,0,0,.25)', border: '1px solid var(--border)',
  },
  cancelBtn: {
    padding: '11px 24px', background: 'transparent', border: '1px solid var(--border)',
    borderRadius: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)',
    fontFamily: "'DM Sans', sans-serif",
  },
  confirmDeleteBtn: {
    padding: '11px 24px', background: '#DC2626', color: '#fff',
    border: 'none', borderRadius: 10, cursor: 'pointer',
    fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
    boxShadow: '0 4px 14px rgba(220,38,38,.35)',
  },
};

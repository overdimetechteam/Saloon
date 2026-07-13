import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import ConfirmDialog from '../../components/ConfirmDialog';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Stars({ rating }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= rating ? '#F59E0B' : 'var(--border)', fontSize: 13 }}>★</span>
      ))}
    </span>
  );
}

const STATUS_META = {
  confirmed:  { label: 'Confirmed',  color: '#0D9488', bg: 'rgba(13,148,136,.1)'  },
  pending:    { label: 'Pending',    color: '#D97706', bg: 'rgba(217,119,6,.1)'   },
  cancelled:  { label: 'Cancelled',  color: '#DC2626', bg: 'rgba(220,38,38,.1)'   },
  completed:  { label: 'Completed',  color: '#7C3AED', bg: 'rgba(124,58,237,.1)'  },
  processing: { label: 'Processing', color: '#2563EB', bg: 'rgba(37,99,235,.1)'   },
  shipped:    { label: 'Shipped',    color: '#0D9488', bg: 'rgba(13,148,136,.1)'  },
  delivered:  { label: 'Delivered',  color: '#059669', bg: 'rgba(5,150,105,.1)'   },
  default:    { label: '—',          color: '#6B7280', bg: 'rgba(107,114,128,.1)' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.default;
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: m.color, background: m.bg }}>
      {m.label || status}
    </span>
  );
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ ...s.statCard, borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value ?? '—'}</div>
          <div style={s.statLabel}>{label}</div>
          {sub && <div style={s.statSub}>{sub}</div>}
        </div>
        <div style={{ fontSize: 20, opacity: .4 }}>{icon}</div>
      </div>
    </div>
  );
}

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');
  const [toggling, setToggling]   = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [confirm, setConfirm]     = useState(null);

  const load = () => {
    setLoading(true);
    api.get(`/admin/customers/${id}/`)
      .then(r => setData(r.data))
      .catch(() => setErr('Failed to load customer details.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const toggleActive = async () => {
    setToggling(true);
    try {
      const r = await api.patch(`/admin/customers/${id}/`, {});
      setData(prev => ({ ...prev, profile: { ...prev.profile, is_active: r.data.is_active } }));
    } catch { /* noop */ }
    finally { setToggling(false); }
  };

  const deleteAccount = () => {
    setConfirm({
      title: 'Delete Account?',
      message: 'This customer account will be permanently deleted along with all their data. This cannot be undone.',
      confirmLabel: 'Delete Account',
      onConfirm: async () => {
        setConfirm(null);
        setDeleting(true);
        try {
          await api.delete(`/admin/customers/${id}/`);
          navigate('/admin/customers');
        } catch {
          setDeleting(false);
        }
      },
    });
  };

  if (loading) return <div style={s.loader}><div style={s.spin} /></div>;
  if (err) return <div style={s.errBox}>{err}</div>;
  if (!data) return null;

  const { profile, stats, recent_bookings, reviews, favourite_salons, recent_orders } = data;

  return (
    <div>
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={confirm?.onConfirm}
        onClose={() => setConfirm(null)}
      />
      {/* Back */}
      <button style={s.backBtn} onClick={() => navigate('/admin/customers')}>
        ← Back to Customers
      </button>

      {/* Header card */}
      <div style={s.profileCard} className="fade-up">
        <div style={s.profileLeft}>
          <div style={{
            ...s.bigAvatar,
            background: profile.is_active
              ? 'linear-gradient(145deg,#0D9488,#14B8A8)'
              : 'linear-gradient(145deg,#6B7280,#9CA3AF)',
          }}>
            {initials(profile.full_name || profile.email)}
          </div>
          <div>
            <h2 style={s.profileName}>{profile.full_name || <em style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No name set</em>}</h2>
            <div style={s.profileEmail}>{profile.email}</div>
            {profile.phone && <div style={s.profilePhone}>{profile.phone}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ ...s.badge, ...(profile.is_active ? s.badgeGreen : s.badgeGray) }}>
                {profile.is_active ? '● Active' : '● Inactive'}
              </span>
              <span style={{ ...s.badge, ...(profile.email_verified ? s.badgeTeal : s.badgeAmber) }}>
                {profile.email_verified ? '✓ Email Verified' : '⚠ Email Unverified'}
              </span>
            </div>
          </div>
        </div>
        <div style={s.profileRight}>
          <div style={s.profileMeta}>
            <div style={s.metaRow}><span style={s.metaLabel}>Last Login</span><span style={s.metaVal}>{fmtDateTime(profile.last_login)}</span></div>
            <div style={s.metaRow}><span style={s.metaLabel}>Customer ID</span><span style={s.metaVal}>#{profile.id}</span></div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              style={{ ...s.toggleBtn, ...(profile.is_active ? s.toggleBtnRed : s.toggleBtnGreen), opacity: toggling ? 0.7 : 1 }}
              onClick={toggleActive}
              disabled={toggling}
            >
              {toggling ? 'Updating…' : profile.is_active ? '⏸ Deactivate' : '▶ Activate'}
            </button>
            <button
              style={{ ...s.toggleBtn, background: 'rgba(220,38,38,.08)', color: '#DC2626', border: '1px solid rgba(220,38,38,.3)', opacity: deleting ? 0.7 : 1 }}
              onClick={deleteAccount}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : '🗑 Delete Account'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={s.statsGrid} className="fade-up">
        <StatCard label="Total Bookings"   value={stats.total_bookings}     sub={`${stats.completed_bookings} completed`} color="#0D9488" icon="◷" />
        <StatCard label="Cancelled"        value={stats.cancelled_bookings} sub="bookings"                                color="#DC2626" icon="✕" />
        <StatCard label="Reviews Written"  value={stats.total_reviews}      sub={stats.avg_rating ? `avg ${stats.avg_rating}★` : undefined} color="#7C3AED" icon="★" />
        <StatCard label="Cosmetic Orders"  value={stats.total_orders}       sub={stats.total_spent > 0 ? `LKR ${stats.total_spent.toLocaleString()} spent` : undefined} color="#D97706" icon="◈" />
        <StatCard label="Favourite Salons" value={stats.total_favourites}   color="#6366F1" icon="♥" />
      </div>

      <div style={s.grid}>
        {/* Recent Bookings */}
        <div style={s.card}>
          <div style={s.cardTitle}>Recent Bookings</div>
          {recent_bookings.length === 0 ? (
            <div style={s.empty}>No bookings yet</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  {['Salon', 'Services', 'Date', 'Status'].map(h => <th key={h} style={s.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {recent_bookings.map(b => (
                  <tr key={b.id} style={s.tableRow}>
                    <td style={s.td}><span style={{ fontWeight: 600 }}>{b.salon_name}</span></td>
                    <td style={{ ...s.td, maxWidth: 180 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {b.services.length > 0 ? b.services.join(', ') : '—'}
                      </span>
                    </td>
                    <td style={{ ...s.td, fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(b.requested_datetime)}</td>
                    <td style={s.td}><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Reviews */}
        <div style={s.card}>
          <div style={s.cardTitle}>Reviews Written</div>
          {reviews.length === 0 ? (
            <div style={s.empty}>No reviews yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map(r => (
                <div key={r.id} style={s.reviewItem}>
                  <div style={s.reviewTop}>
                    <span style={s.reviewSalon}>{r.salon_name}</span>
                    <Stars rating={r.rating} />
                  </div>
                  {r.comment && <div style={s.reviewComment}>"{r.comment}"</div>}
                  <div style={s.reviewDate}>{fmtDate(r.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={s.grid}>
        {/* Favourite Salons */}
        <div style={s.card}>
          <div style={s.cardTitle}>Favourite Salons</div>
          {favourite_salons.length === 0 ? (
            <div style={s.empty}>No favourites yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {favourite_salons.map(f => (
                <div key={f.id} style={s.favRow}>
                  <span style={s.favName}>{f.name}</span>
                  <span style={{ ...s.badge, ...(f.status === 'active' ? s.badgeGreen : s.badgeGray) }}>
                    {f.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cosmetic Orders */}
        <div style={s.card}>
          <div style={s.cardTitle}>Cosmetic Orders</div>
          {recent_orders.length === 0 ? (
            <div style={s.empty}>No orders yet</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  {['#', 'Salon', 'Total', 'Status', 'Date'].map(h => <th key={h} style={s.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {recent_orders.map(o => (
                  <tr key={o.id} style={s.tableRow}>
                    <td style={{ ...s.td, color: 'var(--text-muted)', fontSize: 12 }}>#{o.id}</td>
                    <td style={s.td}><span style={{ fontWeight: 600 }}>{o.salon_name}</span></td>
                    <td style={{ ...s.td, fontWeight: 700, color: '#D97706' }}>LKR {o.total.toLocaleString()}</td>
                    <td style={s.td}><StatusBadge status={o.status} /></td>
                    <td style={{ ...s.td, fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  loader: { display: 'flex', justifyContent: 'center', padding: 80 },
  spin: { width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(13,148,136,.2)', borderTopColor: '#0D9488', animation: 'spinSlow .7s linear infinite' },
  errBox: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '14px 18px', fontSize: 13 },

  backBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#0D9488', fontSize: 13, fontWeight: 600, padding: '0 0 18px', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" },

  profileCard: {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
    padding: '28px 30px', marginBottom: 22, display: 'flex', gap: 24,
    alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap',
    boxShadow: '0 2px 14px rgba(0,0,0,.04)',
  },
  profileLeft: { display: 'flex', gap: 20, alignItems: 'flex-start' },
  bigAvatar: {
    width: 68, height: 68, borderRadius: '50%', flexShrink: 0,
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, fontWeight: 700,
    boxShadow: '0 4px 16px rgba(0,0,0,.12)',
  },
  profileName:  { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' },
  profileEmail: { fontSize: 13, color: 'var(--text-muted)', margin: '0 0 3px' },
  profilePhone: { fontSize: 12, color: 'var(--text-muted)' },
  profileRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14, flexShrink: 0 },
  profileMeta: { display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' },
  metaRow: { display: 'flex', gap: 10, alignItems: 'center' },
  metaLabel: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },
  metaVal:   { fontSize: 12, color: 'var(--text)', fontWeight: 500 },

  toggleBtn: { padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  toggleBtnRed:   { background: 'rgba(220,38,38,.1)',  color: '#DC2626', border: '1px solid rgba(220,38,38,.25)' },
  toggleBtnGreen: { background: 'rgba(13,148,136,.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,.25)' },

  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  badgeGreen: { color: '#0D9488', background: 'rgba(13,148,136,.1)' },
  badgeGray:  { color: '#6B7280', background: 'rgba(107,114,128,.1)' },
  badgeTeal:  { color: '#0D9488', background: 'rgba(13,148,136,.1)' },
  badgeAmber: { color: '#D97706', background: 'rgba(217,119,6,.1)'  },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 },
  statCard:  { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 10px rgba(0,0,0,.04)' },
  statLabel: { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8 },
  statSub:   { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },

  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 10px rgba(0,0,0,.04)', minWidth: 0 },
  cardTitle: { fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  empty: { color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0', fontStyle: 'italic' },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--surface2)', borderBottom: '2px solid var(--border)' },
  tableRow: { transition: 'background .1s' },
  td: { padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 13, verticalAlign: 'middle' },

  reviewItem: { padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' },
  reviewTop:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewSalon: { fontWeight: 700, fontSize: 13, color: 'var(--text)' },
  reviewComment: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55, fontStyle: 'italic', marginBottom: 4 },
  reviewDate: { fontSize: 11, color: 'var(--text-muted)' },

  favRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' },
  favName: { fontWeight: 600, fontSize: 13, color: 'var(--text)' },
};

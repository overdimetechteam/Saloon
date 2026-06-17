import { useState, useEffect } from 'react';
import api from '../../api/axios';

const PLAN_META = {
  free_trial:   { label: 'Free Trial',    color: '#6B7280', bg: 'rgba(107,114,128,.1)'  },
  starter:      { label: 'Starter',       color: '#2563EB', bg: 'rgba(37,99,235,.1)'    },
  professional: { label: 'Professional',  color: '#7C3AED', bg: 'rgba(124,58,237,.1)'   },
  premium:      { label: 'Premium',       color: '#D97706', bg: 'rgba(217,119,6,.1)'    },
};

const TYPE_META = {
  subscription: { label: 'Subscription', color: '#7C3AED', bg: 'rgba(124,58,237,.1)' },
  cosmetics:    { label: 'Cosmetics',    color: '#0D9488', bg: 'rgba(13,148,136,.1)'  },
};

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ ...s.statCard, borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
          <div style={s.statLabel}>{label}</div>
          {sub && <div style={s.statSub}>{sub}</div>}
        </div>
        <div style={{ fontSize: 22, opacity: .45 }}>{icon}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/payments/admin/stats/')
      .then(r => setStats(r.data))
      .catch(() => setErr('Failed to load platform stats.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={s.loader}><div style={s.spin} /></div>;
  if (err) return <div style={s.errBox}>{err}</div>;
  if (!stats) return null;

  const sub = stats.subscription_breakdown || {};
  const maxSub = Math.max(...Object.values(sub), 1);

  return (
    <div>
      <div style={s.pageHeader} className="fade-up">
        <div style={s.eyebrow}>Overview</div>
        <h2 style={s.title}>Platform Dashboard</h2>
        <p style={s.sub}>Live snapshot of BookMyStyle platform activity</p>
      </div>

      {/* KPI row */}
      <div style={s.kpiGrid} className="fade-up">
        <StatCard label="Total Salons"       value={stats.total_salons}            sub={`${stats.active_salons} active`}   color="#0D9488" icon="◈" />
        <StatCard label="Pending Approval"   value={stats.pending_salons}          sub="awaiting review"                   color="#D4AF37" icon="◎" />
        <StatCard label="Suspended"          value={stats.suspended_salons}        sub="access restricted"                 color="#DC2626" icon="⏸" />
        <StatCard label="Total Bookings"     value={stats.total_bookings_platform} sub="platform-wide"                     color="#6366F1" icon="◷" />
        <StatCard label="Platform Revenue"   value={`LKR ${Number(stats.total_revenue).toLocaleString()}`} sub="all completed payments" color="#D97706" icon="₹" />
        <StatCard label="This Month"         value={`LKR ${Number(stats.revenue_this_month).toLocaleString()}`} sub="subscription + cosmetics" color="#0D9488" icon="↑" />
      </div>

      <div style={s.row}>
        {/* Subscription breakdown */}
        <div style={{ ...s.card, flex: 1, minWidth: 0 }}>
          <div style={s.cardTitle}>Subscription Breakdown</div>
          <div style={s.planBars}>
            {Object.entries(PLAN_META).map(([key, meta]) => {
              const count = sub[key] || 0;
              const pct   = Math.round((count / maxSub) * 100);
              return (
                <div key={key} style={s.planRow}>
                  <div style={{ ...s.planBadge, color: meta.color, background: meta.bg }}>{meta.label}</div>
                  <div style={s.barTrack}>
                    <div style={{ ...s.barFill, width: `${pct}%`, background: meta.color }} />
                  </div>
                  <div style={{ ...s.planCount, color: meta.color }}>{count}</div>
                </div>
              );
            })}
          </div>
          <div style={s.newSalons}>
            <span style={{ color: '#0D9488', fontWeight: 700 }}>+{stats.new_salons_this_month}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 6 }}>new salons this month</span>
          </div>
        </div>

        {/* Recent payments */}
        <div style={{ ...s.card, flex: 2, minWidth: 0 }}>
          <div style={s.cardTitle}>Recent Payments</div>
          {stats.recent_payments?.length === 0 && (
            <div style={s.empty}>No payments yet</div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Salon', 'Type', 'Plan', 'Amount', 'Date'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(stats.recent_payments || []).map((p, i) => {
                  const tm = TYPE_META[p.type] || { label: p.type, color: '#888', bg: '#f0f0f0' };
                  const pm = p.plan ? (PLAN_META[p.plan] || { label: p.plan, color: '#888', bg: '#f0f0f0' }) : null;
                  return (
                    <tr key={i} style={s.tr}>
                      <td style={s.td}><span style={s.salonName}>{p.salon_name || '—'}</span></td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, color: tm.color, background: tm.bg }}>{tm.label}</span>
                      </td>
                      <td style={s.td}>
                        {pm ? <span style={{ ...s.badge, color: pm.color, background: pm.bg }}>{pm.label}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ ...s.td, fontWeight: 700, color: '#0D9488' }}>LKR {Number(p.amount).toLocaleString()}</td>
                      <td style={{ ...s.td, color: 'var(--text-muted)', fontSize: 12 }}>
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  loader: { display: 'flex', justifyContent: 'center', padding: 80 },
  spin: { width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(13,148,136,.2)', borderTopColor: '#0D9488', animation: 'spinSlow .7s linear infinite' },
  errBox: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '14px 18px', fontSize: 13 },
  pageHeader: { marginBottom: 26 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' },
  sub: { color: 'var(--text-muted)', fontSize: 13, margin: 0 },

  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 },
  statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,.04)' },
  statLabel: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 10 },
  statSub: { fontSize: 11, color: 'var(--text-muted)', marginTop: 3 },

  row: { display: 'flex', gap: 18, flexWrap: 'wrap' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,.04)', marginBottom: 20 },
  cardTitle: { fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border)' },

  planBars: { display: 'flex', flexDirection: 'column', gap: 14 },
  planRow: { display: 'flex', alignItems: 'center', gap: 12 },
  planBadge: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, minWidth: 88, textAlign: 'center', flexShrink: 0 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, transition: 'width .4s ease' },
  planCount: { fontSize: 13, fontWeight: 700, minWidth: 22, textAlign: 'right' },
  newSalons: { marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 13 },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--surface2)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' },
  tr: { transition: 'background .1s' },
  td: { padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, verticalAlign: 'middle' },
  salonName: { fontWeight: 600, color: 'var(--text)' },
  badge: { display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  empty: { color: 'var(--text-muted)', fontSize: 13, padding: '20px 0', textAlign: 'center', fontStyle: 'italic' },
};

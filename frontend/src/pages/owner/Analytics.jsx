import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { useBreakpoint } from '../../hooks/useMobile';

const PERIODS = [
  { key: 'week',  label: 'Last 7 Days' },
  { key: 'month', label: 'Last 30 Days' },
  { key: 'year',  label: 'Last Year' },
];

export default function OwnerAnalytics() {
  const { salon } = useOwner();
  const { isMobile, isTablet } = useBreakpoint();
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salon) return;
    setLoading(true);
    api.get(`/salons/${salon.id}/analytics/?period=${period}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salon, period]);

  return (
    <div>
      <div style={s.header} className="fade-up">
        <div>
          <div style={s.eyebrow}>Insights</div>
          <h2 style={s.title}>Analytics</h2>
          <p style={s.sub}>Business performance overview</p>
        </div>
        <div style={s.periodToggle}>
          {PERIODS.map(p => (
            <button
              key={p.key}
              style={{ ...s.periodBtn, ...(period === p.key ? s.periodBtnActive : {}) }}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ ...s.loadGrid, gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
          {[1,2,3,4].map(i => <div key={i} style={s.skeleton} className="shimmer" />)}
        </div>
      )}

      {!loading && data && (
        <>
          <div style={s.kpiGrid} className="fade-up">
            <KpiCard label="Total Revenue" value={`LKR ${Number(data.total_revenue).toLocaleString()}`} color="#7C3AED" bg="rgba(124,58,237,.08)" border="rgba(124,58,237,.18)" />
            <KpiCard label="Product Sales" value={`LKR ${Number(data.product_sales_revenue).toLocaleString()}`} color="#0284C7" bg="rgba(2,132,199,.08)" border="rgba(2,132,199,.18)" />
            <KpiCard label="Total Bookings" value={data.total_bookings} color="#059669" bg="rgba(5,150,105,.08)" border="rgba(5,150,105,.18)" />
            <KpiCard label="Cancellation Rate" value={`${data.cancellation_rate}%`} color={data.cancellation_rate > 20 ? '#DC2626' : '#D97706'} bg={data.cancellation_rate > 20 ? 'rgba(220,38,38,.08)' : 'rgba(217,119,6,.08)'} border={data.cancellation_rate > 20 ? 'rgba(220,38,38,.18)' : 'rgba(217,119,6,.18)'} />
          </div>

          {data.revenue_by_day?.length > 0 && (
            <div style={s.card} className="fade-up d1">
              <div style={s.cardEyebrow}>Revenue Over Time</div>
              <RevenueChart data={data.revenue_by_day} />
            </div>
          )}

          <div style={{ ...s.twoCol, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
            {data.top_services?.length > 0 && (
              <div style={s.card} className="fade-up d2">
                <div style={s.cardEyebrow}>Top Services</div>
                <TopServicesChart data={data.top_services} />
              </div>
            )}
            {data.busiest_slots?.length > 0 && (
              <div style={s.card} className="fade-up d3">
                <div style={s.cardEyebrow}>Busiest Hours</div>
                <BusiestHoursChart data={data.busiest_slots} />
              </div>
            )}
          </div>

          <div style={s.card} className="fade-up d4">
            <div style={s.cardEyebrow}>Booking Breakdown</div>
            <div style={s.breakdownRow}>
              {[
                { label: 'Completed', value: data.completed_bookings, color: '#059669', bg: 'rgba(5,150,105,.08)', border: 'rgba(5,150,105,.18)' },
                { label: 'Cancelled', value: data.cancelled_bookings, color: '#DC2626', bg: 'rgba(220,38,38,.08)', border: 'rgba(220,38,38,.18)' },
                { label: 'Other', value: data.total_bookings - data.completed_bookings - data.cancelled_bookings, color: '#6B7280', bg: 'var(--surface2)', border: 'var(--border)' },
              ].map(b => (
                <div key={b.label} style={{ ...s.breakdownCard, background: b.bg, border: `1px solid ${b.border}` }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 36, fontWeight: 700, color: b.color, lineHeight: 1 }}>{b.value}</div>
                  <div style={{ fontSize: 12, color: b.color, fontWeight: 700, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{b.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!loading && !data && (
        <div style={s.empty} className="scale-in">
          <div style={{ fontSize: 36, marginBottom: 14, opacity: .35, color: 'var(--text-muted)' }}>◱</div>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>No analytics data available yet.</p>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, color, bg, border }) {
  return (
    <div style={{ ...s.kpiCard, background: bg, border: `1px solid ${border}` }} className="lift-sm">
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 700, color, lineHeight: 1, marginBottom: 8 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
    </div>
  );
}

function RevenueChart({ data }) {
  const W = 600, H = 160, PAD = { top: 16, right: 16, bottom: 28, left: 60 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const revenues = data.map(d => d.revenue);
  const maxRev = Math.max(...revenues, 1);
  const points = data.map((d, i) => {
    const x = PAD.left + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = PAD.top + innerH - (d.revenue / maxRev) * innerH;
    return { x, y, ...d };
  });

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const area = `M${points[0]?.x},${PAD.top + innerH} ` +
    points.map(p => `L${p.x},${p.y}`).join(' ') +
    ` L${points[points.length - 1]?.x},${PAD.top + innerH} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ value: Math.round(maxRev * f), y: PAD.top + innerH - f * innerH }));
  const showEvery = Math.max(1, Math.floor(data.length / 6));
  const xLabels = data.filter((_, i) => i % showEvery === 0 || i === data.length - 1);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map(t => (
          <g key={t.value}>
            <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} stroke="rgba(124,58,237,.1)" strokeWidth="1" strokeDasharray="4,4" />
            <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fill="#9CA3AF" fontSize="9">
              {t.value >= 1000 ? `${(t.value / 1000).toFixed(0)}k` : t.value}
            </text>
          </g>
        ))}
        {points.length > 1 && <path d={area} fill="url(#revGrad)" />}
        {points.length > 1 && (
          <polyline points={polyline} fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#7C3AED" stroke="#fff" strokeWidth="2" />
        ))}
        {xLabels.map((d, i) => {
          const idx = data.indexOf(d);
          const x = PAD.left + (idx / Math.max(data.length - 1, 1)) * innerW;
          return (
            <text key={i} x={x} y={H - 6} textAnchor="middle" fill="#9CA3AF" fontSize="8.5">
              {d.date.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function TopServicesChart({ data }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map((svc, i) => {
        const pct = (svc.count / maxCount) * 100;
        const hue = [280, 300, 260, 320, 240][i % 5];
        return (
          <div key={svc.service_name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{svc.service_name}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{svc.count} bookings · LKR {svc.revenue.toLocaleString()}</span>
            </div>
            <div style={{ height: 7, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: `hsl(${hue}, 70%, 55%)`, transition: 'width .5s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BusiestHoursChart({ data }) {
  const sorted = [...data].sort((a, b) => a.hour - b.hour);
  const maxCount = Math.max(...sorted.map(d => d.count), 1);
  const W = 300, H = 120, barW = 24, gap = 10;
  const totalW = sorted.length * (barW + gap) - gap;
  const startX = (W - totalW) / 2;

  const fmt = h => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}${ampm}`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block', margin: '0 auto' }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>
      {sorted.map((d, i) => {
        const barH = (d.count / maxCount) * 70;
        const x = startX + i * (barW + gap);
        const y = 90 - barH;
        return (
          <g key={d.hour}>
            <rect x={x} y={y} width={barW} height={barH} rx="5" fill="url(#barGrad)" />
            <text x={x + barW / 2} y={88} textAnchor="middle" fill="#9CA3AF" fontSize="8">{fmt(d.hour)}</text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="#7C3AED" fontSize="9" fontWeight="700">{d.count}</text>
          </g>
        );
      })}
    </svg>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26, flexWrap: 'wrap', gap: 12 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' },
  sub: { color: 'var(--text-muted)', fontSize: 13, margin: 0 },
  periodToggle: {
    display: 'flex', background: 'var(--surface2)', borderRadius: 11,
    border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0,
  },
  periodBtn: { padding: '9px 18px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" },
  periodBtnActive: { background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #0D9488 100%)', color: '#fff' },

  loadGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  skeleton: { height: 120, borderRadius: 16 },

  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16, marginBottom: 22 },
  kpiCard: { borderRadius: 18, padding: '22px 24px', transition: 'transform .2s ease, box-shadow .2s ease' },

  card: {
    background: 'var(--surface)', borderRadius: 18, padding: '22px 24px',
    border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(124,58,237,.06)',
    marginBottom: 20,
  },
  cardEyebrow: {
    fontSize: 9, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 18,
  },

  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 0 },

  breakdownRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  breakdownCard: { flex: 1, minWidth: 130, borderRadius: 14, padding: '20px 22px', textAlign: 'center' },

  empty: {
    textAlign: 'center', padding: '80px 40px',
    background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)',
  },
};
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { useBreakpoint } from '../../hooks/useMobile';

const STEPS = ['pending','confirmed','packing','ready_for_pickup','picked_up','dispatched','delivered'];

const STATUS_META = {
  pending:          { label: 'Pending',          color: '#D97706', bg: 'rgba(217,119,6,.12)',   dot: '#F59E0B' },
  confirmed:        { label: 'Confirmed',         color: '#0D9488', bg: 'rgba(13,148,136,.12)',  dot: '#0D9488' },
  packing:          { label: 'Packing',           color: '#7C3AED', bg: 'rgba(124,58,237,.12)',  dot: '#7C3AED' },
  ready_for_pickup: { label: 'Ready for Pickup',  color: '#2563EB', bg: 'rgba(37,99,235,.12)',   dot: '#2563EB' },
  picked_up:        { label: 'Picked Up',         color: '#0891B2', bg: 'rgba(8,145,178,.12)',   dot: '#0891B2' },
  dispatched:       { label: 'Dispatched',        color: '#059669', bg: 'rgba(5,150,105,.12)',   dot: '#059669' },
  delivered:        { label: 'Delivered',         color: '#16A34A', bg: 'rgba(22,163,74,.12)',   dot: '#16A34A' },
  cancelled:        { label: 'Cancelled',         color: '#DC2626', bg: 'rgba(220,38,38,.12)',   dot: '#DC2626' },
};

const IN_PROGRESS = ['confirmed','packing','ready_for_pickup','picked_up','dispatched'];

const FILTER_TABS = [
  { key: 'all',         label: 'All Orders' },
  { key: 'pending',     label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'delivered',   label: 'Delivered' },
  { key: 'cancelled',   label: 'Cancelled' },
];

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, color: '#6B7280', bg: 'rgba(107,114,128,.12)', dot: '#6B7280' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 20,
      background: m.bg, color: m.color,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

function MiniTracker({ status }) {
  const idx = STEPS.indexOf(status);
  if (idx < 0 || status === 'cancelled') return null;
  const pct = idx === 0 ? 0 : Math.round((idx / (STEPS.length - 1)) * 100);
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#0D9488,#14B8A8)', borderRadius: 4, transition: 'width .4s ease' }} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{pct}% complete</div>
    </div>
  );
}

export default function OwnerOrders() {
  const { salon }                 = useOwner();
  const { isMobile }              = useBreakpoint();
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');

  useEffect(() => {
    if (!salon) return;
    setLoading(true);
    api.get(`/salons/${salon.id}/orders/`)
      .then(r => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salon]);

  const filtered = orders.filter(o => {
    const matchTab =
      filter === 'all'         ? true :
      filter === 'in_progress' ? IN_PROGRESS.includes(o.status) :
      o.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `ORD-${String(o.id).padStart(6,'0')}`.toLowerCase().includes(q) ||
      (o.client_name || '').toLowerCase().includes(q) ||
      (o.client_email || '').toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const counts = {
    all:         orders.length,
    pending:     orders.filter(o => o.status === 'pending').length,
    in_progress: orders.filter(o => IN_PROGRESS.includes(o.status)).length,
    delivered:   orders.filter(o => o.status === 'delivered').length,
    cancelled:   orders.filter(o => o.status === 'cancelled').length,
  };

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + parseFloat(o.total || 0), 0);

  const stats = [
    { label: 'Total Orders',  value: orders.length,     color: '#0D9488', icon: '◈' },
    { label: 'Pending',       value: counts.pending,    color: '#D97706', icon: '⧗' },
    { label: 'In Progress',   value: counts.in_progress,color: '#7C3AED', icon: '◉' },
    { label: 'Delivered',     value: counts.delivered,  color: '#16A34A', icon: '✓' },
    { label: 'Revenue',       value: `Rs. ${totalRevenue.toLocaleString()}`, color: '#0D9488', icon: '◆' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: isMobile ? 24 : 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Orders
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Manage and track all cosmetic orders</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap: 12, marginBottom: 28 }}>
        {stats.map(st => (
          <div key={st.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 18, color: st.color }}>{st.icon}</span>
            </div>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: st.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{st.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs + search */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {FILTER_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                padding: '7px 14px', borderRadius: 20, border: '1.5px solid',
                borderColor: filter === t.key ? '#0D9488' : 'var(--border)',
                background: filter === t.key ? 'rgba(13,148,136,.12)' : 'transparent',
                color: filter === t.key ? '#0D9488' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {t.label}
              <span style={{
                marginLeft: 6, background: filter === t.key ? '#0D9488' : 'var(--border)',
                color: filter === t.key ? '#fff' : 'var(--text-muted)',
                borderRadius: 20, padding: '1px 6px', fontSize: 10, fontWeight: 700,
              }}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>
        <input
          placeholder="Search by order # or customer…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 14px', border: '1.5px solid var(--border)', borderRadius: 10,
            background: 'var(--input-bg)', color: 'var(--text)', fontSize: 13,
            outline: 'none', width: isMobile ? '100%' : 220,
          }}
        />
      </div>

      {/* Orders list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            {search ? 'No orders match your search.' : 'No orders yet.'}
          </div>
        ) : (
          filtered.map((order, i) => {
            const customer = order.client_name || 'Guest';
            const date = new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            return (
              <Link
                key={order.id}
                to={`/owner/orders/${order.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? 10 : 16,
                  padding: '16px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background .15s ease',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Order ref + customer */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', fontFamily: 'monospace' }}>
                        ORD-{String(order.id).padStart(6, '0')}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      {customer} · {date}
                    </div>
                    {!isMobile && <MiniTracker status={order.status} />}
                  </div>

                  {/* Items count */}
                  <div style={{ textAlign: isMobile ? 'left' : 'center', minWidth: 70 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'}</div>
                  </div>

                  {/* Total */}
                  <div style={{ textAlign: isMobile ? 'left' : 'right', minWidth: 90 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0D9488' }}>Rs. {parseFloat(order.total).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{order.payment_method}</div>
                  </div>

                  {/* Arrow */}
                  {!isMobile && <div style={{ color: 'var(--text-muted)', fontSize: 16, flexShrink: 0 }}>›</div>}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

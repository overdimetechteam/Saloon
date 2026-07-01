import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { useIsMobile } from '../../hooks/useMobile';

const STATUS_META = {
  pending:          { label: 'Pending',          color: '#D97706', bg: 'rgba(217,119,6,.1)',   icon: '⧗' },
  confirmed:        { label: 'Confirmed',         color: '#0D9488', bg: 'rgba(13,148,136,.1)',  icon: '✓' },
  packing:          { label: 'Packing',           color: '#7C3AED', bg: 'rgba(124,58,237,.1)',  icon: '📦' },
  ready_for_pickup: { label: 'Ready for Pickup',  color: '#2563EB', bg: 'rgba(37,99,235,.1)',   icon: '🏪' },
  picked_up:        { label: 'Picked Up',         color: '#0891B2', bg: 'rgba(8,145,178,.1)',   icon: '🤝' },
  dispatched:       { label: 'On the Way',        color: '#059669', bg: 'rgba(5,150,105,.1)',   icon: '🚚' },
  delivered:        { label: 'Delivered',         color: '#16A34A', bg: 'rgba(22,163,74,.1)',   icon: '🎉' },
  cancelled:        { label: 'Cancelled',         color: '#DC2626', bg: 'rgba(220,38,38,.1)',   icon: '✕' },
};

const STEP_KEYS = ['pending','confirmed','packing','ready_for_pickup','picked_up','dispatched','delivered'];

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, color: '#6B7280', bg: '#f0f0f0', icon: '•' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20,
      background: m.bg, color: m.color, fontSize: 11, fontWeight: 700,
    }}>
      <span>{m.icon}</span> {m.label}
    </span>
  );
}

function MiniProgress({ status }) {
  const idx = STEP_KEYS.indexOf(status);
  if (idx < 0 || status === 'cancelled') return null;
  const pct = idx === 0 ? 0 : Math.round((idx / (STEP_KEYS.length - 1)) * 100);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ height: 3, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#0D9488,#14B8A8)', borderRadius: 3 }} />
      </div>
    </div>
  );
}

export default function UserOrders() {
  const { profile }           = useAuth();
  const isMobile              = useIsMobile();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');

  useEffect(() => {
    // Fetch orders across all salons the client has ordered from
    api.get('/orders/mine/')
      .then(r => setOrders(r.data))
      .catch(() => setErr('Failed to load orders.'))
      .finally(() => setLoading(false));
  }, []);

  const active    = orders.filter(o => !['delivered','cancelled'].includes(o.status));
  const past      = orders.filter(o => ['delivered','cancelled'].includes(o.status));

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading your orders…</div>;
  if (err) return <div style={{ padding: 48, textAlign: 'center', color: '#DC2626' }}>{err}</div>;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: isMobile ? 24 : 28, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>My Orders</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Track all your cosmetic orders</p>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 8 }}>No orders yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Browse cosmetics from your favourite salons</div>
          <Link to="/salons" style={{ padding: '11px 28px', background: 'linear-gradient(135deg,#0D9488,#14B8A8)', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
            Explore Salons
          </Link>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <Section title="Active Orders" orders={active} isMobile={isMobile} />
          )}
          {past.length > 0 && (
            <Section title="Past Orders" orders={past} isMobile={isMobile} />
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, orders, isMobile }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {orders.map(order => {
          const m    = STATUS_META[order.status] || STATUS_META.pending;
          const date = new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
          return (
            <Link key={order.id} to={`/user/orders/${order.id}?salon=${order.salon}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
                padding: '16px 18px', transition: 'border-color .15s ease, box-shadow .15s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D9488'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(13,148,136,.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', fontFamily: 'monospace' }}>
                        ORD-{String(order.id).padStart(6,'0')}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} · {date}
                    </div>
                    <MiniProgress status={order.status} />
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0D9488' }}>Rs. {parseFloat(order.total).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>View details ›</div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

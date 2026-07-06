import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useIsMobile } from '../../hooks/useMobile';

const TERMINAL = new Set(['delivered', 'cancelled']);

const STEPS = [
  { key: 'pending',          label: 'Order Placed',     desc: 'We received your order!',                  icon: '📋' },
  { key: 'confirmed',        label: 'Confirmed',         desc: 'Salon confirmed your order',               icon: '✅' },
  { key: 'packing',          label: 'Being Packed',      desc: 'Your items are being carefully packed',    icon: '📦' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup',  desc: 'Waiting for delivery person to collect',  icon: '🏪' },
  { key: 'picked_up',        label: 'Picked Up',         desc: 'Delivery has your package',               icon: '🤝' },
  { key: 'dispatched',       label: 'On the Way',        desc: 'Your order is heading to you!',           icon: '🚚' },
  { key: 'delivered',        label: 'Delivered',         desc: 'Enjoy your products!',                    icon: '🎉' },
];

const STATUS_COLOR = {
  pending: '#D97706', confirmed: '#0D9488', packing: '#7C3AED',
  ready_for_pickup: '#2563EB', picked_up: '#0891B2', dispatched: '#059669',
  delivered: '#16A34A', cancelled: '#DC2626',
};

function StatusTracker({ status }) {
  const stepIdx   = STEPS.findIndex(s => s.key === status);
  const cancelled = status === 'cancelled';

  if (cancelled) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(220,38,38,.1)', border: '2px solid rgba(220,38,38,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>✕</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#DC2626' }}>Order Cancelled</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>This order was cancelled</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 0 0' }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Progress</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#0D9488' }}>
            {stepIdx === 0 ? 0 : Math.round((stepIdx / (STEPS.length - 1)) * 100)}% complete
          </span>
        </div>
        <div style={{ height: 8, background: 'var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: stepIdx <= 0 ? '2%' : `${(stepIdx / (STEPS.length - 1)) * 100}%`,
            background: 'linear-gradient(90deg,#0D9488,#14B8A8)',
            borderRadius: 8, transition: 'width .5s ease',
          }} />
        </div>
      </div>

      {/* Steps list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {STEPS.map((step, i) => {
          const done   = i < stepIdx;
          const active = i === stepIdx;
          const future = i > stepIdx;
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div style={{
                  position: 'absolute', left: 18, top: 38, width: 2, height: 28,
                  background: done ? '#0D9488' : 'var(--border)',
                  transition: 'background .3s ease',
                }} />
              )}
              {/* Icon circle */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                border: `2.5px solid ${done || active ? '#0D9488' : 'var(--border)'}`,
                background: done ? '#0D9488' : active ? 'rgba(13,148,136,.08)' : 'var(--surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 15 : 18,
                boxShadow: active ? '0 0 0 4px rgba(13,148,136,.15)' : 'none',
                transition: 'all .3s ease',
                zIndex: 1,
              }}>
                {done ? <span style={{ color: '#fff', fontWeight: 700 }}>✓</span> : step.icon}
              </div>
              {/* Label */}
              <div style={{ paddingTop: 8, paddingBottom: 22, flex: 1 }}>
                <div style={{
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  color: future ? 'var(--text-muted)' : done ? 'var(--text)' : '#0D9488',
                  transition: 'color .3s ease',
                }}>
                  {step.label}
                  {active && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: 'rgba(13,148,136,.12)', color: '#0D9488' }}>Current</span>}
                </div>
                {(active || done) && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{step.desc}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function UserOrderDetail() {
  const { id }                    = useParams();
  const [searchParams]            = useSearchParams();
  const salonId                   = searchParams.get('salon');
  const isMobile                  = useIsMobile();
  const [order, setOrder]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef               = useRef(null);
  const orderRef                  = useRef(null);

  const fetchOrder = useCallback(async (initial = false) => {
    if (!salonId) return;
    try {
      const r = await api.get(`/salons/${salonId}/orders/${id}/`);
      setOrder(prev => {
        if (prev && prev.status !== r.data.status) setLastUpdated(new Date());
        return r.data;
      });
      orderRef.current = r.data;
      if (initial) setLoading(false);
      // Stop polling once terminal
      if (TERMINAL.has(r.data.status) && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch {
      if (initial) { setErr('Failed to load order.'); setLoading(false); }
    }
  }, [id, salonId]);

  useEffect(() => {
    if (!salonId) { setErr('Missing salon info.'); setLoading(false); return; }

    fetchOrder(true);

    // Start polling every 6 seconds
    intervalRef.current = setInterval(() => {
      if (!document.hidden && !TERMINAL.has(orderRef.current?.status)) fetchOrder();
    }, 6000);

    // Pause/resume on tab visibility change
    const onVisibility = () => {
      if (!document.hidden && !TERMINAL.has(orderRef.current?.status)) fetchOrder();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchOrder, salonId]);

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;
  if (err) return <div style={{ padding: 48, textAlign: 'center', color: '#DC2626' }}>{err}</div>;
  if (!order) return null;

  const stepIdx    = STEPS.findIndex(s => s.key === order.status);
  const currentStep = STEPS[stepIdx];
  const statusColor = STATUS_COLOR[order.status] || '#6B7280';

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <Link to="/user/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
        ← Back to Orders
      </Link>

      {/* Order header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: isMobile ? 20 : 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            ORD-{String(order.id).padStart(6,'0')}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {!TERMINAL.has(order.status) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'rgba(13,148,136,.1)', border: '1px solid rgba(13,148,136,.2)', fontSize: 11, fontWeight: 700, color: '#0D9488' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0D9488', animation: 'pulse 1.5s ease-in-out infinite' }} />
                Live
              </span>
            )}
            <span style={{ padding: '5px 14px', borderRadius: 20, background: `${statusColor}18`, color: statusColor, fontSize: 12, fontWeight: 700 }}>
              {order.status_label}
            </span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
          Placed on {new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
          {lastUpdated && <span style={{ marginLeft: 10, color: '#0D9488' }}>· Updated {lastUpdated.toLocaleTimeString()}</span>}
        </div>

        {/* Status tracker */}
        <StatusTracker status={order.status} />

        {/* Active status callout */}
        {currentStep && order.status !== 'cancelled' && order.status !== 'delivered' && (
          <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(13,148,136,.07)', border: '1px solid rgba(13,148,136,.18)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>{currentStep.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D9488' }}>{currentStep.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentStep.desc}</div>
            </div>
          </div>
        )}
        {order.status === 'delivered' && (
          <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(22,163,74,.08)', border: '1px solid rgba(22,163,74,.2)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🎉</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>Order Delivered!</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Thank you for shopping with BookMyStyle</div>
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
          Your Items ({order.items?.length || 0})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(order.items || []).map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(13,148,136,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>◈</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{item.product_name}</div>
                {item.variant_note && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.variant_note}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0D9488' }}>Rs. {(parseFloat(item.unit_price) * item.quantity).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rs. {parseFloat(item.unit_price).toLocaleString()} × {item.quantity}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1.5px solid var(--border)', marginTop: 14, paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Total</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0D9488' }}>Rs. {parseFloat(order.total).toLocaleString()}</span>
        </div>
      </div>

      {/* Delivery info */}
      {order.delivery_type === 'delivery' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Delivery Address</div>
          <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
            <div>{order.delivery_address}</div>
            <div>{[order.delivery_city, order.delivery_postal].filter(Boolean).join(', ')}</div>
          </div>
        </div>
      )}
    </div>
  );
}

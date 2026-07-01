import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { useBreakpoint } from '../../hooks/useMobile';

const STEPS = [
  { key: 'pending',          label: 'Order Placed',      desc: 'Order received, awaiting confirmation',    icon: '📋' },
  { key: 'confirmed',        label: 'Confirmed',          desc: 'Salon has confirmed the order',            icon: '✅' },
  { key: 'packing',          label: 'Packing',            desc: 'Items are being packed',                   icon: '📦' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup',   desc: 'Waiting for delivery person to collect',   icon: '🏪' },
  { key: 'picked_up',        label: 'Picked Up',          desc: 'Delivery person has collected the order',  icon: '🤝' },
  { key: 'dispatched',       label: 'Dispatched',         desc: 'Order is on the way to the customer',      icon: '🚚' },
  { key: 'delivered',        label: 'Delivered',          desc: 'Order delivered successfully',             icon: '🎉' },
];

const NEXT_ACTIONS = {
  pending:          { label: 'Confirm Order',        next: 'confirmed',        color: '#0D9488' },
  confirmed:        { label: 'Start Packing',        next: 'packing',          color: '#7C3AED' },
  packing:          { label: 'Mark Ready for Pickup',next: 'ready_for_pickup', color: '#2563EB' },
  ready_for_pickup: { label: 'Mark as Picked Up',   next: 'picked_up',        color: '#0891B2' },
  picked_up:        { label: 'Mark as Dispatched',  next: 'dispatched',       color: '#059669' },
  dispatched:       { label: 'Mark as Delivered',   next: 'delivered',        color: '#16A34A' },
  delivered:        null,
  cancelled:        null,
};

const STATUS_COLOR = {
  pending: '#D97706', confirmed: '#0D9488', packing: '#7C3AED',
  ready_for_pickup: '#2563EB', picked_up: '#0891B2', dispatched: '#059669',
  delivered: '#16A34A', cancelled: '#DC2626',
};

function StatusTracker({ status }) {
  const stepIdx  = STEPS.findIndex(s => s.key === status);
  const cancelled = status === 'cancelled';

  return (
    <div style={{ padding: '28px 0 8px' }}>
      {cancelled ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✕</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#DC2626' }}>Order Cancelled</div>
        </div>
      ) : (
        <>
          {/* Desktop horizontal tracker */}
          <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
            {/* Background line */}
            <div style={{ position: 'absolute', top: 20, left: '5%', right: '5%', height: 3, background: 'var(--border)', borderRadius: 3, zIndex: 0 }} />
            {/* Progress line */}
            <div style={{
              position: 'absolute', top: 20, left: '5%', height: 3,
              width: stepIdx <= 0 ? '0%' : `${(stepIdx / (STEPS.length - 1)) * 90}%`,
              background: 'linear-gradient(90deg,#0D9488,#14B8A8)',
              borderRadius: 3, zIndex: 1, transition: 'width .5s ease',
            }} />
            {STEPS.map((step, i) => {
              const done    = i < stepIdx;
              const active  = i === stepIdx;
              const pending = i > stepIdx;
              return (
                <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', border: '3px solid',
                    borderColor: done || active ? '#0D9488' : 'var(--border)',
                    background: done ? '#0D9488' : active ? 'var(--surface)' : 'var(--surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: done ? 16 : 20, transition: 'all .3s ease',
                    boxShadow: active ? '0 0 0 4px rgba(13,148,136,.2)' : 'none',
                  }}>
                    {done ? <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>✓</span> : step.icon}
                  </div>
                  <div style={{
                    marginTop: 8, fontSize: 10, fontWeight: active ? 700 : 500,
                    color: active ? '#0D9488' : done ? 'var(--text)' : 'var(--text-muted)',
                    textAlign: 'center', lineHeight: 1.3, maxWidth: 72,
                  }}>
                    {step.label}
                  </div>
                  {active && (
                    <div style={{ fontSize: 9, color: '#0D9488', marginTop: 3, textAlign: 'center', maxWidth: 80, lineHeight: 1.3 }}>
                      {step.desc}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function OwnerOrderDetail() {
  const { id }                  = useParams();
  const { salon }               = useOwner();
  const { isMobile }            = useBreakpoint();
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState('');
  const [advancing, setAdvancing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [msg, setMsg]           = useState('');

  const load = () => {
    if (!salon) return;
    api.get(`/salons/${salon.id}/orders/${id}/`)
      .then(r => setOrder(r.data))
      .catch(() => setErr('Failed to load order.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [salon, id]);

  const advance = async () => {
    const action = NEXT_ACTIONS[order?.status];
    if (!action) return;
    setAdvancing(true); setErr(''); setMsg('');
    try {
      const r = await api.patch(`/salons/${salon.id}/orders/${id}/`, { status: action.next });
      setOrder(r.data);
      setMsg(`Status updated to "${r.data.status_label}"`);
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to update status.');
    } finally { setAdvancing(false); }
  };

  const cancel = async () => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setCancelling(true); setErr(''); setMsg('');
    try {
      const r = await api.patch(`/salons/${salon.id}/orders/${id}/`, { status: 'cancelled' });
      setOrder(r.data);
      setMsg('Order cancelled.');
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to cancel order.');
    } finally { setCancelling(false); }
  };

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;
  if (err && !order) return <div style={{ padding: 48, textAlign: 'center', color: '#DC2626' }}>{err}</div>;
  if (!order) return null;

  const action     = NEXT_ACTIONS[order.status];
  const canCancel  = !['delivered','cancelled'].includes(order.status);
  const stepIdx    = STEPS.findIndex(s => s.key === order.status);
  const currentStep = STEPS[stepIdx];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Link to="/owner/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
        ← Back to Orders
      </Link>

      {/* Header card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: isMobile ? 20 : 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
                ORD-{String(order.id).padStart(6,'0')}
              </h2>
              <span style={{
                padding: '5px 12px', borderRadius: 20,
                background: `${STATUS_COLOR[order.status]}18`,
                color: STATUS_COLOR[order.status],
                fontSize: 12, fontWeight: 700,
              }}>
                {order.status_label}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Placed {new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {canCancel && (
              <button
                onClick={cancel}
                disabled={cancelling}
                style={{ padding: '9px 16px', borderRadius: 10, border: '1.5px solid #FCA5A5', background: 'transparent', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: cancelling ? 0.6 : 1 }}
              >
                {cancelling ? 'Cancelling…' : 'Cancel Order'}
              </button>
            )}
            {action && (
              <button
                onClick={advance}
                disabled={advancing}
                style={{
                  padding: '9px 20px', borderRadius: 10, border: 'none',
                  background: `linear-gradient(135deg, ${action.color}, ${action.color}CC)`,
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  opacity: advancing ? 0.7 : 1,
                  boxShadow: `0 4px 14px ${action.color}40`,
                }}
              >
                {advancing ? 'Updating…' : action.label}
              </button>
            )}
          </div>
        </div>

        {msg && <div style={{ background: 'rgba(13,148,136,.1)', border: '1px solid rgba(13,148,136,.3)', color: '#0D9488', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{msg}</div>}
        {err && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{err}</div>}

        {/* Status tracker */}
        <StatusTracker status={order.status} />

        {/* Current status description */}
        {currentStep && order.status !== 'cancelled' && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(13,148,136,.07)', borderRadius: 10, border: '1px solid rgba(13,148,136,.18)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{currentStep.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D9488' }}>{currentStep.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentStep.desc}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
        {/* Customer details */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Customer</div>
          <InfoRow label="Name"     value={order.client_name || '—'} />
          <InfoRow label="Email"    value={order.client_email || '—'} />
          <InfoRow label="Phone"    value={order.client_phone || '—'} />
          <InfoRow label="Delivery" value={order.delivery_type === 'delivery' ? 'Home Delivery' : 'Pickup'} />
          {order.delivery_type === 'delivery' && (
            <>
              <InfoRow label="Address" value={order.delivery_address || '—'} />
              <InfoRow label="City"    value={[order.delivery_city, order.delivery_postal].filter(Boolean).join(', ') || '—'} />
            </>
          )}
          <InfoRow label="Payment"  value={order.payment_method?.replace('_',' ') || '—'} />
          {order.notes && <InfoRow label="Notes" value={order.notes} />}
        </div>

        {/* Order summary */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Order Summary</div>
          <InfoRow label="Subtotal"     value={`Rs. ${parseFloat(order.subtotal).toLocaleString()}`} />
          {parseFloat(order.tax) > 0 && <InfoRow label="Tax (15%)" value={`Rs. ${parseFloat(order.tax).toLocaleString()}`} />}
          {parseFloat(order.delivery_fee) > 0 && <InfoRow label="Delivery Fee" value={`Rs. ${parseFloat(order.delivery_fee).toLocaleString()}`} />}
          {parseFloat(order.gift_fee) > 0 && <InfoRow label="Gift Wrap" value={`Rs. ${parseFloat(order.gift_fee).toLocaleString()}`} />}
          {parseFloat(order.discount) > 0 && <InfoRow label="Discount" value={`-Rs. ${parseFloat(order.discount).toLocaleString()}`} color="#16A34A" />}
          <div style={{ borderTop: '1.5px solid var(--border)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#0D9488' }}>Rs. {parseFloat(order.total).toLocaleString()}</span>
          </div>
          {order.gift_wrap && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(212,175,55,.08)', border: '1px solid rgba(212,175,55,.2)', borderRadius: 8, fontSize: 12, color: '#B8932A' }}>
              🎁 Gift wrapped{order.gift_message ? ` · "${order.gift_message}"` : ''}
            </div>
          )}
          {order.promo_code && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(13,148,136,.06)', border: '1px solid rgba(13,148,136,.18)', borderRadius: 8, fontSize: 12, color: '#0D9488' }}>
              Promo: <strong>{order.promo_code}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, marginTop: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
          Items ({order.items?.length || 0})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(order.items || []).map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(13,148,136,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>◈</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{item.product_name}</div>
                {item.product_sku && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SKU: {item.product_sku}</div>}
                {item.variant_note && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.variant_note}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Rs. {parseFloat(item.unit_price).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>× {item.quantity}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0D9488', minWidth: 80, textAlign: 'right', flexShrink: 0 }}>
                Rs. {(parseFloat(item.unit_price) * item.quantity).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: color || 'var(--text)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

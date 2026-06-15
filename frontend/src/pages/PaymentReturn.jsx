import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';

export function PaymentSuccess() {
  const [params]  = useSearchParams();
  const orderId   = params.get('order_id');
  const [status, setStatus] = useState('checking'); // checking | confirmed | pending | failed

  useEffect(() => {
    if (!orderId) { setStatus('confirmed'); return; }
    // Poll the payment status once — PayHere may have already notified the backend
    const check = async () => {
      try {
        const r = await api.get(`/payments/status/${orderId}/`);
        if (r.data.status === 'completed') setStatus('confirmed');
        else if (r.data.status === 'failed' || r.data.status === 'cancelled') setStatus('failed');
        else setStatus('pending');
      } catch {
        setStatus('confirmed'); // assume ok if endpoint unreachable
      }
    };
    check();
  }, [orderId]);

  const meta = {
    confirmed: { icon: '🎉', title: 'Transaction Completed!',       color: '#0D9488', sub: 'Your payment was successful and your order is being processed.' },
    pending:   { icon: '⏳', title: 'Payment Processing…',           color: '#D97706', sub: 'Your payment is being verified. This usually takes less than a minute. Check your bookings shortly.' },
    failed:    { icon: '⚠️', title: 'Transaction Incomplete',        color: '#DC2626', sub: 'The transaction could not be completed. No charges were made. Please try again or use a different payment method.' },
    checking:  { icon: '⏳', title: 'Verifying transaction…',        color: '#6B7280', sub: 'Please wait while we confirm your payment.' },
  }[status];

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{meta.icon}</div>
        <h2 style={{ ...s.title, color: meta.color }}>{meta.title}</h2>
        {meta.sub && <p style={s.sub}>{meta.sub}</p>}
        {orderId && (
          <div style={s.refBox}>
            <span style={s.refLabel}>Reference</span>
            <span style={s.refVal}>{orderId}</span>
          </div>
        )}
        <div style={s.actions}>
          {status === 'failed' ? (
            <>
              <Link to="/user/checkout" style={{ ...s.btn, background: 'linear-gradient(135deg,#DC2626,#EF4444)' }}>
                Try Again
              </Link>
              <Link to="/salons" style={s.outlineBtn}>Back to Salons</Link>
            </>
          ) : (
            <>
              <Link to="/user/bookings" style={{ ...s.btn, background: 'linear-gradient(135deg,#0D9488,#14B8A8)' }}>
                My Bookings
              </Link>
              <Link to="/salons" style={s.outlineBtn}>Back to Salons</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function PaymentCancel() {
  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ ...s.title, color: '#DC2626' }}>Transaction Incomplete</h2>
        <p style={s.sub}>Your transaction was not completed and no charges were made. This could be because you cancelled, the session timed out, or the payment was declined. Please try again.</p>
        <div style={s.actions}>
          <button onClick={() => window.history.back()} style={{ ...s.btn, background: 'linear-gradient(135deg,#0D9488,#14B8A8)', border: 'none', cursor: 'pointer', width: '100%' }}>
            Try Again
          </button>
          <Link to="/salons" style={s.outlineBtn}>Back to Salons</Link>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg)', padding: '40px 20px',
  },
  card: {
    background: 'var(--surface)', borderRadius: 24, padding: '52px 40px',
    maxWidth: 460, width: '100%', textAlign: 'center',
    border: '1px solid var(--border)',
    boxShadow: '0 20px 60px rgba(0,0,0,.12)',
  },
  title: {
    fontFamily: "'Cormorant Garamond',Georgia,serif",
    fontSize: 30, fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.02em',
  },
  sub: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 24px' },
  refBox: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '11px 16px', background: 'var(--bg)',
    border: '1px solid var(--border)', borderRadius: 10, marginBottom: 28,
  },
  refLabel: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  refVal:   { fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' },
  actions:  { display: 'flex', flexDirection: 'column', gap: 12 },
  btn: {
    display: 'block', padding: '13px 0', borderRadius: 12, color: '#fff',
    fontWeight: 700, fontSize: 14, textDecoration: 'none',
    fontFamily: "'DM Sans',sans-serif",
    boxShadow: '0 6px 20px rgba(13,148,136,.3)',
  },
  outlineBtn: {
    display: 'block', padding: '13px 0', borderRadius: 12,
    border: '1.5px solid var(--border)', color: 'var(--text-muted)',
    fontWeight: 600, fontSize: 14, textDecoration: 'none',
    fontFamily: "'DM Sans',sans-serif",
  },
};

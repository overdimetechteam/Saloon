import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';

/* ─── Plan config (mirrors backend PLANS) ─────────────────────────────── */
const PLAN_ORDER = ['free_trial', 'starter', 'professional', 'premium'];

const PLAN_COLORS = {
  free_trial:   '#6B7280',
  starter:      '#14B8A8',
  professional: '#0D9488',
  premium:      '#D4AF37',
};

const PLAN_META = {
  free_trial:   { icon: '🆓', badge: null },
  starter:      { icon: '🚀', badge: null },
  professional: { icon: '💎', badge: 'Most Popular' },
  premium:      { icon: '👑', badge: 'Best Value' },
};

/* ─── Feature rows shown in comparison table ─────────────────────────── */
const FEATURE_ROWS = [
  { key: 'max_services',           label: 'Services',               fmt: v => v === -1 ? 'Unlimited' : `Up to ${v}` },
  { key: 'max_staff',              label: 'Staff Members',          fmt: v => v === -1 ? 'Unlimited' : `Up to ${v}` },
  { key: 'max_bookings_per_month', label: 'Bookings / Month',       fmt: v => v === -1 ? 'Unlimited' : `Up to ${v}` },
  { key: 'max_gallery_photos',     label: 'Gallery Photos',         fmt: v => v === -1 ? 'Unlimited' : `Up to ${v}` },
  { key: 'cosmetics',              label: 'Cosmetics Store',        fmt: v => v ? '✓' : '—' },
  { key: 'max_products',           label: 'Products',               fmt: v => v === 0 ? '—' : v === -1 ? 'Unlimited' : `Up to ${v}` },
  { key: 'home_visit',             label: 'Home Visit Bookings',    fmt: v => v ? '✓' : '—' },
  { key: 'promotions',             label: 'Promotions & Offers',    fmt: v => v ? '✓' : '—' },
  { key: 'advanced_analytics',     label: 'Advanced Analytics',     fmt: v => v ? '✓' : '—' },
  { key: 'inventory_reports',      label: 'Inventory Reports',      fmt: v => v ? '✓' : '—' },
  { key: 'featured_listing',       label: 'Featured Listing',       fmt: v => v ? '✓' : '—' },
  { key: 'priority_support',       label: 'Priority Support',       fmt: v => v ? '✓' : '—' },
];

/* ─── PayHere redirect helper ────────────────────────────────────────── */
function submitToPayHere(data) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = data.checkout_url;
  const fields = [
    'merchant_id','return_url','cancel_url','notify_url',
    'order_id','items','currency','amount',
    'first_name','last_name','email','phone',
    'address','city','country','hash',
  ];
  fields.forEach(k => {
    const inp = document.createElement('input');
    inp.type = 'hidden'; inp.name = k; inp.value = data[k] ?? '';
    form.appendChild(inp);
  });
  document.body.appendChild(form);
  form.submit();
}

/* ─── Payment modal ──────────────────────────────────────────────────── */
function PaymentModal({ plan, planKey, onClose }) {
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const color = PLAN_COLORS[planKey];

  const handlePay = async () => {
    setError(''); setLoading(true);
    try {
      const r = await api.post('/payments/initiate/', { type: 'subscription', plan: planKey });
      submitToPayHere(r.data);
      // Page navigates away — no need to setLoading(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not start payment. Please try again.');
      setLoading(false);
    }
  };

  return createPortal(
    <div style={pm.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={pm.modal}>
        <div style={{ ...pm.header, background: `linear-gradient(135deg, ${color}22, ${color}08)`, borderBottom: `1px solid ${color}30` }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
              Subscribe via PayHere
            </div>
            <div style={pm.title}>{PLAN_META[planKey]?.icon} {plan.name}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', marginTop: 4 }}>
              LKR {plan.price.toLocaleString()}
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}> / month</span>
            </div>
          </div>
          <button style={pm.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={pm.form}>
          {error && <div style={pm.error}>{error}</div>}

          <div style={pm.summary}>
            <div style={pm.summaryRow}><span>Plan</span><span style={{ fontWeight: 700 }}>{plan.name}</span></div>
            <div style={pm.summaryRow}><span>Duration</span><span>30 days</span></div>
            <div style={{ ...pm.summaryRow, borderTop: '1.5px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: 17, color: 'var(--text)' }}>LKR {plan.price.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20, padding: '12px 14px', background: 'rgba(13,148,136,.06)', borderRadius: 10, border: '1px solid rgba(13,148,136,.15)' }}>
            🔐 You'll be redirected to <strong style={{ color: 'var(--text)' }}>PayHere</strong> to complete your payment securely with your card, bank account, or mobile wallet.
          </div>

          <button
            style={{ ...pm.payBtn, background: `linear-gradient(135deg, ${color}, ${color}cc)`, opacity: loading ? 0.75 : 1 }}
            onClick={handlePay}
            disabled={loading}
          >
            {loading ? 'Redirecting to PayHere…' : `Pay LKR ${plan.price.toLocaleString()} via PayHere`}
          </button>
          <p style={pm.disclaimer}>🔒 Secured by PayHere · LKR · Sri Lanka</p>
        </div>
      </div>
    </div>,
    document.body
  );
}

const pm = {
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:      { background: 'var(--surface)', borderRadius: 22, width: '100%', maxWidth: 440, boxShadow: '0 30px 80px rgba(0,0,0,.35)' },
  header:     { padding: '26px 28px 22px', borderRadius: '22px 22px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title:      { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 },
  closeBtn:   { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 6 },
  error:      { padding: '11px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 10, fontSize: 13, marginBottom: 16 },
  form:       { padding: '20px 28px 28px' },
  summary:    { background: 'var(--bg)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1px solid var(--border)' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text)', marginBottom: 6 },
  payBtn:     { width: '100%', padding: '14px', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 6px 20px rgba(0,0,0,.2)' },
  disclaimer: { textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 10 },
};

/* ─── Cancel confirmation modal ─────────────────────────────────────── */
function CancelModal({ planName, onClose, onConfirm, loading }) {
  return createPortal(
    <div style={pm.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...pm.modal, maxWidth: 400 }}>
        <div style={{ padding: 32 }}>
          <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 14 }}>⚠️</div>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: 10 }}>
            Cancel {planName}?
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.7, marginBottom: 24 }}>
            Your subscription will be cancelled immediately. You'll lose access to paid features including the cosmetics store. This cannot be undone.
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={{ ...pm.payBtn, background: 'var(--surface)', color: 'var(--text)', border: '1.5px solid var(--border)', flex: 1, boxShadow: 'none' }} onClick={onClose}>
              Keep Plan
            </button>
            <button style={{ ...pm.payBtn, background: '#DC2626', flex: 1 }} onClick={onConfirm} disabled={loading}>
              {loading ? 'Cancelling…' : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────── */
export default function OwnerSubscription() {
  const { setSalon } = useOwner();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [payModal, setPayModal]   = useState(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [msg, setMsg]             = useState('');
  const [tab, setTab]             = useState('plans');

  const load = () => {
    setLoading(true);
    api.get('/subscription/my/')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // handleSuccess is called from PaymentReturn page after PayHere redirect back
  const handleSuccess = () => {
    setPayModal(null);
    load();
    api.get('/owner/salon/').then(r => setSalon(r.data)).catch(() => {});
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await api.post('/subscription/cancel/');
      setCancelModal(false);
      setMsg('Subscription cancelled. You are now on Free Trial.');
      load();
      api.get('/owner/salon/').then(r => setSalon(r.data)).catch(() => {});
      setTimeout(() => setMsg(''), 6000);
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Error cancelling.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={s.spinner} />
    </div>
  );

  if (!data) return null;

  const { subscription: sub, plans } = data;
  const currentPlan = plans[sub.plan] || {};
  const planColor = PLAN_COLORS[sub.plan] || '#6B7280';

  return (
    <div style={s.page}>

      {/* Page header */}
      <div style={s.pageHeader}>
        <div>
          <div style={s.eyebrow}>Billing</div>
          <h2 style={s.pageTitle}>Subscription & Plans</h2>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...s.tabBtn, ...(tab === 'plans' ? s.tabActive : {}) }} onClick={() => setTab('plans')}>
            Plans
          </button>
          <button style={{ ...s.tabBtn, ...(tab === 'compare' ? s.tabActive : {}) }} onClick={() => setTab('compare')}>
            Compare
          </button>
          <button style={{ ...s.tabBtn, ...(tab === 'billing' ? s.tabActive : {}) }} onClick={() => setTab('billing')}>
            Billing
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ ...s.alert, background: msg.includes('cancel') ? '#FEF2F2' : '#F0FDFA', borderColor: msg.includes('cancel') ? '#FCA5A5' : '#99F6E4', color: msg.includes('cancel') ? '#DC2626' : '#0D9488' }}>
          {msg}
        </div>
      )}

      {/* Current plan banner */}
      <div style={{ ...s.currentBanner, borderLeft: `4px solid ${planColor}` }}>
        <div style={s.bannerLeft}>
          <span style={{ fontSize: 28 }}>{PLAN_META[sub.plan]?.icon}</span>
          <div>
            <div style={s.bannerPlan}>
              {currentPlan.name || 'Free Trial'}
              <span style={{ ...s.planStatusBadge, background: sub.is_active ? '#F0FDFA' : '#FEF2F2', color: sub.is_active ? '#0D9488' : '#DC2626', border: `1px solid ${sub.is_active ? '#99F6E4' : '#FCA5A5'}` }}>
                {sub.is_active ? '● Active' : '● ' + sub.status}
              </span>
            </div>
            <div style={s.bannerSub}>
              {sub.plan === 'free_trial'
                ? `Free Trial — ${sub.days_remaining} days remaining`
                : `Renews in ${sub.days_remaining} days · LKR ${Number(sub.amount_paid).toLocaleString()} / month`}
            </div>
          </div>
        </div>
        {sub.plan !== 'free_trial' && sub.is_active && (
          <button style={s.cancelLink} onClick={() => setCancelModal(true)}>Cancel plan</button>
        )}
      </div>

      {/* ── Plans grid ─────────────────────────────────────────────── */}
      {tab === 'plans' && (
        <div style={s.plansGrid}>
          {PLAN_ORDER.map(key => {
            const plan = plans[key];
            if (!plan) return null;
            const isCurrent = sub.plan === key;
            const meta = PLAN_META[key];
            const color = PLAN_COLORS[key];
            const isDowngrade = PLAN_ORDER.indexOf(key) < PLAN_ORDER.indexOf(sub.plan);

            return (
              <div key={key} style={{ ...s.planCard, borderTop: `3px solid ${color}`, opacity: key === 'free_trial' && !isCurrent ? 0.7 : 1 }}>
                {meta.badge && (
                  <div style={{ ...s.popularBadge, background: color }}>{meta.badge}</div>
                )}
                <div style={s.planIcon}>{meta.icon}</div>
                <div style={{ ...s.planName, color }}>{plan.name}</div>
                <div style={s.planTagline}>{plan.tagline}</div>
                <div style={s.planPrice}>
                  {plan.price === 0
                    ? <span style={{ color: 'var(--text)' }}>Free</span>
                    : <><span style={{ color: 'var(--text)' }}>LKR {plan.price.toLocaleString()}</span><span style={s.planPer}>/mo</span></>
                  }
                </div>

                <ul style={s.bulletList}>
                  {plan.bullets.map((b, i) => (
                    <li key={i} style={s.bullet}><span style={{ color }}>✓</span> {b}</li>
                  ))}
                  {plan.not_included?.map((b, i) => (
                    <li key={'n' + i} style={{ ...s.bullet, color: 'var(--text-muted)', opacity: 0.6 }}><span>—</span> {b}</li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div style={{ ...s.currentBadge, background: `${color}15`, color, border: `1px solid ${color}40` }}>
                    ✓ Current Plan
                  </div>
                ) : key === 'free_trial' ? (
                  <div style={{ ...s.planBtn, background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' }}>
                    Default Plan
                  </div>
                ) : (
                  <button
                    style={{ ...s.planBtn, background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 6px 18px ${color}35` }}
                    onClick={() => setPayModal({ key, plan })}
                  >
                    {isDowngrade ? 'Switch to ' : 'Upgrade to '}{plan.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Comparison table ──────────────────────────────────────── */}
      {tab === 'compare' && (
        <div style={s.tableWrap}>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.compareTable}>
              <thead>
                <tr>
                  <th style={s.featureTh}>Feature</th>
                  {PLAN_ORDER.map(key => (
                    <th key={key} style={{ ...s.planTh, color: PLAN_COLORS[key], borderBottom: `2px solid ${PLAN_COLORS[key]}` }}>
                      {PLAN_META[key]?.icon} {plans[key]?.name}
                      {sub.plan === key && <div style={s.currentDot}>Current</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={s.featureTd}>Price</td>
                  {PLAN_ORDER.map(key => (
                    <td key={key} style={{ ...s.planTd, fontWeight: 800, color: 'var(--text)' }}>
                      {plans[key]?.price === 0 ? 'Free' : `LKR ${plans[key]?.price?.toLocaleString()}/mo`}
                    </td>
                  ))}
                </tr>
                {FEATURE_ROWS.map(row => (
                  <tr key={row.key}>
                    <td style={s.featureTd}>{row.label}</td>
                    {PLAN_ORDER.map(key => {
                      const val = plans[key]?.features?.[row.key];
                      const text = row.fmt(val);
                      return (
                        <td key={key} style={{ ...s.planTd, color: text === '—' ? '#D1D5DB' : text === '✓' ? '#0D9488' : 'var(--text)', fontWeight: text === '✓' ? 800 : 400 }}>
                          {text}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td style={s.featureTd} />
                  {PLAN_ORDER.map(key => (
                    <td key={key} style={s.planTd}>
                      {sub.plan === key ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: PLAN_COLORS[key] }}>✓ Current</span>
                      ) : key !== 'free_trial' ? (
                        <button style={{ ...s.tableUpgradeBtn, color: PLAN_COLORS[key], border: `1.5px solid ${PLAN_COLORS[key]}40` }}
                          onClick={() => setPayModal({ key, plan: plans[key] })}>
                          Select
                        </button>
                      ) : null}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Billing tab ───────────────────────────────────────────── */}
      {tab === 'billing' && (
        <div style={s.billingCard}>
          {sub.plan === 'free_trial' ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🆓</div>
              <div style={s.billingTitle}>You're on the Free Trial</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
                No payment information on file. Upgrade to a paid plan to access premium features.
              </div>
              <button style={{ ...s.planBtn, display: 'inline-block', width: 'auto', padding: '12px 28px', background: 'linear-gradient(135deg, #0D9488, #14B8A8)' }}
                onClick={() => setTab('plans')}>
                View Plans
              </button>
            </div>
          ) : (
            <div>
              <div style={s.billingTitle}>Billing Details</div>
              <div style={s.billingGrid}>
                <BillingRow label="Plan" value={currentPlan.name} />
                <BillingRow label="Status" value={sub.is_active ? 'Active' : sub.status} highlight={sub.is_active ? '#0D9488' : '#DC2626'} />
                <BillingRow label="Amount" value={`LKR ${Number(sub.amount_paid).toLocaleString()} / month`} />
                <BillingRow label="Expires" value={sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} />
                <BillingRow label="Days Remaining" value={`${sub.days_remaining} days`} />
                {sub.billing_name && <BillingRow label="Billing Name" value={sub.billing_name} />}
                {sub.billing_email && <BillingRow label="Billing Email" value={sub.billing_email} />}
                {sub.card_last4 && <BillingRow label="Card" value={`•••• •••• •••• ${sub.card_last4}`} />}
                {sub.transaction_ref && <BillingRow label="Transaction Ref" value={sub.transaction_ref} mono />}
              </div>
              {sub.is_active && sub.plan !== 'free_trial' && (
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
                  <button style={{ ...s.planBtn, background: 'linear-gradient(135deg, #0D9488, #14B8A8)', display: 'inline-block', width: 'auto', padding: '11px 24px' }}
                    onClick={() => setTab('plans')}>
                    Change Plan
                  </button>
                  <button style={{ ...s.planBtn, background: 'none', color: '#DC2626', border: '1.5px solid #FCA5A5', display: 'inline-block', width: 'auto', padding: '11px 24px', boxShadow: 'none' }}
                    onClick={() => setCancelModal(true)}>
                    Cancel Subscription
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Payment modal */}
      {payModal && (
        <PaymentModal
          plan={payModal.plan}
          planKey={payModal.key}
          onClose={() => setPayModal(null)}
        />
      )}

      {/* Cancel modal */}
      {cancelModal && (
        <CancelModal
          planName={currentPlan.name}
          onClose={() => setCancelModal(false)}
          onConfirm={handleCancel}
          loading={cancelLoading}
        />
      )}
    </div>
  );
}

function BillingRow({ label, value, highlight, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: highlight || 'var(--text)', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
    </div>
  );
}

const s = {
  page: {},
  spinner: { width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(13,148,136,.15)', borderTopColor: '#0D9488', animation: 'spinSlow .7s linear infinite' },

  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 14 },
  eyebrow:    { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  pageTitle:  { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: 0 },

  tabBtn:    { padding: '8px 18px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: 'all .15s' },
  tabActive: { background: 'linear-gradient(135deg, #0D9488, #0D9488)', color: '#fff', border: '1.5px solid transparent', boxShadow: '0 4px 12px rgba(13,148,136,.3)' },

  alert: { padding: '13px 18px', borderRadius: 12, border: '1px solid', fontSize: 14, fontWeight: 500, marginBottom: 20 },

  currentBanner: { background: 'var(--surface)', borderRadius: 16, padding: '18px 22px', border: '1px solid var(--border)', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.06)', flexWrap: 'wrap', gap: 12 },
  bannerLeft:    { display: 'flex', alignItems: 'center', gap: 14 },
  bannerPlan:    { display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 },
  bannerSub:     { fontSize: 13, color: 'var(--text-muted)' },
  planStatusBadge: { fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 },
  cancelLink:    { fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' },

  plansGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20, marginTop: 4 },
  planCard:   { background: 'var(--surface)', borderRadius: 18, padding: '24px 22px', border: '1px solid var(--border)', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,.06)' },
  popularBadge: { position: 'absolute', top: -12, right: 18, padding: '3px 12px', borderRadius: 20, color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '0.04em' },
  planIcon:   { fontSize: 28, marginBottom: 10 },
  planName:   { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, marginBottom: 4 },
  planTagline: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 },
  planPrice:  { fontSize: 26, fontWeight: 900, marginBottom: 18, letterSpacing: '-0.01em' },
  planPer:    { fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' },
  bulletList: { listStyle: 'none', margin: '0 0 20px', padding: 0, flex: 1 },
  bullet:     { fontSize: 13, color: 'var(--text)', marginBottom: 7, display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.45 },
  planBtn:    { width: '100%', padding: '12px 0', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'opacity .2s', textAlign: 'center' },
  currentBadge: { width: '100%', padding: '11px 0', borderRadius: 12, textAlign: 'center', fontWeight: 800, fontSize: 14 },

  tableWrap:     { background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)', padding: '0 4px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.06)' },
  compareTable:  { width: '100%', borderCollapse: 'collapse' },
  featureTh:     { padding: '14px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--surface2)', borderBottom: '2px solid var(--border)' },
  planTh:        { padding: '14px 16px', textAlign: 'center', fontSize: 13, fontWeight: 800, background: 'var(--surface2)', borderBottom: '2px solid var(--border)' },
  currentDot:    { fontSize: 10, fontWeight: 700, color: '#0D9488', marginTop: 3 },
  featureTd:     { padding: '10px 20px', fontSize: 13, color: 'var(--text)', borderBottom: '1px solid var(--border)', fontWeight: 500 },
  planTd:        { padding: '10px 16px', textAlign: 'center', fontSize: 13, borderBottom: '1px solid var(--border)' },
  tableUpgradeBtn: { padding: '5px 14px', borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },

  billingCard:   { background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)', padding: '28px 32px', boxShadow: '0 4px 20px rgba(0,0,0,.06)' },
  billingTitle:  { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 20 },
  billingGrid:   {},
};

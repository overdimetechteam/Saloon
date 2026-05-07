import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { c, shadow } from '../../styles/theme';

const EMPTY_FORM = {
  code: '', discount_type: 'percentage', discount_value: '',
  min_booking_value: '', valid_from: '', valid_until: '',
  max_uses: 100, is_active: true,
};

export default function OwnerPromotions() {
  const { salon } = useOwner();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    if (!salon) return;
    api.get(`/salons/${salon.id}/promotions/`).then(r => setPromos(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [salon]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(''); setMsg('');
    if (!form.code) return setError('Promo code is required.');
    if (!form.discount_value || isNaN(form.discount_value)) return setError('Discount value is required.');
    if (!form.valid_from || !form.valid_until) return setError('Both dates are required.');
    if (form.valid_from > form.valid_until) return setError('End date must be after start date.');
    setSubmitting(true);
    try {
      await api.post(`/salons/${salon.id}/promotions/`, {
        ...form,
        discount_value: Number(form.discount_value),
        min_booking_value: form.min_booking_value ? Number(form.min_booking_value) : null,
        max_uses: Number(form.max_uses),
      });
      setMsg('Promotion created!');
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error creating promotion.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (promo) => {
    try {
      await api.patch(`/salons/${salon.id}/promotions/${promo.id}/`, { is_active: !promo.is_active });
      load();
    } catch {}
  };

  const deletePromo = async (promo) => {
    if (!window.confirm(`Delete promo code "${promo.code}"?`)) return;
    try {
      await api.delete(`/salons/${salon.id}/promotions/${promo.id}/`);
      setMsg('Promotion deleted.');
      load();
    } catch (err) {
      setMsg('');
      setError(err.response?.data?.detail || 'Cannot delete this promotion.');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isExpired = p => p.valid_until < today;
  const isExhausted = p => p.times_used >= p.max_uses;

  return (
    <div>
      <div style={s.header} className="fade-up">
        <div>
          <div style={s.eyebrow}>Marketing</div>
          <h2 style={s.title}>Promotions</h2>
          <p style={s.sub}>Create discount codes for your clients.</p>
        </div>
        <button style={s.addBtn} onClick={() => { setShowForm(v => !v); setError(''); }}>
          {showForm ? '✕ Cancel' : '+ New Promo Code'}
        </button>
      </div>

      {error && <div style={s.alert}>{error}</div>}
      {msg && <div style={s.success}>{msg}</div>}

      {showForm && (
        <div style={s.formCard} className="fade-up">
          <h4 style={s.formTitle}>New Promotion</h4>
          <div style={s.formGrid}>
            <div style={s.field}>
              <label style={s.label}>Promo Code *</label>
              <input style={s.input} placeholder="e.g. SUMMER20" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Discount Type *</label>
              <select style={s.input} value={form.discount_type} onChange={e => set('discount_type', e.target.value)}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (LKR)</option>
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Discount Value *</label>
              <input style={s.input} type="number" min="0" step="0.01" placeholder={form.discount_type === 'percentage' ? '20' : '500'} value={form.discount_value} onChange={e => set('discount_value', e.target.value)} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Min. Booking Value (LKR)</label>
              <input style={s.input} type="number" min="0" step="0.01" placeholder="Optional" value={form.min_booking_value} onChange={e => set('min_booking_value', e.target.value)} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Valid From *</label>
              <input style={s.input} type="date" value={form.valid_from} onChange={e => set('valid_from', e.target.value)} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Valid Until *</label>
              <input style={s.input} type="date" value={form.valid_until} onChange={e => set('valid_until', e.target.value)} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Max Uses</label>
              <input style={s.input} type="number" min="1" value={form.max_uses} onChange={e => set('max_uses', e.target.value)} />
            </div>
          </div>
          <div style={s.formFooter}>
            <button style={{ ...s.submitBtn, opacity: submitting ? .7 : 1 }} onClick={submit} disabled={submitting}>
              {submitting ? 'Creating…' : '✓ Create Promotion'}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div style={s.loadStack}>
          {[1,2,3].map(i => <div key={i} style={s.skeleton} className="shimmer" />)}
        </div>
      )}

      {!loading && promos.length === 0 && (
        <div style={s.empty} className="scale-in">
          <div style={{ fontSize: 40, marginBottom: 12, opacity: .5 }}>⬡</div>
          <h3 style={s.emptyTitle}>No promotions yet</h3>
          <p style={{ color: c.textMuted, fontSize: 14 }}>Create your first discount code to attract clients.</p>
        </div>
      )}

      <div style={s.promoGrid}>
        {promos.map(p => {
          const expired = isExpired(p);
          const exhausted = isExhausted(p);
          const statusColor = !p.is_active ? '#6B7280' : expired ? '#DC2626' : exhausted ? '#D97706' : '#059669';
          const statusLabel = !p.is_active ? 'Disabled' : expired ? 'Expired' : exhausted ? 'Used Up' : 'Active';
          const statusBg = !p.is_active ? '#F3F4F6' : expired ? '#FEF2F2' : exhausted ? '#FFFBEB' : '#ECFDF5';
          const usePct = Math.min(100, Math.round((p.times_used / p.max_uses) * 100));
          return (
            <div key={p.id} style={{ ...s.promoCard, opacity: (!p.is_active || expired) ? .75 : 1 }} className="lift-sm">
              <div style={s.promoTop}>
                <div style={s.codeWrap}>
                  <span style={s.codeText}>{p.code}</span>
                  <span style={{ ...s.statusBadge, color: statusColor, background: statusBg }}>
                    {statusLabel}
                  </span>
                </div>
                <div style={s.discountBig}>
                  {p.discount_type === 'percentage'
                    ? `${Number(p.discount_value).toFixed(0)}% OFF`
                    : `LKR ${Number(p.discount_value).toFixed(0)} OFF`}
                </div>
              </div>

              <div style={s.promoMeta}>
                {p.min_booking_value && <div style={s.metaRow}>Min. booking: LKR {Number(p.min_booking_value).toFixed(0)}</div>}
                <div style={s.metaRow}>Valid: {p.valid_from} → {p.valid_until}</div>
              </div>

              <div style={s.usageSection}>
                <div style={s.usageLabel}>
                  <span>Usage</span>
                  <span style={{ fontWeight: 700, color: c.text }}>{p.times_used} / {p.max_uses}</span>
                </div>
                <div style={s.progressBg}>
                  <div style={{ ...s.progressFill, width: `${usePct}%`, background: usePct >= 90 ? '#EF4444' : usePct >= 60 ? '#F59E0B' : '#7C3AED' }} />
                </div>
              </div>

              <div style={s.promoActions}>
                <button
                  style={{ ...s.actionBtn, color: p.is_active ? c.error : c.success }}
                  onClick={() => toggleActive(p)}
                >
                  {p.is_active ? '⏸ Disable' : '▶ Enable'}
                </button>
                {p.times_used === 0 && (
                  <button style={{ ...s.actionBtn, color: c.error }} onClick={() => deletePromo(p)}>
                    🗑 Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: '#A78BFA', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 5 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: c.text, margin: '0 0 4px' },
  sub: { color: c.textMuted, fontSize: 13, margin: 0 },
  addBtn: {
    padding: '10px 20px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
    color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
    fontWeight: 700, fontSize: 13, boxShadow: '0 4px 14px rgba(124,58,237,.3)',
    flexShrink: 0,
  },
  alert: { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.error, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  success: { background: c.successBg, border: `1px solid ${c.successBorder}`, color: c.success, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },

  formCard: { background: c.surface, borderRadius: 16, padding: 24, boxShadow: shadow.md, border: `1px solid ${c.border}`, marginBottom: 24 },
  formTitle: { fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 18, marginTop: 0 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 8,
    fontSize: 13, color: c.text, background: c.bg, fontFamily: 'inherit', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  },
  formFooter: { display: 'flex', justifyContent: 'flex-end' },
  submitBtn: {
    padding: '10px 24px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
    color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer',
    fontWeight: 700, fontSize: 13, boxShadow: '0 4px 14px rgba(124,58,237,.3)',
  },

  loadStack: { display: 'flex', flexDirection: 'column', gap: 12 },
  skeleton: { height: 160, borderRadius: 14 },

  empty: {
    background: c.surface, borderRadius: 20, padding: '60px 40px',
    textAlign: 'center', border: `1px solid ${c.border}`,
  },
  emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: 20, color: c.text, marginBottom: 8 },

  promoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  promoCard: {
    background: c.surface, borderRadius: 16, padding: 20,
    border: `1px solid ${c.border}`, boxShadow: shadow.sm,
    display: 'flex', flexDirection: 'column', gap: 14,
    transition: 'transform .2s ease, box-shadow .2s ease',
  },
  promoTop: {},
  codeWrap: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  codeText: {
    fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: c.text,
    letterSpacing: '0.08em',
  },
  statusBadge: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 },
  discountBig: {
    fontSize: 26, fontWeight: 900, letterSpacing: '-0.01em',
    background: 'linear-gradient(135deg, #7C3AED, #0D9488)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  promoMeta: { display: 'flex', flexDirection: 'column', gap: 4 },
  metaRow: { fontSize: 12, color: c.textMuted },
  usageSection: {},
  usageLabel: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: c.textMuted, marginBottom: 5 },
  progressBg: { height: 6, background: c.bg, borderRadius: 3, overflow: 'hidden', border: `1px solid ${c.border}` },
  progressFill: { height: '100%', borderRadius: 3, transition: 'width .3s ease' },
  promoActions: { display: 'flex', gap: 8, paddingTop: 4, borderTop: `1px solid ${c.border}`, marginTop: 2 },
  actionBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '4px 0' },
};

import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';

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

      {error && <div style={s.alertErr}>{error}</div>}
      {msg && <div style={s.alertOk}>{msg}</div>}

      {showForm && (
        <div style={s.formCard} className="fade-up">
          <div style={s.formTitle}>New Promotion</div>
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
          <div style={s.emptyOrb}>🏷</div>
          <h3 style={s.emptyTitle}>No promotions yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Create your first discount code to attract clients.</p>
        </div>
      )}

      <div style={s.promoGrid}>
        {promos.map(p => {
          const expired = isExpired(p);
          const exhausted = isExhausted(p);
          const statusColor = !p.is_active ? '#6B7280' : expired ? '#DC2626' : exhausted ? '#D97706' : '#059669';
          const statusLabel = !p.is_active ? 'Disabled' : expired ? 'Expired' : exhausted ? 'Used Up' : 'Active';
          const statusBg = !p.is_active ? 'var(--surface2)' : expired ? '#FEF2F2' : exhausted ? '#FFFBEB' : '#ECFDF5';
          const usePct = Math.min(100, Math.round((p.times_used / p.max_uses) * 100));
          return (
            <div key={p.id} style={{ ...s.promoCard, opacity: (!p.is_active || expired) ? .75 : 1 }} className="lift-sm">
              <div style={s.promoTop}>
                <div style={s.codeWrap}>
                  <span style={s.codeText}>{p.code}</span>
                  <span style={{ ...s.statusBadge, color: statusColor, background: statusBg, border: `1px solid ${statusColor}28` }}>
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

              <div>
                <div style={s.usageLabel}>
                  <span>Usage</span>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{p.times_used} / {p.max_uses}</span>
                </div>
                <div style={s.progressBg}>
                  <div style={{ ...s.progressFill, width: `${usePct}%`, background: usePct >= 90 ? '#EF4444' : usePct >= 60 ? '#F59E0B' : '#7C3AED' }} />
                </div>
              </div>

              <div style={s.promoActions}>
                <button
                  style={{ ...s.actionBtn, color: p.is_active ? '#DC2626' : '#059669' }}
                  onClick={() => toggleActive(p)}
                >
                  {p.is_active ? '⏸ Disable' : '▶ Enable'}
                </button>
                {p.times_used === 0 && (
                  <button style={{ ...s.actionBtn, color: '#DC2626' }} onClick={() => deletePromo(p)}>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26 },
  eyebrow: {
    fontSize: 10, fontWeight: 700, color: 'var(--brand-label)',
    letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6,
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em',
  },
  sub: { color: 'var(--text-muted)', fontSize: 13, margin: 0 },
  addBtn: {
    padding: '11px 22px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #EC4899 100%)',
    color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer',
    fontWeight: 700, fontSize: 13,
    boxShadow: '0 6px 18px rgba(124,58,237,.35)',
    flexShrink: 0,
  },
  alertErr: {
    background: '#FEF2F2', border: '1px solid #FCA5A5',
    color: '#DC2626', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18,
  },
  alertOk: {
    background: '#ECFDF5', border: '1px solid #6EE7B7',
    color: '#059669', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18,
  },

  formCard: {
    background: 'var(--surface)', borderRadius: 20, padding: 26,
    boxShadow: '0 4px 24px rgba(124,58,237,.08)',
    border: '1px solid var(--border)', marginBottom: 26,
  },
  formTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.01em',
  },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: {
    fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  input: {
    padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 13, color: 'var(--text)', background: 'var(--input-bg)',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
    width: '100%', boxSizing: 'border-box',
  },
  formFooter: { display: 'flex', justifyContent: 'flex-end' },
  submitBtn: {
    padding: '10px 26px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #EC4899 100%)',
    color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer',
    fontWeight: 700, fontSize: 13,
    boxShadow: '0 4px 14px rgba(124,58,237,.35)',
    fontFamily: "'DM Sans', sans-serif",
  },

  loadStack: { display: 'flex', flexDirection: 'column', gap: 12 },
  skeleton: { height: 180, borderRadius: 16 },

  empty: {
    background: 'var(--surface)', borderRadius: 22, padding: '64px 40px',
    textAlign: 'center', border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(124,58,237,.06)',
  },
  emptyOrb: { fontSize: 36, marginBottom: 16, display: 'block' },
  emptyTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22, color: 'var(--text)', marginBottom: 8,
  },

  promoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 },
  promoCard: {
    background: 'var(--surface)', borderRadius: 20, padding: 22,
    border: '1px solid var(--border)',
    boxShadow: '0 4px 16px rgba(124,58,237,.06)',
    display: 'flex', flexDirection: 'column', gap: 16,
    transition: 'transform .2s ease, box-shadow .2s ease',
  },
  promoTop: {},
  codeWrap: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  codeText: {
    fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: 'var(--text)',
    letterSpacing: '0.08em',
  },
  statusBadge: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 },
  discountBig: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em',
    background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  promoMeta: { display: 'flex', flexDirection: 'column', gap: 4 },
  metaRow: { fontSize: 12, color: 'var(--text-muted)' },
  usageLabel: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 },
  progressBg: {
    height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden',
    border: '1px solid var(--border)',
  },
  progressFill: { height: '100%', borderRadius: 3, transition: 'width .3s ease' },
  promoActions: {
    display: 'flex', gap: 8, paddingTop: 6,
    borderTop: '1px solid var(--border)',
  },
  actionBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 600, padding: '4px 0',
    fontFamily: "'DM Sans', sans-serif",
  },
};
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { c } from '../styles/theme';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export default function RegisterSalon() {
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState({
    name: '', business_reg_number: '',
    address_street: '', address_city: '', address_district: '', address_postal: '',
    contact_number: '', email: '',
    full_name: '', phone: '', password: '',
    operating_hours: Object.fromEntries(DAYS.map(d => [d, { open: '09:00', close: '17:00', closed: false }])),
  });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const f = k => e => setForm({ ...form, [k]: e.target.value });
  const setHours = (day, field, val) => setForm({
    ...form,
    operating_hours: { ...form.operating_hours, [day]: { ...form.operating_hours[day], [field]: val } },
  });

  const handle = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form };
      const hours = {};
      DAYS.forEach(d => { if (!form.operating_hours[d].closed) hours[d] = { open: form.operating_hours[d].open, close: form.operating_hours[d].close }; });
      payload.operating_hours = hours;
      await api.post('/salons/register/', payload);
      setSuccess(true);
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'string' ? data : JSON.stringify(data));
    } finally { setLoading(false); }
  };

  if (success) return (
    <div style={s.page}>
      <div style={s.card} className="scale-in">
        <div style={s.successOrb}>✦</div>
        <h2 style={s.successTitle}>Application Submitted!</h2>
        <p style={s.successSub}>
          Your salon has been registered and is pending admin approval.<br />
          You'll be notified once approved.
        </p>
        <Link to="/login" style={s.primaryBtn}>Go to Login</Link>
      </div>
    </div>
  );

  const STEP_LABELS = ['Salon Details', 'Location & Owner', 'Operating Hours'];

  return (
    <div style={s.page}>
      <div style={s.card} className="fade-up">
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerMark}>✦</div>
          <h1 style={s.title}>Register Your Salon</h1>
          <p style={s.sub}>Step {step} of 3 — {STEP_LABELS[step - 1]}</p>
          <div style={s.stepBar}>
            {[1,2,3].map(n => (
              <div key={n} style={n <= step ? s.stepActive : s.step}>
                {n < step ? '✓' : n}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={s.alert}>
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={step < 3 ? e => { e.preventDefault(); setStep(p => p + 1); } : handle}>
          {step === 1 && (
            <div style={s.fields}>
              <h4 style={s.sectionTitle}>Salon Details</h4>
              <div style={s.field}>
                <label style={s.label}>Salon Name</label>
                <input style={s.input} placeholder="Glam Studio" value={form.name} onChange={f('name')} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Business Registration Number</label>
                <input style={s.input} placeholder="BR-12345" value={form.business_reg_number} onChange={f('business_reg_number')} required />
              </div>
              <div style={s.row2}>
                <div style={s.field}>
                  <label style={s.label}>Contact Number</label>
                  <input style={s.input} value={form.contact_number} onChange={f('contact_number')} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Salon Email</label>
                  <input style={s.input} type="email" value={form.email} onChange={f('email')} required />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={s.fields}>
              <h4 style={s.sectionTitle}>Location</h4>
              <div style={s.field}>
                <label style={s.label}>Street Address</label>
                <input style={s.input} placeholder="123 Main Street" value={form.address_street} onChange={f('address_street')} required />
              </div>
              <div style={s.row2}>
                <div style={s.field}>
                  <label style={s.label}>City</label>
                  <input style={s.input} value={form.address_city} onChange={f('address_city')} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>District</label>
                  <input style={s.input} value={form.address_district} onChange={f('address_district')} required />
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Postal Code</label>
                <input style={s.input} value={form.address_postal} onChange={f('address_postal')} required />
              </div>
              <h4 style={{ ...s.sectionTitle, marginTop: 28 }}>Owner Account</h4>
              <div style={s.field}>
                <label style={s.label}>Your Full Name</label>
                <input style={s.input} value={form.full_name} onChange={f('full_name')} required />
              </div>
              <div style={s.row2}>
                <div style={s.field}>
                  <label style={s.label}>Your Phone</label>
                  <input style={s.input} value={form.phone} onChange={f('phone')} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Password</label>
                  <input style={s.input} type="password" value={form.password} onChange={f('password')} required />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={s.fields}>
              <h4 style={s.sectionTitle}>Operating Hours</h4>
              {DAYS.map(day => (
                <div key={day} style={s.dayRow}>
                  <span style={s.dayName}>{day.slice(0, 3).toUpperCase()}</span>
                  <label style={s.checkLabel}>
                    <input
                      type="checkbox"
                      checked={form.operating_hours[day].closed}
                      onChange={e => setHours(day, 'closed', e.target.checked)}
                    />
                    Closed
                  </label>
                  {!form.operating_hours[day].closed && (
                    <>
                      <input type="time" style={s.timeInput} value={form.operating_hours[day].open} onChange={e => setHours(day, 'open', e.target.value)} />
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>–</span>
                      <input type="time" style={s.timeInput} value={form.operating_hours[day].close} onChange={e => setHours(day, 'close', e.target.value)} />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={s.actions}>
            {step > 1 && (
              <button type="button" style={s.backBtn} onClick={() => setStep(p => p - 1)}>← Back</button>
            )}
            <button type="submit" style={{ ...s.nextBtn, opacity: loading ? 0.75 : 1 }} disabled={loading}>
              {step < 3 ? 'Continue →' : loading ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </form>

        <p style={s.footer}>
          Already have an account? <Link to="/login" style={s.footerLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(145deg, #F5F2FF 0%, var(--bg) 60%)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '48px 20px',
  },
  card: {
    background: 'var(--surface)', borderRadius: 22, padding: '44px 40px',
    width: '100%', maxWidth: 560,
    boxShadow: '0 24px 56px rgba(124,58,237,.12), 0 8px 20px rgba(0,0,0,.06)',
    border: '1px solid var(--border)',
  },
  header: { textAlign: 'center', marginBottom: 32 },
  headerMark: {
    fontSize: 28, color: '#EC4899', marginBottom: 14,
    filter: 'drop-shadow(0 0 10px rgba(236,72,153,.4))',
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 34, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em',
  },
  sub: { color: 'var(--text-muted)', fontSize: 14, marginTop: 6 },
  stepBar: { display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20 },
  step: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'var(--surface2)', border: '1.5px solid var(--border)',
    color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
  },
  stepActive: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
    boxShadow: '0 4px 14px rgba(124,58,237,.4)',
  },
  alert: {
    background: '#FEF2F2', border: '1px solid #FCA5A5',
    color: '#DC2626', borderRadius: 12, padding: '12px 16px',
    fontSize: 13, marginBottom: 20,
    display: 'flex', alignItems: 'center', gap: 8,
  },

  fields: { display: 'flex', flexDirection: 'column', gap: 16 },
  sectionTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 17, fontWeight: 700, color: 'var(--text-sub)', margin: 0,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', letterSpacing: '0.01em' },
  input: {
    padding: '12px 15px', border: '1.5px solid var(--border)', borderRadius: 11,
    fontSize: 14, background: 'var(--input-bg)', outline: 'none',
    width: '100%', boxSizing: 'border-box', color: 'var(--text)',
    fontFamily: "'DM Sans', sans-serif",
  },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },

  dayRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 0', borderBottom: '1px solid var(--border)',
  },
  dayName: { width: 38, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' },
  checkLabel: { fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', width: 72 },
  timeInput: {
    padding: '7px 11px', border: '1.5px solid var(--border)',
    borderRadius: 9, fontSize: 13, color: 'var(--text)',
    background: 'var(--input-bg)', fontFamily: "'DM Sans', sans-serif",
  },

  actions: { display: 'flex', gap: 12, marginTop: 28 },
  backBtn: {
    flex: 1, padding: '13px', background: 'transparent',
    border: '1.5px solid var(--border)', borderRadius: 12,
    fontSize: 14, fontWeight: 500, cursor: 'pointer', color: 'var(--text-sub)',
    fontFamily: "'DM Sans', sans-serif",
  },
  nextBtn: {
    flex: 2, padding: '13px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #EC4899 100%)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(124,58,237,.35), inset 0 1px 0 rgba(255,255,255,.15)',
    fontFamily: "'DM Sans', sans-serif",
  },
  primaryBtn: {
    display: 'inline-block', padding: '13px 32px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #EC4899 100%)',
    color: '#fff', borderRadius: 12, textDecoration: 'none',
    fontWeight: 600, fontSize: 15,
    boxShadow: '0 6px 20px rgba(124,58,237,.35)',
  },
  successOrb: {
    fontSize: 36, color: '#EC4899', textAlign: 'center', marginBottom: 18,
    filter: 'drop-shadow(0 0 14px rgba(236,72,153,.5))',
  },
  successTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 32, fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: 12,
  },
  successSub: { color: 'var(--text-muted)', fontSize: 15, textAlign: 'center', lineHeight: 1.7, marginBottom: 28 },
  footer: { marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' },
  footerLink: { color: '#7C3AED', fontWeight: 600 },
};
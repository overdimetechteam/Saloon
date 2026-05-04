import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { c, shadow } from '../styles/theme';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export default function RegisterSalon() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', business_reg_number: '',
    address_street: '', address_city: '', address_district: '', address_postal: '',
    contact_number: '', email: '',
    full_name: '', phone: '', password: '',
    operating_hours: Object.fromEntries(DAYS.map(d => [d, { open: '09:00', close: '17:00', closed: false }])),
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const f = k => e => setForm({ ...form, [k]: e.target.value });
  const setHours = (day, field, val) => setForm({ ...form, operating_hours: { ...form.operating_hours, [day]: { ...form.operating_hours[day], [field]: val } } });

  const handle = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form };
      // remove closed days from operating_hours
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
      <div style={{ ...s.card, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: c.text, marginBottom: 8 }}>Application Submitted!</h2>
        <p style={{ color: c.textMuted, marginBottom: 24 }}>Your salon has been registered and is pending admin approval. You'll be able to log in once approved.</p>
        <Link to="/login" style={s.primaryBtn}>Go to Login</Link>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.logo}>🏪</div>
          <h1 style={s.title}>Register Your Salon</h1>
          <p style={s.sub}>Step {step} of 3</p>
          <div style={s.stepBar}>
            {[1,2,3].map(n => <div key={n} style={{ ...s.step, ...(n <= step ? s.stepActive : {}) }}>{n}</div>)}
          </div>
        </div>

        {error && <div style={s.alert}>{error}</div>}

        <form onSubmit={step < 3 ? e => { e.preventDefault(); setStep(s => s + 1); } : handle}>
          {step === 1 && (
            <>
              <h4 style={s.sectionTitle}>Salon Details</h4>
              <label style={s.label}>Salon Name</label>
              <input style={s.input} placeholder="Glam Studio" value={form.name} onChange={f('name')} required />
              <label style={s.label}>Business Registration Number</label>
              <input style={s.input} placeholder="BR-12345" value={form.business_reg_number} onChange={f('business_reg_number')} required />
              <div style={s.row2}>
                <div style={s.col}>
                  <label style={s.label}>Contact Number</label>
                  <input style={s.input} value={form.contact_number} onChange={f('contact_number')} required />
                </div>
                <div style={s.col}>
                  <label style={s.label}>Salon Email</label>
                  <input style={s.input} type="email" value={form.email} onChange={f('email')} required />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h4 style={s.sectionTitle}>Location</h4>
              <label style={s.label}>Street Address</label>
              <input style={s.input} placeholder="123 Main Street" value={form.address_street} onChange={f('address_street')} required />
              <div style={s.row2}>
                <div style={s.col}>
                  <label style={s.label}>City</label>
                  <input style={s.input} value={form.address_city} onChange={f('address_city')} required />
                </div>
                <div style={s.col}>
                  <label style={s.label}>District</label>
                  <input style={s.input} value={form.address_district} onChange={f('address_district')} required />
                </div>
              </div>
              <label style={s.label}>Postal Code</label>
              <input style={s.input} value={form.address_postal} onChange={f('address_postal')} required />
              <h4 style={{ ...s.sectionTitle, marginTop: 20 }}>Owner Account</h4>
              <label style={s.label}>Your Full Name</label>
              <input style={s.input} value={form.full_name} onChange={f('full_name')} required />
              <div style={s.row2}>
                <div style={s.col}>
                  <label style={s.label}>Your Phone</label>
                  <input style={s.input} value={form.phone} onChange={f('phone')} />
                </div>
                <div style={s.col}>
                  <label style={s.label}>Password</label>
                  <input style={s.input} type="password" value={form.password} onChange={f('password')} required />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h4 style={s.sectionTitle}>Operating Hours</h4>
              {DAYS.map(day => (
                <div key={day} style={s.dayRow}>
                  <span style={s.dayName}>{day.slice(0,3).toUpperCase()}</span>
                  <label style={s.checkLabel}>
                    <input type="checkbox" checked={form.operating_hours[day].closed}
                      onChange={e => setHours(day, 'closed', e.target.checked)} />
                    Closed
                  </label>
                  {!form.operating_hours[day].closed && (
                    <>
                      <input type="time" style={s.timeInput} value={form.operating_hours[day].open} onChange={e => setHours(day, 'open', e.target.value)} />
                      <span style={{ color: c.textMuted }}>–</span>
                      <input type="time" style={s.timeInput} value={form.operating_hours[day].close} onChange={e => setHours(day, 'close', e.target.value)} />
                    </>
                  )}
                </div>
              ))}
            </>
          )}

          <div style={s.actions}>
            {step > 1 && <button type="button" style={s.backBtn} onClick={() => setStep(s => s - 1)}>← Back</button>}
            <button type="submit" style={{ ...s.nextBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {step < 3 ? 'Next →' : loading ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </form>

        <p style={s.footer}>Already have an account? <Link to="/login" style={s.link}>Sign in</Link></p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: `linear-gradient(135deg, ${c.primarySoft} 0%, #F9FAFB 50%)`, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px' },
  card: { background: c.surface, borderRadius: 16, padding: 40, width: '100%', maxWidth: 540, boxShadow: shadow.xl },
  header: { textAlign: 'center', marginBottom: 24 },
  logo: { fontSize: 36, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 700, color: c.text, margin: 0 },
  sub: { color: c.textMuted, fontSize: 13, marginTop: 4 },
  stepBar: { display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 },
  step: { width: 28, height: 28, borderRadius: '50%', background: c.border, color: c.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 },
  stepActive: { background: c.primary, color: '#fff' },
  alert: { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.error, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: c.textSub, marginBottom: 12, marginTop: 4 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: c.textSub, marginBottom: 4, marginTop: 10 },
  input: { padding: '10px 13px', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 14, background: c.inputBg, outline: 'none', width: '100%', boxSizing: 'border-box' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  col: { display: 'flex', flexDirection: 'column' },
  dayRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${c.border}` },
  dayName: { width: 36, fontSize: 12, fontWeight: 700, color: c.textMuted },
  checkLabel: { fontSize: 13, color: c.textMuted, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', width: 70 },
  timeInput: { padding: '6px 10px', border: `1px solid ${c.border}`, borderRadius: 6, fontSize: 13 },
  actions: { display: 'flex', gap: 10, marginTop: 24 },
  backBtn: { flex: 1, padding: 12, background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: c.textSub },
  nextBtn: { flex: 2, padding: 12, background: c.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  primaryBtn: { padding: '12px 28px', background: c.primary, color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600 },
  footer: { marginTop: 16, textAlign: 'center', fontSize: 13, color: c.textMuted },
  link: { color: c.primary, fontWeight: 600, textDecoration: 'none' },
};

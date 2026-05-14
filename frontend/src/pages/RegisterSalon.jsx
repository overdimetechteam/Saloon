import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useBreakpoint } from '../hooks/useMobile';

const DAYS       = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const CATEGORIES = ['Hair', 'Nails', 'Skin', 'Makeup'];
const EMPTY_SVC  = { name: '', category: 'Hair', price: '', duration: '', show_price: true };

export default function RegisterSalon() {
  const { isMobile } = useBreakpoint();
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState({
    name: '', business_reg_number: '',
    address_street: '', address_city: '', address_district: '', address_postal: '',
    contact_number: '', email: '',
    full_name: '', phone: '', password: '',
    operating_hours: Object.fromEntries(DAYS.map(d => [d, { open: '09:00', close: '17:00', closed: false }])),
  });
  const [services, setServices] = useState([{ ...EMPTY_SVC }]);
  const [offer, setOffer] = useState({ title: '', description: '', discount_type: 'percentage', discount_value: '', start_date: '', end_date: '', note: '', is_active: true });
  const [hasOffer, setHasOffer]   = useState(false);
  const [cosmeticsEnabled, setCosmeticsEnabled] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [loading, setLoading]     = useState(false);

  const f = k => e => setForm({ ...form, [k]: e.target.value });
  const setHours = (day, field, val) => setForm({
    ...form,
    operating_hours: { ...form.operating_hours, [day]: { ...form.operating_hours[day], [field]: val } },
  });
  const offerF = k => e => setOffer(o => ({ ...o, [k]: e.target.value }));

  const addService = () => setServices(p => [...p, { ...EMPTY_SVC }]);
  const removeService = i => setServices(p => p.filter((_, idx) => idx !== i));
  const updateService = (i, k, v) => setServices(p => p.map((s, idx) => idx === i ? { ...s, [k]: v } : s));

  const handle = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form, cosmetics_enabled: cosmeticsEnabled };
      const hours = {};
      DAYS.forEach(d => { if (!form.operating_hours[d].closed) hours[d] = { open: form.operating_hours[d].open, close: form.operating_hours[d].close }; });
      payload.operating_hours = hours;

      const validServices = services.filter(s => s.name.trim() && s.price && s.duration);
      if (validServices.length > 0) payload.initial_services = validServices.map(s => ({ name: s.name.trim(), category: s.category, price: Number(s.price), duration: Number(s.duration) }));

      if (hasOffer && offer.title && offer.start_date && offer.end_date && offer.discount_value) {
        payload.initial_offer = { ...offer, discount_value: Number(offer.discount_value) };
      }

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

  const STEP_LABELS = ['Salon Details', 'Location & Owner', 'Operating Hours', 'Services & Offers'];
  const TOTAL_STEPS = 4;

  const advance = e => { e.preventDefault(); setStep(p => p + 1); };

  return (
    <div style={{ ...s.page, padding: isMobile ? '24px 12px 48px' : '48px 20px' }}>
      <div style={{ ...s.card, padding: isMobile ? '28px 20px' : '44px 40px' }} className="fade-up">
        <div style={s.header}>
          <div style={s.headerMark}>✦</div>
          <h1 style={{ ...s.title, fontSize: isMobile ? 26 : 34 }}>Register Your Salon</h1>
          <p style={s.sub}>Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}</p>
          <div style={s.stepBar}>
            {[1,2,3,4].map(n => (
              <div key={n} style={n <= step ? s.stepActive : s.step}>
                {n < step ? '✓' : n}
              </div>
            ))}
          </div>
        </div>

        {error && <div style={s.alert}><span>⚠</span> {error}</div>}

        <form onSubmit={step < TOTAL_STEPS ? advance : handle}>
          {/* Step 1 — Salon Details */}
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

          {/* Step 2 — Location & Owner */}
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

          {/* Step 3 — Operating Hours */}
          {step === 3 && (
            <div style={s.fields}>
              <h4 style={s.sectionTitle}>Operating Hours</h4>
              {DAYS.map(day => (
                <div key={day} style={s.dayRow}>
                  <span style={s.dayName}>{day.slice(0, 3).toUpperCase()}</span>
                  <label style={s.checkLabel}>
                    <input type="checkbox" checked={form.operating_hours[day].closed} onChange={e => setHours(day, 'closed', e.target.checked)} />
                    Closed
                  </label>
                  {!form.operating_hours[day].closed && (
                    <>
                      <input type="time" style={s.timeInput} value={form.operating_hours[day].open}  onChange={e => setHours(day, 'open',  e.target.value)} />
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>–</span>
                      <input type="time" style={s.timeInput} value={form.operating_hours[day].close} onChange={e => setHours(day, 'close', e.target.value)} />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 4 — Services & Opening Offer */}
          {step === 4 && (
            <div style={s.fields}>

              {/* Cosmetics Section Toggle */}
              <div style={s.step4Block}>
                <div style={s.offerToggleRow}>
                  <div>
                    <h4 style={{ ...s.sectionTitle, margin: 0 }}>Cosmetics Section</h4>
                    <p style={{ ...s.hint, margin: '4px 0 0' }}>Enable if your salon sells beauty & cosmetic products.</p>
                  </div>
                  <button type="button" style={{ ...s.toggleBtn, ...(cosmeticsEnabled ? s.toggleOn : s.toggleOff) }} onClick={() => setCosmeticsEnabled(o => !o)}>
                    {cosmeticsEnabled ? '● Enabled' : '○ Disabled'}
                  </button>
                </div>
                {cosmeticsEnabled && (
                  <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(236,72,153,.07)', border: '1px solid rgba(236,72,153,.2)', fontSize: 13, color: '#9D174D' }}>
                    ✿ Clients will be able to browse your cosmetics products from your salon page.
                  </div>
                )}
              </div>

              {/* Services */}
              <div style={s.step4Block}>
                <h4 style={s.sectionTitle}>Initial Services <span style={s.optTag}>optional</span></h4>
                <p style={s.hint}>Add the services you'll offer. You can always add more later.</p>
                {services.map((svc, i) => (
                  <div key={i} style={s.svcRow}>
                    <div style={{ ...s.row2, flex: 1 }}>
                      <div style={s.field}>
                        <label style={s.label}>Service Name</label>
                        <input style={s.input} placeholder="e.g. Hair Colour" value={svc.name} onChange={e => updateService(i, 'name', e.target.value)} />
                      </div>
                      <div style={s.field}>
                        <label style={s.label}>Category</label>
                        <select style={s.input} value={svc.category} onChange={e => updateService(i, 'category', e.target.value)}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ ...s.row2, flex: 1 }}>
                      <div style={s.field}>
                        <label style={s.label}>Price (LKR)</label>
                        <input style={s.input} type="number" min="0" placeholder="1500" value={svc.price} onChange={e => updateService(i, 'price', e.target.value)} />
                      </div>
                      <div style={s.field}>
                        <label style={s.label}>Duration (min)</label>
                        <input style={s.input} type="number" min="1" placeholder="60" value={svc.duration} onChange={e => updateService(i, 'duration', e.target.value)} />
                      </div>
                    </div>
                    {services.length > 1 && (
                      <button type="button" style={s.removeBtn} onClick={() => removeService(i)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" style={s.addSvcBtn} onClick={addService}>+ Add Another Service</button>
              </div>

              {/* Opening Offer */}
              <div style={s.step4Block}>
                <div style={s.offerToggleRow}>
                  <h4 style={{ ...s.sectionTitle, margin: 0 }}>Opening Offer <span style={s.optTag}>optional</span></h4>
                  <button type="button" style={{ ...s.toggleBtn, ...(hasOffer ? s.toggleOn : s.toggleOff) }} onClick={() => setHasOffer(o => !o)}>
                    {hasOffer ? '● Include' : '○ Skip'}
                  </button>
                </div>
                {hasOffer && (
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <p style={s.hint}>Create a launch offer to attract your first clients.</p>
                    <div style={s.row2}>
                      <div style={s.field}>
                        <label style={s.label}>Offer Title *</label>
                        <input style={s.input} placeholder="Grand Opening Deal" value={offer.title} onChange={offerF('title')} />
                      </div>
                      <div style={s.field}>
                        <label style={s.label}>Discount Type</label>
                        <select style={s.input} value={offer.discount_type} onChange={offerF('discount_type')}>
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed (LKR)</option>
                        </select>
                      </div>
                    </div>
                    <div style={s.row2}>
                      <div style={s.field}>
                        <label style={s.label}>Discount Value *</label>
                        <input style={s.input} type="number" min="0" placeholder={offer.discount_type === 'percentage' ? '20' : '500'} value={offer.discount_value} onChange={offerF('discount_value')} />
                      </div>
                      <div style={s.field}>
                        <label style={s.label}>Start Date *</label>
                        <input style={s.input} type="date" value={offer.start_date} onChange={offerF('start_date')} />
                      </div>
                    </div>
                    <div style={s.row2}>
                      <div style={s.field}>
                        <label style={s.label}>End Date *</label>
                        <input style={s.input} type="date" value={offer.end_date} onChange={offerF('end_date')} />
                      </div>
                      <div style={s.field}>
                        <label style={s.label}>Description</label>
                        <input style={s.input} placeholder="Brief offer description" value={offer.description} onChange={offerF('description')} />
                      </div>
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Note (e.g. "Starting onwards from [date]")</label>
                      <input style={s.input} placeholder="Any fine print or special message" value={offer.note} onChange={offerF('note')} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={s.actions}>
            {step > 1 && (
              <button type="button" style={s.backBtn} onClick={() => setStep(p => p - 1)}>← Back</button>
            )}
            <button type="submit" style={{ ...s.nextBtn, opacity: loading ? 0.75 : 1 }} disabled={loading}>
              {step < TOTAL_STEPS ? 'Continue →' : loading ? 'Submitting…' : 'Submit Application'}
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
  page: { minHeight: '100vh', background: 'linear-gradient(145deg, #F5F2FF 0%, var(--bg) 60%)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 20px' },
  card: { background: 'var(--surface)', borderRadius: 22, padding: '44px 40px', width: '100%', maxWidth: 600, boxShadow: '0 24px 56px rgba(124,58,237,.12), 0 8px 20px rgba(0,0,0,.06)', border: '1px solid var(--border)' },
  header:     { textAlign: 'center', marginBottom: 32 },
  headerMark: { fontSize: 28, color: '#7C3AED', marginBottom: 14, filter: 'drop-shadow(0 0 10px rgba(124,58,237,.4))' },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' },
  sub:   { color: 'var(--text-muted)', fontSize: 14, marginTop: 6 },
  stepBar: { display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20 },
  step: { width: 32, height: 32, borderRadius: '50%', background: 'var(--surface2)', border: '1.5px solid var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  stepActive: { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #0D9488)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(124,58,237,.4)' },
  alert: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '12px 16px', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 },
  fields:       { display: 'flex', flexDirection: 'column', gap: 16 },
  sectionTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 700, color: 'var(--text-sub)', margin: 0 },
  optTag:       { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 10, padding: '1px 8px', marginLeft: 8, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.04em' },
  hint:         { fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 },
  field:  { display: 'flex', flexDirection: 'column', gap: 7 },
  label:  { fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', letterSpacing: '0.01em' },
  input:  { padding: '12px 15px', border: '1.5px solid var(--border)', borderRadius: 11, fontSize: 14, background: 'var(--input-bg)', outline: 'none', width: '100%', boxSizing: 'border-box', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" },
  row2:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: 14 },
  dayRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' },
  dayName:    { width: 38, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' },
  checkLabel: { fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', width: 72 },
  timeInput:  { padding: '7px 11px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text)', background: 'var(--input-bg)', fontFamily: "'DM Sans', sans-serif" },

  step4Block:    { display: 'flex', flexDirection: 'column', gap: 12, padding: '20px 0', borderBottom: '1px solid var(--border)' },
  svcRow:        { display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', background: 'var(--surface2)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)' },
  removeBtn:     { padding: '8px 12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", alignSelf: 'flex-end' },
  addSvcBtn:     { padding: '9px 18px', background: 'var(--surface2)', color: '#7C3AED', border: '1.5px dashed rgba(124,58,237,.35)', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif", alignSelf: 'flex-start' },
  offerToggleRow:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  toggleBtn:     { padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif" },
  toggleOn:      { background: 'rgba(13,148,136,.12)', color: '#0D9488', border: '1px solid rgba(13,148,136,.25)' },
  toggleOff:     { background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)' },

  actions: { display: 'flex', gap: 12, marginTop: 28 },
  backBtn: { flex: 1, padding: '13px', background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: 'var(--text-sub)', fontFamily: "'DM Sans', sans-serif" },
  nextBtn: { flex: 2, padding: '13px', background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 20px rgba(124,58,237,.35), inset 0 1px 0 rgba(255,255,255,.15)', fontFamily: "'DM Sans', sans-serif" },
  primaryBtn: { display: 'inline-block', padding: '13px 32px', background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 15, boxShadow: '0 6px 20px rgba(124,58,237,.35)' },
  successOrb:   { fontSize: 36, color: '#7C3AED', textAlign: 'center', marginBottom: 18, filter: 'drop-shadow(0 0 14px rgba(124,58,237,.5))' },
  successTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: 12 },
  successSub:   { color: 'var(--text-muted)', fontSize: 15, textAlign: 'center', lineHeight: 1.7, marginBottom: 28 },
  footer:       { marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' },
  footerLink:   { color: '#7C3AED', fontWeight: 600 },
};

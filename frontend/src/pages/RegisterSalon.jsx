import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useBreakpoint } from '../hooks/useMobile';
import MapLocationPicker from '../components/MapLocationPicker';
import { checkPasswordStrength, PASSWORD_REQUIREMENT_TEXT } from '../utils/passwordStrength';

const DAYS       = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const BASE_CATS  = ['Hair', 'Nails', 'Skin', 'Makeup'];
const EMPTY_SVC  = { name: '', category: 'Hair', price: '', duration: '', show_price: true };

const SERVICES_BY_CATEGORY = {
  Hair: [
    'Haircut (Women)','Haircut (Men)','Haircut (Kids)','Haircut & Blow Dry',
    'Fringe / Bangs Trim','Beard Trim','Haircut & Beard Combo','Head Shave',
    'Shape Up / Line Up','Low Fade','Mid Fade','High Fade','Undercut','Buzz Cut',
    'Full Hair Color','Root Touch Up','Full Highlights','Partial Highlights',
    'Balayage','Ombre','Hair Bleaching','Toning','Gray Coverage',
    'Deep Conditioning Treatment','Keratin Treatment','Protein Treatment',
    'Scalp Treatment','Hair Botox Treatment','Olaplex Treatment',
    'Blow Dry & Style','Hair Straightening (Flat Iron)','Curling & Waves',
    'Updo / Formal Style','Bridal Hair','Box Braids','French Braid','Cornrows',
    'Perm (Wavy / Curly)','Digital Perm','Hair Relaxer','Head & Scalp Massage',
  ],
  Nails: [
    'Basic Manicure','Spa Manicure','French Manicure','Gel Manicure','Acrylic Manicure',
    'Dip Powder Manicure','Paraffin Manicure','Nail Art (Simple)','Nail Art (Complex)',
    'Nail Extensions (Gel Tips)','Gel / Acrylic Removal','Nail Repair (Per Nail)',
    'Polish Change (Hands)','Nail Strengthening Treatment','Basic Pedicure','Spa Pedicure',
    'Gel Pedicure','French Pedicure','Paraffin Pedicure','Callus Removal',
    'Foot Scrub & Massage','Polish Change (Toes)','Nail Art (Toes)',
  ],
  Skin: [
    'Basic Facial','Deep Cleansing Facial','Hydrating Facial','Anti-Aging Facial',
    'Brightening Facial','Acne Treatment Facial','Gold Facial','Charcoal Facial',
    'Fruit Facial','Bridal Glow Facial','Chemical Peel (Light)','Microdermabrasion',
    'LED Light Therapy','Blackhead Extraction','Eyebrow Threading','Eyebrow Waxing',
    'Eyebrow Tinting','Eyebrow Lamination','Eyelash Tinting','Eyelash Lift & Perm',
    'Eyelash Extensions (Classic)','Eyelash Extensions (Volume)','Upper Lip Threading',
    'Full Face Threading','Hot Towel Shave','Beard Shaping & Styling',"Men's Facial",
    'Face Scrub (Men)','Swedish Massage','Deep Tissue Massage','Aromatherapy Massage',
    'Hot Stone Massage','Shoulder & Neck Massage','Full Body Scrub','Body Wrap',
    'Foot Reflexology','Underarm Waxing','Full Leg Waxing','Half Leg Waxing',
    'Full Arm Waxing','Bikini Wax','Brazilian Wax','Back Waxing','Chest Waxing',
  ],
  Makeup: [
    'Day Makeup','Evening / Party Makeup','Bridal Makeup (Trial)',
    'Bridal Makeup (Wedding Day)','Engagement Makeup','Photoshoot / Editorial Makeup',
    'Airbrush Makeup','Contouring & Highlighting','Makeup Lesson','Strip Lash Application',
    'Microblading','Lip Blush','Semi-Permanent Eyeliner',
  ],
  Bridal: [
    'Bridal Hair','Bridal Glow Facial','Bridal Makeup (Trial)','Bridal Makeup (Wedding Day)',
    'Engagement Makeup','Updo / Formal Style','Airbrush Makeup','Eyelash Extensions (Classic)',
    'Eyelash Extensions (Volume)','Eyelash Lift & Perm','Eyebrow Lamination',
    'Contouring & Highlighting','Strip Lash Application',
  ],
};

const GENDER_OPTIONS = [
  {
    val: 'male',
    icon: '♂',
    label: 'Barbershop',
    sub: 'For men — haircuts, beard trims & grooming',
    grad: 'linear-gradient(135deg, #0D9488 0%, #0B7A70 100%)',
  },
  {
    val: 'female',
    icon: '♀',
    label: 'Ladies Salon',
    sub: 'For women — hair, nails, skin, makeup & bridal',
    grad: 'linear-gradient(135deg, #C96B51 0%, #D4AF37 100%)',
  },
  {
    val: 'unisex',
    icon: '⚤',
    label: 'Unisex / Both',
    sub: 'Open to everyone — full service range',
    grad: 'linear-gradient(135deg, #0D9488 0%, #D4AF37 100%)',
  },
];

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

function TimePicker({ value, onChange, style }) {
  const [h, m] = (value || '09:00').split(':');
  const emit = (hh, mm) => onChange({ target: { value: `${hh}:${mm}` } });
  const sel = {
    ...style,
    padding: '7px 8px', appearance: 'auto',
    backgroundImage: 'none', cursor: 'pointer',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <select value={h} onChange={e => emit(e.target.value, m)} style={sel}>
        {HOURS.map(hh => <option key={hh} value={hh}>{hh}</option>)}
      </select>
      <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 14, userSelect: 'none' }}>:</span>
      <select value={m} onChange={e => emit(h, e.target.value)} style={sel}>
        {MINUTES.map(mm => <option key={mm} value={mm}>{mm}</option>)}
      </select>
    </div>
  );
}

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
  const [genderFocus, setGenderFocus] = useState('unisex');
  const [salonPos, setSalonPos] = useState(null);       // { lat, lng }
  const [salonPosLabel, setSalonPosLabel] = useState('');
  const [showLocMap, setShowLocMap] = useState(false);
  const [services, setServices] = useState([{ ...EMPTY_SVC }]);
  const [offer, setOffer] = useState({ title: '', description: '', discount_type: 'percentage', discount_value: '', start_date: '', end_date: '', note: '', is_active: true });
  const [hasOffer, setHasOffer]   = useState(false);
  const [cosmeticsEnabled, setCosmeticsEnabled] = useState(false);
  const [showPw, setShowPw]        = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [loading, setLoading]     = useState(false);

  const f = k => e => setForm({ ...form, [k]: e.target.value });
  const setHours = (day, field, val) => setForm({
    ...form,
    operating_hours: { ...form.operating_hours, [day]: { ...form.operating_hours[day], [field]: val } },
  });
  const offerF = k => e => setOffer(o => ({ ...o, [k]: e.target.value }));

  const pwStrength = checkPasswordStrength(form.password);

  const addService = () => setServices(p => [...p, { ...EMPTY_SVC }]);
  const removeService = i => setServices(p => p.filter((_, idx) => idx !== i));
  const updateService = (i, k, v) => setServices(p => p.map((s, idx) => idx === i ? { ...s, [k]: v } : s));

  const handle = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form, cosmetics_enabled: cosmeticsEnabled, gender_focus: genderFocus, ...(salonPos ? { latitude: salonPos.lat, longitude: salonPos.lng } : {}) };
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

  if (showLocMap) return (
    <MapLocationPicker
      initialPos={salonPos}
      showRadius={false}
      title="Pin Your Salon Location"
      applyLabel="Set Location"
      onClose={() => setShowLocMap(false)}
      onApply={(pos, _rad, label) => {
        setSalonPos(pos);
        setSalonPosLabel(label);
        setShowLocMap(false);
      }}
    />
  );

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

  const STEP_LABELS = ['Salon Details', 'Location & Owner', 'Operating Hours', 'Services & Offers', 'Your Account'];
  const TOTAL_STEPS = 5;

  const toMinutes = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  const advance = e => {
    e.preventDefault();
    setError('');
    if (step === 1) {
      const phone = form.contact_number.trim();
      if (phone && !/^\+?[\d\s\-()]{7,15}$/.test(phone)) {
        setError('Contact number appears invalid. Use digits, spaces, dashes, and optionally a leading +.');
        return;
      }
    }
    if (step === 4) {
      if (!pwStrength.valid) {
        setError(PASSWORD_REQUIREMENT_TEXT);
        return;
      }
      if (!form.email.trim()) {
        setError('Please enter your email address.');
        return;
      }
    }
    if (step === 3) {
      for (const day of DAYS) {
        const h = form.operating_hours[day];
        if (!h.closed && toMinutes(h.open) >= toMinutes(h.close)) {
          setError(`${day.charAt(0).toUpperCase() + day.slice(1)}: closing time must be after opening time.`);
          return;
        }
      }
    }
    setStep(p => p + 1);
  };;

  return (
    <div style={{ ...s.page, padding: isMobile ? '24px 12px 48px' : '48px 20px' }}>
      <div style={{ ...s.card, padding: isMobile ? '28px 20px' : '44px 40px' }} className="fade-up">
        <div style={s.header}>
          <div style={s.headerMark}>✦</div>
          <h1 style={{ ...s.title, fontSize: isMobile ? 26 : 34 }}>Register Your Salon</h1>
          <p style={s.sub}>Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}</p>
          <div style={s.stepBar}>
            {[1,2,3,4,5].map(n => (
              <div key={n} style={n <= step ? s.stepActive : s.step}>
                {n < step ? '✓' : n}
              </div>
            ))}
          </div>
        </div>

        {error && <div style={s.alert}><span>⚠</span> {error}</div>}

        <form onSubmit={step < TOTAL_STEPS ? advance : handle} autoComplete="off">
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
              <div style={s.field}>
                <label style={s.label}>Contact Number</label>
                <input style={s.input} value={form.contact_number} onChange={f('contact_number')} required />
              </div>

              {/* Gender Focus */}
              <div style={s.field}>
                <label style={s.label}>Salon Type</label>
                <p style={s.hint}>Who is your salon primarily for? This helps clients find you.</p>
                <div style={s.genderGrid}>
                  {GENDER_OPTIONS.map(opt => (
                    <div
                      key={opt.val}
                      onClick={() => setGenderFocus(opt.val)}
                      style={{
                        ...s.genderCard,
                        border: genderFocus === opt.val
                          ? '2px solid #0D9488'
                          : '2px solid var(--border)',
                        background: genderFocus === opt.val
                          ? 'rgba(13,148,136,.06)'
                          : 'var(--surface2)',
                      }}
                    >
                      <div style={{
                        ...s.genderIcon,
                        background: genderFocus === opt.val ? opt.grad : 'var(--border)',
                      }}>
                        {opt.icon}
                      </div>
                      <div style={s.genderLabel}>{opt.label}</div>
                      <div style={s.genderSub}>{opt.sub}</div>
                      {genderFocus === opt.val && (
                        <div style={s.genderCheck}>✓</div>
                      )}
                    </div>
                  ))}
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

              {/* Map pin for salon location */}
              <div style={s.field}>
                <label style={s.label}>Salon Location on Map <span style={s.optTag}>optional but recommended</span></label>
                <p style={s.hint}>Pin your salon's exact location so clients can find you using radius search.</p>
                {salonPos ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 11, background: '#F0FDFA', border: '1px solid #99F6E4' }}>
                    <span style={{ fontSize: 18 }}>📍</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pinned</div>
                      <div style={{ fontSize: 13, color: '#0D9488', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {salonPosLabel || `${salonPos.lat.toFixed(5)}, ${salonPos.lng.toFixed(5)}`}
                      </div>
                    </div>
                    <button type="button" onClick={() => setShowLocMap(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#0D9488', fontWeight: 600, textDecoration: 'underline', flexShrink: 0 }}>
                      Change
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowLocMap(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'var(--surface2)', border: '1.5px dashed rgba(13,148,136,.4)', borderRadius: 11, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#0D9488', fontFamily: "'DM Sans', sans-serif" }}>
                    📍 Pin Salon on Map
                  </button>
                )}
              </div>

              <h4 style={{ ...s.sectionTitle, marginTop: 28 }}>Owner Details</h4>
              <div style={s.field}>
                <label style={s.label}>Your Full Name</label>
                <input style={s.input} value={form.full_name} onChange={f('full_name')} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Your Phone</label>
                <input style={s.input} value={form.phone} onChange={f('phone')} />
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
                      <TimePicker style={s.timeInput} value={form.operating_hours[day].open}  onChange={e => setHours(day, 'open',  e.target.value)} />
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>–</span>
                      <TimePicker style={s.timeInput} value={form.operating_hours[day].close} onChange={e => setHours(day, 'close', e.target.value)} />
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
                  <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(13,148,136,.07)', border: '1px solid rgba(13,148,136,.2)', fontSize: 13, color: '#0D9488' }}>
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
                        <label style={s.label}>Category</label>
                        <select
                          style={s.input}
                          value={svc.category}
                          onChange={e => setServices(p => p.map((sv, idx) => idx === i ? { ...sv, category: e.target.value, name: '' } : sv))}
                        >
                          {[...BASE_CATS, ...(genderFocus !== 'male' ? ['Bridal'] : [])].map(c => (
                            <option key={c} value={c}>{c === 'Bridal' ? 'Bridal & Party' : c}</option>
                          ))}
                        </select>
                      </div>
                      <div style={s.field}>
                        <label style={s.label}>Service Name *</label>
                        <select style={s.input} value={svc.name} onChange={e => updateService(i, 'name', e.target.value)} required>
                          <option value="">— Select a service —</option>
                          {(SERVICES_BY_CATEGORY[svc.category] || []).map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ ...s.row2, flex: 1 }}>
                      <div style={s.field}>
                        <label style={s.label}>Price (LKR) *</label>
                        <input style={s.input} type="number" min="0" placeholder="1500" value={svc.price} onChange={e => updateService(i, 'price', e.target.value)} required />
                      </div>
                      <div style={s.field}>
                        <label style={s.label}>Duration (min) *</label>
                        <input style={s.input} type="number" min="1" placeholder="60" value={svc.duration} onChange={e => updateService(i, 'duration', e.target.value)} required />
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
                    {hasOffer ? '● Skip' : '○ Include'}
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

          {/* Step 5 — Account Credentials */}
          {step === 5 && (
            <div style={s.fields}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔐</div>
                <h4 style={{ ...s.sectionTitle, fontSize: 20, textAlign: 'center', marginBottom: 4 }}>Create Your Account</h4>
                <p style={{ ...s.hint, textAlign: 'center' }}>
                  This will be your login to manage your salon.
                </p>
              </div>
              <div style={s.field}>
                <label style={s.label}>Email Address</label>
                <input
                  style={s.input} type="email"
                  placeholder="you@example.com"
                  value={form.email} onChange={f('email')}
                  autoComplete="email" required
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...s.input, paddingRight: 44 }}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={form.password} onChange={f('password')}
                    autoComplete="new-password" required minLength={8}
                  />
                  <button
                    type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', padding: '2px 4px' }}
                  >
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
                {form.password && (
                  <div>
                    <div style={s.pwBarTrack}>
                      <div style={{ ...s.pwBarFill, width: `${(pwStrength.score / 5) * 100}%`, background: pwStrength.color }} />
                    </div>
                    <div style={{ ...s.pwLabel, color: pwStrength.color }}>{pwStrength.label}</div>
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
  page: { minHeight: '100vh', background: 'linear-gradient(145deg, #F0FDFA 0%, var(--bg) 60%)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 20px' },
  card: { background: 'var(--surface)', borderRadius: 22, padding: '44px 40px', width: '100%', maxWidth: 600, boxShadow: '0 24px 56px rgba(13,148,136,.12), 0 8px 20px rgba(0,0,0,.06)', border: '1px solid var(--border)' },
  header:     { textAlign: 'center', marginBottom: 32 },
  headerMark: { fontSize: 28, color: '#0D9488', marginBottom: 14, filter: 'drop-shadow(0 0 10px rgba(13,148,136,.4))' },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' },
  sub:   { color: 'var(--text-muted)', fontSize: 14, marginTop: 6 },
  stepBar: { display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20 },
  step: { width: 32, height: 32, borderRadius: '50%', background: 'var(--surface2)', border: '1.5px solid var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  stepActive: { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #0D9488, #0D9488)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(13,148,136,.4)' },
  alert: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '12px 16px', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 },
  fields:       { display: 'flex', flexDirection: 'column', gap: 16 },
  sectionTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 700, color: 'var(--text-sub)', margin: 0 },
  optTag:       { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 10, padding: '1px 8px', marginLeft: 8, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.04em' },
  hint:         { fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 },
  field:  { display: 'flex', flexDirection: 'column', gap: 7 },
  label:  { fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', letterSpacing: '0.01em' },
  pwBarTrack: { marginTop: 4, height: 5, borderRadius: 4, background: 'var(--surface2)', overflow: 'hidden' },
  pwBarFill: { height: '100%', borderRadius: 4, transition: 'width .2s ease, background .2s ease' },
  pwLabel: { fontSize: 11, fontWeight: 600, marginTop: 4 },
  input:  { padding: '12px 15px', border: '1.5px solid var(--border)', borderRadius: 11, fontSize: 14, background: 'var(--input-bg)', outline: 'none', width: '100%', boxSizing: 'border-box', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" },
  row2:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: 14 },
  dayRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' },
  dayName:    { width: 38, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' },
  checkLabel: { fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', width: 72 },
  timeInput:  { padding: '7px 11px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text)', background: 'var(--input-bg)', fontFamily: "'DM Sans', sans-serif" },

  step4Block:    { display: 'flex', flexDirection: 'column', gap: 12, padding: '20px 0', borderBottom: '1px solid var(--border)' },
  svcRow:        { display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', background: 'var(--surface2)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)' },
  removeBtn:     { padding: '8px 12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", alignSelf: 'flex-end' },
  addSvcBtn:     { padding: '9px 18px', background: 'var(--surface2)', color: '#0D9488', border: '1.5px dashed rgba(13,148,136,.35)', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif", alignSelf: 'flex-start' },
  offerToggleRow:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  toggleBtn:     { padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif" },
  toggleOn:      { background: 'rgba(13,148,136,.12)', color: '#0D9488', border: '1px solid rgba(13,148,136,.25)' },
  toggleOff:     { background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)' },

  actions: { display: 'flex', gap: 12, marginTop: 28 },
  backBtn: { flex: 1, padding: '13px', background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: 'var(--text-sub)', fontFamily: "'DM Sans', sans-serif" },
  nextBtn: { flex: 2, padding: '13px', background: 'linear-gradient(135deg, #0D9488 0%, #0D9488 100%)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 20px rgba(13,148,136,.35), inset 0 1px 0 rgba(255,255,255,.15)', fontFamily: "'DM Sans', sans-serif" },
  primaryBtn: { display: 'inline-block', padding: '13px 32px', background: 'linear-gradient(135deg, #0D9488 0%, #0D9488 100%)', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 15, boxShadow: '0 6px 20px rgba(13,148,136,.35)' },
  successOrb:   { fontSize: 36, color: '#0D9488', textAlign: 'center', marginBottom: 18, filter: 'drop-shadow(0 0 14px rgba(13,148,136,.5))' },
  successTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: 12 },
  successSub:   { color: 'var(--text-muted)', fontSize: 15, textAlign: 'center', lineHeight: 1.7, marginBottom: 28 },
  footer:       { marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' },
  footerLink:   { color: '#0D9488', fontWeight: 600 },

  genderGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 4 },
  genderCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    gap: 8, padding: '16px 10px', borderRadius: 14,
    cursor: 'pointer', transition: 'all .18s ease', position: 'relative',
  },
  genderIcon: {
    width: 44, height: 44, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, color: '#fff', fontWeight: 700,
    transition: 'background .18s ease',
  },
  genderLabel: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  genderSub:   { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 },
  genderCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: '50%',
    background: '#0D9488', color: '#fff',
    fontSize: 10, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};

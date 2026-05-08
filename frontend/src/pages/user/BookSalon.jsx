import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import { c } from '../../styles/theme';
import { useIsMobile } from '../../hooks/useMobile';

const DAY_ABBR  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

const STAFF_COLORS = ['#7C3AED','#EC4899','#2563EB','#059669','#D97706','#DC2626'];

const CONFETTI_PARTICLES = [
  { size: 8,  top: '22%', left: '10%',  color: '#7C3AED', round: true,  anim: 'confettiA', dur: '2.8s', delay: '0.1s'  },
  { size: 6,  top: '28%', left: '84%',  color: '#EC4899', round: true,  anim: 'confettiB', dur: '2.5s', delay: '0.2s'  },
  { size: 10, top: '62%', left: '7%',   color: '#BF9B65', round: false, anim: 'confettiC', dur: '2.6s', delay: '0.3s'  },
  { size: 7,  top: '58%', left: '89%',  color: '#A78BFA', round: false, anim: 'confettiA', dur: '2.7s', delay: '0.05s' },
  { size: 5,  top: '44%', left: '4%',   color: '#F9A8D4', round: true,  anim: 'confettiB', dur: '2.4s', delay: '0.15s' },
  { size: 9,  top: '34%', left: '93%',  color: '#C4B5FD', round: true,  anim: 'confettiC', dur: '2.9s', delay: '0.25s' },
  { size: 6,  top: '76%', left: '47%',  color: '#7C3AED', round: false, anim: 'confettiA', dur: '2.3s', delay: '0.35s' },
  { size: 7,  top: '14%', left: '57%',  color: '#EC4899', round: true,  anim: 'confettiB', dur: '2.6s', delay: '0.4s'  },
];

function DatePicker({ value, onChange, operatingHours }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const windowStart = new Date(today);
  windowStart.setDate(today.getDate() + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(windowStart);
    d.setDate(windowStart.getDate() + i);
    return d;
  });

  const months = [...new Set(days.map(d =>
    d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  ))];

  const isOpen = d => {
    if (!operatingHours || Object.keys(operatingHours).length === 0) return true;
    return !!operatingHours[DAY_NAMES[d.getDay()]];
  };

  return (
    <div>
      <div style={dp.header}>
        <span style={dp.monthLabel}>{months.join(' / ')}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            disabled={weekOffset === 0}
            style={{ ...dp.navBtn, opacity: weekOffset === 0 ? 0.35 : 1 }}
          >‹</button>
          <button onClick={() => setWeekOffset(w => w + 1)} style={dp.navBtn}>›</button>
        </div>
      </div>

      <div style={dp.row}>
        {days.map(d => {
          const isPast    = d < today;
          const isClosed  = !isOpen(d);
          const dateStr   = d.toISOString().split('T')[0];
          const isSelected = value === dateStr;
          const isToday   = d.getTime() === today.getTime();
          const disabled  = isPast || isClosed;

          let chip = { ...dp.chip };
          if      (isSelected) chip = { ...chip, ...dp.chipSelected };
          else if (isPast)     chip = { ...chip, ...dp.chipPast };
          else if (isClosed)   chip = { ...chip, ...dp.chipClosed };
          else if (isToday)    chip = { ...chip, ...dp.chipToday };

          return (
            <button
              key={dateStr}
              disabled={disabled}
              onClick={() => onChange(dateStr)}
              style={chip}
              title={isClosed ? 'Salon closed' : isPast ? 'Past date' : dateStr}
            >
              <span style={{ ...dp.abbr, color: isSelected ? 'rgba(255,255,255,.72)' : disabled ? 'var(--text-light)' : 'var(--text-muted)' }}>
                {DAY_ABBR[d.getDay()]}
              </span>
              <span style={{ ...dp.num, ...(isPast ? dp.numPast : {}), color: isSelected ? '#fff' : disabled ? 'var(--text-light)' : 'var(--text)' }}>
                {d.getDate()}
              </span>
              <span style={dp.tag}>
                {isPast   && <span style={{ color: '#DC2626', fontSize: 8, fontWeight: 700 }}>PAST</span>}
                {!isPast && isClosed && <span style={{ color: 'var(--text-light)', fontSize: 8, fontWeight: 700 }}>N/A</span>}
                {isSelected && <span style={{ color: 'rgba(255,255,255,.85)', fontSize: 10 }}>✓</span>}
                {!isPast && !isClosed && !isSelected && (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: isToday ? '#7C3AED' : 'transparent', display: 'inline-block' }} />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const dp = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  monthLabel: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em',
  },
  navBtn: {
    width: 34, height: 34, borderRadius: 10,
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)', cursor: 'pointer', fontSize: 18, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background .15s ease',
  },
  row: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 },
  chip: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    width: 60, minWidth: 60, padding: '10px 4px 8px',
    borderRadius: 16, border: '2px solid var(--border)',
    background: 'var(--surface)', cursor: 'pointer',
    transition: 'all .18s ease', gap: 2,
  },
  chipSelected: {
    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    borderColor: 'transparent', boxShadow: '0 6px 18px rgba(124,58,237,.4)', transform: 'translateY(-3px)',
  },
  chipPast:   { background: 'var(--surface2)', borderColor: 'transparent', cursor: 'not-allowed', opacity: 0.4 },
  chipClosed: { background: 'var(--surface2)', borderColor: 'transparent', cursor: 'not-allowed', opacity: 0.5 },
  chipToday:  { borderColor: '#7C3AED', boxShadow: '0 0 0 3px rgba(124,58,237,.12)' },
  abbr: { fontSize: 9, fontWeight: 700, letterSpacing: '0.08em' },
  num:  { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, lineHeight: 1.1 },
  numPast: { textDecoration: 'line-through' },
  tag: { height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

const STEPS = ['Services', 'Professional', 'Date', 'Time', 'Confirm'];

export default function BookSalon() {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const isMobile  = useIsMobile();
  const [searchParams] = useSearchParams();
  const preIds = (searchParams.get('services') || '').split(',').map(Number).filter(Boolean);
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(preIds);
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffId, setStaffId] = useState(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(preIds.length > 0 ? 1 : 0);
  const [promoCode, setPromoCode] = useState('');
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    api.get(`/salons/${salonId}/`).then(r => setSalon(r.data)).catch(() => {});
    api.get(`/salons/${salonId}/services/`).then(r => setServices(r.data)).catch(() => {});
    setStaffLoading(true);
    api.get(`/salons/${salonId}/staff/`)
      .then(r => setStaffList(r.data))
      .catch(() => setStaffList([]))
      .finally(() => setStaffLoading(false));
  }, [salonId]);

  useEffect(() => {
    if (!date) return;
    setSlotsLoading(true); setSlot('');
    const staffParam = staffId !== null ? `&staff_id=${staffId}` : '';
    api.get(`/salons/${salonId}/calendar/available-slots/?date=${date}${staffParam}`)
      .then(r => setSlots(r.data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [date, salonId, staffId]);

  useEffect(() => { setPromoResult(null); }, [selected]);

  const toggleService = id => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoResult(null);
    try {
      const r = await api.post('/promotions/validate/', { code: promoCode.trim(), salon_id: Number(salonId) });
      setPromoResult(r.data);
    } catch (err) {
      setPromoResult({ valid: false, message: err.response?.data?.message || err.response?.data?.detail || 'Invalid promo code' });
    } finally { setPromoLoading(false); }
  };

  const submit = async e => {
    e.preventDefault(); setError('');
    if (selected.length === 0) return setError('Please select at least one service');
    if (!slot) return setError('Please select a time slot');
    setSubmitting(true);
    try {
      const payload = {
        salon: Number(salonId),
        requested_datetime: slot,
        salon_service_ids: selected,
        notes,
        ...(staffId !== null ? { staff_member_id: staffId } : {}),
        ...(promoResult?.valid ? { promo_id: promoResult.promo_id } : {}),
      };
      const res = await api.post('/bookings/', payload);
      setBookingId(res.data?.id ?? null);
      setConfirmed(true);
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Booking failed');
    } finally { setSubmitting(false); }
  };

  if (!salon) return (
    <div style={s.loader}><div style={s.loaderSpinner} /></div>
  );

  const selectedServices = services.filter(ss => selected.includes(ss.id));
  const total = selectedServices.reduce((sum, ss) => sum + Number(ss.effective_price), 0);
  const discount = promoResult?.valid ? Number(promoResult.discount_amount) : 0;
  const finalTotal = Math.max(0, total - discount);
  const selectedStaffName = staffId === null ? 'Any Available' : staffList.find(m => m.id === staffId)?.full_name || '';

  const stepDone = [selected.length > 0, true, !!date, !!slot, true];
  const canAdvance = stepDone[step];

  const goNext = () => { if (canAdvance && step < 4) setStep(st => st + 1); };
  const goPrev = () => { if (step > 0) setStep(st => st - 1); };

  /* ── Luxury booking confirmation overlay ── */
  if (confirmed) {
    const dt = slot ? new Date(slot) : null;
    const fmtDate = dt ? dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '';
    const fmtTime = dt ? dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return createPortal(
      <div style={conf.overlay} className="noise-bg">
        {/* Ambient background glows */}
        <div style={conf.bgGlow1} className="ambient-glow" />
        <div style={conf.bgGlow2} />
        <div style={conf.bgGlow3} />

        {/* Confetti particles */}
        {CONFETTI_PARTICLES.map((p, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: p.size, height: p.size,
            borderRadius: p.round ? '50%' : 3,
            background: p.color,
            top: p.top, left: p.left,
            animation: `${p.anim} ${p.dur} ${p.delay} cubic-bezier(.25,.46,.45,.94) forwards`,
            opacity: 0,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Main confirmation content */}
        <div style={conf.content}>
          {/* Eyebrow */}
          <div style={conf.eyebrow} className="fade-in d1">
            <span style={{ color: '#BF9B65', marginRight: 8 }}>✦</span>
            Your Appointment is Confirmed
          </div>

          {/* Animated checkmark */}
          <div style={conf.checkWrap} className="fade-in d1">
            <div style={conf.checkGlow} />
            <div style={{ ...conf.checkCircle, animation: 'checkmarkBounce .65s .2s cubic-bezier(.16,1,.3,1) backwards' }}>
              <svg width="96" height="96" viewBox="0 0 96 96" fill="none" style={{ display: 'block' }}>
                <defs>
                  <linearGradient id="cGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
                <circle
                  cx="48" cy="48" r="44"
                  stroke="url(#cGrad)" strokeWidth="2"
                  strokeDasharray="276"
                  style={{ animation: 'svgCircleDraw .9s .25s cubic-bezier(.16,1,.3,1) backwards' }}
                />
                <path
                  d="M30 48L42 60L66 34"
                  stroke="white" strokeWidth="4"
                  strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="65"
                  style={{ animation: 'svgCheckDraw .55s .9s cubic-bezier(.16,1,.3,1) backwards' }}
                />
              </svg>
            </div>
          </div>

          {/* Salon name — the cinematic moment */}
          <h1 style={conf.salonName} className="fade-up d3">{salon.name}</h1>
          <p style={conf.salonSub} className="fade-up d3">Your luxury experience awaits</p>

          {/* Decorative rule */}
          <div style={conf.rule} className="fade-in d4" />

          {/* Appointment detail card */}
          <div style={conf.detailCard} className="fade-up d4">
            {dt && (
              <div style={conf.detailRow}>
                <div style={conf.detailIconWrap}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="2.5" width="12" height="10.5" rx="2" stroke="#A78BFA" strokeWidth="1.2"/>
                    <line x1="1" y1="6" x2="13" y2="6" stroke="#A78BFA" strokeWidth="1.2"/>
                    <line x1="4.5" y1="1" x2="4.5" y2="4" stroke="#A78BFA" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="9.5" y1="1" x2="9.5" y2="4" stroke="#A78BFA" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div style={conf.detailLabel}>Date &amp; Time</div>
                  <div style={conf.detailVal}>{fmtDate} &nbsp;·&nbsp; {fmtTime}</div>
                </div>
              </div>
            )}
            {selectedServices.length > 0 && (
              <div style={conf.detailRow}>
                <div style={conf.detailIconWrap}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="4.5" cy="4.5" r="3" stroke="#A78BFA" strokeWidth="1.2"/>
                    <circle cx="9.5" cy="9.5" r="3" stroke="#A78BFA" strokeWidth="1.2"/>
                    <line x1="7" y1="7" x2="13" y2="1" stroke="#A78BFA" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div style={conf.detailLabel}>Services</div>
                  <div style={conf.detailVal}>{selectedServices.map(ss => ss.service_name).join(' · ')}</div>
                </div>
              </div>
            )}
            {staffId !== null && staffList.find(m => m.id === staffId) && (
              <div style={conf.detailRow}>
                <div style={conf.detailIconWrap}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="4.5" r="3" stroke="#A78BFA" strokeWidth="1.2"/>
                    <path d="M1 13c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="#A78BFA" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div style={conf.detailLabel}>Professional</div>
                  <div style={conf.detailVal}>{staffList.find(m => m.id === staffId)?.full_name}</div>
                </div>
              </div>
            )}
            {finalTotal > 0 && (
              <div style={{ ...conf.detailRow, borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
                <div style={conf.detailIconWrap}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="#A78BFA" strokeWidth="1.2"/>
                    <text x="4.5" y="10.5" fontSize="7" fill="#A78BFA" fontWeight="700">LKR</text>
                  </svg>
                </div>
                <div>
                  <div style={conf.detailLabel}>Total</div>
                  <div style={{ ...conf.detailVal, color: '#C4B5FD', fontWeight: 700 }}>
                    LKR {finalTotal.toFixed(2)}
                    {promoResult?.valid && (
                      <span style={{ fontSize: 11, color: '#6EE7B7', marginLeft: 8, fontWeight: 500 }}>
                        (promo applied)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTAs */}
          <div style={conf.ctaRow} className="fade-up d5">
            <button
              style={conf.primaryCTA}
              className="btn-cta"
              onClick={() => navigate(bookingId ? `/user/bookings/${bookingId}` : '/user/bookings')}
            >
              View My Booking
            </button>
            <button style={conf.ghostCTA} onClick={() => navigate('/salons')}>
              Explore More Salons
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div>
      <Link to={`/salons/${salonId}`} style={s.back}>← Back to {salon.name}</Link>

      {/* Progress bar */}
      <div style={{ ...s.progress, padding: isMobile ? '14px 16px' : '18px 28px' }} className="fade-up">
        {STEPS.map((label, i) => (
          <div key={label} style={s.progressStep} onClick={() => i < step && setStep(i)}>
            <div style={{
              ...s.progressDot,
              width: isMobile ? 26 : 30, height: isMobile ? 26 : 30,
              background: i <= step ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : 'var(--border)',
              boxShadow: i === step ? '0 0 0 4px rgba(124,58,237,.18)' : 'none',
              cursor: i < step ? 'pointer' : 'default',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            {!isMobile && (
              <div style={{ ...s.progressLabel, color: i <= step ? '#7C3AED' : 'var(--text-light)', fontWeight: i === step ? 700 : 500 }}>
                {label}
              </div>
            )}
            {i < STEPS.length - 1 && (
              <div style={{ ...s.progressLine, background: i < step ? 'linear-gradient(90deg, #7C3AED, #EC4899)' : 'var(--border)' }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ ...s.layout, flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Main form */}
        <div style={s.formCol}>

          {/* Step 0: Services */}
          {step === 0 && (
            <div style={s.stepCard} className="scale-in">
              <div style={s.stepHeader}>
                <div style={s.stepIcon}>✂</div>
                <div>
                  <div style={s.stepTitle}>Select Services</div>
                  <div style={s.stepSub}>Choose one or more services for your appointment</div>
                </div>
              </div>
              {error && <div style={s.alert}>{error}</div>}
              <div style={s.serviceGrid}>
                {services.map(ss => {
                  const on = selected.includes(ss.id);
                  return (
                    <label
                      key={ss.id}
                      style={{ ...s.serviceCard, ...(on ? s.serviceCardOn : {}) }}
                    >
                      <input type="checkbox" checked={on} onChange={() => toggleService(ss.id)} style={{ display: 'none' }} />
                      <div style={s.svcCheck}>
                        <div style={{ ...s.checkBox, ...(on ? s.checkBoxOn : {}) }}>{on && '✓'}</div>
                      </div>
                      <div style={s.svcInfo}>
                        <div style={s.svcName}>{ss.service_name}</div>
                        <div style={s.svcMeta}>⏱ {ss.effective_duration} min</div>
                      </div>
                      <div style={{ ...s.svcPrice, color: on ? '#7C3AED' : 'var(--text-sub)' }}>
                        LKR {ss.effective_price}
                      </div>
                    </label>
                  );
                })}
                {services.length === 0 && <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No services available at this salon.</p>}
              </div>

              {selected.length > 0 && (
                <div style={s.promoSection}>
                  <button style={s.promoToggle} type="button" onClick={() => setPromoOpen(o => !o)}>
                    <span>🏷 Have a promo code?</span>
                    <span style={{ fontSize: 10 }}>{promoOpen ? '▲' : '▼'}</span>
                  </button>
                  {promoOpen && (
                    <div style={s.promoBody}>
                      <div style={s.promoRow}>
                        <input
                          style={s.promoInput}
                          value={promoCode}
                          onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
                          placeholder="Enter promo code"
                          onKeyDown={e => e.key === 'Enter' && applyPromo()}
                        />
                        <button
                          type="button"
                          style={{ ...s.promoApplyBtn, opacity: promoLoading || !promoCode.trim() ? 0.6 : 1 }}
                          onClick={applyPromo}
                          disabled={promoLoading || !promoCode.trim()}
                        >
                          {promoLoading ? '…' : 'Apply'}
                        </button>
                      </div>
                      {promoResult && (
                        <div style={{
                          ...s.promoMsg,
                          color: promoResult.valid ? '#059669' : '#DC2626',
                          background: promoResult.valid ? '#ECFDF5' : '#FEF2F2',
                          border: `1px solid ${promoResult.valid ? '#6EE7B7' : '#FCA5A5'}`,
                        }}>
                          {promoResult.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Professional */}
          {step === 1 && (
            <div style={s.stepCard} className="scale-in">
              <div style={s.stepHeader}>
                <div style={s.stepIcon}>★</div>
                <div>
                  <div style={s.stepTitle}>Choose a Professional</div>
                  <div style={s.stepSub}>Pick your preferred stylist or let us assign the next available</div>
                </div>
              </div>

              {staffLoading ? (
                <div style={s.slotLoading}>
                  <div style={s.loaderSpinner} />
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading team…</span>
                </div>
              ) : (
                <div style={s.staffGrid}>
                  <div
                    style={{ ...s.staffCard, ...(staffId === null ? s.staffCardOn : {}) }}
                    onClick={() => setStaffId(null)}
                  >
                    <div style={{ ...s.staffAvatar, background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)', boxShadow: '0 4px 14px rgba(124,58,237,.3)' }}>✦</div>
                    <div style={s.staffInfo}>
                      <div style={s.staffName}>Any Available Professional</div>
                      <div style={s.staffRole}>Show all open time slots</div>
                    </div>
                    {staffId === null && <div style={s.staffCheck}>✓</div>}
                  </div>

                  {staffList.map((member, i) => {
                    const color = STAFF_COLORS[i % STAFF_COLORS.length];
                    const isOn = staffId === member.id;
                    return (
                      <div
                        key={member.id}
                        style={{ ...s.staffCard, ...(isOn ? s.staffCardOn : {}) }}
                        onClick={() => setStaffId(member.id)}
                      >
                        <div style={{ ...s.staffAvatar, background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`, boxShadow: `0 4px 14px ${color}40` }}>
                          {member.full_name[0].toUpperCase()}
                        </div>
                        <div style={s.staffInfo}>
                          <div style={s.staffName}>{member.full_name}</div>
                          <div style={s.staffRole}>{member.role || 'Stylist'}</div>
                          {member.phone && <div style={{ ...s.staffRole, marginTop: 2 }}>📞 {member.phone}</div>}
                        </div>
                        {isOn && <div style={s.staffCheck}>✓</div>}
                      </div>
                    );
                  })}

                  {staffList.length === 0 && (
                    <div style={s.noStaffNote}>
                      No team members have been registered yet. We'll assign the next available professional.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Date */}
          {step === 2 && (
            <div style={s.stepCard} className="scale-in">
              <div style={s.stepHeader}>
                <div style={s.stepIcon}>◷</div>
                <div>
                  <div style={s.stepTitle}>Choose a Date</div>
                  <div style={s.stepSub}>Tap a day to select your appointment date</div>
                </div>
              </div>

              <DatePicker
                value={date}
                onChange={d => { setDate(d); setSlot(''); }}
                operatingHours={salon?.operating_hours || {}}
              />

              {date && (
                <div style={s.selectedDateBanner}>
                  <span style={{ fontSize: 16, color: '#7C3AED' }}>◷</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#059669', fontWeight: 700 }}>Selected ✓</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Time */}
          {step === 3 && (
            <div style={s.stepCard} className="scale-in">
              <div style={s.stepHeader}>
                <div style={s.stepIcon}>✦</div>
                <div>
                  <div style={s.stepTitle}>Pick a Time</div>
                  <div style={s.stepSub}>{date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}</div>
                </div>
              </div>
              {slotsLoading ? (
                <div style={s.slotLoading}>
                  <div style={s.loaderSpinner} />
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading available slots…</span>
                </div>
              ) : slots.length === 0 ? (
                <div style={s.noSlots}>
                  No available slots for this date. Try another day.
                  <button style={s.backDateBtn} onClick={() => setStep(2)}>← Change Date</button>
                </div>
              ) : (
                <div style={s.slotGrid}>
                  {slots.map(sl => {
                    const time = sl.datetime.split('T')[1]?.substring(0, 5);
                    const isOn = slot === sl.datetime;
                    return (
                      <button
                        key={sl.datetime}
                        type="button"
                        disabled={!sl.available}
                        onClick={() => { setSlot(sl.datetime); setStep(4); }}
                        style={{ ...s.slotBtn, ...(isOn ? s.slotOn : {}), ...(!sl.available ? s.slotOff : {}) }}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div style={s.stepCard} className="scale-in">
              <div style={s.stepHeader}>
                <div style={s.stepIcon}>◈</div>
                <div>
                  <div style={s.stepTitle}>Add Notes & Confirm</div>
                  <div style={s.stepSub}>Any special requests for the salon?</div>
                </div>
              </div>
              {error && <div style={s.alert}>{error}</div>}
              <textarea
                style={s.textarea}
                rows={4}
                placeholder="e.g. I have allergies, or want a specific style…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <button
                style={{ ...s.confirmBtn, opacity: submitting ? 0.7 : 1 }}
                onClick={submit}
                disabled={submitting}
              >
                {submitting ? 'Booking your appointment…' : '✦ Confirm Booking'}
              </button>
            </div>
          )}

          {/* Step navigation */}
          <div style={s.stepNav}>
            {step > 0 && (
              <button style={s.prevBtn} onClick={goPrev}>← Back</button>
            )}
            {step < 4 && (
              <button
                style={{ ...s.nextBtn, opacity: canAdvance ? 1 : 0.45 }}
                onClick={goNext}
                disabled={!canAdvance}
              >
                {step === 0
                  ? `Continue with ${selected.length} service${selected.length !== 1 ? 's' : ''}`
                  : step === 1
                  ? `Continue with ${staffId === null ? 'Any Available' : staffList.find(m => m.id === staffId)?.full_name || 'selected'}`
                  : 'Continue'} →
              </button>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <div style={{ ...s.sidebar, width: isMobile ? '100%' : undefined }}>
          <div style={s.summaryCard} className="fade-up d2">
            <div style={s.summaryHeader}>
              <div style={s.summaryEyebrow}>Booking Summary</div>
              <span style={s.salonTag}>{salon.name}</span>
            </div>

            {selectedServices.length === 0 ? (
              <div style={s.emptySummary}>No services selected yet</div>
            ) : (
              selectedServices.map(ss => (
                <div key={ss.id} style={s.sumRow}>
                  <span style={s.sumName}>{ss.service_name}</span>
                  <span style={s.sumPrice}>LKR {ss.effective_price}</span>
                </div>
              ))
            )}

            {selectedServices.length > 0 && (
              <>
                {promoResult?.valid && (
                  <div style={s.sumRow}>
                    <span style={{ ...s.sumName, color: '#059669' }}>🏷 Promo discount</span>
                    <span style={{ fontWeight: 600, color: '#059669', flexShrink: 0, marginLeft: 8 }}>− LKR {discount.toFixed(2)}</span>
                  </div>
                )}
                <div style={s.sumTotal}>
                  <span style={{ fontWeight: 600, color: 'var(--text-sub)', fontSize: 13 }}>Total</span>
                  <span style={s.sumTotalVal}>LKR {finalTotal.toFixed(2)}</span>
                </div>
              </>
            )}

            {selectedStaffName && (
              <div style={s.sumDetail}>
                <span style={s.sumDetailIcon}>★</span>
                {selectedStaffName}
              </div>
            )}
            {date && (
              <div style={s.sumDetail}>
                <span style={s.sumDetailIcon}>◷</span>
                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            )}
            {slot && (
              <div style={s.sumDetail}>
                <span style={s.sumDetailIcon}>✦</span>
                {slot.split('T')[1]?.substring(0, 5)}
              </div>
            )}

            <div style={s.checklist}>
              {STEPS.map((label, i) => (
                <div key={label} style={{ ...s.checkItem, color: stepDone[i] ? '#059669' : 'var(--text-muted)' }}>
                  <span style={{ fontSize: stepDone[i] ? 13 : 11 }}>{stepDone[i] ? '✓' : '○'}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  loader: { display: 'flex', justifyContent: 'center', padding: 80 },
  loaderSpinner: {
    width: 32, height: 32, borderRadius: '50%',
    border: '3px solid rgba(124,58,237,.15)', borderTopColor: '#7C3AED',
    animation: 'spinSlow .7s linear infinite',
  },
  back: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, color: '#7C3AED', fontWeight: 600, marginBottom: 24,
    textDecoration: 'none',
  },

  progress: {
    display: 'flex', alignItems: 'center', marginBottom: 28,
    background: 'var(--surface)', borderRadius: 18, padding: '18px 28px',
    boxShadow: '0 4px 16px rgba(124,58,237,.07)',
    border: '1px solid var(--border)',
  },
  progressStep: { display: 'flex', alignItems: 'center', flex: 1 },
  progressDot: {
    width: 30, height: 30, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
    transition: 'background .3s ease, box-shadow .3s ease',
  },
  progressLabel: { fontSize: 11, marginLeft: 7, whiteSpace: 'nowrap', transition: 'color .3s ease' },
  progressLine: { flex: 1, height: 2, margin: '0 8px', borderRadius: 2, transition: 'background .3s ease' },

  layout: { display: 'flex', gap: 24, alignItems: 'flex-start' },
  formCol: { flex: 1, minWidth: 0 },

  stepCard: {
    background: 'var(--surface)', borderRadius: 20, padding: 22,
    boxShadow: '0 4px 24px rgba(124,58,237,.08)',
    border: '1px solid var(--border)', marginBottom: 16,
  },
  stepHeader: { display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 },
  stepIcon: {
    width: 46, height: 46, borderRadius: 14, flexShrink: 0,
    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, color: '#fff', boxShadow: '0 6px 16px rgba(124,58,237,.35)',
  },
  stepTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em',
  },
  stepSub: { fontSize: 13, color: 'var(--text-muted)', marginTop: 3 },
  alert: {
    background: '#FEF2F2', border: '1px solid #FCA5A5',
    color: '#DC2626', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18,
  },

  serviceGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  serviceCard: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
    border: '2px solid var(--border)', borderRadius: 14, cursor: 'pointer',
    background: 'var(--surface)', transition: 'all .18s ease',
  },
  serviceCardOn: {
    border: '2px solid #7C3AED',
    background: 'linear-gradient(135deg, rgba(124,58,237,.05) 0%, rgba(236,72,153,.03) 100%)',
    boxShadow: '0 3px 12px rgba(124,58,237,.12)',
  },
  svcCheck: { flexShrink: 0 },
  checkBox: {
    width: 22, height: 22, borderRadius: 6, border: '2px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: '#fff', transition: 'all .2s ease',
  },
  checkBoxOn: { background: 'linear-gradient(135deg, #7C3AED, #EC4899)', borderColor: 'transparent' },
  svcInfo: { flex: 1 },
  svcName: { fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 2 },
  svcMeta: { fontSize: 12, color: 'var(--text-muted)' },
  svcPrice: { fontWeight: 700, fontSize: 15, flexShrink: 0, transition: 'color .2s ease' },

  staffGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  staffCard: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
    border: '2px solid var(--border)', borderRadius: 14, cursor: 'pointer',
    background: 'var(--surface)', transition: 'all .18s ease',
  },
  staffCardOn: {
    border: '2px solid #7C3AED',
    background: 'linear-gradient(135deg, rgba(124,58,237,.06) 0%, rgba(236,72,153,.04) 100%)',
    boxShadow: '0 3px 14px rgba(124,58,237,.14)',
  },
  staffAvatar: {
    width: 48, height: 48, borderRadius: 15, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20, fontWeight: 700, color: '#fff',
  },
  staffInfo: { flex: 1 },
  staffName: { fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 2 },
  staffRole: { fontSize: 12, color: 'var(--text-muted)' },
  staffCheck: {
    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
  },
  noStaffNote: {
    padding: '16px 18px', borderRadius: 12, fontSize: 13,
    color: 'var(--text-muted)', background: 'var(--surface2)',
    border: '1px solid var(--border)', fontStyle: 'italic', lineHeight: 1.6,
  },

  selectedDateBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    marginTop: 18, padding: '13px 18px',
    background: 'rgba(124,58,237,.06)', borderRadius: 12,
    border: '1px solid rgba(124,58,237,.15)',
  },

  slotLoading: { display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' },
  noSlots: {
    color: 'var(--text-muted)', fontSize: 14, padding: '20px 0',
    display: 'flex', flexDirection: 'column', gap: 12, lineHeight: 1.7,
  },
  backDateBtn: {
    display: 'inline-block', background: 'rgba(124,58,237,.08)', color: '#7C3AED',
    border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, width: 'fit-content',
  },
  slotGrid: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  slotBtn: {
    padding: '11px 16px', border: '2px solid var(--border)', borderRadius: 12,
    background: 'var(--surface)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text)',
    minWidth: 72, textAlign: 'center', transition: 'all .15s ease',
  },
  slotOn: {
    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    color: '#fff', borderColor: 'transparent', boxShadow: '0 5px 14px rgba(124,58,237,.38)',
  },
  slotOff: { background: 'var(--surface2)', color: 'var(--text-muted)', cursor: 'not-allowed', borderColor: 'transparent', opacity: 0.5 },

  textarea: {
    width: '100%', padding: '14px 16px',
    border: '2px solid var(--border)', borderRadius: 14,
    fontSize: 14, resize: 'vertical', fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box', marginBottom: 20, minHeight: 100,
    background: 'var(--input-bg)', color: 'var(--text)', outline: 'none',
  },
  confirmBtn: {
    width: '100%', padding: '15px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #EC4899 100%)',
    color: '#fff', border: 'none', borderRadius: 14,
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(124,58,237,.4), inset 0 1px 0 rgba(255,255,255,.15)',
    transition: 'opacity .2s ease, transform .2s ease',
  },

  stepNav: { display: 'flex', justifyContent: 'space-between', gap: 12 },
  prevBtn: {
    padding: '11px 22px', background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: 12,
    cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-sub)',
    fontFamily: "'DM Sans', sans-serif",
  },
  nextBtn: {
    flex: 1, padding: '12px 24px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #EC4899 100%)',
    color: '#fff', border: 'none', borderRadius: 12,
    cursor: 'pointer', fontSize: 14, fontWeight: 700,
    boxShadow: '0 6px 18px rgba(124,58,237,.35)', transition: 'opacity .2s ease',
    fontFamily: "'DM Sans', sans-serif",
  },

  sidebar: { width: 268, flexShrink: 0, position: 'sticky', top: 100 },
  summaryCard: {
    background: 'var(--surface)', borderRadius: 22, padding: 22,
    border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(124,58,237,.08)',
  },
  summaryHeader: {
    marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)',
  },
  summaryEyebrow: {
    fontSize: 9, fontWeight: 700, color: '#A78BFA',
    letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6,
  },
  salonTag: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em',
  },
  emptySummary: { fontSize: 13, color: 'var(--text-muted)', padding: '10px 0', textAlign: 'center', fontStyle: 'italic' },
  sumRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 9, fontSize: 13 },
  sumName: { color: 'var(--text-sub)', flex: 1, lineHeight: 1.4 },
  sumPrice: { fontWeight: 600, color: 'var(--text)', flexShrink: 0, marginLeft: 8 },
  sumTotal: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, marginTop: 6, borderTop: '1.5px solid rgba(124,58,237,.15)',
  },
  sumTotalVal: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22, fontWeight: 700, color: '#7C3AED',
  },
  sumDetail: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, color: 'var(--text-sub)', padding: '8px 12px',
    background: 'var(--surface2)', borderRadius: 10, marginTop: 8,
    border: '1px solid var(--border)',
  },
  sumDetailIcon: { color: '#7C3AED', fontSize: 13 },
  checklist: { marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 14, borderTop: '1px solid var(--border)' },
  checkItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, transition: 'color .3s ease' },

  promoSection: { marginTop: 18, borderTop: '1px solid var(--border)', paddingTop: 14 },
  promoToggle: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, color: '#7C3AED', padding: 0,
  },
  promoBody: { marginTop: 12 },
  promoRow: { display: 'flex', gap: 8 },
  promoInput: {
    flex: 1, padding: '9px 14px',
    border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    background: 'var(--input-bg)', color: 'var(--text)',
    textTransform: 'uppercase', letterSpacing: '0.06em', outline: 'none',
  },
  promoApplyBtn: {
    padding: '9px 18px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    color: '#fff', border: 'none', borderRadius: 10,
    cursor: 'pointer', fontWeight: 700, fontSize: 13,
    boxShadow: '0 4px 12px rgba(124,58,237,.3)',
  },
  promoMsg: { marginTop: 8, padding: '9px 12px', borderRadius: 10, fontSize: 12, fontWeight: 500 },
};

/* ────────────────────────────────────────────
   Luxury Booking Confirmation Overlay Styles
   ──────────────────────────────────────────── */
const conf = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'linear-gradient(160deg, #060411 0%, #0D0721 45%, #17093A 100%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    overflowY: 'auto', padding: '48px 24px',
    animation: 'confirmReveal .45s cubic-bezier(.16,1,.3,1) both',
  },

  bgGlow1: {
    position: 'absolute', width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,.22) 0%, transparent 70%)',
    top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    pointerEvents: 'none', filter: 'blur(60px)',
    animation: 'ambientDrift 24s ease-in-out infinite',
  },
  bgGlow2: {
    position: 'absolute', width: 360, height: 360, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(236,72,153,.14) 0%, transparent 70%)',
    top: '20%', right: '10%', pointerEvents: 'none', filter: 'blur(50px)',
  },
  bgGlow3: {
    position: 'absolute', width: 280, height: 280, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(191,155,101,.1) 0%, transparent 70%)',
    bottom: '15%', left: '8%', pointerEvents: 'none', filter: 'blur(60px)',
  },

  content: {
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', maxWidth: 560, width: '100%',
  },

  eyebrow: {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase',
    color: 'rgba(196,181,253,.7)', marginBottom: 36,
    display: 'inline-flex', alignItems: 'center',
    background: 'rgba(255,255,255,.05)', padding: '8px 20px', borderRadius: 30,
    border: '1px solid rgba(255,255,255,.09)',
  },

  checkWrap: {
    position: 'relative', marginBottom: 36,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 96, height: 96,
  },
  checkGlow: {
    position: 'absolute', width: 160, height: 160, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,.35) 0%, transparent 70%)',
    top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    animation: 'glowBreath 3s ease-in-out infinite',
  },
  checkCircle: {
    width: 96, height: 96, borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(124,58,237,.2) 0%, rgba(236,72,153,.15) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 0 1px rgba(124,58,237,.35), 0 12px 40px rgba(124,58,237,.3)',
  },

  salonName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 700,
    color: '#F0EAFF', margin: '0 0 10px',
    lineHeight: 1.1, letterSpacing: '-0.02em',
  },
  salonSub: {
    fontSize: 15, color: 'rgba(196,181,253,.55)', margin: '0 0 28px',
    fontStyle: 'italic', fontFamily: "'Cormorant Garamond', Georgia, serif",
    letterSpacing: '0.02em',
  },

  rule: {
    width: 48, height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(167,139,250,.5), transparent)',
    marginBottom: 28,
  },

  detailCard: {
    width: '100%', borderRadius: 20,
    background: 'rgba(255,255,255,.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,.08)',
    padding: '8px 0',
    marginBottom: 32,
    boxShadow: '0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.06)',
  },
  detailRow: {
    display: 'flex', alignItems: 'flex-start', gap: 14,
    padding: '14px 24px',
    borderBottom: '1px solid rgba(255,255,255,.05)',
    marginBottom: 0, textAlign: 'left',
  },
  detailIconWrap: {
    width: 30, height: 30, borderRadius: 9, flexShrink: 0,
    background: 'rgba(124,58,237,.15)', border: '1px solid rgba(167,139,250,.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 9, fontWeight: 700, color: 'rgba(167,139,250,.65)',
    letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4,
  },
  detailVal: {
    fontSize: 14, fontWeight: 500, color: '#E9D5FF', lineHeight: 1.5,
  },

  ctaRow: {
    display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 380,
  },
  primaryCTA: {
    width: '100%', padding: '15px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #EC4899 100%)',
    color: '#fff', border: 'none', borderRadius: 14,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: '0 8px 28px rgba(124,58,237,.45), inset 0 1px 0 rgba(255,255,255,.18)',
    transition: 'transform .18s ease, box-shadow .18s ease',
    letterSpacing: '0.01em',
  },
  ghostCTA: {
    width: '100%', padding: '14px',
    background: 'rgba(255,255,255,.06)',
    color: 'rgba(196,181,253,.8)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 14,
    fontSize: 14, fontWeight: 500, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'background .18s ease, border-color .18s ease',
    letterSpacing: '0.01em',
  },
};

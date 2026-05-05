import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { c } from '../../styles/theme';

const DAY_ABBR  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

const STAFF_COLORS = ['#7C3AED','#EC4899','#2563EB','#059669','#D97706','#DC2626'];

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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthLabel: { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: 'var(--text)' },
  navBtn: {
    width: 34, height: 34, borderRadius: 10,
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)', cursor: 'pointer', fontSize: 18, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
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
    borderColor: 'transparent', boxShadow: '0 5px 16px rgba(124,58,237,.38)', transform: 'translateY(-2px)',
  },
  chipPast:   { background: 'var(--surface2)', borderColor: 'transparent', cursor: 'not-allowed', opacity: 0.45 },
  chipClosed: { background: 'var(--surface2)', borderColor: 'transparent', cursor: 'not-allowed', opacity: 0.55 },
  chipToday:  { borderColor: '#7C3AED', boxShadow: '0 0 0 3px rgba(124,58,237,.14)' },
  abbr: { fontSize: 9, fontWeight: 700, letterSpacing: '0.08em' },
  num:  { fontSize: 22, fontWeight: 800, lineHeight: 1.1 },
  numPast: { textDecoration: 'line-through' },
  tag: { height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

const STEPS = ['Services', 'Professional', 'Date', 'Time', 'Confirm'];

export default function BookSalon() {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffId, setStaffId] = useState(null); // null = any available
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);

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

  const toggleService = id => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

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
      };
      await api.post('/bookings/', payload);
      navigate('/user/bookings');
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Booking failed');
    } finally { setSubmitting(false); }
  };

  if (!salon) return (
    <div style={s.loader}><div style={s.loaderSpinner} /></div>
  );

  const selectedServices = services.filter(ss => selected.includes(ss.id));
  const total = selectedServices.reduce((sum, ss) => sum + Number(ss.effective_price), 0);
  const selectedStaffName = staffId === null ? 'Any Available' : staffList.find(m => m.id === staffId)?.full_name || '';

  // step 1 (Professional) is always "done" — any available is a valid default
  const stepDone = [selected.length > 0, true, !!date, !!slot, true];
  const canAdvance = stepDone[step];

  const goNext = () => { if (canAdvance && step < 4) setStep(s => s + 1); };
  const goPrev = () => { if (step > 0) setStep(s => s - 1); };

  return (
    <div>
      <Link to={`/salons/${salonId}`} style={s.back}>← Back to {salon.name}</Link>

      {/* Progress bar */}
      <div style={s.progress} className="fade-up">
        {STEPS.map((label, i) => (
          <div key={label} style={s.progressStep} onClick={() => i < step && setStep(i)}>
            <div style={{
              ...s.progressDot,
              background: i <= step ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : 'var(--border)',
              boxShadow: i === step ? '0 0 0 4px rgba(124,58,237,.2)' : 'none',
              cursor: i < step ? 'pointer' : 'default',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <div style={{ ...s.progressLabel, color: i <= step ? c.primary : c.textLight, fontWeight: i === step ? 700 : 500 }}>
              {label}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ ...s.progressLine, background: i < step ? 'linear-gradient(90deg, #7C3AED, #EC4899)' : 'var(--border)' }} />
            )}
          </div>
        ))}
      </div>

      <div style={s.layout}>
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
                      className={`svc-card ${on ? 'svc-selected' : ''}`}
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
                      <div style={{ ...s.svcPrice, color: on ? c.primary : c.textSub }}>
                        LKR {ss.effective_price}
                      </div>
                    </label>
                  );
                })}
                {services.length === 0 && <p style={{ color: c.textMuted }}>No services available at this salon.</p>}
              </div>
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
                  <span style={{ color: c.textMuted, fontSize: 13 }}>Loading team…</span>
                </div>
              ) : (
                <div style={s.staffGrid}>
                  {/* Any Available option */}
                  <div
                    style={{ ...s.staffCard, ...(staffId === null ? s.staffCardOn : {}) }}
                    onClick={() => setStaffId(null)}
                  >
                    <div style={{ ...s.staffAvatar, background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)' }}>✦</div>
                    <div style={s.staffInfo}>
                      <div style={s.staffName}>Any Available Professional</div>
                      <div style={s.staffRole}>Show all open time slots</div>
                    </div>
                    {staffId === null && <div style={s.staffCheck}>✓</div>}
                  </div>

                  {/* Staff members */}
                  {staffList.map((member, i) => {
                    const color = STAFF_COLORS[i % STAFF_COLORS.length];
                    const isOn = staffId === member.id;
                    return (
                      <div
                        key={member.id}
                        style={{ ...s.staffCard, ...(isOn ? s.staffCardOn : {}) }}
                        onClick={() => setStaffId(member.id)}
                      >
                        <div style={{ ...s.staffAvatar, background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)` }}>
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
                  <span style={{ fontSize: 18 }}>◷</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>
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
                  <span style={{ color: c.textMuted, fontSize: 13 }}>Loading available slots…</span>
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
                        className={`slot-btn ${isOn ? 'slot-active' : ''}`}
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
        <div style={s.sidebar}>
          <div style={s.summaryCard} className="fade-up d2">
            <div style={s.summaryTitle}>
              <span>Booking Summary</span>
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
              <div style={s.sumTotal}>
                <span style={{ fontWeight: 600 }}>Total</span>
                <span style={s.sumTotalVal}>LKR {total.toFixed(2)}</span>
              </div>
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

            {/* Step checklist */}
            <div style={s.checklist}>
              {STEPS.map((label, i) => (
                <div key={label} style={{ ...s.checkItem, color: stepDone[i] ? c.success : c.textLight }}>
                  <span>{stepDone[i] ? '✓' : '○'}</span>
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
    border: '3px solid #EDE9FE', borderTopColor: '#7C3AED',
    animation: 'spinSlow .7s linear infinite',
  },
  back: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, color: c.primary, fontWeight: 500, marginBottom: 24,
  },

  progress: {
    display: 'flex', alignItems: 'center', marginBottom: 32,
    background: 'var(--surface)', borderRadius: 16, padding: '18px 28px',
    boxShadow: '0 2px 10px rgba(124,58,237,.07)',
    border: '1px solid var(--border)',
  },
  progressStep: { display: 'flex', alignItems: 'center', flex: 1 },
  progressDot: {
    width: 30, height: 30, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
    transition: 'background .3s ease, box-shadow .3s ease',
  },
  progressLabel: { fontSize: 11, marginLeft: 6, whiteSpace: 'nowrap', transition: 'color .3s ease' },
  progressLine: { flex: 1, height: 2, margin: '0 8px', borderRadius: 2, transition: 'background .3s ease' },

  layout: { display: 'flex', gap: 24, alignItems: 'flex-start' },
  formCol: { flex: 1 },

  stepCard: {
    background: 'var(--surface)', borderRadius: 20, padding: 28,
    boxShadow: '0 4px 20px rgba(124,58,237,.08)',
    border: '1px solid var(--border)', marginBottom: 16,
  },
  stepHeader: { display: 'flex', gap: 16, alignItems: 'center', marginBottom: 22 },
  stepIcon: {
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,.3)',
  },
  stepTitle: { fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700, color: c.text },
  stepSub: { fontSize: 13, color: c.textMuted, marginTop: 2 },
  alert: {
    background: '#FEF2F2', border: '1px solid #FCA5A5',
    color: '#DC2626', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16,
  },

  serviceGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  serviceCard: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
    border: '2px solid var(--border)', borderRadius: 14, cursor: 'pointer',
    background: 'var(--surface)',
  },
  serviceCardOn: {},
  svcCheck: { flexShrink: 0 },
  checkBox: {
    width: 22, height: 22, borderRadius: 6, border: '2px solid #D1D5DB',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: '#fff', transition: 'all .2s ease',
  },
  checkBoxOn: { background: 'linear-gradient(135deg, #7C3AED, #EC4899)', borderColor: 'transparent' },
  svcInfo: { flex: 1 },
  svcName: { fontWeight: 600, fontSize: 14, color: c.text, marginBottom: 2 },
  svcMeta: { fontSize: 12, color: c.textMuted },
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
    boxShadow: '0 3px 12px rgba(124,58,237,.14)',
  },
  staffAvatar: {
    width: 46, height: 46, borderRadius: 14, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, fontWeight: 800, color: '#fff',
    boxShadow: '0 3px 10px rgba(0,0,0,.15)',
  },
  staffInfo: { flex: 1 },
  staffName: { fontWeight: 600, fontSize: 14, color: c.text, marginBottom: 2 },
  staffRole: { fontSize: 12, color: c.textMuted },
  staffCheck: {
    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
  },
  noStaffNote: {
    padding: '16px 18px', borderRadius: 12, fontSize: 13,
    color: c.textMuted, background: 'var(--surface2)',
    border: '1px solid var(--border)', fontStyle: 'italic',
  },

  selectedDateBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    marginTop: 18, padding: '13px 16px',
    background: 'var(--surface2)', borderRadius: 12,
    border: '1px solid var(--border)', fontSize: 14,
  },

  slotLoading: { display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' },
  noSlots: {
    color: c.textMuted, fontSize: 14, padding: '20px 0',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  backDateBtn: {
    display: 'inline-block', background: c.primarySoft, color: c.primary,
    border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, width: 'fit-content',
  },
  slotGrid: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  slotBtn: {
    padding: '10px 16px', border: '2px solid var(--border)', borderRadius: 12,
    background: 'var(--surface)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text)',
    minWidth: 72, textAlign: 'center',
  },
  slotOn: {
    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    color: '#fff', borderColor: 'transparent', boxShadow: '0 4px 12px rgba(124,58,237,.35)',
  },
  slotOff: { background: '#F9FAFB', color: '#D1D5DB', cursor: 'not-allowed', borderColor: '#F3F4F6' },

  textarea: {
    width: '100%', padding: '14px 16px',
    border: '2px solid var(--border)', borderRadius: 14,
    fontSize: 14, resize: 'vertical', fontFamily: 'inherit',
    boxSizing: 'border-box', marginBottom: 20, minHeight: 100,
    background: 'var(--input-bg)', color: c.text,
  },
  confirmBtn: {
    width: '100%', padding: '15px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    color: '#fff', border: 'none', borderRadius: 14,
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(124,58,237,.35)',
    transition: 'opacity .2s ease, transform .2s ease',
  },

  stepNav: { display: 'flex', justifyContent: 'space-between', gap: 12 },
  prevBtn: {
    padding: '10px 22px', background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: 10,
    cursor: 'pointer', fontSize: 14, fontWeight: 500, color: c.textSub,
  },
  nextBtn: {
    flex: 1, padding: '12px 24px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    color: '#fff', border: 'none', borderRadius: 10,
    cursor: 'pointer', fontSize: 14, fontWeight: 700,
    boxShadow: '0 4px 14px rgba(124,58,237,.3)', transition: 'opacity .2s ease',
  },

  sidebar: { width: 260, flexShrink: 0, position: 'sticky', top: 100 },
  summaryCard: {
    background: 'var(--surface)', borderRadius: 20, padding: 22,
    border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(124,58,237,.08)',
  },
  summaryTitle: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: c.text,
    marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)',
  },
  salonTag: {
    fontSize: 11, color: c.primary, background: c.primarySoft,
    borderRadius: 20, padding: '2px 10px', fontFamily: 'Inter, sans-serif', fontWeight: 600,
  },
  emptySummary: { fontSize: 13, color: c.textLight, padding: '10px 0', textAlign: 'center', fontStyle: 'italic' },
  sumRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 },
  sumName: { color: c.textSub, flex: 1 },
  sumPrice: { fontWeight: 600, color: c.text, flexShrink: 0, marginLeft: 8 },
  sumTotal: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 16, paddingTop: 12, marginTop: 4, borderTop: '2px solid #EDE9FE',
  },
  sumTotalVal: { fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: c.primary },
  sumDetail: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, color: c.textSub, padding: '8px 12px',
    background: 'var(--surface2)', borderRadius: 8, marginTop: 8,
    border: '1px solid var(--border)',
  },
  sumDetailIcon: { color: c.primary, fontSize: 14 },
  checklist: { marginTop: 16, display: 'flex', flexDirection: 'column', gap: 5 },
  checkItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, transition: 'color .3s ease' },
};

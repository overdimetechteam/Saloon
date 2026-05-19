import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

// ─── iOS Drum-Wheel Picker ────────────────────────────────────────────────────
function DrumWheel({ items, value, onChange, width = 64 }) {
  const ref      = useRef(null);
  const startY   = useRef(null);
  const startIdx = useRef(null);
  const ITEM_H   = 44;

  const idx = items.indexOf(value);

  const clamp = i => Math.max(0, Math.min(items.length - 1, i));

  const onPointerDown = e => {
    startY.current   = e.clientY;
    startIdx.current = idx;
    ref.current.setPointerCapture(e.pointerId);
  };
  const onPointerMove = e => {
    if (startY.current === null) return;
    const delta = Math.round((startY.current - e.clientY) / ITEM_H);
    onChange(items[clamp(startIdx.current + delta)]);
  };
  const onPointerUp = () => { startY.current = null; };

  const onWheel = e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    onChange(items[clamp(idx + delta)]);
  };

  useEffect(() => {
    const el = ref.current;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ width, height: ITEM_H * 5, overflow: 'hidden', position: 'relative',
               userSelect: 'none', touchAction: 'none', cursor: 'ns-resize' }}
    >
      {/* selector highlight */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: ITEM_H * 2, height: ITEM_H,
        background: 'rgba(13,148,136,.12)',
        borderTop: '1.5px solid rgba(13,148,136,.35)',
        borderBottom: '1.5px solid rgba(13,148,136,.35)',
        borderRadius: 6, zIndex: 1, pointerEvents: 'none',
      }} />
      {/* fade top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H * 2,
        background: 'linear-gradient(to bottom, var(--surface) 0%, transparent 100%)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      {/* fade bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H * 2,
        background: 'linear-gradient(to top, var(--surface) 0%, transparent 100%)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      {/* items */}
      <div style={{
        transform: `translateY(${(2 - idx) * ITEM_H}px)`,
        transition: 'transform .18s cubic-bezier(.25,.46,.45,.94)',
      }}>
        {items.map(item => (
          <div
            key={item}
            onClick={() => onChange(item)}
            style={{
              height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: item === value ? 26 : 18,
              fontWeight: item === value ? 700 : 400,
              color: item === value ? '#0D9488' : 'var(--text-muted)',
              transition: 'all .15s ease',
              cursor: 'pointer',
            }}
          >
            {String(item).padStart(2, '0')}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Time Picker ─────────────────────────────────────────────────────────────
function TimePicker({ value, onChange }) {
  const hours   = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const periods = ['AM', 'PM'];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
      <DrumWheel items={hours}   value={value.hour}   onChange={h => onChange({ ...value, hour: h })} width={70} />
      <span style={{ fontSize: 32, fontWeight: 700, color: '#0D9488', marginBottom: 4 }}>:</span>
      <DrumWheel items={minutes} value={value.minute} onChange={m => onChange({ ...value, minute: m })} width={70} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 8 }}>
        {periods.map(p => (
          <button
            key={p}
            onClick={() => onChange({ ...value, period: p })}
            style={{
              padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 14,
              background: value.period === p ? '#0D9488' : 'var(--surface2)',
              color: value.period === p ? '#fff' : 'var(--text-muted)',
              transition: 'all .15s ease',
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Radius Slider ────────────────────────────────────────────────────────────
function RadiusSlider({ value, onChange }) {
  const marks = [1, 2, 5, 10, 20, 50];
  return (
    <div style={{ padding: '0 8px' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 42, fontWeight: 800, color: '#0D9488' }}>{value}</span>
        <span style={{ fontSize: 16, color: 'var(--text-muted)', marginLeft: 6 }}>km</span>
      </div>
      <input
        type="range" min={1} max={50} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#0D9488', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        {marks.map(m => (
          <button
            key={m}
            onClick={() => onChange(m)}
            style={{
              padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              background: value === m ? '#0D9488' : 'var(--surface2)',
              color: value === m ? '#fff' : 'var(--text-muted)',
            }}
          >
            {m}km
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Category icons ───────────────────────────────────────────────────────────
const CAT_ICON = { Hair: '✂', Nails: '💅', Skin: '✨', Makeup: '💄' };

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function QuickSearchModal({ onClose }) {
  const navigate = useNavigate();
  const [step, setStep]           = useState(0); // 0=service 1=time 2=location 3=gender
  const [services, setServices]   = useState([]);
  const [selService, setSelSvc]   = useState(null);
  const [time, setTime]           = useState({ hour: 10, minute: 0, period: 'AM' });
  const [radius, setRadius]       = useState(10);
  const [userPos, setUserPos]     = useState(null);
  const [locError, setLocError]   = useState('');
  const [locLoading, setLocLoad]  = useState(false);
  const [gender, setGender]       = useState('any');
  const [results, setResults]     = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    api.get('/services/all/').then(r => setServices(r.data)).catch(() => {});
  }, []);

  // group services by category
  const byCategory = services.reduce((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported by your browser.'); return; }
    setLocLoad(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoad(false);
      },
      () => {
        setLocError('Could not get your location. Please allow location access.');
        setLocLoad(false);
      },
      { timeout: 10000 }
    );
  };

  const to24h = ({ hour, minute, period }) => {
    let h = hour;
    if (period === 'AM' && h === 12) h = 0;
    if (period === 'PM' && h !== 12) h += 12;
    return `${String(h).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
  };

  const runSearch = async () => {
    setSearching(true);
    const params = new URLSearchParams();
    if (selService) params.set('service_id', selService.id);
    params.set('time', to24h(time));
    if (userPos) { params.set('lat', userPos.lat); params.set('lng', userPos.lng); }
    params.set('radius', radius);
    if (gender !== 'any') params.set('gender', gender);
    try {
      const r = await api.get(`/salons/quick-search/?${params}`);
      setResults(r.data);
    } catch {
      setResults([]);
    }
    setSearching(false);
  };

  const STEPS = [
    { label: 'Service', icon: '✦' },
    { label: 'Time',    icon: '◷' },
    { label: 'Location',icon: '◎' },
    { label: 'Gender',  icon: '◈' },
  ];

  const canNext = [
    true,
    true,
    true,
    true,
  ];

  if (results !== null) {
    return (
      <Overlay onClose={onClose}>
        <div style={m.header}>
          <button style={m.back} onClick={() => setResults(null)}>← Back</button>
          <span style={m.title}>
            {results.length} Salon{results.length !== 1 ? 's' : ''} Found
          </span>
          <button style={m.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '16px 24px', overflowY: 'auto', maxHeight: 480 }}>
          {results.length === 0 && (
            <div style={m.empty}>No salons match your criteria. Try expanding the radius or changing filters.</div>
          )}
          {results.map(salon => (
            <div
              key={salon.id}
              style={m.resultCard}
              onClick={() => { navigate(`/salons/${salon.id}`); onClose(); }}
            >
              <div style={m.cardName}>{salon.name}</div>
              <div style={m.cardSub}>
                {salon.address_city}, {salon.address_district}
                {salon.gender_focus !== 'unisex' && (
                  <span style={m.genderBadge}>
                    {salon.gender_focus === 'male' ? '♂ Barbershop' : '♀ Ladies Salon'}
                  </span>
                )}
              </div>
              <div style={m.cardTags}>
                {(salon.service_names || []).slice(0, 4).map(name => (
                  <span key={name} style={m.tag}>{name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      {/* Header */}
      <div style={m.header}>
        <span style={m.title}>Book Now!</span>
        <button style={m.closeBtn} onClick={onClose}>✕</button>
      </div>

      {/* Step indicator */}
      <div style={m.steps}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                ...m.stepDot,
                background: i <= step ? '#0D9488' : 'var(--border)',
                color: i <= step ? '#fff' : 'var(--text-muted)',
                cursor: i < step ? 'pointer' : 'default',
              }}
              onClick={() => i < step && setStep(i)}
            >
              {i < step ? '✓' : s.icon}
            </div>
            <span style={{ fontSize: 12, color: i === step ? '#0D9488' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400 }}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div style={{ width: 24, height: 1, background: i < step ? '#0D9488' : 'var(--border)', margin: '0 4px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div style={{ padding: '16px 24px 8px', overflowY: 'auto', maxHeight: 380 }}>

        {/* Step 0: Service */}
        {step === 0 && (
          <div>
            <p style={m.hint}>What service are you looking for?</p>
            {/* Any service option */}
            <div
              style={{ ...m.anyCard, border: !selService ? '2px solid #0D9488' : '2px solid var(--border)' }}
              onClick={() => setSelSvc(null)}
            >
              <span style={{ fontSize: 20 }}>✦</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Any Service</span>
            </div>
            {Object.entries(byCategory).map(([cat, svcs]) => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={m.catLabel}>{CAT_ICON[cat] || '•'} {cat}</div>
                <div style={m.serviceGrid}>
                  {svcs.map(svc => (
                    <div
                      key={svc.id}
                      style={{
                        ...m.serviceChip,
                        background: selService?.id === svc.id ? '#0D9488' : 'var(--surface2)',
                        color: selService?.id === svc.id ? '#fff' : 'var(--text)',
                        border: selService?.id === svc.id ? '2px solid #0D9488' : '2px solid var(--border)',
                      }}
                      onClick={() => setSelSvc(svc)}
                    >
                      {svc.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Time */}
        {step === 1 && (
          <div>
            <p style={m.hint}>What time works for you?</p>
            <div style={{ background: 'var(--surface2)', borderRadius: 16, padding: '20px 16px', margin: '0 auto', maxWidth: 280 }}>
              <TimePicker value={time} onChange={setTime} />
            </div>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
              Shows salons open at {time.hour}:{String(time.minute).padStart(2,'0')} {time.period}
            </p>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div>
            <p style={m.hint}>How far are you willing to travel?</p>
            {!userPos ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Allow location access to filter by distance
                </p>
                <button style={m.locBtn} onClick={requestLocation} disabled={locLoading}>
                  {locLoading ? 'Getting location…' : '⊕ Use My Location'}
                </button>
                {locError && <p style={{ color: '#DC2626', fontSize: 12, marginTop: 8 }}>{locError}</p>}
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                  Or skip — we'll show all matching salons regardless of distance
                </p>
              </div>
            ) : (
              <div>
                <div style={m.locGranted}>
                  <span>⊕</span>
                  <span style={{ fontSize: 13 }}>Location detected — set your radius below</span>
                  <button style={m.changeBtn} onClick={() => setUserPos(null)}>Change</button>
                </div>
                <RadiusSlider value={radius} onChange={setRadius} />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Gender */}
        {step === 3 && (
          <div>
            <p style={m.hint}>Which type of salon?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              {[
                { val: 'any',    icon: '✦', label: 'Any',            sub: 'Show all salons' },
                { val: 'female', icon: '♀', label: 'Ladies Salon',   sub: 'Hair, nails, skin & beauty for women' },
                { val: 'male',   icon: '♂', label: 'Barbershop',     sub: 'Hair cut, beard & grooming for men' },
              ].map(opt => (
                <div
                  key={opt.val}
                  style={{
                    ...m.genderCard,
                    border: gender === opt.val ? '2px solid #0D9488' : '2px solid var(--border)',
                    background: gender === opt.val ? '#F0FDFA' : 'var(--surface2)',
                  }}
                  onClick={() => setGender(opt.val)}
                >
                  <span style={{ fontSize: 24, color: '#0D9488' }}>{opt.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{opt.sub}</div>
                  </div>
                  {gender === opt.val && <span style={{ marginLeft: 'auto', color: '#0D9488', fontSize: 18 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={m.footer}>
        {step > 0 && (
          <button style={m.backBtn} onClick={() => setStep(s => s - 1)}>← Back</button>
        )}
        {step < 3 ? (
          <button style={m.nextBtn} onClick={() => setStep(s => s + 1)}>
            Next →
          </button>
        ) : (
          <button style={{ ...m.nextBtn, minWidth: 160 }} onClick={runSearch} disabled={searching}>
            {searching ? 'Searching…' : '✦ Find Salons'}
          </button>
        )}
      </div>
    </Overlay>
  );
}

function Overlay({ onClose, children }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)',
        }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 901,
        width: 'min(520px, 96vw)',
        background: 'var(--surface)',
        borderRadius: 20,
        boxShadow: '0 24px 64px rgba(13,148,136,.18), 0 8px 24px rgba(0,0,0,.12)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        maxHeight: '90vh',
      }}>
        {children}
      </div>
    </>
  );
}

const m = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px 16px',
    borderBottom: '1px solid var(--border)',
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20, fontWeight: 700, color: 'var(--text)',
  },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 16, color: 'var(--text-muted)', padding: '4px 8px', borderRadius: 8,
  },
  back: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 14, color: '#0D9488', padding: '4px 8px', fontWeight: 600,
  },
  steps: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '14px 24px',
    borderBottom: '1px solid var(--border)',
    gap: 4,
  },
  stepDot: {
    width: 28, height: 28, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
    transition: 'all .2s ease',
  },
  hint: {
    fontSize: 15, fontWeight: 600, color: 'var(--text)',
    marginBottom: 16, marginTop: 0,
  },
  catLabel: {
    fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    marginBottom: 8,
  },
  serviceGrid: {
    display: 'flex', flexWrap: 'wrap', gap: 8,
  },
  serviceChip: {
    padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', transition: 'all .15s ease',
  },
  anyCard: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', borderRadius: 12, marginBottom: 16,
    cursor: 'pointer', background: 'var(--surface2)',
    transition: 'all .15s ease',
  },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: 10,
    padding: '16px 24px',
    borderTop: '1px solid var(--border)',
  },
  backBtn: {
    padding: '10px 20px', background: 'transparent',
    border: '1px solid var(--border)', borderRadius: 10,
    cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)',
  },
  nextBtn: {
    padding: '10px 28px',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 100%)',
    color: '#fff', border: 'none', borderRadius: 10,
    cursor: 'pointer', fontSize: 14, fontWeight: 700,
    boxShadow: '0 4px 14px rgba(13,148,136,.35)',
    transition: 'opacity .15s ease',
  },
  locBtn: {
    padding: '11px 24px',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 100%)',
    color: '#fff', border: 'none', borderRadius: 10,
    cursor: 'pointer', fontSize: 14, fontWeight: 700,
    boxShadow: '0 4px 14px rgba(13,148,136,.35)',
  },
  locGranted: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px', borderRadius: 10,
    background: '#F0FDFA', border: '1px solid #99F6E4',
    fontSize: 13, color: '#0D9488', marginBottom: 20,
  },
  changeBtn: {
    marginLeft: 'auto', background: 'none', border: 'none',
    cursor: 'pointer', fontSize: 12, color: '#0D9488',
    fontWeight: 600, textDecoration: 'underline',
  },
  genderCard: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 16px', borderRadius: 12,
    cursor: 'pointer', transition: 'all .15s ease',
  },
  resultCard: {
    padding: '14px 16px', borderRadius: 12,
    border: '1.5px solid var(--border)',
    marginBottom: 10, cursor: 'pointer',
    transition: 'box-shadow .15s ease, border-color .15s ease',
    background: 'var(--surface)',
  },
  cardName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 17, fontWeight: 700, color: 'var(--text)',
  },
  cardSub: {
    fontSize: 13, color: 'var(--text-muted)', marginTop: 3,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  cardTags: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 },
  tag: {
    padding: '3px 10px', borderRadius: 20, fontSize: 11,
    background: '#F0FDFA', color: '#0D9488',
    border: '1px solid #99F6E4', fontWeight: 500,
  },
  genderBadge: {
    padding: '2px 8px', borderRadius: 20, fontSize: 11,
    background: '#F0FDFA', color: '#0D9488',
    border: '1px solid #99F6E4', fontWeight: 600,
  },
  empty: {
    textAlign: 'center', fontSize: 14, color: 'var(--text-muted)',
    padding: '40px 20px', fontStyle: 'italic',
  },
};

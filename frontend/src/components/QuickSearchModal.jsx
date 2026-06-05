import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import MapLocationPicker from './MapLocationPicker';

// ─── Drum-Wheel ───────────────────────────────────────────────────────────────
function DrumWheel({ items, value, onChange, width = 64, fmt }) {
  const ref      = useRef(null);
  const startY   = useRef(null);
  const startIdx = useRef(null);
  const ITEM_H   = 44;
  const idx      = items.indexOf(value);
  const clamp    = i => Math.max(0, Math.min(items.length - 1, i));

  const onPointerDown = e => { startY.current = e.clientY; startIdx.current = idx; ref.current.setPointerCapture(e.pointerId); };
  const onPointerMove = e => {
    if (startY.current === null) return;
    onChange(items[clamp(startIdx.current + Math.round((startY.current - e.clientY) / ITEM_H))]);
  };
  const onPointerUp = () => { startY.current = null; };
  const onWheel = e => { e.preventDefault(); onChange(items[clamp(idx + (e.deltaY > 0 ? 1 : -1))]); };

  useEffect(() => {
    const el = ref.current;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  return (
    <div ref={ref} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      style={{ width, height: ITEM_H * 5, overflow: 'hidden', position: 'relative', userSelect: 'none', touchAction: 'none', cursor: 'ns-resize' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: ITEM_H * 2, height: ITEM_H,
        background: 'rgba(13,148,136,.12)', borderTop: '1.5px solid rgba(13,148,136,.35)',
        borderBottom: '1.5px solid rgba(13,148,136,.35)', borderRadius: 6, zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H * 2,
        background: 'linear-gradient(to bottom, var(--surface) 0%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H * 2,
        background: 'linear-gradient(to top, var(--surface) 0%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ transform: `translateY(${(2 - idx) * ITEM_H}px)`, transition: 'transform .18s cubic-bezier(.25,.46,.45,.94)' }}>
        {items.map(item => (
          <div key={item} onClick={() => onChange(item)} style={{
            height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: item === value ? 26 : 18, fontWeight: item === value ? 700 : 400,
            color: item === value ? '#0D9488' : 'var(--text-muted)', transition: 'all .15s ease', cursor: 'pointer',
          }}>
            {fmt ? fmt(item) : String(item).padStart(2, '0')}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Time Picker ──────────────────────────────────────────────────────────────
function TimePicker({ value, onChange }) {
  const hours   = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
      <DrumWheel items={hours}   value={value.hour}   onChange={h => onChange({ ...value, hour: h })} width={70} />
      <span style={{ fontSize: 32, fontWeight: 700, color: '#0D9488', marginBottom: 4 }}>:</span>
      <DrumWheel items={minutes} value={value.minute} onChange={mn => onChange({ ...value, minute: mn })} width={70}
        fmt={v => String(v).padStart(2, '0')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 8 }}>
        {['AM', 'PM'].map(per => (
          <button key={per} onClick={() => onChange({ ...value, period: per })} style={{
            padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 14,
            background: value.period === per ? '#0D9488' : 'var(--surface2)',
            color: value.period === per ? '#fff' : 'var(--text-muted)',
            transition: 'all .15s ease',
          }}>{per}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Category icons ───────────────────────────────────────────────────────────
const CAT_ICON = { Hair: '✂', Nails: '💅', Skin: '✨', Makeup: '💄', Bridal: '👰' };

// ─── to24h helper ─────────────────────────────────────────────────────────────
function to24h({ hour, minute, period }) {
  let h = hour;
  if (period === 'AM' && h === 12) h = 0;
  if (period === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function QuickSearchModal({ onClose }) {
  const navigate = useNavigate();

  // step state
  const [step, setStep] = useState(0); // 0=service 1=time 2=location 3=gender

  // step 0 — service
  const [services, setServices] = useState([]);
  const [selService, setSelSvc] = useState(null);

  // step 1 — time
  const [time, setTime] = useState(() => {
    const d = new Date();
    let h = d.getHours(), min = Math.ceil(d.getMinutes() / 5) * 5;
    if (min >= 60) { h += 1; min = 0; }
    return { hour: h % 12 || 12, minute: min < 60 ? min - (min % 5) : 0, period: h >= 12 ? 'PM' : 'AM' };
  });

  // step 2 — location (map picker)
  const [userPos, setUserPos]     = useState(null);   // { lat, lng }
  const [radius, setRadius]       = useState(10);
  const [locLabel, setLocLabel]   = useState('');     // reverse-geocoded display name
  const [showMapPicker, setShowMapPicker] = useState(false);

  // step 3 — gender
  const [gender, setGender] = useState('any');

  // results
  const [results, setResults]     = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    api.get('/services/all/').then(r => setServices(r.data)).catch(() => {});
  }, []);

  // ── Search ──
  const runSearch = async () => {
    setSearching(true);
    const params = new URLSearchParams();
    if (selService) params.set('service_id', selService.id);
    params.set('time', to24h(time));
    if (userPos) { params.set('lat', userPos.lat); params.set('lng', userPos.lng); params.set('radius', radius); }
    if (gender !== 'any') params.set('gender', gender);
    try {
      const r = await api.get(`/salons/quick-search/?${params}`);
      setResults(r.data);
    } catch { setResults([]); }
    setSearching(false);
  };

  // ── Groups for service picker ──
  const byCategory = services.reduce((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  const STEPS = [
    { label: 'Service',  icon: '✦' },
    { label: 'Time',     icon: '◷' },
    { label: 'Location', icon: '◎' },
    { label: 'Salon',    icon: '◈' },
  ];

  // ── Results screen ──
  if (results !== null) {
    return (
      <Overlay onClose={onClose}>
        <div style={m.header}>
          <button style={m.backLink} onClick={() => setResults(null)}>← Back</button>
          <span style={m.title}>{results.length} Salon{results.length !== 1 ? 's' : ''} Found</span>
          <button style={m.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '16px 24px', overflowY: 'auto', maxHeight: 480 }}>
          {results.length === 0 && (
            <div style={m.empty}>No salons match. Try a wider radius or fewer filters.</div>
          )}
          {results.map(salon => (
            <div key={salon.id} style={m.resultCard} onClick={() => { navigate(`/salons/${salon.id}`); onClose(); }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={m.cardName}>{salon.name}</div>
                {salon.distance_km != null
                  ? <span style={m.distBadge}>📍 {salon.distance_km} km</span>
                  : userPos
                    ? <span style={{ ...m.distBadge, background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>📍 Unknown</span>
                    : null
                }
              </div>
              <div style={m.cardSub}>
                {salon.address_city}{salon.address_district ? `, ${salon.address_district}` : ''}
                {salon.gender_focus !== 'unisex' && (
                  <span style={m.genderBadge}>{salon.gender_focus === 'male' ? '♂ Barbershop' : '♀ Ladies Salon'}</span>
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
              style={{ ...m.stepDot, background: i <= step ? '#0D9488' : 'var(--border)', color: i <= step ? '#fff' : 'var(--text-muted)', cursor: i < step ? 'pointer' : 'default' }}
              onClick={() => i < step && setStep(i)}
            >
              {i < step ? '✓' : s.icon}
            </div>
            <span style={{ fontSize: 12, color: i === step ? '#0D9488' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400 }}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div style={{ width: 20, height: 1, background: i < step ? '#0D9488' : 'var(--border)', margin: '0 2px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div style={{ padding: '16px 24px 8px', overflowY: 'auto', maxHeight: 400 }}>

        {/* ── Step 0: Service ── */}
        {step === 0 && (
          <div>
            <p style={m.hint}>What service are you looking for?</p>
            <div
              style={{ ...m.anyCard, border: !selService ? '2px solid #0D9488' : '2px solid var(--border)' }}
              onClick={() => setSelSvc(null)}
            >
              <span style={{ fontSize: 18 }}>✦</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Any Service</span>
            </div>
            {Object.entries(byCategory).map(([cat, svcs]) => (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={m.catLabel}>{CAT_ICON[cat] || '•'} {cat === 'Bridal' ? 'Bridal & Party' : cat}</div>
                <div style={m.serviceGrid}>
                  {svcs.map(svc => (
                    <div key={svc.id}
                      style={{ ...m.serviceChip, background: selService?.id === svc.id ? '#0D9488' : 'var(--surface2)', color: selService?.id === svc.id ? '#fff' : 'var(--text)', border: selService?.id === svc.id ? '2px solid #0D9488' : '2px solid var(--border)' }}
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

        {/* ── Step 1: Time ── */}
        {step === 1 && (
          <div>
            <p style={m.hint}>What time works for you?</p>
            <div style={{ background: 'var(--surface2)', borderRadius: 16, padding: '20px 16px', margin: '0 auto', maxWidth: 280 }}>
              <TimePicker value={time} onChange={setTime} />
            </div>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 14 }}>
              Shows salons open at {time.hour}:{String(time.minute).padStart(2, '0')} {time.period}
            </p>
          </div>
        )}

        {/* ── Step 2: Location ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={m.hint}>Where are you? We'll find salons near you.</p>

            {/* Location card — shown after picking */}
            {userPos ? (
              <div style={{ ...m.locGranted, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📍</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location set</div>
                    <div style={{ fontSize: 13, color: '#0D9488', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{locLabel || `${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}`}</div>
                  </div>
                  <button style={m.changeBtn} onClick={() => setShowMapPicker(true)}>Change</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#0D9488' }}>⊙</span>
                  <span style={{ fontSize: 13, color: '#0D9488' }}>Radius: <strong>{radius} km</strong></span>
                  <button style={{ ...m.changeBtn, marginLeft: 0 }} onClick={() => setShowMapPicker(true)}>Adjust</button>
                </div>
              </div>
            ) : (
              <button style={m.locBtn} onClick={() => setShowMapPicker(true)}>
                📍 Set My Location on Map
              </button>
            )}

            {!userPos && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                Skip this step to show all matching salons regardless of distance.
              </p>
            )}
          </div>
        )}

        {/* Map picker modal */}
        {showMapPicker && (
          <MapLocationPicker
            initialPos={userPos}
            initialRadius={radius}
            showRadius
            title="Where are you?"
            applyLabel="Use This Location"
            onClose={() => setShowMapPicker(false)}
            onApply={(pos, rad, label) => {
              setUserPos(pos);
              setRadius(rad);
              setLocLabel(label);
              setShowMapPicker(false);
            }}
          />
        )}

        {/* ── Step 3: Gender ── */}
        {step === 3 && (
          <div>
            <p style={m.hint}>Which type of salon?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {[
                { val: 'any',    icon: '✦', label: 'Any',          sub: 'Show all salons' },
                { val: 'female', icon: '♀', label: 'Ladies Salon', sub: 'Hair, nails, skin, makeup & bridal' },
                { val: 'male',   icon: '♂', label: 'Barbershop',   sub: 'Haircut, beard & grooming for men' },
              ].map(opt => (
                <div key={opt.val}
                  style={{ ...m.genderCard, border: gender === opt.val ? '2px solid #0D9488' : '2px solid var(--border)', background: gender === opt.val ? '#F0FDFA' : 'var(--surface2)' }}
                  onClick={() => setGender(opt.val)}
                >
                  <span style={{ fontSize: 22, color: '#0D9488' }}>{opt.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{opt.sub}</div>
                  </div>
                  {gender === opt.val && <span style={{ marginLeft: 'auto', color: '#0D9488', fontSize: 16 }}>✓</span>}
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
          <button style={m.nextBtn} onClick={() => setStep(s => s + 1)}>Next →</button>
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
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)', animation: 'backdropIn .22s ease both' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 901, width: 'min(520px, 96vw)',
        background: 'var(--surface)', borderRadius: 20,
        boxShadow: '0 24px 64px rgba(13,148,136,.18), 0 8px 24px rgba(0,0,0,.12)',
        border: '1px solid var(--border)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
        animation: 'scaleInBounce .28s cubic-bezier(.16,1,.3,1) both',
      }}>
        {children}
      </div>
    </>
  );
}

const m = {
  header:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' },
  title:    { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text)' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)', padding: '4px 8px', borderRadius: 8 },
  backLink: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#0D9488', padding: '4px 8px', fontWeight: 600 },
  steps:    { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 24px', borderBottom: '1px solid var(--border)', gap: 4 },
  stepDot:  { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, transition: 'all .2s ease' },
  hint:     { fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 14, marginTop: 0 },
  catLabel: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 },
  serviceGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  serviceChip: { padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .15s ease' },
  anyCard:  { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 12, marginBottom: 14, cursor: 'pointer', background: 'var(--surface2)', transition: 'all .15s ease' },
  locBtn:   { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", background: 'linear-gradient(135deg,#0D9488,#14B8A8)', color: '#fff', boxShadow: '0 2px 10px rgba(13,148,136,.3)' },
  locGranted: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 10, background: '#F0FDFA', border: '1px solid #99F6E4', fontSize: 13, color: '#0D9488' },
  changeBtn:  { marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#0D9488', fontWeight: 600, textDecoration: 'underline', flexShrink: 0 },
  genderCard: { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all .15s ease' },
  footer:   { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: '1px solid var(--border)' },
  backBtn:  { padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)' },
  nextBtn:  { padding: '10px 28px', background: 'linear-gradient(135deg,#0D9488,#14B8A8)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 14px rgba(13,148,136,.35)', transition: 'opacity .15s ease' },
  resultCard: { padding: '14px 16px', borderRadius: 12, border: '1.5px solid var(--border)', marginBottom: 10, cursor: 'pointer', background: 'var(--surface)', transition: 'border-color .15s' },
  distBadge:  { fontSize: 11, fontWeight: 700, color: '#0D9488', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap', flexShrink: 0 },
  cardName:   { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 700, color: 'var(--text)' },
  cardSub:    { fontSize: 13, color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 },
  cardTags:   { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 },
  tag:        { padding: '3px 10px', borderRadius: 20, fontSize: 11, background: '#F0FDFA', color: '#0D9488', border: '1px solid #99F6E4', fontWeight: 500 },
  genderBadge:{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: '#F0FDFA', color: '#0D9488', border: '1px solid #99F6E4', fontWeight: 600 },
  empty:      { textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', padding: '40px 20px', fontStyle: 'italic' },
};

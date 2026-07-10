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

  // responsive — hide step labels on narrow screens
  const [narrow, setNarrow] = useState(() => window.innerWidth < 500);
  useEffect(() => {
    const fn = () => setNarrow(window.innerWidth < 500);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // step 0 — service
  const [services, setServices] = useState([]);
  const [selService, setSelSvc] = useState(null);
  const [svcQuery, setSvcQuery] = useState('');

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
  const [autoLocDone, setAutoLocDone] = useState(false); // only auto-fetch once

  // step 3 — gender
  const [gender, setGender] = useState('any');

  // results
  const [results, setResults]     = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    api.get('/services/all/').then(r => setServices(r.data)).catch(() => {});
  }, []);

  // Auto-request GPS the moment the location step opens (PickMe / Uber style)
  useEffect(() => {
    if (step !== 2 || autoLocDone || userPos || gpsLoading) return;
    setAutoLocDone(true);
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const p = { lat: coords.latitude, lng: coords.longitude };
        setUserPos(p);
        // Reverse-geocode via Google to show a readable label
        try {
          const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${p.lat},${p.lng}&key=${key}&language=en`);
          const data = await res.json();
          if (data.status === 'OK' && data.results[0]) {
            const parts = data.results[0].address_components;
            const get = type => parts.find(c => c.types.includes(type))?.long_name || '';
            const sub  = get('sublocality_level_1') || get('neighborhood');
            const city = get('locality') || get('administrative_area_level_2');
            setLocLabel([sub, city].filter(Boolean).join(', ') || data.results[0].formatted_address);
          }
        } catch { /* label stays as coordinates */ }
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { timeout: 12000, enableHighAccuracy: true }
    );
  }, [step]); // eslint-disable-line

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

  const filteredByCategory = svcQuery.trim()
    ? Object.fromEntries(
        Object.entries(byCategory)
          .map(([cat, svcs]) => [cat, svcs.filter(s => s.name.toLowerCase().includes(svcQuery.toLowerCase()))])
          .filter(([, svcs]) => svcs.length > 0)
      )
    : byCategory;

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
        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
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
      <div style={{ ...m.header, padding: narrow ? '12px 16px 10px' : '20px 24px 16px' }}>
        <span style={{ ...m.title, fontSize: narrow ? 17 : 20 }}>Book Now!</span>
        <button style={m.closeBtn} onClick={onClose}>✕</button>
      </div>

      {/* Step indicator */}
      <div style={{ ...m.steps, padding: narrow ? '8px 16px' : '14px 24px' }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? '1 1 auto' : '0 0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div
                style={{
                  ...m.stepDot,
                  width: narrow ? 24 : 28, height: narrow ? 24 : 28, fontSize: narrow ? 10 : 12,
                  background: i <= step ? '#0D9488' : 'var(--border)',
                  color: i <= step ? '#fff' : 'var(--text-muted)',
                  cursor: i < step ? 'pointer' : 'default',
                }}
                onClick={() => i < step && setStep(i)}
              >
                {i < step ? '✓' : s.icon}
              </div>
              {!narrow && (
                <span style={{ fontSize: 10, fontWeight: i === step ? 700 : 400, color: i === step ? '#0D9488' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1.5, background: i < step ? '#0D9488' : 'var(--border)', margin: narrow ? '0 5px' : '0 8px', marginBottom: narrow ? 0 : 14 }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div style={{ padding: narrow ? '10px 14px 6px' : '16px 24px 8px', overflowY: 'auto', flex: 1 }}>

        {/* ── Step 0: Service ── */}
        {step === 0 && (
          <div>
            <p style={{ ...m.hint, fontSize: narrow ? 13 : 15, marginBottom: narrow ? 8 : 14 }}>What service are you looking for?</p>

            {/* Search bar */}
            <div style={{ ...m.svcSearchWrap, marginBottom: narrow ? 8 : 14 }}>
              <svg style={m.svcSearchIcon} viewBox="0 0 20 20" fill="none">
                <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              <input
                style={{ ...m.svcSearchInput, padding: narrow ? '7px 8px 7px 6px' : '10px 10px 10px 8px', fontSize: narrow ? 13 : 14 }}
                type="text"
                placeholder="Search services…"
                value={svcQuery}
                onChange={e => setSvcQuery(e.target.value)}
                autoComplete="off"
              />
              {svcQuery && (
                <button style={m.svcSearchClear} onClick={() => setSvcQuery('')}>✕</button>
              )}
            </div>

            {/* Any Service chip — hidden while searching */}
            {!svcQuery && (
              <div
                style={{ ...m.anyCard, padding: narrow ? '6px 12px' : '9px 14px', marginBottom: narrow ? 8 : 14, border: !selService ? '2px solid #0D9488' : '2px solid var(--border)' }}
                onClick={() => setSelSvc(null)}
              >
                <span style={{ fontSize: narrow ? 14 : 18 }}>✦</span>
                <span style={{ fontSize: narrow ? 12 : 14, fontWeight: 600 }}>Any Service</span>
                {!selService && <span style={{ marginLeft: 'auto', color: '#0D9488', fontSize: 13 }}>✓</span>}
              </div>
            )}

            {Object.keys(filteredByCategory).length === 0 && svcQuery ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                No services match "<strong>{svcQuery}</strong>"
              </div>
            ) : (
              Object.entries(filteredByCategory).map(([cat, svcs]) => (
                <div key={cat} style={{ marginBottom: narrow ? 8 : 14 }}>
                  <div style={{ ...m.catLabel, marginBottom: narrow ? 5 : 8 }}>{CAT_ICON[cat] || '•'} {cat === 'Bridal' ? 'Bridal & Party' : cat}</div>
                  <div style={{ ...m.serviceGrid, gap: narrow ? 5 : 8 }}>
                    {svcs.map(svc => (
                      <div key={svc.id}
                        style={{ ...m.serviceChip, padding: narrow ? '5px 10px' : '7px 14px', fontSize: narrow ? 11 : 13, background: selService?.id === svc.id ? '#0D9488' : 'var(--surface2)', color: selService?.id === svc.id ? '#fff' : 'var(--text)', border: selService?.id === svc.id ? '2px solid #0D9488' : '2px solid var(--border)' }}
                        onClick={() => setSelSvc(svc)}
                      >
                        {svc.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
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

            {/* Auto-fetching state */}
            {gpsLoading && !userPos && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 0' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#0D9488', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Getting your location…</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Please allow location access when prompted</div>
                </div>
              </div>
            )}

            {/* Location confirmed card */}
            {userPos && (
              <div style={{ ...m.locGranted, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📍</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location set</div>
                    <div style={{ fontSize: 13, color: '#0D9488', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {locLabel || `${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}`}
                    </div>
                  </div>
                  <button style={m.changeBtn} onClick={() => setShowMapPicker(true)}>Change</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#0D9488' }}>⊙</span>
                  <span style={{ fontSize: 13, color: '#0D9488' }}>Radius: <strong>{radius} km</strong></span>
                  <button style={{ ...m.changeBtn, marginLeft: 0 }} onClick={() => setShowMapPicker(true)}>Adjust</button>
                </div>
              </div>
            )}

            {/* Fallback — shown if GPS was denied / unavailable */}
            {!gpsLoading && !userPos && (
              <>
                <button style={m.locBtn} onClick={() => setShowMapPicker(true)}>
                  📍 Set My Location on Map
                </button>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                  Skip this step to show all matching salons regardless of distance.
                </p>
              </>
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
      <div style={{ ...m.footer, padding: narrow ? '10px 14px' : '14px 24px' }}>
        {step > 0 && (
          <button style={{ ...m.backBtn, padding: narrow ? '8px 14px' : '10px 20px', fontSize: narrow ? 13 : 14 }} onClick={() => setStep(s => s - 1)}>← Back</button>
        )}
        {step < 3 ? (
          <button style={{ ...m.nextBtn, padding: narrow ? '8px 20px' : '10px 28px', fontSize: narrow ? 13 : 14 }} onClick={() => setStep(s => s + 1)}>Next →</button>
        ) : (
          <button style={{ ...m.nextBtn, minWidth: 140, padding: narrow ? '8px 20px' : '10px 28px', fontSize: narrow ? 13 : 14 }} onClick={runSearch} disabled={searching}>
            {searching ? 'Searching…' : '✦ Find Salons'}
          </button>
        )}
      </div>
    </Overlay>
  );
}

function Overlay({ onClose, children }) {
  const isMobile = window.innerWidth < 640;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center',
      padding: isMobile ? '60px 10px 10px' : '20px',
      background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)',
      animation: 'backdropIn .22s ease both',
    }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
      <div style={{
        position: 'relative', zIndex: 1,
        width: isMobile ? '100%' : 'min(520px, 96vw)',
        background: 'var(--surface)', borderRadius: 20,
        boxShadow: '0 24px 64px rgba(13,148,136,.18), 0 8px 24px rgba(0,0,0,.12)',
        border: '1px solid var(--border)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        maxHeight: isMobile ? 'calc(100dvh - 84px)' : '88vh',
        animation: 'scaleInBounce .28s cubic-bezier(.16,1,.3,1) both',
      }}>
        {children}
      </div>
    </div>
  );
}

const m = {
  header:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' },
  title:    { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text)' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)', padding: '4px 8px', borderRadius: 8 },
  backLink: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#0D9488', padding: '4px 8px', fontWeight: 600 },
  steps:    { display: 'flex', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid var(--border)' },
  stepDot:  { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, transition: 'all .2s ease' },
  hint:     { fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 14, marginTop: 0 },
  catLabel: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 },
  serviceGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  serviceChip: { padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .15s ease' },
  svcSearchWrap: {
    display: 'flex', alignItems: 'center', gap: 0,
    border: '1.5px solid var(--border)', borderRadius: 12,
    background: 'var(--surface2)', marginBottom: 14,
    transition: 'border-color .15s ease',
    overflow: 'hidden',
  },
  svcSearchIcon: { width: 16, height: 16, flexShrink: 0, marginLeft: 13, color: 'var(--text-muted)' },
  svcSearchInput: {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    padding: '10px 10px 10px 8px', fontSize: 14, color: 'var(--text)',
    fontFamily: "'DM Sans', sans-serif",
  },
  svcSearchClear: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 12, color: 'var(--text-muted)', padding: '0 12px',
    lineHeight: 1, flexShrink: 0,
  },
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

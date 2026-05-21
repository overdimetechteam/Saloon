import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../api/axios';

const RADIUS_MARKS = [1, 2, 5, 10, 20, 50];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ─── Drum Wheel ──────────────────────────────────────────────────────────────
function DrumWheel({ items, value, onChange, width = 64, fmt }) {
  const ref      = useRef(null);
  const startY   = useRef(null);
  const startIdx = useRef(null);
  const ITEM_H   = 40;
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
        background: 'rgba(13,148,136,.1)', borderTop: '1.5px solid rgba(13,148,136,.3)', borderBottom: '1.5px solid rgba(13,148,136,.3)',
        borderRadius: 6, zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H * 2,
        background: 'linear-gradient(to bottom, var(--surface) 0%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H * 2,
        background: 'linear-gradient(to top, var(--surface) 0%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ transform: `translateY(${(2 - idx) * ITEM_H}px)`, transition: 'transform .18s cubic-bezier(.25,.46,.45,.94)' }}>
        {items.map(item => (
          <div key={item} onClick={() => onChange(item)} style={{
            height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: item === value ? 22 : 16, fontWeight: item === value ? 700 : 400,
            color: item === value ? '#0D9488' : 'var(--text-muted)', transition: 'all .15s ease', cursor: 'pointer',
          }}>
            {fmt ? fmt(item) : String(item).padStart(2, '0')}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Time Picker Popover ─────────────────────────────────────────────────────
function TimePicker({ value, onChange }) {
  // value: { hour: 1-12, minute: 0|5|10…55, period: 'AM'|'PM' }
  const hours   = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', padding: '8px 4px' }}>
      <DrumWheel items={hours}   value={value.hour}   onChange={h => onChange({ ...value, hour: h })}   width={60} />
      <span style={{ fontSize: 26, fontWeight: 700, color: '#0D9488' }}>:</span>
      <DrumWheel items={minutes} value={value.minute} onChange={m => onChange({ ...value, minute: m })} width={60}
        fmt={v => String(v).padStart(2, '0')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 6 }}>
        {['AM', 'PM'].map(per => (
          <button key={per} onClick={() => onChange({ ...value, period: per })} style={{
            padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 13,
            background: value.period === per ? '#0D9488' : 'var(--surface2)',
            color: value.period === per ? '#fff' : 'var(--text-muted)',
          }}>{per}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Calendar Picker Popover ─────────────────────────────────────────────────
function CalendarPicker({ value, onChange }) {
  // value: Date object
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const [view, setView] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));

  const prevMonth = () => setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1));
  const nextMonth = () => setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1));

  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const firstDay    = view.getDay(); // 0=Sun

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ padding: '12px 14px', minWidth: 240 }}>
      {/* nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={prevMonth} style={cal.navBtn}>‹</button>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </span>
        <button onClick={nextMonth} style={cal.navBtn}>›</button>
      </div>
      {/* day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', padding: '2px 0' }}>{d}</div>
        ))}
      </div>
      {/* day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const cellDate = new Date(view.getFullYear(), view.getMonth(), d);
          const isPast   = cellDate < today;
          const isSel    = d === value.getDate() && view.getMonth() === value.getMonth() && view.getFullYear() === value.getFullYear();
          const isToday  = cellDate.getTime() === today.getTime();
          return (
            <button key={i} disabled={isPast} onClick={() => onChange(cellDate)} style={{
              ...cal.dayBtn,
              background: isSel ? '#0D9488' : isToday ? 'rgba(13,148,136,.1)' : 'transparent',
              color: isSel ? '#fff' : isPast ? 'var(--border)' : 'var(--text)',
              fontWeight: isSel || isToday ? 700 : 400,
              cursor: isPast ? 'default' : 'pointer',
              border: isToday && !isSel ? '1px solid rgba(13,148,136,.4)' : '1px solid transparent',
            }}>{d}</button>
          );
        })}
      </div>
    </div>
  );
}

const cal = {
  navBtn: {
    background: 'none', border: '1px solid var(--border)', borderRadius: 6,
    width: 28, height: 28, cursor: 'pointer', fontSize: 16,
    color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dayBtn: {
    borderRadius: 6, padding: '5px 0', fontSize: 12, textAlign: 'center',
    transition: 'all .1s',
  },
};

// ─── Popover wrapper ─────────────────────────────────────────────────────────
function Popover({ anchor, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target) && !anchor?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [anchor, onClose]);
  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', left: 0, zIndex: 300, marginTop: 6,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, boxShadow: '0 12px 36px rgba(0,0,0,.15)',
      minWidth: 240,
    }}>
      {children}
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function dateToStr(d) { return d.toISOString().slice(0, 10); }

function timeObjTo24(t) {
  let h = t.hour;
  if (t.period === 'AM' && h === 12) h = 0;
  if (t.period === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
}

function initTimeObj() {
  const d = new Date();
  let h = d.getHours(), min = Math.ceil(d.getMinutes() / 5) * 5;
  if (min >= 60) { h += 1; min = 0; }
  const period = h >= 12 ? 'PM' : 'AM';
  const hour   = h % 12 || 12;
  const minute = min < 60 ? min : 0;
  return { hour, minute: minute - (minute % 5), period };
}

function fmtDateDisplay(d) {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function fmtTimeDisplay(t) {
  return `${t.hour}:${String(t.minute).padStart(2, '0')} ${t.period}`;
}

async function geocodeAddress(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`,
    { headers: { 'Accept-Language': 'en' } }
  );
  if (!res.ok) throw new Error('Geocode failed');
  return res.json();
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NearbyPanel({ onResults, onClear, isMobile }) {
  const [mode, setMode]               = useState('gps');
  const [radius, setRadius]           = useState(10); // always 1–50
  const [gpsPos, setGpsPos]           = useState(null);
  const [gpsState, setGpsState]       = useState('idle');
  const [manualQuery, setManualQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selPlace, setSelPlace]       = useState(null);
  const [sugLoading, setSugLoading]   = useState(false);
  const [searching, setSearching]     = useState(false);
  const [active, setActive]           = useState(false);
  const [date, setDate]               = useState(() => new Date(new Date().setHours(0, 0, 0, 0)));
  const [timeObj, setTimeObj]         = useState(initTimeObj);
  const [showCal, setShowCal]         = useState(false);
  const [showTime, setShowTime]       = useState(false);
  const debounceRef = useRef(null);
  const sugRef      = useRef(null);
  const calAnchorRef  = useRef(null);
  const timeAnchorRef = useRef(null);

  useEffect(() => {
    const h = e => { if (sugRef.current && !sugRef.current.contains(e.target)) setSuggestions([]); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Auto-request GPS on mount since 'gps' is the default mode
  useEffect(() => { requestGps(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runSearch = useCallback(async (pos, r, d, t) => {
    setSearching(true);
    try {
      const params = new URLSearchParams({ lat: pos.lat, lng: pos.lng, radius: r, date: d, time: t });
      const res = await api.get(`/salons/quick-search/?${params}`);
      onResults(res.data, pos, r, d, t);
      setActive(true);
    } catch {
      onResults([], pos, r, d, t);
      setActive(true);
    }
    setSearching(false);
  }, [onResults]);

  const requestGps = () => {
    if (!navigator.geolocation) { setGpsState('denied'); return; }
    setGpsState('loading');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGpsPos(p);
        setGpsState('granted');
        runSearch(p, radius, dateToStr(date), timeObjTo24(timeObj));
      },
      () => setGpsState('denied'),
      { timeout: 12000 }
    );
  };

  const onQueryChange = e => {
    const v = e.target.value;
    setManualQuery(v); setSelPlace(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSugLoading(true);
      try { setSuggestions(await geocodeAddress(v)); } catch { setSuggestions([]); }
      setSugLoading(false);
    }, 400);
  };

  const pickSuggestion = place => {
    setSelPlace(place);
    setManualQuery(place.display_name.split(',').slice(0, 3).join(', '));
    setSuggestions([]);
  };

  const resolvedPos = mode === 'gps'
    ? gpsPos
    : (selPlace ? { lat: parseFloat(selPlace.lat), lng: parseFloat(selPlace.lon) } : null);
  const canSearch = resolvedPos !== null;

  const handleSearch = () => {
    if (!resolvedPos) return;
    runSearch(resolvedPos, radius, dateToStr(date), timeObjTo24(timeObj));
  };

  const handleClear = () => {
    setActive(false); setGpsPos(null); setGpsState('idle');
    setSelPlace(null); setManualQuery(''); setRadius(10);
    setDate(new Date(new Date().setHours(0, 0, 0, 0))); setTimeObj(initTimeObj());
    onClear();
  };

  // Re-run when radius/date/time change while active
  useEffect(() => {
    if (!active || !resolvedPos) return;
    const t = setTimeout(() => runSearch(resolvedPos, radius, dateToStr(date), timeObjTo24(timeObj)), 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius, date, timeObj]);

  const hPad = isMobile ? '12px 14px' : '14px 40px';

  return (
    <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: hPad }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Mode toggle ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={p.label}>Browse by Location</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ k: 'gps', icon: '◎', text: 'My Location' }, { k: 'manual', icon: '⊕', text: 'Select Location' }].map(opt => (
              <button key={opt.k}
                style={{ ...p.toggleBtn, ...(mode === opt.k ? p.toggleOn : {}) }}
                onClick={() => { setMode(opt.k); setActive(false); if (opt.k === 'gps') requestGps(); }}>
                <span style={{ fontSize: 11 }}>{opt.icon}</span>{opt.text}
              </button>
            ))}
          </div>
        </div>

        {/* ── Location input ── */}
        {mode === 'gps' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {gpsState === 'idle'    && <button style={p.locBtn} onClick={requestGps}>◎ Use My Current Location</button>}
            {gpsState === 'loading' && <span style={p.hint}>Getting your location…</span>}
            {gpsState === 'granted' && <span style={p.granted}>◎ Location detected</span>}
            {gpsState === 'denied'  && <span style={p.denied}>Location access denied. Please allow it in browser settings.</span>}
          </div>
        )}

        {mode === 'manual' && (
          <div style={{ position: 'relative' }} ref={sugRef}>
            <div style={p.inputWrap}>
              <span style={{ color: '#0D9488', fontSize: 14, flexShrink: 0 }}>⊕</span>
              <input style={p.input} placeholder="Type a city, area or address…"
                value={manualQuery} onChange={onQueryChange} autoComplete="off" />
              {sugLoading && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>…</span>}
              {selPlace   && <span style={{ fontSize: 13, color: '#0D9488' }}>✓</span>}
            </div>
            {suggestions.length > 0 && (
              <div style={p.sugList}>
                {suggestions.map(s => (
                  <div key={s.place_id} style={p.sugItem} onClick={() => pickSuggestion(s)}>
                    <span style={{ fontSize: 12, color: '#0D9488', flexShrink: 0 }}>◎</span>
                    <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
                      {s.display_name.split(',').slice(0, 4).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Date + Time + Radius ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: isMobile ? 'wrap' : 'nowrap', alignItems: 'stretch' }}>

          {/* Date picker */}
          <div style={{ position: 'relative', flex: '0 0 auto' }}>
            <div ref={calAnchorRef} style={{ ...p.pickerBtn, ...(showCal ? p.pickerBtnOn : {}) }}
              onClick={() => { setShowCal(v => !v); setShowTime(false); }}>
              <span style={p.pickerIcon}>▦</span>
              <div>
                <div style={p.pickerLabel}>Date</div>
                <div style={p.pickerVal}>{fmtDateDisplay(date)}</div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>▾</span>
            </div>
            {showCal && (
              <Popover anchor={calAnchorRef.current} onClose={() => setShowCal(false)}>
                <CalendarPicker value={date} onChange={d => { setDate(d); setShowCal(false); }} />
              </Popover>
            )}
          </div>

          {/* Time picker */}
          <div style={{ position: 'relative', flex: '0 0 auto' }}>
            <div ref={timeAnchorRef} style={{ ...p.pickerBtn, ...(showTime ? p.pickerBtnOn : {}) }}
              onClick={() => { setShowTime(v => !v); setShowCal(false); }}>
              <span style={p.pickerIcon}>◷</span>
              <div>
                <div style={p.pickerLabel}>From time</div>
                <div style={p.pickerVal}>{fmtTimeDisplay(timeObj)}</div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>▾</span>
            </div>
            {showTime && (
              <Popover anchor={timeAnchorRef.current} onClose={() => setShowTime(false)}>
                <TimePicker value={timeObj} onChange={setTimeObj} />
                <div style={{ padding: '0 14px 12px', textAlign: 'right' }}>
                  <button style={{ ...p.locBtn, fontSize: 12, padding: '5px 14px' }}
                    onClick={() => setShowTime(false)}>Done</button>
                </div>
              </Popover>
            )}
          </div>

          {/* Radius */}
          <div style={{ ...p.radiusBox, flex: 1, minWidth: isMobile ? '100%' : 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={p.pickerLabel}>Radius <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(max 50 km)</span></span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0D9488' }}>{radius} km</span>
            </div>
            <input type="range" min={1} max={50} value={radius}
              onChange={e => setRadius(Math.min(50, Number(e.target.value)))}
              style={{ width: '100%', accentColor: '#0D9488', cursor: 'pointer', margin: '4px 0 6px' }} />
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {RADIUS_MARKS.map(m => (
                <button key={m} onClick={() => setRadius(m)} style={{
                  padding: '2px 9px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 600,
                  background: radius === m ? '#0D9488' : 'var(--surface2)',
                  color:      radius === m ? '#fff'    : 'var(--text-muted)',
                  transition: 'all .15s',
                }}>{m}km</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
          {active && (
            <button style={p.clearBtn} onClick={handleClear}>✕ Clear</button>
          )}
          <button
            style={{ ...p.searchBtn, opacity: canSearch ? 1 : 0.5, cursor: canSearch ? 'pointer' : 'not-allowed' }}
            onClick={handleSearch} disabled={!canSearch || searching}>
            {searching ? 'Searching…' : '◎ Find Available Salons'}
          </button>
        </div>

      </div>
    </div>
  );
}

const p = {
  label: {
    fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
    letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
  },
  toggleBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-muted)', cursor: 'pointer', transition: 'all .15s',
    fontFamily: "'DM Sans', sans-serif",
  },
  toggleOn: {
    background: 'rgba(13,148,136,.09)', color: '#0D9488', borderColor: 'rgba(13,148,136,.3)',
  },
  locBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 100%)',
    color: '#fff', boxShadow: '0 2px 10px rgba(13,148,136,.3)',
  },
  hint:    { fontSize: 13, color: 'var(--text-muted)' },
  granted: { fontSize: 13, color: '#0D9488', fontWeight: 600 },
  denied:  { fontSize: 12, color: '#DC2626' },
  inputWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '8px 14px',
  },
  input: {
    border: 'none', outline: 'none', background: 'transparent',
    flex: 1, fontSize: 14, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif",
  },
  sugList: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, marginTop: 4, overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0,0,0,.1)',
  },
  sugItem: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
  },
  pickerBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
    background: 'var(--surface2)', border: '1px solid var(--border)',
    transition: 'all .15s', userSelect: 'none', minWidth: 150,
  },
  pickerBtnOn: {
    borderColor: 'rgba(13,148,136,.4)', background: 'rgba(13,148,136,.05)',
  },
  pickerIcon: { fontSize: 18, color: '#0D9488', flexShrink: 0 },
  pickerLabel: {
    fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  pickerVal: { fontSize: 14, fontWeight: 700, color: 'var(--text)', marginTop: 1 },
  radiusBox: {
    background: 'var(--surface2)', borderRadius: 12,
    padding: '10px 14px', border: '1px solid var(--border)',
  },
  searchBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 24px', borderRadius: 20, border: 'none',
    fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 100%)',
    color: '#fff', boxShadow: '0 2px 10px rgba(13,148,136,.3)', transition: 'opacity .15s',
  },
  clearBtn: {
    padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  },
};

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom teal pin icon — no external image URLs needed
const PIN_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width:22px;height:22px;
    border-radius:50% 50% 50% 0;
    background:#0D9488;
    border:3px solid #fff;
    transform:rotate(-45deg);
    box-shadow:0 2px 8px rgba(0,0,0,.35);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -24],
});

const RADIUS_OPTIONS = [1, 2, 5, 10, 20, 50];
const DEFAULT_CENTER = { lat: 6.9271, lng: 79.8612 }; // Colombo, LK

async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!r.ok) return null;
    const d = await r.json();
    return d.display_name ? d.display_name.split(',').slice(0, 3).join(', ') : null;
  } catch { return null; }
}

async function geocodeSearch(q) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`,
    { headers: { 'Accept-Language': 'en' } }
  );
  if (!r.ok) return [];
  return r.json();
}

// ─── Map sub-components ────────────────────────────────────────────────────────

function MapClickHandler({ onPos }) {
  useMapEvents({ click(e) { onPos({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}

function MapFlyTo({ target }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (!target) return;
    if (prev.current?.lat === target.lat && prev.current?.lng === target.lng) return;
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
    prev.current = target;
  }, [target, map]);
  return null;
}

function DraggableMarker({ pos, onPos }) {
  const markerRef = useRef(null);
  return (
    <Marker
      draggable
      icon={PIN_ICON}
      position={[pos.lat, pos.lng]}
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const p = markerRef.current?.getLatLng();
          if (p) onPos({ lat: p.lat, lng: p.lng });
        },
      }}
    />
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MapLocationPicker({
  initialPos = null,
  initialRadius = 10,
  showRadius = true,
  title = 'Set Location',
  applyLabel = 'Apply',
  onApply,
  onClose,
}) {
  const initCenter = initialPos || DEFAULT_CENTER;
  const [pos, setPos]               = useState(initCenter);
  const [flyTarget, setFlyTarget]   = useState(null);
  const [radius, setRadius]         = useState(initialRadius);
  const [displayName, setDisplayName] = useState('');
  const [query, setQuery]           = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [sugLoading, setSugLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const debounceRef = useRef(null);
  const revDebRef   = useRef(null);
  const sugRef      = useRef(null);

  // Reverse-geocode whenever pos changes (debounced)
  useEffect(() => {
    if (revDebRef.current) clearTimeout(revDebRef.current);
    revDebRef.current = setTimeout(async () => {
      const name = await reverseGeocode(pos.lat, pos.lng);
      if (name) setDisplayName(name);
    }, 600);
    return () => clearTimeout(revDebRef.current);
  }, [pos]);

  // Reverse-geocode initial position immediately
  useEffect(() => {
    if (initialPos) {
      reverseGeocode(initialPos.lat, initialPos.lng).then(n => { if (n) setDisplayName(n); });
    }
  }, []); // eslint-disable-line

  // Close suggestion dropdown on outside click
  useEffect(() => {
    const h = e => { if (sugRef.current && !sugRef.current.contains(e.target)) setSuggestions([]); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSearchInput = e => {
    const v = e.target.value;
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSugLoading(true);
      try { setSuggestions(await geocodeSearch(v)); } catch { setSuggestions([]); }
      setSugLoading(false);
    }, 400);
  };

  const pickSuggestion = place => {
    const p = { lat: parseFloat(place.lat), lng: parseFloat(place.lon) };
    setPos(p);
    setFlyTarget(p);
    setDisplayName(place.display_name.split(',').slice(0, 3).join(', '));
    setQuery('');
    setSuggestions([]);
  };

  const handleGps = () => {
    if (!navigator.geolocation || gpsLoading) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const p = { lat: coords.latitude, lng: coords.longitude };
        setPos(p);
        setFlyTarget(p);
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { timeout: 12000 }
    );
  };

  const handlePosChange = useCallback(p => setPos(p), []);

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 1101, width: 'min(540px, 95vw)',
        background: 'var(--surface)', borderRadius: 18,
        boxShadow: '0 24px 64px rgba(0,0,0,.22)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 20px', overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Search */}
          <div ref={sugRef} style={{ position: 'relative' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 7px' }}>Search by city, neighborhood or ZIP code.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 14px', background: 'var(--surface2)' }}>
              <span style={{ color: '#9ca3af', fontSize: 13, flexShrink: 0 }}>🔍</span>
              <input
                style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 14, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}
                placeholder="Type a city or address…"
                value={query}
                onChange={handleSearchInput}
                autoComplete="off"
              />
              {sugLoading && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>…</span>}
            </div>
            {suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,.12)', overflow: 'hidden' }}>
                {suggestions.map(s => (
                  <div
                    key={s.place_id}
                    onClick={() => pickSuggestion(s)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text)' }}
                  >
                    <span style={{ color: '#0D9488', flexShrink: 0, marginTop: 1 }}>◎</span>
                    <span style={{ lineHeight: 1.4 }}>{s.display_name.split(',').slice(0, 4).join(', ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Location field */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid var(--border)', borderRadius: 10, padding: '11px 14px' }}>
            <span style={{ fontSize: 16, color: '#6b7280', flexShrink: 0 }}>📍</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Location</div>
              <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName || `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`}
              </div>
            </div>
          </div>

          {/* Radius dropdown */}
          {showRadius && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid var(--border)', borderRadius: 10, padding: '11px 14px', cursor: 'pointer' }}>
              <span style={{ fontSize: 14, color: '#6b7280', flexShrink: 0 }}>⊙</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Radius</div>
                <select
                  value={radius}
                  onChange={e => setRadius(Number(e.target.value))}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', width: '100%', marginTop: 2, appearance: 'none', WebkitAppearance: 'none' }}
                >
                  {RADIUS_OPTIONS.map(r => (
                    <option key={r} value={r}>{r} kilometer{r !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>▾</span>
            </div>
          )}

          {/* Map */}
          <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 300, flexShrink: 0, border: '1px solid var(--border)' }}>
            {/* GPS button overlay */}
            <button
              onClick={handleGps}
              disabled={gpsLoading}
              title="Use my location"
              style={{
                position: 'absolute', top: 10, right: 10, zIndex: 1000,
                width: 36, height: 36, background: '#fff',
                borderRadius: 8, boxShadow: '0 1px 5px rgba(0,0,0,.3)',
                border: '1px solid rgba(0,0,0,.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: gpsLoading ? 'wait' : 'pointer', fontSize: gpsLoading ? 11 : 17,
                color: '#374151',
              }}
            >
              {gpsLoading ? '…' : '⊹'}
            </button>

            {/* GPS loading overlay */}
            {gpsLoading && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 999, background: 'rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#0D9488', fontWeight: 600 }}>
                Getting your location…
              </div>
            )}

            <MapContainer
              center={[initCenter.lat, initCenter.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <DraggableMarker pos={pos} onPos={handlePosChange} />
              {showRadius && (
                <Circle
                  center={[pos.lat, pos.lng]}
                  radius={radius * 1000}
                  pathOptions={{ color: '#0D9488', fillColor: '#0D9488', fillOpacity: 0.12, weight: 2, dashArray: '6 4' }}
                />
              )}
              <MapClickHandler onPos={handlePosChange} />
              <MapFlyTo target={flyTarget} />
            </MapContainer>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
            Click the map or drag the pin to set your exact location.
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
            Cancel
          </button>
          <button
            onClick={() => onApply({ ...pos }, radius, displayName)}
            style={{
              padding: '10px 32px',
              background: 'linear-gradient(135deg, #0D9488, #14B8A8)',
              color: '#fff', border: 'none', borderRadius: 10,
              cursor: 'pointer', fontSize: 14, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: '0 4px 14px rgba(13,148,136,.35)',
            }}
          >
            {applyLabel}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GoogleMap, useJsApiLoader, Marker, Circle, Autocomplete } from '@react-google-maps/api';

const LIBRARIES = ['places'];
const DEFAULT_CENTER = { lat: 6.9271, lng: 79.8612 }; // Colombo, LK
const RADIUS_OPTIONS = [1, 2, 5, 10, 20, 50];
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}&language=en`
    );
    const data = await res.json();
    if (data.status === 'OK' && data.results.length > 0) {
      const r = data.results[0];
      const parts = r.address_components;
      const get = type => parts.find(c => c.types.includes(type))?.long_name || '';
      const sub  = get('sublocality_level_1') || get('sublocality') || get('neighborhood');
      const city = get('locality') || get('administrative_area_level_2');
      return [sub, city].filter(Boolean).join(', ') || r.formatted_address;
    }
    return null;
  } catch { return null; }
}

export default function MapLocationPicker({
  initialPos    = null,
  initialRadius = 10,
  showRadius    = true,
  title         = 'Set Location',
  applyLabel    = 'Apply',
  onApply,
  onClose,
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
    libraries: LIBRARIES,
  });

  const initCenter = initialPos || DEFAULT_CENTER;
  const [pos, setPos]                   = useState(initCenter);
  const [radius, setRadius]             = useState(initialRadius);
  const [displayName, setDisplayName]   = useState('');
  const [gpsLoading, setGpsLoading]     = useState(false);
  const [mapRef, setMapRef]             = useState(null);
  const autocompleteRef                 = useRef(null);
  const revDebRef                       = useRef(null);

  // Debounced reverse-geocode on pin move
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

  const onMapLoad = useCallback(map => setMapRef(map), []);

  const handleMapClick = useCallback(e => {
    setPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }, []);

  const handleMarkerDrag = useCallback(e => {
    setPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }, []);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    const p = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
    setPos(p);
    setDisplayName(place.formatted_address || place.name || '');
    if (mapRef) { mapRef.panTo(p); mapRef.setZoom(15); }
  };

  const handleGps = () => {
    if (!navigator.geolocation || gpsLoading) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const p = { lat: coords.latitude, lng: coords.longitude };
        setPos(p);
        if (mapRef) { mapRef.panTo(p); mapRef.setZoom(16); }
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }} />

      {/* Modal panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 1101, width: 'min(580px, 96vw)',
        background: 'var(--surface)', borderRadius: 24,
        boxShadow: '0 32px 80px rgba(0,0,0,.3)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        maxHeight: '92vh',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#0D9488', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 2 }}>Location</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{title}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Map area — explicit height so GoogleMap's height:100% resolves correctly */}
        <div style={{ position: 'relative', height: 380, flexShrink: 0, overflow: 'hidden' }}>

          {loadError && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', zIndex: 10, padding: 28 }}>
              <div style={{ textAlign: 'center', maxWidth: 320 }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>🗺️</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Maps failed to load</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  The API key may not be authorised for this domain. Add this site's URL to the <strong>allowed referrers</strong> in Google Cloud Console → APIs &amp; Services → Credentials.
                </div>
              </div>
            </div>
          )}

          {!isLoaded && !loadError && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', zIndex: 10 }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#0D9488', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 13 }}>Loading Google Maps…</div>
              </div>
            </div>
          )}

          {/* Floating search bar — Autocomplete must wrap the input directly */}
          {isLoaded && (
            <div style={{
              position: 'absolute', top: 12, left: 12, right: 12, zIndex: 20,
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(12px)',
              borderRadius: 14,
              boxShadow: '0 4px 24px rgba(0,0,0,.18)',
              padding: '0 14px',
              overflow: 'hidden',
            }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, color: '#9ca3af' }}>
                <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              <Autocomplete
                onLoad={ac => { autocompleteRef.current = ac; }}
                onPlaceChanged={handlePlaceSelect}
                options={{ componentRestrictions: { country: 'lk' } }}
                style={{ flex: 1 }}
              >
                <input
                  style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 14, color: '#111827', padding: '13px 0', fontFamily: "'DM Sans', sans-serif" }}
                  placeholder="Search city, area or address…"
                  autoComplete="off"
                />
              </Autocomplete>
            </div>
          )}

          {/* Google Map */}
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={initCenter}
              zoom={14}
              onLoad={onMapLoad}
              onClick={handleMapClick}
              options={{
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                clickableIcons: false,
              }}
            >
              <Marker
                position={pos}
                draggable
                onDragEnd={handleMarkerDrag}
                icon={{
                  path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z',
                  fillColor: '#0D9488',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2.5,
                  scale: 2.2,
                  anchor: { x: 12, y: 24 },
                }}
              />
              {showRadius && (
                <Circle
                  center={pos}
                  radius={radius * 1000}
                  options={{
                    strokeColor: '#0D9488',
                    strokeOpacity: 0.7,
                    strokeWeight: 2,
                    fillColor: '#0D9488',
                    fillOpacity: 0.08,
                  }}
                />
              )}
            </GoogleMap>
          )}

          {/* GPS button — bottom-right of map */}
          <button
            onClick={handleGps}
            disabled={gpsLoading}
            title="Use my current location"
            style={{
              position: 'absolute', bottom: 14, right: 14, zIndex: 10,
              width: 44, height: 44, background: '#fff',
              borderRadius: 12, boxShadow: '0 4px 14px rgba(0,0,0,.22)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: gpsLoading ? 'wait' : 'pointer',
            }}
          >
            {gpsLoading
              ? <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #e5e7eb', borderTopColor: '#0D9488', animation: 'spin 0.8s linear infinite' }} />
              : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" fill="#0D9488"/>
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="#0D9488" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="7" stroke="#0D9488" strokeWidth="1.5" strokeDasharray="2 0"/>
                </svg>
              )
            }
          </button>
        </div>

        {/* Location info + radius */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: showRadius ? 12 : 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(13,148,136,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              📍
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Selected location</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName || `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`}
              </div>
            </div>
          </div>

          {showRadius && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>Search radius:</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {RADIUS_OPTIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'all .15s ease',
                      border: `1.5px solid ${radius === r ? '#0D9488' : 'var(--border)'}`,
                      background: radius === r ? '#0D9488' : 'transparent',
                      color: radius === r ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'var(--surface)', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
            Cancel
          </button>
          <button
            onClick={() => onApply({ ...pos }, radius, displayName)}
            disabled={!isLoaded}
            style={{
              padding: '10px 32px',
              background: isLoaded ? 'linear-gradient(135deg, #0D9488, #14B8A8)' : 'var(--border)',
              color: isLoaded ? '#fff' : 'var(--text-muted)',
              border: 'none', borderRadius: 10,
              cursor: isLoaded ? 'pointer' : 'not-allowed',
              fontSize: 14, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: isLoaded ? '0 4px 14px rgba(13,148,136,.35)' : 'none',
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

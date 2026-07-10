import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GoogleMap, useJsApiLoader, Marker, Circle, Autocomplete } from '@react-google-maps/api';

const LIBRARIES = ['places'];
const DEFAULT_CENTER = { lat: 6.9271, lng: 79.8612 }; // Colombo, LK
const RADIUS_OPTIONS  = [1, 2, 5, 10, 20, 50];
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const MAP_STYLES = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#C8E6F5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#F5F5F5' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#F2F2F2' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#CCCCCC' }] },
];

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
      const province = get('administrative_area_level_1');
      return [sub, city, province].filter(Boolean).join(', ') || r.formatted_address;
    }
    return null;
  } catch { return null; }
}

export default function MapLocationPicker({
  initialPos     = null,
  initialRadius  = 10,
  showRadius     = true,
  title          = 'Set Location',
  applyLabel     = 'Apply',
  onApply,
  onClose,
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
    libraries: LIBRARIES,
  });

  const initCenter = initialPos || DEFAULT_CENTER;
  const [pos, setPos]           = useState(initCenter);
  const [radius, setRadius]     = useState(initialRadius);
  const [displayName, setDisplayName] = useState('');
  const [gpsLoading, setGpsLoading]   = useState(false);
  const [mapRef, setMapRef]     = useState(null);
  const autocompleteRef         = useRef(null);
  const revDebRef               = useRef(null);

  // Reverse-geocode whenever pos changes (debounced 600 ms)
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
    if (mapRef) {
      mapRef.panTo(p);
      mapRef.setZoom(15);
    }
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
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 1101, width: 'min(560px, 96vw)',
        background: 'var(--surface)', borderRadius: 20,
        boxShadow: '0 24px 64px rgba(0,0,0,.22)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '94vh',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 3 }}>Location</div>
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{title}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 20px', overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {loadError && (
            <div style={{ padding: '16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, fontSize: 13, color: '#DC2626' }}>
              Failed to load Google Maps. Check your API key.
            </div>
          )}

          {/* Search — Google Places Autocomplete */}
          {isLoaded && (
            <Autocomplete
              onLoad={ac => { autocompleteRef.current = ac; }}
              onPlaceChanged={handlePlaceSelect}
              options={{ componentRestrictions: { country: 'lk' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 14px', background: 'var(--surface2)' }}>
                <span style={{ color: '#9ca3af', fontSize: 13, flexShrink: 0 }}>🔍</span>
                <input
                  style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 14, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}
                  placeholder="Search city or address…"
                  autoComplete="off"
                />
              </div>
            </Autocomplete>
          )}

          {/* Selected location label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid var(--border)', borderRadius: 10, padding: '11px 14px' }}>
            <span style={{ fontSize: 16, color: '#6b7280', flexShrink: 0 }}>📍</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Selected Location</div>
              <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName || `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`}
              </div>
            </div>
          </div>

          {/* Radius picker */}
          {showRadius && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid var(--border)', borderRadius: 10, padding: '11px 14px' }}>
              <span style={{ fontSize: 14, color: '#6b7280', flexShrink: 0 }}>⊙</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Search Radius</div>
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
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', height: 320, flexShrink: 0, border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,.08)' }}>
            {!isLoaded && !loadError && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', zIndex: 10 }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#0D9488', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                  Loading Google Maps…
                </div>
              </div>
            )}

            {isLoaded && (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={initCenter}
                zoom={14}
                onLoad={onMapLoad}
                onClick={handleMapClick}
                options={{
                  styles: MAP_STYLES,
                  disableDefaultUI: false,
                  zoomControl: true,
                  mapTypeControl: true,
                  streetViewControl: true,
                  fullscreenControl: false,
                  mapTypeControlOptions: {
                    mapTypeIds: ['roadmap', 'satellite', 'hybrid'],
                  },
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
                    strokeWeight: 2,
                    scale: 2,
                    anchor: { x: 12, y: 24 },
                  }}
                />
                {showRadius && (
                  <Circle
                    center={pos}
                    radius={radius * 1000}
                    options={{
                      strokeColor: '#0D9488',
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                      fillColor: '#0D9488',
                      fillOpacity: 0.1,
                      strokeDasharray: '6 4',
                    }}
                  />
                )}
              </GoogleMap>
            )}

            {/* GPS button overlay */}
            <button
              onClick={handleGps}
              disabled={gpsLoading}
              title="Use my current location"
              style={{
                position: 'absolute', bottom: 12, right: 12, zIndex: 10,
                width: 40, height: 40, background: '#fff',
                borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,.25)',
                border: '1px solid rgba(0,0,0,.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: gpsLoading ? 'wait' : 'pointer',
                fontSize: gpsLoading ? 11 : 18,
                color: '#0D9488',
              }}
            >
              {gpsLoading
                ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #e5e7eb', borderTopColor: '#0D9488', animation: 'spin 0.8s linear infinite' }} />
                : '⊹'}
            </button>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
            Click the map or drag the pin · Search by city or address · Use ⊹ for GPS
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'var(--surface)' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
            Cancel
          </button>
          <button
            onClick={() => onApply({ ...pos }, radius, displayName)}
            disabled={!isLoaded}
            style={{
              padding: '10px 32px',
              background: 'linear-gradient(135deg, #0D9488, #14B8A8)',
              color: '#fff', border: 'none', borderRadius: 10,
              cursor: isLoaded ? 'pointer' : 'not-allowed',
              fontSize: 14, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: '0 4px 14px rgba(13,148,136,.35)',
              opacity: isLoaded ? 1 : 0.6,
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

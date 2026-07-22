import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';

const LIBRARIES = ['places'];
const DEFAULT_CENTER = { lat: 6.9271, lng: 79.8612 }; // Colombo, LK
const RADIUS_OPTIONS = [1, 2, 5, 10, 20, 50];
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

async function geocodeSearch(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=lk&format=json&limit=8&accept-language=en&addressdetails=1`
    );
    const data = await res.json();
    if (!data.length) return [];
    return data.map(r => {
      const parts = r.display_name.split(',');
      return {
        place_id: String(r.place_id),
        description: r.display_name,
        structured_formatting: {
          main_text: r.name || parts[0].trim(),
          secondary_text: parts.slice(1).join(',').trim(),
        },
        _latlng: { lat: parseFloat(r.lat), lng: parseFloat(r.lon) },
      };
    });
  } catch { return []; }
}

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

  // Search state
  const [searchText, setSearchText]     = useState('');
  const [predictions, setPredictions]   = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching]       = useState(false);
  const usingGeocoderRef                = useRef(false);

  const autoSvcRef    = useRef(null);
  const placesSvcRef  = useRef(null);
  const debounceRef   = useRef(null);
  const revDebRef     = useRef(null);
  const dropdownRef   = useRef(null);

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

  // Init AutocompleteService as soon as the API loads (no map needed)
  useEffect(() => {
    if (!isLoaded) return;
    if (window.google?.maps?.places?.AutocompleteService) {
      autoSvcRef.current = new window.google.maps.places.AutocompleteService();
    } else {
      usingGeocoderRef.current = true; // silent fallback — Geocoding REST API
    }
  }, [isLoaded]);

  const onMapLoad = useCallback(map => {
    setMapRef(map);
    if (window.google?.maps?.places?.PlacesService) {
      placesSvcRef.current = new window.google.maps.places.PlacesService(map);
    }
  }, []);

  const handleMapClick = useCallback(e => {
    setPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    setShowDropdown(false);
  }, []);

  const handleMarkerDrag = useCallback(e => {
    setPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }, []);

  // Search input — Places AutocompleteService with Geocoding REST API as fallback
  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchText(val);
    clearTimeout(debounceRef.current);

    if (!val.trim() || val.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      if (!autoSvcRef.current || usingGeocoderRef.current) {
        // Geocoding REST API fallback
        const results = await geocodeSearch(val);
        setSearching(false);
        setPredictions(results);
        setShowDropdown(true);
        return;
      }
      autoSvcRef.current.getPlacePredictions(
        { input: val },
        async (results, status) => {
          const S = window.google.maps.places.PlacesServiceStatus;
          if (status === S.REQUEST_DENIED || status === S.UNKNOWN_ERROR || status === S.NOT_FOUND) {
            usingGeocoderRef.current = true;
            const fallback = await geocodeSearch(val);
            setSearching(false);
            setPredictions(fallback);
            setShowDropdown(true);
            return;
          }
          setSearching(false);
          if (status === S.OK && results?.length) {
            setPredictions(results);
            setShowDropdown(true);
          } else {
            setPredictions([]);
            setShowDropdown(true);
          }
        }
      );
    }, 280);
  };

  // Click a prediction → pin on map
  const selectPrediction = (pred) => {
    setSearchText(pred.structured_formatting?.main_text || pred.description);
    setPredictions([]);
    setShowDropdown(false);

    // Geocoded result — lat/lng already embedded
    if (pred._latlng) {
      const p = pred._latlng;
      setPos(p);
      setDisplayName(pred.description);
      if (mapRef) { mapRef.panTo(p); mapRef.setZoom(15); }
      return;
    }

    // Places result — need getDetails for lat/lng
    if (!placesSvcRef.current) return;
    placesSvcRef.current.getDetails(
      { placeId: pred.place_id, fields: ['geometry', 'formatted_address', 'name'] },
      (place, status) => {
        const OK = window.google.maps.places.PlacesServiceStatus.OK;
        if (status === OK && place?.geometry?.location) {
          const p = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
          setPos(p);
          setDisplayName(place.formatted_address || place.name || pred.description);
          if (mapRef) { mapRef.panTo(p); mapRef.setZoom(15); }
        }
      }
    );
  };

  const clearSearch = () => {
    setSearchText('');
    setPredictions([]);
    setShowDropdown(false);
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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
        display: 'flex', flexDirection: 'column',
        maxHeight: '92vh', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#0D9488', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 2 }}>Location</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{title}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Map area — clamp height so it's smaller on mobile, keeping footer visible */}
        <div style={{ position: 'relative', height: 'clamp(180px, 45vh, 380px)', flexShrink: 0 }}>

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

          {/* ── Custom search bar + autocomplete dropdown ── */}
          {isLoaded && (
            <div
              ref={dropdownRef}
              style={{
                position: 'absolute', top: 12, left: 12, right: 12,
                zIndex: 25,   /* above map tiles */
              }}
            >
              <>
              {/* Input pill */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(12px)',
                borderRadius: showDropdown ? '14px 14px 0 0' : 14,
                boxShadow: showDropdown
                  ? '0 2px 0 rgba(0,0,0,.04), 0 4px 24px rgba(0,0,0,.18)'
                  : '0 4px 24px rgba(0,0,0,.18)',
                padding: '0 14px',
                border: '1px solid rgba(0,0,0,.08)',
                borderBottomColor: showDropdown ? '#e5e7eb' : 'rgba(0,0,0,.08)',
              }}>
                {searching ? (
                  <div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid #e5e7eb', borderTopColor: '#0D9488', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                ) : (
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, color: '#9ca3af' }}>
                    <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                )}
                <input
                  value={searchText}
                  onChange={handleSearchInput}
                  onFocus={() => predictions.length && setShowDropdown(true)}
                  className="map-search-input"
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'transparent',
                    fontSize: 14, color: '#111827', padding: '12px 0',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  placeholder="Search city, area or address in Sri Lanka…"
                  autoComplete="off"
                  spellCheck={false}
                />
                {searchText && (
                  <button
                    onMouseDown={e => { e.preventDefault(); clearSearch(); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, lineHeight: 1, padding: '2px', flexShrink: 0 }}
                  >✕</button>
                )}
              </div>

              {/* Results dropdown */}
              {showDropdown && (
                <div style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderTop: 'none',
                  borderRadius: '0 0 14px 14px',
                  boxShadow: '0 12px 32px rgba(0,0,0,.16)',
                  overflow: 'hidden',
                  maxHeight: 230,
                  overflowY: 'auto',
                }}>
                  {predictions.length === 0 && (
                    <div style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', fontFamily: "'DM Sans', sans-serif" }}>
                      No results found
                    </div>
                  )}
                  {predictions.map((pred, i) => (
                    <button
                      key={pred.place_id}
                      onMouseDown={(e) => { e.preventDefault(); selectPrediction(pred); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '10px 14px',
                        background: 'none', border: 'none',
                        borderBottom: i < predictions.length - 1 ? '1px solid #f3f4f6' : 'none',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <svg width="14" height="16" viewBox="0 0 14 18" fill="none" style={{ flexShrink: 0, marginTop: 1, color: '#0D9488' }}>
                        <path d="M7 0C4.24 0 2 2.24 2 5c0 3.75 5 11 5 11s5-7.25 5-11c0-2.76-2.24-5-5-5zm0 6.5A1.5 1.5 0 1 1 7 3.5a1.5 1.5 0 0 1 0 3z" fill="currentColor"/>
                      </svg>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pred.structured_formatting?.main_text || pred.description}
                        </div>
                        {pred.structured_formatting?.secondary_text && (
                          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {pred.structured_formatting.secondary_text}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                  <div style={{ padding: '6px 14px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'sans-serif' }}>© OpenStreetMap contributors</span>
                  </div>
                </div>
              )}
              </>
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

          {/* GPS button */}
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

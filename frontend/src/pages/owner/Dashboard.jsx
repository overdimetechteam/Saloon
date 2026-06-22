import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { STATUS_META } from '../../styles/theme';
import { formatDuration } from '../../utils/format';
import { useBreakpoint } from '../../hooks/useMobile';
import MapLocationPicker from '../../components/MapLocationPicker';

const DAYS    = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

function TimePicker({ value, onChange, style }) {
  const [h, m] = (value || '09:00').split(':');
  const emit = (hh, mm) => onChange({ target: { value: `${hh}:${mm}` } });
  const sel = { ...style, padding: '7px 8px', appearance: 'auto', backgroundImage: 'none', cursor: 'pointer' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <select value={h} onChange={e => emit(e.target.value, m)} style={sel}>
        {HOURS.map(hh => <option key={hh} value={hh}>{hh}</option>)}
      </select>
      <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 14, userSelect: 'none' }}>:</span>
      <select value={m} onChange={e => emit(h, e.target.value)} style={sel}>
        {MINUTES.map(mm => <option key={mm} value={mm}>{mm}</option>)}
      </select>
    </div>
  );
}

function buildLocalHours(operatingHours) {
  const out = {};
  DAYS.forEach(d => {
    out[d] = operatingHours?.[d]
      ? { open: operatingHours[d].open, close: operatingHours[d].close, closed: false }
      : { open: '09:00', close: '17:00', closed: true };
  });
  return out;
}

function toApiHours(localHours) {
  const out = {};
  DAYS.forEach(d => {
    if (!localHours[d].closed) out[d] = { open: localHours[d].open, close: localHours[d].close };
  });
  return out;
}

const COSMETICS_PLANS = ['starter', 'professional', 'premium'];

const PALETTE_OPTIONS = [
  { key: 'teal',   label: 'Teal',   main: '#0D9488', light: '#14B8A8', dark: '#0B7A70', rgb: '13,148,136'  },
  { key: 'purple', label: 'Purple', main: '#613ba3', light: '#7c52b8', dark: '#4a2a8a', rgb: '97,59,163'   },
  { key: 'olive',  label: 'Olive',  main: '#707a2d', light: '#8a9438', dark: '#556120', rgb: '112,122,45'  },
];

export default function OwnerDashboard() {
  const { salon, setSalon, loading: salonLoading } = useOwner();
  const { isMobile, isTablet } = useBreakpoint();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, lowStock: 0, todayBookings: [] });
  const [homeVisit, setHomeVisit] = useState(false);
  const [homeVisitSaving, setHomeVisitSaving] = useState(false);
  const [salonServices, setSalonServices] = useState([]);
  const [cosmetics, setCosmetics] = useState(false);
  const [cosmeticsSaving, setCosmeticsSaving] = useState(false);
  const [paletteSaving, setPaletteSaving] = useState(false);
  const [genderFocus, setGenderFocus] = useState('unisex');
  const [genderSaving, setGenderSaving] = useState(false);
  const [hours, setHours] = useState({});
  const [hoursOpen, setHoursOpen] = useState(false);
  const [hoursSaving, setHoursSaving] = useState(false);
  const [hoursMsg, setHoursMsg] = useState('');
  const [locSaving, setLocSaving] = useState(false);
  const [locMsg, setLocMsg] = useState('');
  const [showLocMap, setShowLocMap] = useState(false);

  useEffect(() => {
    if (salon) {
      setHomeVisit(!!salon.home_visit_enabled);
      setCosmetics(!!salon.cosmetics_enabled);
      setGenderFocus(salon.gender_focus || 'unisex');
      setHours(buildLocalHours(salon.operating_hours));
    }
  }, [salon]);

  useEffect(() => {
    if (!salon) return;
    api.get(`/salons/${salon.id}/services/`).then(r => setSalonServices(r.data)).catch(() => {});
  }, [salon]);

  const toggleHomeVisit = async () => {
    if (!salon || homeVisitSaving) return;
    const next = !homeVisit;
    setHomeVisit(next);
    setHomeVisitSaving(true);
    try {
      await api.patch(`/salons/${salon.id}/`, { home_visit_enabled: next });
    } catch {
      setHomeVisit(!next);
    } finally {
      setHomeVisitSaving(false);
    }
  };

  const toggleSvcHV = async (ss) => {
    const next = !ss.home_visit_available;
    setSalonServices(prev => prev.map(s => s.id === ss.id ? { ...s, home_visit_available: next } : s));
    try {
      await api.patch(`/salons/${salon.id}/services/${ss.id}/`, { home_visit_available: next });
    } catch {
      setSalonServices(prev => prev.map(s => s.id === ss.id ? { ...s, home_visit_available: !next } : s));
    }
  };

  const toggleCosmetics = async () => {
    if (!salon || cosmeticsSaving) return;
    const next = !cosmetics;
    setCosmetics(next);
    setCosmeticsSaving(true);
    try {
      const r = await api.patch(`/salons/${salon.id}/`, { cosmetics_enabled: next });
      setSalon(r.data);
    } catch {
      setCosmetics(!next);
    } finally {
      setCosmeticsSaving(false);
    }
  };

  const saveGenderFocus = async (val) => {
    if (!salon || genderSaving || val === genderFocus) return;
    setGenderFocus(val);
    setGenderSaving(true);
    try {
      const r = await api.patch(`/salons/${salon.id}/`, { gender_focus: val });
      setSalon(r.data);
    } catch {
      setGenderFocus(genderFocus);
    } finally {
      setGenderSaving(false);
    }
  };

  const saveLocation = async (pos, label) => {
    if (!salon || locSaving) return;
    setLocSaving(true);
    setLocMsg('');
    try {
      const r = await api.patch(`/salons/${salon.id}/`, { latitude: pos.lat, longitude: pos.lng });
      setSalon(r.data);
      setLocMsg(label || `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);
      setTimeout(() => setLocMsg(''), 4000);
    } catch {
      setLocMsg('error');
      setTimeout(() => setLocMsg(''), 3000);
    } finally {
      setLocSaving(false);
    }
  };

  const savePalette = async (key) => {
    if (!salon || paletteSaving || salon.color_palette === key) return;
    setPaletteSaving(key);
    try {
      const r = await api.patch(`/salons/${salon.id}/`, { color_palette: key });
      setSalon(r.data);
    } catch {} finally {
      setPaletteSaving(false);
    }
  };

  const setHourField = (day, field, val) =>
    setHours(h => ({ ...h, [day]: { ...h[day], [field]: val } }));

  const toMin = t => { const [h, m] = (t || '00:00').split(':').map(Number); return h * 60 + m; };

  const saveHours = async () => {
    if (hoursSaving) return;
    for (const day of DAYS) {
      const h = hours[day];
      if (!h?.closed && toMin(h?.open) >= toMin(h?.close)) {
        setHoursMsg(`error:${day}`);
        return;
      }
    }
    setHoursSaving(true);
    setHoursMsg('');
    try {
      const r = await api.patch(`/salons/${salon.id}/`, { operating_hours: toApiHours(hours) });
      setSalon(r.data);
      setHoursMsg('saved');
      setTimeout(() => setHoursMsg(''), 2500);
    } catch {
      setHoursMsg('error');
    } finally {
      setHoursSaving(false);
    }
  };

  useEffect(() => {
    if (!salon) return;
    Promise.all([
      api.get(`/salons/${salon.id}/bookings/pending/`),
      api.get(`/salons/${salon.id}/bookings/?status=confirmed`),
      api.get(`/salons/${salon.id}/reports/low-stock/`),
      api.get(`/salons/${salon.id}/bookings/`),
    ]).then(([pending, confirmed, low, all]) => {
      const today = new Date().toDateString();
      const todayBookings = all.data.filter(
        b => new Date(b.requested_datetime.slice(0, 19)).toDateString() === today && ['pending','confirmed'].includes(b.status)
      );
      setStats({ pending: pending.data.length, confirmed: confirmed.data.length, lowStock: low.data.length, todayBookings });
    }).catch(() => {});
  }, [salon]);

  if (salonLoading) return (
    <div style={s.loader}>
      <div style={s.loaderSpinner} />
    </div>
  );

  if (!salon) return (
    <div style={s.noSalon} className="scale-in">
      <div style={s.noSalonOrb}>◈</div>
      <h3 style={s.noSalonTitle}>No Salon Registered</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 15, lineHeight: 1.7 }}>Register your salon to unlock your dashboard.</p>
      <Link to="/register/owner" style={s.heroBtn}>Register Salon</Link>
    </div>
  );

  const statCards = [
    {
      label: 'Pending Bookings', value: stats.pending,
      grad: 'linear-gradient(135deg, rgba(212,175,55,.14) 0%, rgba(212,175,55,.07) 100%)',
      color: '#D4AF37', border: 'rgba(212,175,55,.28)', icon: '⏳',
      to: '/owner/bookings',
    },
    {
      label: 'Confirmed Today', value: stats.confirmed,
      grad: 'linear-gradient(135deg, rgba(13,148,136,.14) 0%, rgba(13,148,136,.07) 100%)',
      color: '#0D9488', border: 'rgba(13,148,136,.28)', icon: '✓',
      to: '/owner/bookings',
    },
    {
      label: 'Low Stock Alerts', value: stats.lowStock,
      grad: 'linear-gradient(135deg, rgba(220,38,38,.12) 0%, rgba(220,38,38,.06) 100%)',
      color: '#DC2626', border: 'rgba(220,38,38,.25)', icon: '⚠',
      to: '/owner/reports',
    },
    {
      label: "Today's Queue", value: stats.todayBookings.length,
      grad: 'linear-gradient(135deg, rgba(13,148,136,.14) 0%, rgba(13,148,136,.07) 100%)',
      color: '#0D9488', border: 'rgba(13,148,136,.28)', icon: '◉',
      to: '/owner/bookings',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ ...s.header, flexDirection: isMobile ? 'column' : 'row' }} className="fade-up">
        <div>
          <div style={s.eyebrow}>Dashboard</div>
          <h2 style={{ ...s.title, fontSize: isMobile ? 24 : isTablet ? 26 : 30 }}>{salon.name}</h2>
          <div style={s.statusRow}>
            <span style={{ ...s.statusDot, background: salon.status === 'active' ? '#14B8A8' : '#D4AF37', boxShadow: salon.status === 'active' ? '0 0 0 4px rgba(13,148,136,.2)' : '0 0 0 4px rgba(212,175,55,.2)' }} />
            <span style={s.statusText}>
              {salon.status === 'active' ? 'Live & Accepting Bookings' : salon.status === 'pending' ? 'Pending Admin Approval' : 'Currently Inactive'}
            </span>
          </div>
        </div>
        <Link to="/owner/bookings" style={{ ...s.heroBtn, alignSelf: isMobile ? 'stretch' : 'auto', justifyContent: 'center' }} className="fade-up d2 lift-sm">
          View All Bookings →
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ ...s.statGrid, gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
        {statCards.map((sc, i) => (
          <Link
            key={sc.label}
            to={sc.to}
            style={{ ...s.statCard, background: sc.grad, border: `1px solid ${sc.border}` }}
            className={`lift-sm fade-up d${i + 1}`}
          >
            <div style={{ ...s.statIconWrap, color: sc.color, background: sc.color + '18' }}>
              {sc.icon}
            </div>
            <div style={{ ...s.statVal, color: sc.color }}>{sc.value}</div>
            <div style={{ ...s.statLabel, color: sc.color + 'AA' }}>{sc.label}</div>
            <div style={{ ...s.statArrow, color: sc.color }}>→</div>
          </Link>
        ))}
      </div>

      {/* Today's appointments */}
      <div style={s.section} className="fade-up d4">
        <div style={s.sectionHead}>
          <div>
            <div style={s.sectionEyebrow}>Today</div>
            <h3 style={s.sectionTitle}>Today's Appointments</h3>
          </div>
          <span style={s.sectionCount}>{stats.todayBookings.length} scheduled</span>
        </div>

        {stats.todayBookings.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyOrb}>◷</div>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>No appointments scheduled for today.</p>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Client', 'Time', 'Services', 'Status', ''].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.todayBookings.map(b => {
                  const meta = STATUS_META[b.status] || { label: b.status, color: '#888', bg: '#f0f0f0' };
                  return (
                    <tr key={b.id} style={s.tr}>
                      <td style={s.td}>
                        <div style={s.clientRow}>
                          <div style={{ ...s.clientAvatar, background: meta.bg, color: meta.color, boxShadow: `0 3px 10px ${meta.color}28` }}>
                            {b.client_email?.[0]?.toUpperCase()}
                          </div>
                          <span style={s.clientEmail}>{b.client_email}</span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={s.timeChip}>
                          {new Date(b.requested_datetime.slice(0, 19)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={s.svcsText}>{b.booking_services?.map(bs => bs.service_name).join(', ') || '—'}</span>
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}30` }}>
                          {meta.label}
                        </span>
                      </td>
                      <td style={s.td}>
                        <Link to={`/owner/bookings/${b.id}`} style={s.manageBtn}>Manage →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Home Visit Service Toggle ── */}
      <div style={s.hvCard} className="fade-up d5">
        <div style={s.hvLeft}>
          <div style={{ ...s.hvIconWrap, background: homeVisit ? 'rgba(13,148,136,.12)' : 'var(--surface2)', color: homeVisit ? '#0D9488' : 'var(--text-muted)' }}>
            🏠
          </div>
          <div>
            <div style={s.hvTitle}>Home Visit Service</div>
            <div style={s.hvSub}>
              {homeVisit
                ? 'Clients can request a home visit when booking'
                : 'Enable to let clients request appointments at their location'}
            </div>
          </div>
        </div>
        <button
          style={{ ...s.hvToggle, background: homeVisit ? 'linear-gradient(135deg, #0D9488, #0B7A70)' : 'var(--surface2)', border: homeVisit ? 'none' : '1.5px solid var(--border)' }}
          onClick={toggleHomeVisit}
          disabled={homeVisitSaving}
          aria-pressed={homeVisit}
        >
          <span style={{ ...s.hvKnob, transform: homeVisit ? 'translateX(20px)' : 'translateX(2px)' }} />
        </button>
      </div>

      {/* ── Home Visit Services Panel ── shown when HV is enabled */}
      {homeVisit && salonServices.length > 0 && (
        <div style={s.hvServicesPanel} className="fade-in">
          <div style={s.hvServicesHeader}>
            <div style={s.hvServicesTitle}>Home Visit Services</div>
            <div style={s.hvServicesSub}>Toggle which services are available during home visits</div>
          </div>
          <div style={s.hvServicesList}>
            {salonServices.map(ss => (
              <div key={ss.id} style={{ ...s.hvSvcRow, ...(ss.home_visit_available ? s.hvSvcRowOn : {}) }}>
                <div style={s.hvSvcInfo}>
                  <div style={s.hvSvcName}>{ss.service_name}</div>
                  <div style={s.hvSvcPriceLine}>
                    {ss.is_price_starting_from && <span style={s.hvSvcStartingFrom}>Starting From </span>}
                    <span>LKR {ss.effective_price}</span>
                    {ss.effective_duration && <span style={{ marginLeft: 8, opacity: 0.6 }}>· {formatDuration(ss.effective_duration)}</span>}
                  </div>
                </div>
                <button
                  style={{ ...s.hvSvcToggle, background: ss.home_visit_available ? 'linear-gradient(135deg, #0D9488, #0B7A70)' : 'var(--surface2)', border: ss.home_visit_available ? 'none' : '1.5px solid var(--border)' }}
                  onClick={() => toggleSvcHV(ss)}
                  aria-pressed={ss.home_visit_available}
                >
                  <span style={{ ...s.hvSvcKnob, transform: ss.home_visit_available ? 'translateX(20px)' : 'translateX(2px)' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Cosmetics Toggle ── */}
      <div style={{ ...s.hvCard, marginTop: 12 }} className="fade-up d6">
        <div style={s.hvLeft}>
          <div style={{ ...s.hvIconWrap, background: cosmetics ? 'rgba(201,107,81,.12)' : 'var(--surface2)', color: cosmetics ? '#C96B51' : 'var(--text-muted)' }}>
            ✿
          </div>
          <div>
            <div style={s.hvTitle}>Cosmetics Section</div>
            <div style={s.hvSub}>
              {salon.subscription_plan === 'free_trial'
                ? 'Sell products to clients — requires any paid subscription'
                : cosmetics
                  ? 'Clients can browse your cosmetics products from your salon page'
                  : 'Enable to let clients discover your beauty products'}
            </div>
          </div>
        </div>
        {(!salon.subscription_plan || COSMETICS_PLANS.includes(salon.subscription_plan)) ? (
          <button
            style={{ ...s.hvToggle, background: cosmetics ? 'linear-gradient(135deg, #C96B51, #D4AF37)' : 'var(--surface2)', border: cosmetics ? 'none' : '1.5px solid var(--border)' }}
            onClick={toggleCosmetics}
            disabled={cosmeticsSaving}
            aria-pressed={cosmetics}
          >
            <span style={{ ...s.hvKnob, transform: cosmetics ? 'translateX(20px)' : 'translateX(2px)' }} />
          </button>
        ) : (
          <button
            style={s.upgradeBtn}
            onClick={() => navigate('/owner/subscription')}
          >
            Upgrade Plan →
          </button>
        )}
      </div>

      {/* ── Salon Type / Gender Focus ── */}
      <div style={{ ...s.hvCard, marginTop: 12, flexDirection: 'column', alignItems: 'stretch', gap: 14 }} className="fade-up d6">
        <div style={s.hvLeft}>
          <div style={{ ...s.hvIconWrap, background: 'rgba(13,148,136,.1)', color: '#0D9488' }}>◈</div>
          <div>
            <div style={s.hvTitle}>Salon Type</div>
            <div style={s.hvSub}>Who is your salon for? This appears in search results and filters.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { val: 'male',   icon: '♂', label: 'Barbershop',     grad: 'linear-gradient(135deg,#0D9488,#0B7A70)' },
            { val: 'female', icon: '♀', label: 'Ladies Salon',   grad: 'linear-gradient(135deg,#C96B51,#D4AF37)' },
            { val: 'unisex', icon: '⚤', label: 'Unisex / Both',  grad: 'linear-gradient(135deg,#0D9488,#D4AF37)' },
          ].map(opt => {
            const active = genderFocus === opt.val;
            return (
              <button
                key={opt.val}
                onClick={() => saveGenderFocus(opt.val)}
                disabled={genderSaving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 16px', borderRadius: 12, border: 'none',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700, fontSize: 13,
                  background: active ? opt.grad : 'var(--surface2)',
                  color: active ? '#fff' : 'var(--text-muted)',
                  boxShadow: active ? '0 4px 14px rgba(13,148,136,.25)' : 'none',
                  transition: 'all .18s ease',
                  opacity: genderSaving ? 0.7 : 1,
                }}
              >
                <span style={{ fontSize: 16 }}>{opt.icon}</span>
                {opt.label}
                {active && <span style={{ fontSize: 11 }}>✓</span>}
              </button>
            );
          })}
        </div>
        {genderFocus !== 'male' && (
          <div style={{ fontSize: 12, color: '#0D9488', background: '#F0FDFA', borderRadius: 8, padding: '7px 12px', border: '1px solid #99F6E4' }}>
            ✦ Bridal & Party services are available for your salon type.
          </div>
        )}
      </div>

      {/* ── Salon Location ── */}
      <div style={{ ...s.hvCard, marginTop: 12, flexDirection: 'column', alignItems: 'stretch', gap: 12 }} className="fade-up d6">
        <div style={s.hvLeft}>
          <div style={{ ...s.hvIconWrap, background: 'rgba(13,148,136,.1)', color: '#0D9488' }}>📍</div>
          <div>
            <div style={s.hvTitle}>Salon Location</div>
            <div style={s.hvSub}>
              {salon.latitude
                ? 'Location pinned — clients can find you in radius search'
                : 'Pin your exact location so clients can filter salons by distance'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {salon.latitude && (
            <div style={{ fontSize: 12, color: '#0D9488', background: '#F0FDFA', borderRadius: 8, padding: '6px 12px', border: '1px solid #99F6E4', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {locMsg && locMsg !== 'error' ? `✓ Saved: ${locMsg}` : `◎ ${salon.latitude.toFixed(5)}, ${salon.longitude.toFixed(5)}`}
            </div>
          )}
          {locMsg === 'error' && (
            <span style={{ fontSize: 12, color: '#DC2626' }}>Failed to save</span>
          )}
          <button
            onClick={() => setShowLocMap(true)}
            disabled={locSaving}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: 10, border: 'none',
              cursor: locSaving ? 'wait' : 'pointer',
              background: 'linear-gradient(135deg, #0D9488, #14B8A8)',
              color: '#fff', fontWeight: 700, fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: '0 4px 14px rgba(13,148,136,.3)',
              opacity: locSaving ? 0.7 : 1,
              flexShrink: 0,
            }}
          >
            {locSaving ? 'Saving…' : salon.latitude ? '📍 Update Location' : '📍 Pin My Location'}
          </button>
        </div>
      </div>

      {/* Map picker modal */}
      {showLocMap && (
        <MapLocationPicker
          initialPos={salon.latitude ? { lat: salon.latitude, lng: salon.longitude } : null}
          showRadius={false}
          title="Pin Your Salon Location"
          applyLabel="Save Location"
          onClose={() => setShowLocMap(false)}
          onApply={(pos, _rad, label) => {
            setShowLocMap(false);
            saveLocation(pos, label);
          }}
        />
      )}

      {/* ── Colour Palette Picker ── */}
      <div style={{ ...s.hvCard, marginTop: 12, flexWrap: 'wrap' }} className="fade-up d6">
        <div style={s.hvLeft}>
          <div style={{ ...s.hvIconWrap, background: 'rgba(13,148,136,.1)', color: '#0D9488' }}>🎨</div>
          <div>
            <div style={s.hvTitle}>Salon Colour Palette</div>
            <div style={s.hvSub}>Choose a colour theme for your salon's public page</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
          {PALETTE_OPTIONS.map(p => {
            const isActive = (salon.color_palette || 'teal') === p.key;
            const isSaving = paletteSaving === p.key;
            return (
              <button
                key={p.key}
                onClick={() => savePalette(p.key)}
                disabled={!!paletteSaving}
                title={p.label}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  padding: '8px 14px', borderRadius: 12, cursor: paletteSaving ? 'wait' : 'pointer',
                  border: isActive ? `2px solid ${p.main}` : '2px solid var(--border)',
                  background: isActive ? `rgba(${p.rgb},.1)` : 'var(--surface2)',
                  boxShadow: isActive ? `0 4px 14px rgba(${p.rgb},.22)` : 'none',
                  transition: 'all .2s ease',
                  minWidth: 68,
                }}
              >
                <div style={{ display: 'flex', gap: 3 }}>
                  {[p.main, p.light, p.dark].map((c, i) => (
                    <div key={i} style={{ width: 14, height: 14, borderRadius: 4, background: c }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? p.main : 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  {isSaving ? '…' : p.label}
                </span>
                {isActive && <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.main }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Operating Hours Editor ── */}
      <div style={{ ...s.hvCard, flexDirection: 'column', alignItems: 'stretch', marginTop: 12, padding: 0, overflow: 'hidden' }} className="fade-up d6">
        <button
          style={s.hoursHeader}
          onClick={() => setHoursOpen(o => !o)}
        >
          <div style={s.hvLeft}>
            <div style={{ ...s.hvIconWrap, background: 'rgba(13,148,136,.1)', color: '#0D9488' }}>🕐</div>
            <div>
              <div style={s.hvTitle}>Operating Hours</div>
              <div style={s.hvSub}>Update your salon's opening and closing times</div>
            </div>
          </div>
          <span style={{ fontSize: 18, color: 'var(--text-muted)', transition: 'transform .2s', transform: hoursOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▾</span>
        </button>

        {hoursOpen && (
          <div style={s.hoursBody}>
            {DAYS.map(day => (
              <div key={day} style={s.dayRow}>
                <span style={s.dayName}>{day.slice(0,3).toUpperCase()}</span>
                <label style={s.closedLabel}>
                  <input
                    type="checkbox"
                    checked={hours[day]?.closed ?? true}
                    onChange={e => setHourField(day, 'closed', e.target.checked)}
                    style={{ marginRight: 5 }}
                  />
                  Closed
                </label>
                {!hours[day]?.closed && (
                  <>
                    <TimePicker style={s.timeInput} value={hours[day]?.open || '09:00'} onChange={e => setHourField(day, 'open', e.target.value)} />
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>–</span>
                    <TimePicker style={s.timeInput} value={hours[day]?.close || '17:00'} onChange={e => setHourField(day, 'close', e.target.value)} />
                  </>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 14, borderTop: '1px solid var(--border)', marginTop: 8 }}>
              <button style={s.saveHoursBtn} onClick={saveHours} disabled={hoursSaving}>
                {hoursSaving ? 'Saving…' : '✓ Save Hours'}
              </button>
              {hoursMsg === 'saved' && <span style={{ fontSize: 13, color: '#0D9488', fontWeight: 600 }}>✓ Saved successfully</span>}
              {hoursMsg === 'error' && <span style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>✕ Failed to save</span>}
              {hoursMsg.startsWith('error:') && <span style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>✕ {hoursMsg.split(':')[1].charAt(0).toUpperCase() + hoursMsg.split(':')[1].slice(1)}: closing time must be after opening time</span>}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

const s = {
  loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 },
  loaderSpinner: {
    width: 36, height: 36, borderRadius: '50%',
    border: '3px solid rgba(13,148,136,.15)', borderTopColor: '#0D9488',
    animation: 'spinSlow .7s linear infinite',
  },
  noSalon: {
    textAlign: 'center', padding: '80px 40px',
    background: 'var(--surface)', borderRadius: 24,
    border: '1px solid var(--border)',
    boxShadow: '0 4px 24px rgba(13,148,136,.08)',
  },
  noSalonOrb: {
    fontSize: 44, marginBottom: 18, color: 'var(--text-muted)', display: 'block',
  },
  noSalonTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 26, color: 'var(--text)', marginBottom: 10,
  },

  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 28, flexWrap: 'wrap', gap: 12,
  },
  eyebrow: {
    fontSize: 10, fontWeight: 700, color: 'var(--brand-label)',
    letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6,
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px',
    letterSpacing: '-0.01em',
  },
  statusRow: { display: 'flex', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: '50%', animation: 'pulseRing 2.5s ease infinite', flexShrink: 0 },
  statusText: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 },

  heroBtn: {
    padding: '11px 24px',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)',
    color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14,
    textDecoration: 'none', boxShadow: '0 6px 20px rgba(13,148,136,.35)',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  },

  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
  statCard: {
    borderRadius: 20, padding: '22px 22px',
    textDecoration: 'none', display: 'block', position: 'relative',
    transition: 'transform .22s ease, box-shadow .22s ease',
    overflow: 'hidden',
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 17, marginBottom: 14,
  },
  statVal: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 38, fontWeight: 800, lineHeight: 1, marginBottom: 5,
  },
  statLabel: { fontSize: 12, fontWeight: 600, lineHeight: 1.3 },
  statArrow: { position: 'absolute', top: 18, right: 20, fontSize: 17, opacity: .5 },

  section: {
    background: 'var(--surface)', borderRadius: 22, overflow: 'hidden',
    border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(13,148,136,.07)', marginBottom: 24,
  },
  sectionHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 26px 16px', borderBottom: '1px solid var(--border)',
  },
  sectionEyebrow: {
    fontSize: 9, fontWeight: 700, color: 'var(--brand-label)',
    letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 19, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em',
  },
  sectionCount: {
    fontSize: 12, color: 'var(--text-muted)',
    background: 'var(--surface2)', borderRadius: 20, padding: '4px 12px',
    border: '1px solid var(--border)',
  },
  empty: { padding: '44px', textAlign: 'center' },
  emptyOrb: { fontSize: 32, marginBottom: 10, display: 'block', color: 'var(--text-light)', opacity: .6 },

  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '10px 22px', textAlign: 'left',
    fontSize: 9, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    background: 'var(--surface2)', borderBottom: '1px solid var(--border)',
  },
  tr: { transition: 'background .15s ease' },
  td: { padding: '14px 22px', borderBottom: '1px solid var(--border)', fontSize: 13 },
  clientRow: { display: 'flex', alignItems: 'center', gap: 10 },
  clientAvatar: {
    width: 32, height: 32, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 14, fontWeight: 700, flexShrink: 0,
  },
  clientEmail: { fontWeight: 500, color: 'var(--text)', fontSize: 13 },
  timeChip: {
    background: 'rgba(13,148,136,.08)', color: '#0D9488', borderRadius: 8,
    padding: '3px 10px', fontSize: 12, fontWeight: 700,
    border: '1px solid rgba(13,148,136,.15)',
  },
  svcsText: { fontSize: 12, color: 'var(--text-muted)' },
  badge: { display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  manageBtn: {
    fontSize: 12, color: '#0D9488', fontWeight: 700,
    background: 'rgba(13,148,136,.08)', borderRadius: 8, padding: '5px 12px',
    border: '1px solid rgba(13,148,136,.15)', transition: 'background .15s ease',
    textDecoration: 'none',
  },

  hvCard: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    background: 'var(--surface)', borderRadius: 18, padding: '18px 22px',
    border: '1px solid var(--border)',
    boxShadow: '0 2px 12px rgba(13,148,136,.06)',
    marginTop: 16, flexWrap: 'wrap',
  },
  hvLeft: { display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 },
  hvIconWrap: {
    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, transition: 'background .25s ease, color .25s ease',
  },
  hvTitle: { fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 3 },
  hvSub:   { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 },
  hvToggle: {
    width: 46, height: 26, borderRadius: 13, flexShrink: 0,
    position: 'relative', cursor: 'pointer',
    transition: 'background .25s ease, border .25s ease',
    padding: 0,
  },
  hvKnob: {
    position: 'absolute', top: 3, width: 20, height: 20,
    borderRadius: '50%', background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,.25)',
    transition: 'transform .22s cubic-bezier(.16,1,.3,1)',
    display: 'block',
  },

  hvServicesPanel: {
    background: 'var(--surface)', borderRadius: 18,
    border: '1.5px solid rgba(13,148,136,.2)',
    boxShadow: '0 2px 12px rgba(13,148,136,.08)',
    marginTop: 10, overflow: 'hidden',
  },
  hvServicesHeader: { padding: '16px 22px 12px', borderBottom: '1px solid var(--border)' },
  hvServicesTitle: { fontWeight: 700, fontSize: 14, color: '#0D9488', marginBottom: 3 },
  hvServicesSub: { fontSize: 12, color: 'var(--text-muted)' },
  hvServicesList: { padding: '8px 16px 10px' },
  hvSvcRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 8px', borderRadius: 10, transition: 'background .2s ease', gap: 12,
    borderBottom: '1px solid var(--border)',
  },
  hvSvcRowOn: { background: 'rgba(13,148,136,.06)' },
  hvSvcInfo: { flex: 1, minWidth: 0 },
  hvSvcName: { fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 },
  hvSvcPriceLine: { fontSize: 11, color: 'var(--text-muted)' },
  hvSvcStartingFrom: { fontWeight: 700, color: '#0D9488', marginRight: 2 },
  hvSvcToggle: {
    width: 46, height: 26, borderRadius: 13, flexShrink: 0,
    position: 'relative', cursor: 'pointer',
    transition: 'background .25s ease, border .25s ease',
    padding: 0,
  },
  hvSvcKnob: {
    position: 'absolute', top: 3, width: 20, height: 20,
    borderRadius: '50%', background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,.25)',
    transition: 'transform .22s cubic-bezier(.16,1,.3,1)',
    display: 'block',
  },

  hoursHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer',
    width: '100%', gap: 12, textAlign: 'left',
  },
  hoursBody: {
    padding: '4px 22px 20px',
    borderTop: '1px solid var(--border)',
  },
  dayRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '9px 0', borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap',
  },
  dayName: {
    width: 36, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    letterSpacing: '0.08em', flexShrink: 0,
  },
  closedLabel: {
    display: 'flex', alignItems: 'center', fontSize: 13,
    color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0, minWidth: 70,
  },
  timeInput: {
    padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 8,
    fontSize: 13, color: 'var(--text)', background: 'var(--input-bg)',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
  },
  saveHoursBtn: {
    padding: '10px 22px',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
    fontWeight: 700, fontSize: 13, boxShadow: '0 4px 14px rgba(13,148,136,.3)',
    fontFamily: "'DM Sans', sans-serif",
  },
  upgradeBtn: {
    padding: '9px 18px',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 100%)',
    color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
    fontWeight: 700, fontSize: 12, flexShrink: 0,
    boxShadow: '0 4px 14px rgba(13,148,136,.35)',
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: 'nowrap',
  },
};
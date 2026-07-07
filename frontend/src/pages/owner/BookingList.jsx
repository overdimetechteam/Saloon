import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { c, STATUS_META } from '../../styles/theme';
import { useBreakpoint } from '../../hooks/useMobile';

const STATUSES = ['pending','confirmed','awaiting_client','rescheduled','cancelled','completed','flagged'];

const looksEncrypted = v => typeof v === 'string' && v.startsWith('gAAAAA') && v.length > 30;
const safeClientName = (name, email) => looksEncrypted(name) ? (email || 'Client') : (name || email || 'Client');
const safeClientInitial = (name, email) => {
  const n = looksEncrypted(name) ? email : name;
  return (n || 'C')[0].toUpperCase();
};

export default function OwnerBookingList() {
  const { salon } = useOwner();
  const { isMobile } = useBreakpoint();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showWalkIn, setShowWalkIn] = useState(false);

  const load = () => {
    if (!salon) return;
    api.get(`/salons/${salon.id}/bookings/`).then(r => setBookings(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [salon]);

  const shown = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div>
      <div style={{ ...s.header, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 14 : 12 }} className="fade-up">
        <div>
          <div style={s.eyebrow}>Management</div>
          <h2 style={s.title}>Bookings</h2>
          {pendingCount > 0 && (
            <div style={s.pendingAlert}>
              <span style={s.pendingDot} />
              {pendingCount} booking{pendingCount > 1 ? 's' : ''} awaiting your response
            </div>
          )}
        </div>
        <button style={{ ...s.walkInBtn, alignSelf: isMobile ? 'stretch' : 'auto' }} onClick={() => setShowWalkIn(true)}>
          + Walk-In Booking
        </button>
      </div>

      <div style={s.filters} className="fade-up d1">
        <button
          style={{ ...s.chip, ...(filter === 'all' ? s.chipAll : {}) }}
          onClick={() => setFilter('all')}
        >
          All
          <span style={{ ...s.chipBadge, background: filter === 'all' ? '#0D9488' : 'var(--surface2)', color: filter === 'all' ? '#fff' : 'var(--text-muted)' }}>
            {bookings.length}
          </span>
        </button>
        {STATUSES.map(st => {
          const count = bookings.filter(b => b.status === st).length;
          if (!count && filter !== st) return null;
          const meta = STATUS_META[st];
          const isActive = filter === st;
          return (
            <button
              key={st}
              style={{
                ...s.chip,
                ...(isActive ? { background: meta?.bg, color: meta?.color, border: `1px solid ${meta?.color}40` } : {}),
              }}
              onClick={() => setFilter(st)}
            >
              {meta?.label || st}
              <span style={{ ...s.chipBadge, background: isActive ? meta?.color : 'var(--surface2)', color: isActive ? '#fff' : 'var(--text-muted)' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div style={s.loadStack}>
          {[1,2,3,4].map(i => <div key={i} style={s.skeleton} className="shimmer" />)}
        </div>
      )}

      {!loading && shown.length === 0 && (
        <div style={s.empty} className="scale-in">
          <div style={s.emptyOrb}>◷</div>
          <h3 style={s.emptyTitle}>No bookings found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            {filter === 'all' ? 'No bookings yet.' : `No ${STATUS_META[filter]?.label || filter} bookings.`}
          </p>
        </div>
      )}

      <div style={s.list}>
        {shown.map((b, i) => {
          const meta = STATUS_META[b.status] || { label: b.status, color: '#888', bg: '#f0f0f0' };
          const dt = new Date(b.requested_datetime.slice(0, 19));
          const isPending = b.status === 'pending';
          return (
            <div
              key={b.id}
              style={{ ...s.card, ...(isPending ? s.cardPending : {}), flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}
              className={`lift-sm fade-up d${Math.min(i + 1, 5)}`}
            >
              <div style={isMobile
                ? { height: 3, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}66)`, flexShrink: 0 }
                : { ...s.colorTab, background: `linear-gradient(180deg, ${meta.color}, ${meta.color}66)` }
              } />

              <div style={{ ...s.clientSection, flex: 1 }}>
                <div style={{ ...s.avatar, background: meta.bg, color: meta.color, boxShadow: `0 4px 12px ${meta.color}28` }}>
                  {safeClientInitial(b.client_name, b.client_email)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.clientName}>
                    {safeClientName(b.client_name, b.client_email)}
                    {b.is_walk_in && <span style={s.walkInBadge}>Walk-In</span>}
                  </div>
                  <div style={s.clientDt}>
                    ◷ {dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' · '}
                    {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {b.booking_services?.length > 0 && (
                    <div style={s.svcs}>
                      ✂ {b.booking_services.map(bs => bs.service_name).join(' · ')}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ ...s.rightSection, flexDirection: isMobile ? 'row' : 'column', justifyContent: isMobile ? 'space-between' : 'center', padding: isMobile ? '10px 16px 14px' : '14px 20px', borderTop: isMobile ? '1px solid var(--border)' : 'none' }}>
                <span style={{ ...s.badge, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}30` }}>
                  {meta.label}
                </span>
                {b.negotiation_round > 0 && (
                  <span style={s.roundTag}>Round {b.negotiation_round}/5</span>
                )}
                <Link
                  to={`/owner/bookings/${b.id}`}
                  style={{ ...s.manageBtn, ...(isPending ? s.manageBtnPending : {}) }}
                >
                  {isPending ? '⚡ Respond' : 'View →'}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {showWalkIn && (
        <WalkInModal salonId={salon?.id} onClose={() => setShowWalkIn(false)} onCreated={() => { setShowWalkIn(false); load(); }} />
      )}
    </div>
  );
}

// 30-minute time slots from 7:00 AM to 9:00 PM
const TIME_SLOTS = (() => {
  const slots = [];
  for (let h = 7; h <= 21; h++) {
    for (let mn = 0; mn < 60; mn += 30) {
      if (h === 21 && mn > 0) break;
      const hh = String(h).padStart(2, '0');
      const mm = String(mn).padStart(2, '0');
      const period = h < 12 ? 'AM' : 'PM';
      const h12 = h % 12 || 12;
      slots.push({ value: `${hh}:${mm}`, label: `${h12}:${mm} ${period}` });
    }
  }
  return slots;
})();

function WalkInModal({ salonId, onClose, onCreated }) {
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({
    client_email: '', client_name: '', client_phone: '',
    appointment_date: '', appointment_time: '',
    notes: '', staff_id: '',
  });
  const [selectedServices, setSelectedServices] = useState([]);
  const [availCheck, setAvailCheck] = useState(null); // null | 'checking' | 'free' | 'busy'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef(null);

  const appointmentDatetime = form.appointment_date && form.appointment_time
    ? `${form.appointment_date}T${form.appointment_time}`
    : '';

  useEffect(() => {
    if (!salonId) return;
    api.get(`/salons/${salonId}/services/`).then(r => setServices(r.data.filter(sv => sv.is_active))).catch(() => {});
    api.get(`/salons/${salonId}/staff-members/`).then(r => setStaff(r.data.filter(st => st.is_active))).catch(() => {});
  }, [salonId]);

  // Check stylist availability whenever staff + datetime + services change
  useEffect(() => {
    if (!form.staff_id || !appointmentDatetime || selectedServices.length === 0) {
      setAvailCheck(null);
      return;
    }
    const dt = new Date(appointmentDatetime);
    if (isNaN(dt)) { setAvailCheck(null); return; }
    const dateStr = dt.toISOString().slice(0, 10);
    const totalDur = selectedServices.reduce((sum, id) => {
      const sv = services.find(s => s.id === id);
      return sum + (sv?.effective_duration || 30);
    }, 0);
    setAvailCheck('checking');
    api.get(`/salons/${salonId}/available-slots/`, {
      params: { date: dateStr, staff_id: form.staff_id, duration: totalDur }
    }).then(r => {
      const slotTime = appointmentDatetime.slice(11, 16);
      const match = r.data.slots?.find(s => s.datetime.slice(11, 16) === slotTime);
      setAvailCheck(match?.available ? 'free' : 'busy');
    }).catch(() => setAvailCheck(null));
  }, [form.staff_id, appointmentDatetime, selectedServices]);

  const toggleService = id => {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const submit = async () => {
    setError('');
    if (!form.client_email) return setError('Client email is required.');
    if (!form.client_name.trim()) return setError('Client name is required.');
    if (!form.client_phone.trim()) return setError('Phone number is required.');
    if (!form.appointment_date) return setError('Appointment date is required.');
    if (!form.appointment_time) return setError('Appointment time is required.');
    if (selectedServices.length === 0) return setError('Select at least one service.');
    if (availCheck === 'busy') return setError('That stylist already has a booking at this time. Please choose a different time or stylist.');
    setSubmitting(true);
    try {
      await api.post(`/salons/${salonId}/bookings/walk-in/`, {
        client_email: form.client_email,
        client_name: form.client_name,
        client_phone: form.client_phone,
        appointment_datetime: appointmentDatetime,
        notes: form.notes,
        service_ids: selectedServices,
        staff_id: form.staff_id,
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create walk-in booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={m.overlay} ref={overlayRef} onClick={e => e.target === overlayRef.current && onClose()}>
      <div style={m.modal} className="scale-in">
        <div style={m.modalHead}>
          <div>
            <div style={m.modalEyebrow}>Quick Entry</div>
            <h3 style={m.modalTitle}>Walk-In Booking</h3>
          </div>
          <button style={m.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && <div style={m.alert}>{error}</div>}

        <div style={m.grid}>
          <div style={m.field}>
            <label style={m.label}>Client Email *</label>
            <input
              style={m.input}
              type="email"
              placeholder="client@example.com"
              value={form.client_email}
              onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))}
            />
          </div>
          <div style={m.field}>
            <label style={m.label}>Client Name *</label>
            <input
              style={m.input}
              type="text"
              placeholder="Full name"
              value={form.client_name}
              onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
            />
          </div>
          <div style={m.field}>
            <label style={m.label}>Phone *</label>
            <input
              style={m.input}
              type="tel"
              placeholder="+94 77 000 0000"
              value={form.client_phone}
              onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))}
            />
          </div>
          <div style={m.field}>
            <label style={m.label}>Appointment Date *</label>
            <input
              style={m.input}
              type="date"
              value={form.appointment_date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => setForm(f => ({ ...f, appointment_date: e.target.value }))}
              onKeyDown={e => e.preventDefault()}
            />
          </div>
          <div style={m.field}>
            <label style={m.label}>Appointment Time *</label>
            <select
              style={m.input}
              value={form.appointment_time}
              onChange={e => setForm(f => ({ ...f, appointment_time: e.target.value }))}
            >
              <option value="">— Select Time —</option>
              {TIME_SLOTS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div style={m.field}>
            <label style={m.label}>Assign a Professional</label>
            <select
              style={m.input}
              value={form.staff_id}
              onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}
            >
              <option value="">— Select Professional —</option>
              {staff.map(st => (
                <option key={st.id} value={st.id}>{st.full_name}{st.role ? ` — ${st.role}` : ''}</option>
              ))}
            </select>
            {availCheck === 'checking' && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Checking availability…</div>
            )}
            {availCheck === 'free' && (
              <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 700, marginTop: 4 }}>✓ Analyst is available at this time</div>
            )}
            {availCheck === 'busy' && (
              <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 700, marginTop: 4 }}>✗ Analyst already booked at this time</div>
            )}
          </div>
        </div>

        <div style={m.fieldFull}>
          <label style={m.label}>Services * ({selectedServices.length} selected)</label>
          <div style={m.serviceGrid}>
            {services.map(sv => {
              const sel = selectedServices.includes(sv.id);
              return (
                <button
                  key={sv.id}
                  style={{ ...m.serviceChip, ...(sel ? m.serviceChipSel : {}) }}
                  onClick={() => toggleService(sv.id)}
                  type="button"
                >
                  <span style={m.serviceChipName}>{sv.service_name}</span>
                  <span style={{ ...m.serviceChipPrice, color: sel ? '#0D9488' : 'var(--text-muted)' }}>
                    LKR {sv.effective_price}
                  </span>
                </button>
              );
            })}
            {services.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>No services configured.</div>}
          </div>
        </div>

        <div style={m.fieldFull}>
          <label style={m.label}>Notes</label>
          <textarea
            style={{ ...m.input, minHeight: 70, resize: 'vertical' }}
            placeholder="Any special instructions…"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <div style={m.footer}>
          <button style={m.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...m.submitBtn, opacity: submitting ? 0.7 : 1 }} onClick={submit} disabled={submitting}>
            {submitting ? 'Creating…' : '✓ Create Walk-In Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  header: { marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: {
    fontSize: 10, fontWeight: 700, color: 'var(--brand-label)',
    letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6,
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px',
    letterSpacing: '-0.01em',
  },
  pendingAlert: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    fontSize: 12, color: '#D4AF37', fontWeight: 500,
    background: 'rgba(212,175,55,.09)',
    border: '1px solid rgba(212,175,55,.25)',
    borderRadius: 20, padding: '4px 12px',
  },
  pendingDot: {
    width: 7, height: 7, borderRadius: '50%', background: '#D4AF37', flexShrink: 0,
    animation: 'pulseRing 2s ease infinite',
  },
  walkInBtn: {
    padding: '11px 22px',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer',
    fontWeight: 700, fontSize: 13,
    boxShadow: '0 6px 20px rgba(13,148,136,.35)',
    flexShrink: 0, marginTop: 4,
  },

  filters: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  chip: {
    padding: '7px 14px', borderRadius: 20,
    border: '1px solid var(--border)', background: 'var(--surface)',
    color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 7,
    transition: 'all .18s ease',
  },
  chipAll: { background: 'rgba(13,148,136,.08)', color: '#0D9488', borderColor: 'rgba(13,148,136,.3)' },
  chipBadge: {
    borderRadius: 20, fontSize: 10, fontWeight: 700,
    padding: '1px 6px', transition: 'all .18s ease',
  },

  loadStack: { display: 'flex', flexDirection: 'column', gap: 12 },
  skeleton: { height: 84, borderRadius: 18 },

  empty: {
    background: 'var(--surface)', borderRadius: 22, padding: '60px 40px',
    textAlign: 'center', border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(13,148,136,.06)',
  },
  emptyOrb: { fontSize: 38, marginBottom: 14, display: 'block', color: 'var(--text-muted)' },
  emptyTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22, color: 'var(--text)', marginBottom: 8,
  },

  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    background: 'var(--surface)', borderRadius: 18,
    boxShadow: '0 4px 16px rgba(13,148,136,.07), 0 1px 4px rgba(0,0,0,.04)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', overflow: 'hidden',
    transition: 'transform .2s ease, box-shadow .2s ease',
  },
  cardPending: { border: '1px solid rgba(212,175,55,.3)', boxShadow: '0 4px 16px rgba(212,175,55,.08)' },
  colorTab: { width: 4, alignSelf: 'stretch', flexShrink: 0 },
  clientSection: { display: 'flex', alignItems: 'center', gap: 14, flex: 1, padding: '16px 18px' },
  avatar: {
    width: 42, height: 42, borderRadius: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 18, fontWeight: 700, flexShrink: 0,
  },
  clientName: {
    fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4,
    display: 'flex', alignItems: 'center', gap: 7,
  },
  walkInBadge: {
    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
    background: '#F0FDFA', color: '#0D9488', border: '1px solid #99F6E4',
  },
  clientDt: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 },
  svcs: { fontSize: 11, color: 'var(--text-muted)' },
  rightSection: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7,
    padding: '14px 20px', flexShrink: 0,
  },
  badge: { display: 'inline-flex', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  roundTag: { fontSize: 10, color: 'var(--text-muted)' },
  manageBtn: {
    fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 9,
    background: 'rgba(13,148,136,.08)', color: '#0D9488',
    border: '1px solid rgba(13,148,136,.15)',
    transition: 'background .15s ease', textDecoration: 'none',
  },
  manageBtnPending: {
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)',
    color: '#fff', border: 'none',
    boxShadow: '0 4px 12px rgba(13,148,136,.35)',
  },
};

const m = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(8,6,17,.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20,
    backdropFilter: 'blur(6px)',
  },
  modal: {
    background: 'var(--surface)', borderRadius: 24, padding: 32,
    width: '100%', maxWidth: 640, maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 32px 80px rgba(0,0,0,.35), 0 8px 24px rgba(13,148,136,.15)',
    border: '1px solid var(--border)',
  },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalEyebrow: {
    fontSize: 9, fontWeight: 700, color: 'var(--brand-label)',
    letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 5,
  },
  modalTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em',
  },
  closeBtn: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', fontSize: 15, cursor: 'pointer',
    padding: '6px 10px', lineHeight: 1, borderRadius: 8,
  },
  alert: {
    background: '#FEF2F2', border: '1px solid #FCA5A5',
    color: '#DC2626', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 18,
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldFull: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 },
  label: {
    fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  input: {
    padding: '10px 13px', border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 13, color: 'var(--text)', background: 'var(--input-bg)',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
    width: '100%', boxSizing: 'border-box',
  },
  serviceGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  serviceChip: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    padding: '9px 14px', borderRadius: 11, border: '1.5px solid var(--border)',
    background: 'var(--surface2)', cursor: 'pointer', transition: 'all .15s ease',
  },
  serviceChipSel: {
    background: 'rgba(13,148,136,.08)', border: '1.5px solid #0D9488',
    boxShadow: '0 3px 10px rgba(13,148,136,.15)',
  },
  serviceChipName: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  serviceChipPrice: { fontSize: 11, fontWeight: 500, marginTop: 2 },
  footer: {
    display: 'flex', gap: 10, justifyContent: 'flex-end',
    marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)',
  },
  cancelBtn: {
    padding: '10px 20px', background: 'transparent',
    border: '1.5px solid var(--border)', color: 'var(--text-muted)',
    borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
  },
  submitBtn: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
    fontWeight: 700, fontSize: 13,
    boxShadow: '0 6px 18px rgba(13,148,136,.35)',
    fontFamily: "'DM Sans', sans-serif",
  },
};
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { c, STATUS_META } from '../../styles/theme';
import MiniCalendar from '../../components/MiniCalendar';
import { useBreakpoint } from '../../hooks/useMobile';

/* ─── Single calendar, pick up to 3 dates, then set times ─────────────── */
function MultiSlotPicker({ slots, setSlots, operatingHours }) {
  const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

  const getHours = dateStr => {
    if (!dateStr || !operatingHours) return { open: '08:00', close: '20:00' };
    const h = operatingHours[DAY_NAMES[new Date(dateStr).getDay()]];
    return h || { open: '08:00', close: '20:00' };
  };

  const selectedDates = slots.map(s => s ? s.split('T')[0] : '').filter(Boolean);

  const handleToggle = dateStr => {
    const idx = selectedDates.indexOf(dateStr);
    if (idx !== -1) {
      // deselect — remove that slot, shift others up, pad with ''
      const next = slots.filter((_, i) => slots[i]?.split('T')[0] !== dateStr);
      while (next.length < 3) next.push('');
      setSlots(next);
    } else if (selectedDates.length < 3) {
      // select — fill the first empty slot
      const next = [...slots];
      const emptyIdx = next.findIndex(s => !s || !s.split('T')[0]);
      const time = next[emptyIdx]?.split('T')[1] || '09:00';
      next[emptyIdx] = dateStr + 'T' + time;
      setSlots(next);
    }
  };

  const handleTime = (slotIdx, time) => {
    const next = [...slots];
    const dateStr = next[slotIdx]?.split('T')[0] || '';
    next[slotIdx] = dateStr + 'T' + time;
    setSlots(next);
  };

  return (
    <div>
      {/* One calendar */}
      <div style={sp.calCard}>
        <div style={sp.calHint}>
          Click up to 3 dates — they'll appear as options below.
          {selectedDates.length === 3 && <span style={{ color: '#7C3AED', fontWeight: 700 }}> (3 selected)</span>}
        </div>
        <MiniCalendar
          selectedDates={selectedDates}
          onToggle={handleToggle}
          operatingHours={operatingHours}
        />
      </div>

      {/* Three time rows */}
      <div style={sp.timeList}>
        {[0, 1, 2].map(i => {
          const raw      = slots[i] || '';
          const dateStr  = raw.split('T')[0] || '';
          const timePart = raw.split('T')[1] || '';
          const filled   = !!dateStr;
          const { open, close } = getHours(dateStr);
          const label = dateStr
            ? new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            : 'No date selected';

          return (
            <div key={i} style={{ ...sp.timeRow, opacity: filled ? 1 : 0.45 }}>
              <div style={sp.optBadge}>{i + 1}</div>
              <div style={sp.dateLabel}>{label}</div>
              <div style={sp.timeWrap}>
                <input
                  type="time"
                  style={{ ...sp.timeInput, cursor: filled ? 'pointer' : 'not-allowed' }}
                  value={timePart}
                  min={open}
                  max={close}
                  disabled={!filled}
                  onChange={e => handleTime(i, e.target.value)}
                />
                {filled && timePart && (
                  <span style={sp.timeSet}>
                    {new Date(dateStr + 'T' + timePart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {filled && !timePart && <span style={sp.timeHint}>pick a time</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const sp = {
  calCard:   { background: 'var(--surface2)', borderRadius: 14, padding: '16px', border: '1px solid var(--border)', marginBottom: 16 },
  calHint:   { fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 },
  timeList:  { display: 'flex', flexDirection: 'column', gap: 10 },
  timeRow:   { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)', transition: 'opacity .2s ease' },
  optBadge:  { width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #0D9488)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dateLabel: { fontSize: 13, fontWeight: 600, color: 'var(--text)', minWidth: 130, flexShrink: 0 },
  timeWrap:  { display: 'flex', alignItems: 'center', gap: 8, flex: 1 },
  timeInput: { padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, background: 'var(--input-bg)', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", outline: 'none' },
  timeHint:  { fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' },
  timeSet:   { fontSize: 11, fontWeight: 600, color: '#0D9488' },
};

/* ─── Main component ───────────────────────────────────────────────────── */
export default function OwnerBookingDetail() {
  const { id } = useParams();
  const { isMobile } = useBreakpoint();
  const [booking, setBooking] = useState(null);
  const [error, setError]     = useState('');
  const [msg, setMsg]         = useState('');
  const [slots, setSlots]     = useState(['', '', '']);
  const [staff, setStaff]     = useState([]);
  const [salon, setSalon]     = useState(null);
  const [assignId, setAssignId]   = useState('');
  const [assigning, setAssigning] = useState(false);

  const load = () => api.get(`/bookings/${id}/`).then(r => {
    setBooking(r.data);
    setAssignId(r.data.staff_member ?? '');
    if (r.data.salon) {
      api.get(`/salons/${r.data.salon}/staff/`).then(sr => setStaff(sr.data)).catch(() => {});
      api.get(`/salons/${r.data.salon}/`).then(sr => setSalon(sr.data)).catch(() => {});
    }
  }).catch(() => {});

  useEffect(() => { load(); }, [id]);

  const confirm = async () => {
    try { await api.post(`/bookings/${id}/confirm/`); setMsg('Booking confirmed!'); load(); }
    catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  const reject = async () => {
    if (slots.some(s => !s || !s.includes('T') || s.split('T')[1] === ''))
      return setError('All 3 alternative slots need both a date and time.');
    try {
      await api.post(`/bookings/${id}/reject/`, { proposed_slots: slots });
      setMsg('Booking rejected with 3 alternative slots proposed.'); load();
    } catch (err) { setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error'); }
  };

  const cancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    try { await api.post(`/bookings/${id}/cancel/`); setMsg('Booking cancelled.'); load(); }
    catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  const assignStaff = async () => {
    setAssigning(true);
    try {
      await api.patch(`/bookings/${id}/assign-staff/`, { staff_id: assignId || null });
      setMsg('Stylist assigned successfully.'); load();
    } catch (err) { setError(err.response?.data?.detail || 'Error assigning staff'); }
    finally { setAssigning(false); }
  };

  if (!booking) return (
    <div style={s.loader}><div style={s.loaderSpinner} /></div>
  );

  const meta    = STATUS_META[booking.status] || { label: booking.status, color: '#888', bg: '#f0f0f0' };
  const canAct  = ['pending', 'rescheduled'].includes(booking.status);
  const canAssign = ['pending', 'confirmed', 'rescheduled'].includes(booking.status);
  const opHours = salon?.operating_hours || {};

  return (
    <div style={s.page}>
      <Link to="/owner/bookings" style={s.back}>← Back to Bookings</Link>

      <div style={s.layout}>
        <div style={s.mainCol}>
          <div style={s.card}>
            <div style={s.cardHead}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                  <h2 style={s.clientName}>{booking.client_name || booking.client_email}</h2>
                  {booking.is_walk_in && <span style={s.walkInBadge}>Walk-In</span>}
                </div>
                <p style={s.bookingId}>
                  {booking.client_email}
                  {booking.client_phone && ` · ${booking.client_phone}`}
                  {' · '}Booking #{booking.id}
                </p>
              </div>
              <span style={{ ...s.badge, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}22` }}>{meta.label}</span>
            </div>

            {error && <div style={s.alertErr}>{error}</div>}
            {msg   && <div style={s.alertOk}>{msg}</div>}

            <div style={{ ...s.infoGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              <div style={s.infoBox}>
                <div style={s.infoLbl}>Date & Time</div>
                <div style={s.infoVal}>{new Date(booking.requested_datetime).toLocaleString()}</div>
              </div>
              <div style={s.infoBox}>
                <div style={s.infoLbl}>Negotiation Round</div>
                <div style={s.infoVal}>{booking.negotiation_round} / 5</div>
              </div>
              {booking.staff_member_name && (
                <div style={s.infoBox}>
                  <div style={s.infoLbl}>Assigned Stylist</div>
                  <div style={s.infoVal}>★ {booking.staff_member_name}</div>
                </div>
              )}
              {booking.discount_amount > 0 && (
                <div style={s.infoBox}>
                  <div style={s.infoLbl}>Discount Applied</div>
                  <div style={{ ...s.infoVal, color: '#059669' }}>− LKR {Number(booking.discount_amount).toFixed(2)}</div>
                </div>
              )}
            </div>

            {booking.booking_services?.length > 0 && (
              <div style={s.section}>
                <div style={s.secTitle}>Services Requested</div>
                <div style={s.chips}>
                  {booking.booking_services.map(bs => <span key={bs.id} style={s.chip}>{bs.service_name}</span>)}
                </div>
              </div>
            )}

            {booking.home_visit && (
              <div style={{ ...s.section, background: 'rgba(13,148,136,.06)', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(13,148,136,.18)' }}>
                <div style={{ ...s.secTitle, color: '#0D9488' }}>🏠 Home Visit Booking</div>
                {booking.home_visit_address ? (
                  <p style={s.notes}>{booking.home_visit_address}</p>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>No address provided</p>
                )}
              </div>
            )}

            {booking.notes && (
              <div style={s.section}>
                <div style={s.secTitle}>Client Notes</div>
                <p style={s.notes}>"{booking.notes}"</p>
              </div>
            )}
          </div>

          {canAct && (
            <div style={s.actionsCard}>
              <div style={s.confirmSection}>
                <h4 style={s.actTitle}>Confirm Booking</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>Approve this booking at the requested time.</p>
                <button style={s.confirmBtn} onClick={confirm}>✓ Confirm Booking</button>
              </div>

              <div style={s.divider} />

              <div style={s.rejectSection}>
                <h4 style={s.actTitle}>Reject & Propose Alternatives</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>
                  Select 3 alternative dates and times for the client to choose from.
                  {Object.keys(opHours).length > 0 && ' Closed days are greyed out.'}
                </p>
                <MultiSlotPicker
                  slots={slots}
                  setSlots={setSlots}
                  operatingHours={opHours}
                />
                <button style={{ ...s.rejectBtn, marginTop: 16 }} onClick={reject}>✗ Reject & Send Alternatives</button>
              </div>
            </div>
          )}
        </div>

        <div style={s.sideCol}>
          {!['cancelled','completed'].includes(booking.status) && (
            <button style={s.cancelBtn} onClick={cancel}>Cancel Booking</button>
          )}

          {canAssign && staff.length > 0 && (
            <div style={s.assignCard}>
              <div style={s.secTitle}>Assign Stylist</div>
              <select style={s.select} value={assignId} onChange={e => setAssignId(e.target.value)}>
                <option value="">Any Available</option>
                {staff.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}{m.role ? ` — ${m.role}` : ''}</option>
                ))}
              </select>
              <button style={{ ...s.assignBtn, opacity: assigning ? 0.7 : 1 }} onClick={assignStaff} disabled={assigning}>
                {assigning ? 'Saving…' : '★ Assign'}
              </button>
            </div>
          )}

          {booking.alternative_slots?.length > 0 && (
            <div style={s.histCard}>
              <div style={s.secTitle}>Alternative Slot History</div>
              {booking.alternative_slots.map(sl => (
                <div key={sl.id} style={{ ...s.histSlot, ...(sl.is_selected ? { borderColor: '#059669', background: '#ECFDF5' } : {}) }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: sl.is_selected ? '#059669' : 'var(--text)' }}>
                    Round {sl.round_number}{sl.is_selected ? ' ✓ Selected' : ''}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{new Date(sl.proposed_datetime).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {},
  loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 },
  loaderSpinner: { width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(124,58,237,.15)', borderTopColor: '#7C3AED', animation: 'spinSlow .7s linear infinite' },
  back: { display: 'inline-block', marginBottom: 22, color: '#7C3AED', textDecoration: 'none', fontWeight: 600, fontSize: 13 },
  layout: { display: 'flex', gap: 24, alignItems: 'flex-start' },
  mainCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: 16 },
  sideCol: { width: 248, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 },
  card: { background: 'var(--surface)', borderRadius: 22, padding: 28, boxShadow: '0 8px 32px rgba(124,58,237,.08)', border: '1px solid var(--border)' },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' },
  clientName: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' },
  walkInBadge: { fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#DBEAFE', color: '#1D4ED8', border: '1px solid #BFDBFE', flexShrink: 0 },
  bookingId: { color: 'var(--text-muted)', fontSize: 12, margin: '4px 0 0', lineHeight: 1.6 },
  badge: { display: 'inline-flex', borderRadius: 20, fontWeight: 700, flexShrink: 0, fontSize: 13, padding: '6px 16px' },
  alertErr: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '11px 14px', fontSize: 13, marginBottom: 18 },
  alertOk:  { background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', borderRadius: 12, padding: '11px 14px', fontSize: 13, marginBottom: 18 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 },
  infoBox:  { background: 'var(--surface2)', borderRadius: 12, padding: '13px 16px', border: '1px solid var(--border)' },
  infoLbl:  { fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 },
  infoVal:  { fontSize: 14, fontWeight: 600, color: 'var(--text)' },
  section:  { marginBottom: 18 },
  secTitle: { fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 },
  chips:    { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip:     { padding: '6px 14px', background: 'rgba(124,58,237,.08)', color: '#7C3AED', borderRadius: 20, fontSize: 13, fontWeight: 500, border: '1px solid rgba(124,58,237,.18)' },
  notes:    { fontSize: 14, color: 'var(--text-sub)', fontStyle: 'italic', background: 'var(--surface2)', borderRadius: 12, padding: '12px 16px', margin: 0, lineHeight: 1.6, border: '1px solid var(--border)' },
  actionsCard: { background: 'var(--surface)', borderRadius: 22, padding: 26, boxShadow: '0 4px 20px rgba(124,58,237,.07)', border: '1px solid var(--border)' },
  confirmSection: { marginBottom: 20 },
  actTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.01em' },
  confirmBtn: { padding: '11px 26px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 14px rgba(5,150,105,.3)', fontFamily: "'DM Sans', sans-serif" },
  divider:  { height: 1, background: 'var(--border)', margin: '20px 0' },
  rejectSection: {},
  rejectBtn: { padding: '11px 24px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif", marginTop: 4 },
  cancelBtn: { width: '100%', padding: '11px', background: 'transparent', color: 'var(--text-muted)', border: '1.5px solid var(--border)', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif" },
  assignCard: { background: 'var(--surface)', borderRadius: 16, padding: 18, border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(124,58,237,.06)', display: 'flex', flexDirection: 'column', gap: 10 },
  select: { width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, background: 'var(--input-bg)', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", outline: 'none' },
  assignBtn: { padding: '10px 16px', background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 12px rgba(124,58,237,.3)', fontFamily: "'DM Sans', sans-serif" },
  histCard:  { background: 'var(--surface)', borderRadius: 16, padding: 18, border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(124,58,237,.05)' },
  histSlot:  { border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 8, transition: 'border-color .2s ease, background .2s ease' },
};

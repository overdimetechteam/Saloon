import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { c, shadow, STATUS_META } from '../../styles/theme';

export default function OwnerBookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [slots, setSlots] = useState(['', '', '']);

  const load = () => api.get(`/bookings/${id}/`).then(r => setBooking(r.data)).catch(() => {});
  useEffect(() => { load(); }, [id]);

  const confirm = async () => {
    try { await api.post(`/bookings/${id}/confirm/`); setMsg('Booking confirmed!'); load(); }
    catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  const reject = async () => {
    if (slots.some(s => !s)) return setError('All 3 alternative slots are required');
    try {
      await api.post(`/bookings/${id}/reject/`, { proposed_slots: slots });
      setMsg('Booking rejected with 3 alternative slots proposed.');
      load();
    } catch (err) { setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error'); }
  };

  const cancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    try { await api.post(`/bookings/${id}/cancel/`); setMsg('Booking cancelled.'); load(); }
    catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  const setSlot = (i, v) => setSlots(prev => prev.map((s, idx) => idx === i ? v : s));

  if (!booking) return <div style={s.loading}>Loading…</div>;

  const meta = STATUS_META[booking.status] || { label: booking.status, color: '#888', bg: '#f0f0f0' };
  const canAct = ['pending', 'rescheduled'].includes(booking.status);

  return (
    <div style={s.page}>
      <Link to="/owner/bookings" style={s.back}>← Back to Bookings</Link>

      <div style={s.layout}>
        <div style={s.mainCol}>
          <div style={s.card}>
            <div style={s.cardHead}>
              <div>
                <h2 style={s.clientName}>{booking.client_email}</h2>
                <p style={s.bookingId}>Booking #{booking.id}</p>
              </div>
              <span style={{ ...s.badge, color: meta.color, background: meta.bg, fontSize: 13, padding: '6px 16px' }}>{meta.label}</span>
            </div>

            {error && <div style={s.alert}>{error}</div>}
            {msg && <div style={s.success}>{msg}</div>}

            <div style={s.infoGrid}>
              <div style={s.infoBox}><div style={s.infoLbl}>Date & Time</div><div style={s.infoVal}>{new Date(booking.requested_datetime).toLocaleString()}</div></div>
              <div style={s.infoBox}><div style={s.infoLbl}>Negotiation Round</div><div style={s.infoVal}>{booking.negotiation_round} / 5</div></div>
            </div>

            {booking.booking_services?.length > 0 && (
              <div style={s.section}>
                <div style={s.secTitle}>Services Requested</div>
                <div style={s.chips}>{booking.booking_services.map(bs => <span key={bs.id} style={s.chip}>{bs.service_name}</span>)}</div>
              </div>
            )}

            {booking.notes && (
              <div style={s.section}>
                <div style={s.secTitle}>Client Notes</div>
                <p style={s.notes}>{booking.notes}</p>
              </div>
            )}
          </div>

          {canAct && (
            <div style={s.actionsCard}>
              <div style={s.confirmSection}>
                <h4 style={s.actTitle}>Confirm Booking</h4>
                <p style={{ color: c.textMuted, fontSize: 13, marginBottom: 14 }}>Approve this booking at the requested time.</p>
                <button style={s.confirmBtn} onClick={confirm}>✓ Confirm Booking</button>
              </div>

              <div style={s.divider} />

              <div style={s.rejectSection}>
                <h4 style={s.actTitle}>Reject & Propose Alternatives</h4>
                <p style={{ color: c.textMuted, fontSize: 13, marginBottom: 14 }}>Propose 3 alternative slots for the client to choose from.</p>
                <div style={s.slotInputs}>
                  {slots.map((sl, i) => (
                    <div key={i} style={s.slotRow}>
                      <span style={s.slotLabel}>Option {i + 1}</span>
                      <input type="datetime-local" style={s.dateInput} value={sl} onChange={e => setSlot(i, e.target.value)} />
                    </div>
                  ))}
                </div>
                <button style={s.rejectBtn} onClick={reject}>✗ Reject & Send Alternatives</button>
              </div>
            </div>
          )}
        </div>

        <div style={s.sideCol}>
          {!['cancelled','completed'].includes(booking.status) && (
            <button style={s.cancelBtn} onClick={cancel}>Cancel Booking</button>
          )}
          {booking.alternative_slots?.length > 0 && (
            <div style={s.histCard}>
              <div style={s.secTitle}>Alternative Slot History</div>
              {booking.alternative_slots.map(sl => (
                <div key={sl.id} style={{ ...s.histSlot, ...(sl.is_selected ? { borderColor: c.success, background: c.successBg } : {}) }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: sl.is_selected ? c.success : c.text }}>Round {sl.round_number}{sl.is_selected ? ' ✓ Selected' : ''}</div>
                  <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{new Date(sl.proposed_datetime).toLocaleString()}</div>
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
  loading: { padding: 60, textAlign: 'center', color: c.textMuted },
  back: { display: 'inline-block', marginBottom: 20, color: c.primary, textDecoration: 'none', fontWeight: 500, fontSize: 14 },
  layout: { display: 'flex', gap: 24, alignItems: 'flex-start' },
  mainCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: 16 },
  sideCol: { width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 },
  card: { background: c.surface, borderRadius: 16, padding: 28, boxShadow: shadow.md, border: `1px solid ${c.border}` },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${c.border}` },
  clientName: { fontSize: 20, fontWeight: 700, color: c.text, margin: 0, marginBottom: 4 },
  bookingId: { color: c.textMuted, fontSize: 13, margin: 0 },
  badge: { display: 'inline-flex', borderRadius: 20, fontWeight: 700, flexShrink: 0 },
  alert: { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.error, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  success: { background: c.successBg, border: `1px solid ${c.successBorder}`, color: c.success, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 },
  infoBox: { background: c.bg, borderRadius: 8, padding: '12px 14px' },
  infoLbl: { fontSize: 11, fontWeight: 600, color: c.textLight, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 },
  infoVal: { fontSize: 14, fontWeight: 600, color: c.text },
  section: { marginBottom: 16 },
  secTitle: { fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { padding: '5px 12px', background: c.primarySoft, color: c.primary, borderRadius: 20, fontSize: 13, fontWeight: 500 },
  notes: { fontSize: 14, color: c.textSub, background: c.bg, borderRadius: 8, padding: '10px 14px', margin: 0 },
  actionsCard: { background: c.surface, borderRadius: 16, padding: 24, boxShadow: shadow.md, border: `1px solid ${c.border}` },
  confirmSection: { marginBottom: 20 },
  actTitle: { fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 6 },
  confirmBtn: { padding: '11px 24px', background: c.success, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  divider: { height: 1, background: c.border, margin: '20px 0' },
  rejectSection: {},
  slotInputs: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 },
  slotRow: { display: 'flex', alignItems: 'center', gap: 10 },
  slotLabel: { fontSize: 12, fontWeight: 600, color: c.textMuted, width: 54, flexShrink: 0 },
  dateInput: { flex: 1, padding: '8px 12px', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 13 },
  rejectBtn: { padding: '11px 24px', background: c.errorBg, color: c.error, border: `1px solid ${c.errorBorder}`, borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  cancelBtn: { width: '100%', padding: '10px', background: 'transparent', color: c.textMuted, border: `1px solid ${c.border}`, borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  histCard: { background: c.surface, borderRadius: 12, padding: 16, border: `1px solid ${c.border}`, boxShadow: shadow.sm },
  histSlot: { border: `1px solid ${c.border}`, borderRadius: 8, padding: '8px 12px', marginBottom: 6 },
};

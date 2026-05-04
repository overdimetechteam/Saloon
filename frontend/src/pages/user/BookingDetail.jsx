import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { c, shadow, STATUS_META } from '../../styles/theme';

export default function UserBookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api.get(`/bookings/${id}/`).then(r => setBooking(r.data)).catch(() => {});
  useEffect(() => { load(); }, [id]);

  const cancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try { await api.post(`/bookings/${id}/cancel/`); setMsg('Booking cancelled.'); load(); }
    catch (err) { setError(err.response?.data?.detail || 'Error cancelling'); }
  };

  const selectSlot = async slotId => {
    try { await api.post(`/bookings/${id}/select-slot/`, { slot_id: slotId }); setMsg('Slot selected! The salon will confirm shortly.'); load(); }
    catch (err) { setError(err.response?.data?.detail || 'Error selecting slot'); }
  };

  if (!booking) return <div style={s.loading}>Loading…</div>;

  const meta = STATUS_META[booking.status] || { label: booking.status, color: '#888', bg: '#f0f0f0' };
  const currentRound = booking.negotiation_round;
  const currentSlots = (booking.alternative_slots || []).filter(sl => sl.round_number === currentRound && !sl.is_selected);

  return (
    <div style={s.page}>
      <Link to="/user/bookings" style={s.back}>← Back to Bookings</Link>

      <div style={s.card}>
        <div style={s.cardHead}>
          <div>
            <h2 style={s.salonName}>{booking.salon_name}</h2>
            <p style={s.sub}>Booking #{booking.id}</p>
          </div>
          <span style={{ ...s.badge, color: meta.color, background: meta.bg }}>{meta.label}</span>
        </div>

        {error && <div style={s.alert}>{error}</div>}
        {msg && <div style={s.success}>{msg}</div>}

        <div style={s.infoGrid}>
          <div style={s.infoItem}><span style={s.infoLabel}>Date & Time</span><span style={s.infoVal}>{new Date(booking.requested_datetime).toLocaleString()}</span></div>
          <div style={s.infoItem}><span style={s.infoLabel}>Negotiation Round</span><span style={s.infoVal}>{booking.negotiation_round} / 5</span></div>
          {booking.notes && <div style={{ ...s.infoItem, gridColumn: '1 / -1' }}><span style={s.infoLabel}>Notes</span><span style={s.infoVal}>{booking.notes}</span></div>}
        </div>

        {booking.booking_services?.length > 0 && (
          <div style={s.section}>
            <h4 style={s.sectionTitle}>Services Booked</h4>
            <div style={s.serviceList}>
              {booking.booking_services.map(bs => (
                <span key={bs.id} style={s.serviceChip}>{bs.service_name}</span>
              ))}
            </div>
          </div>
        )}

        {booking.status === 'awaiting_client' && currentSlots.length > 0 && (
          <div style={s.altBox}>
            <h4 style={{ color: c.warning, marginBottom: 14, fontSize: 15 }}>⚠️ The salon couldn't confirm your original slot. Please choose one of these alternatives:</h4>
            {currentSlots.map(sl => (
              <div key={sl.id} style={s.slotCard}>
                <div>
                  <div style={s.slotDate}>{new Date(sl.proposed_datetime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  <div style={s.slotTime}>{new Date(sl.proposed_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <button style={s.selectBtn} onClick={() => selectSlot(sl.id)}>Select this slot</button>
              </div>
            ))}
          </div>
        )}

        {!['cancelled', 'completed', 'flagged'].includes(booking.status) && (
          <div style={s.actions}>
            <button style={s.cancelBtn} onClick={cancel}>Cancel Booking</button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { maxWidth: 680, margin: '0 auto' },
  loading: { padding: 60, textAlign: 'center', color: c.textMuted },
  back: { display: 'inline-block', marginBottom: 20, color: c.primary, textDecoration: 'none', fontWeight: 500, fontSize: 14 },
  card: { background: c.surface, borderRadius: 16, padding: 32, boxShadow: shadow.md, border: `1px solid ${c.border}` },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${c.border}` },
  salonName: { fontSize: 22, fontWeight: 700, color: c.text, margin: 0, marginBottom: 4 },
  sub: { color: c.textMuted, fontSize: 13, margin: 0 },
  badge: { padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0 },
  alert: { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.error, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  success: { background: c.successBg, border: `1px solid ${c.successBorder}`, color: c.success, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 },
  infoItem: { background: c.bg, borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 },
  infoLabel: { fontSize: 11, fontWeight: 600, color: c.textLight, textTransform: 'uppercase', letterSpacing: '0.05em' },
  infoVal: { fontSize: 14, fontWeight: 600, color: c.text },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: c.textSub, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' },
  serviceList: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  serviceChip: { padding: '5px 12px', background: c.primarySoft, color: c.primary, borderRadius: 20, fontSize: 13, fontWeight: 500 },
  altBox: { background: c.warningBg, border: `1px solid ${c.warningBorder}`, borderRadius: 12, padding: 20, marginBottom: 20 },
  slotCard: { background: '#fff', borderRadius: 8, padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  slotDate: { fontSize: 14, fontWeight: 600, color: c.text },
  slotTime: { fontSize: 13, color: c.textMuted, marginTop: 2 },
  selectBtn: { padding: '8px 18px', background: c.success, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  actions: { marginTop: 24, paddingTop: 20, borderTop: `1px solid ${c.border}` },
  cancelBtn: { padding: '10px 20px', background: c.errorBg, color: c.error, border: `1px solid ${c.errorBorder}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
};

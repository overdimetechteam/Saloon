import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import api from '../../api/axios';

export default function ClientBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const load = () => api.get(`/bookings/${id}/`).then(r => setBooking(r.data)).catch(() => {});

  useEffect(() => { load(); }, [id]);

  const cancel = async () => {
    setShowCancelModal(false);
    try {
      await api.post(`/bookings/${id}/cancel/`);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error');
    }
  };

  const selectSlot = async (slotId) => {
    try {
      await api.post(`/bookings/${id}/select-slot/`, { slot_id: slotId });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error');
    }
  };

  if (!booking) return <div style={s.wrap}>Loading...</div>;

  const altSlots = booking.alternative_slots?.filter(sl => !sl.is_selected) || [];
  const currentRound = booking.negotiation_round;
  const currentSlots = altSlots.filter(sl => sl.round_number === currentRound);

  return (
    <div style={s.wrap}>
      <h2>Booking #{booking.id}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p><strong>Salon:</strong> {booking.salon_name}</p>
      <p><strong>Date/Time:</strong> {new Date(booking.requested_datetime.slice(0, 19)).toLocaleString()}</p>
      <p><strong>Status:</strong> {booking.status}</p>
      <p><strong>Services:</strong> {booking.booking_services?.map(bs => bs.service_name).join(', ')}</p>
      {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}

      {booking.status === 'awaiting_client' && currentSlots.length > 0 && (
        <div style={s.altBox}>
          <h4>The salon has proposed alternative slots. Please pick one:</h4>
          {currentSlots.map(sl => (
            <div key={sl.id} style={s.slotRow}>
              <span>{new Date(sl.proposed_datetime.slice(0, 19)).toLocaleString()}</span>
              <button style={s.btn} onClick={() => selectSlot(sl.id)}>Select</button>
            </div>
          ))}
        </div>
      )}

      {!['cancelled', 'completed', 'flagged'].includes(booking.status) && (
        <button style={s.cancelBtn} onClick={() => setShowCancelModal(true)}>Cancel Booking</button>
      )}

      {showCancelModal && createPortal(
        <div style={s.overlay} onClick={() => setShowCancelModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalIcon}>🗑️</div>
            <div style={s.modalTitle}>Cancel Booking?</div>
            <p style={s.modalBody}>Are you sure you want to cancel Booking #{booking.id}? This action cannot be undone.</p>
            <div style={s.modalActions}>
              <button style={s.modalKeep} onClick={() => setShowCancelModal(false)}>Keep Booking</button>
              <button style={s.modalConfirm} onClick={cancel}>Yes, Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const s = {
  wrap: { maxWidth: 600, margin: '40px auto', padding: 24 },
  altBox: { background: '#fef9e7', border: '1px solid #f1c40f', borderRadius: 8, padding: 16, marginTop: 16 },
  slotRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  btn: { padding: '6px 14px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  cancelBtn: { marginTop: 20, padding: '8px 18px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: 'var(--surface)', borderRadius: 20, padding: '32px 28px', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,.4)', border: '1px solid var(--border)' },
  modalIcon: { fontSize: 36, marginBottom: 12 },
  modalTitle: { fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 10 },
  modalBody: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 },
  modalActions: { display: 'flex', gap: 10 },
  modalKeep: { flex: 1, padding: '12px', border: '1.5px solid var(--border)', borderRadius: 12, background: 'none', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  modalConfirm: { flex: 1, padding: '12px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
};

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';

export default function SalonBookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [slots, setSlots] = useState(['', '', '']);

  const load = () => api.get(`/bookings/${id}/`).then(r => setBooking(r.data)).catch(() => {});

  useEffect(() => { load(); }, [id]);

  const confirm = async () => {
    try { await api.post(`/bookings/${id}/confirm/`); load(); }
    catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  const reject = async () => {
    if (slots.some(s => !s)) return setError('All 3 alternative slots required');
    try {
      await api.post(`/bookings/${id}/reject/`, { proposed_slots: slots });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error');
    }
  };

  const cancel = async () => {
    if (!confirm('Cancel this booking?')) return;
    try { await api.post(`/bookings/${id}/cancel/`); load(); }
    catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  const setSlot = (i, v) => setSlots(prev => prev.map((s, idx) => idx === i ? v : s));

  if (!booking) return <div style={s.wrap}>Loading...</div>;

  const canAct = ['pending', 'rescheduled'].includes(booking.status);

  return (
    <div style={s.wrap}>
      <h2>Booking #{booking.id}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p><strong>Client:</strong> {booking.client_email}</p>
      <p><strong>Date/Time:</strong> {new Date(booking.requested_datetime).toLocaleString()}</p>
      <p><strong>Status:</strong> {booking.status}</p>
      <p><strong>Services:</strong> {booking.booking_services?.map(bs => bs.service_name).join(', ')}</p>
      {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}

      {canAct && (
        <div style={s.actions}>
          <button style={s.confirmBtn} onClick={confirm}>Confirm</button>
          <div style={s.rejectSection}>
            <h4>Reject — Propose 3 Alternative Slots</h4>
            {slots.map((sl, i) => (
              <input key={i} type="datetime-local" style={s.input} value={sl} onChange={e => setSlot(i, e.target.value)} />
            ))}
            <button style={s.rejectBtn} onClick={reject}>Reject & Propose Slots</button>
          </div>
        </div>
      )}

      {!['cancelled', 'completed'].includes(booking.status) && (
        <button style={s.cancelBtn} onClick={cancel}>Cancel</button>
      )}
    </div>
  );
}

const s = {
  wrap: { maxWidth: 600, margin: '40px auto', padding: 24 },
  actions: { marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 },
  confirmBtn: { padding: '10px 20px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', alignSelf: 'flex-start' },
  rejectSection: { border: '1px solid #e74c3c', borderRadius: 8, padding: 16 },
  rejectBtn: { marginTop: 8, padding: '8px 16px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  cancelBtn: { marginTop: 16, padding: '8px 16px', background: '#95a5a6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  input: { display: 'block', width: '100%', marginBottom: 8, padding: '8px', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' },
};

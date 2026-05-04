import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function BookSalon() {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/salons/${salonId}/`).then(r => setSalon(r.data)).catch(() => {});
    api.get(`/salons/${salonId}/services/`).then(r => setServices(r.data)).catch(() => {});
  }, [salonId]);

  useEffect(() => {
    if (!date) return;
    api.get(`/salons/${salonId}/calendar/available-slots/?date=${date}`)
      .then(r => setSlots(r.data.slots || []))
      .catch(() => setSlots([]));
  }, [date, salonId]);

  const toggleService = id => {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (selectedServices.length === 0) return setError('Select at least one service');
    if (!selectedSlot) return setError('Select a time slot');
    try {
      await api.post('/bookings/', {
        salon: Number(salonId),
        requested_datetime: selectedSlot,
        salon_service_ids: selectedServices,
        notes,
      });
      navigate('/client/bookings');
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Booking failed');
    }
  };

  if (!salon) return <div style={s.wrap}>Loading...</div>;

  return (
    <div style={s.wrap}>
      <h2>Book at {salon.name}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={submit} style={s.form}>
        <h4>Select Services</h4>
        <div style={s.serviceGrid}>
          {services.map(ss => (
            <label key={ss.id} style={{ ...s.serviceCard, ...(selectedServices.includes(ss.id) ? s.selected : {}) }}>
              <input type="checkbox" checked={selectedServices.includes(ss.id)} onChange={() => toggleService(ss.id)} style={{ marginRight: 8 }} />
              <strong>{ss.service_name}</strong>
              <span> — LKR {ss.effective_price} ({ss.effective_duration}min)</span>
            </label>
          ))}
        </div>

        <h4>Select Date</h4>
        <input type="date" style={s.input} value={date} onChange={e => { setDate(e.target.value); setSelectedSlot(''); }} min={new Date().toISOString().split('T')[0]} />

        {slots.length > 0 && (
          <>
            <h4>Select Time</h4>
            <div style={s.slotGrid}>
              {slots.map(sl => (
                <button key={sl.datetime} type="button"
                  disabled={!sl.available}
                  onClick={() => setSelectedSlot(sl.datetime)}
                  style={{ ...s.slotBtn, ...(selectedSlot === sl.datetime ? s.slotSelected : {}), ...(sl.available ? {} : s.slotTaken) }}>
                  {sl.datetime.split('T')[1]}
                </button>
              ))}
            </div>
          </>
        )}

        <h4>Notes (optional)</h4>
        <textarea style={s.input} rows={3} value={notes} onChange={e => setNotes(e.target.value)} />

        <button style={s.btn} type="submit">Confirm Booking</button>
      </form>
    </div>
  );
}

const s = {
  wrap: { maxWidth: 700, margin: '40px auto', padding: 24 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: '8px 12px', fontSize: 14, border: '1px solid #ccc', borderRadius: 4, width: '100%', boxSizing: 'border-box' },
  btn: { padding: '10px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', alignSelf: 'flex-start' },
  serviceGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  serviceCard: { padding: 10, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  selected: { borderColor: '#27ae60', background: '#eafaf1' },
  slotGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  slotBtn: { padding: '6px 12px', border: '1px solid #3498db', borderRadius: 4, cursor: 'pointer', background: '#fff', fontSize: 13 },
  slotSelected: { background: '#3498db', color: '#fff' },
  slotTaken: { background: '#f0f0f0', color: '#aaa', borderColor: '#ddd', cursor: 'not-allowed' },
};

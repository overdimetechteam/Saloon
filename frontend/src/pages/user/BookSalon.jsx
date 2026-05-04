import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { c, shadow } from '../../styles/theme';

export default function BookSalon() {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState([]);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/salons/${salonId}/`).then(r => setSalon(r.data)).catch(() => {});
    api.get(`/salons/${salonId}/services/`).then(r => setServices(r.data)).catch(() => {});
  }, [salonId]);

  useEffect(() => {
    if (!date) return;
    setSlotsLoading(true); setSlot('');
    api.get(`/salons/${salonId}/calendar/available-slots/?date=${date}`)
      .then(r => setSlots(r.data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [date, salonId]);

  const toggle = id => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const submit = async e => {
    e.preventDefault(); setError('');
    if (selected.length === 0) return setError('Please select at least one service');
    if (!slot) return setError('Please select a time slot');
    setSubmitting(true);
    try {
      await api.post('/bookings/', { salon: Number(salonId), requested_datetime: slot, salon_service_ids: selected, notes });
      navigate('/user/bookings');
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Booking failed');
    } finally { setSubmitting(false); }
  };

  if (!salon) return <div style={s.loading}>Loading…</div>;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={s.page}>
      <Link to={`/salons/${salonId}`} style={s.back}>← Back to {salon.name}</Link>

      <div style={s.layout}>
        <div style={s.form}>
          <h2 style={s.title}>Book an Appointment</h2>
          <p style={s.sub}>{salon.name}</p>

          {error && <div style={s.alert}>{error}</div>}

          <form onSubmit={submit}>
            <div style={s.section}>
              <h4 style={s.sectionTitle}>1. Select Services</h4>
              <div style={s.serviceList}>
                {services.map(ss => {
                  const on = selected.includes(ss.id);
                  return (
                    <label key={ss.id} style={{ ...s.serviceItem, ...(on ? s.serviceSelected : {}) }}>
                      <input type="checkbox" checked={on} onChange={() => toggle(ss.id)} style={s.checkbox} />
                      <div style={s.serviceInfo}>
                        <span style={s.serviceName}>{ss.service_name}</span>
                        <span style={s.serviceMeta}>⏱ {ss.effective_duration}min</span>
                      </div>
                      <span style={s.servicePrice}>LKR {ss.effective_price}</span>
                    </label>
                  );
                })}
                {services.length === 0 && <p style={{ color: c.textMuted }}>No services available.</p>}
              </div>
            </div>

            <div style={s.section}>
              <h4 style={s.sectionTitle}>2. Pick a Date</h4>
              <input type="date" style={s.dateInput} value={date} min={today}
                onChange={e => { setDate(e.target.value); setSlot(''); }} />
            </div>

            {date && (
              <div style={s.section}>
                <h4 style={s.sectionTitle}>3. Pick a Time</h4>
                {slotsLoading ? <p style={{ color: c.textMuted }}>Loading slots…</p> : (
                  <div style={s.slotGrid}>
                    {slots.map(sl => (
                      <button key={sl.datetime} type="button" disabled={!sl.available}
                        onClick={() => setSlot(sl.datetime)}
                        style={{ ...s.slotBtn, ...(slot === sl.datetime ? s.slotOn : {}), ...(!sl.available ? s.slotOff : {}) }}>
                        {sl.datetime.split('T')[1]}
                      </button>
                    ))}
                    {slots.length === 0 && <p style={{ color: c.textMuted }}>No slots available for this date.</p>}
                  </div>
                )}
              </div>
            )}

            <div style={s.section}>
              <h4 style={s.sectionTitle}>4. Notes <span style={s.opt}>(optional)</span></h4>
              <textarea style={s.textarea} rows={3} placeholder="Any special requests or instructions…" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <button style={{ ...s.submitBtn, opacity: submitting ? 0.7 : 1 }} type="submit" disabled={submitting}>
              {submitting ? 'Booking…' : 'Confirm Booking'}
            </button>
          </form>
        </div>

        <div style={s.summary}>
          <div style={s.summaryCard}>
            <h4 style={s.summaryTitle}>Booking Summary</h4>
            {selected.length === 0 ? <p style={{ color: c.textMuted, fontSize: 13 }}>No services selected</p> :
              services.filter(ss => selected.includes(ss.id)).map(ss => (
                <div key={ss.id} style={s.sumItem}>
                  <span style={s.sumName}>{ss.service_name}</span>
                  <span style={s.sumPrice}>LKR {ss.effective_price}</span>
                </div>
              ))
            }
            {selected.length > 0 && (
              <div style={s.sumTotal}>
                <span>Total</span>
                <span>LKR {services.filter(ss => selected.includes(ss.id)).reduce((sum, ss) => sum + Number(ss.effective_price), 0).toFixed(2)}</span>
              </div>
            )}
            {date && <div style={s.sumDate}>📅 {date}</div>}
            {slot && <div style={s.sumSlot}>⏰ {slot.split('T')[1]}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { maxWidth: 900, margin: '0 auto' },
  loading: { padding: 60, textAlign: 'center', color: c.textMuted },
  back: { display: 'inline-block', marginBottom: 20, color: c.primary, textDecoration: 'none', fontWeight: 500, fontSize: 14 },
  layout: { display: 'flex', gap: 28, alignItems: 'flex-start' },
  form: { flex: 1 },
  title: { fontSize: 24, fontWeight: 700, color: c.text, margin: 0, marginBottom: 4 },
  sub: { color: c.textMuted, marginBottom: 24 },
  alert: { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.error, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  section: { background: c.surface, borderRadius: 12, padding: 20, marginBottom: 16, border: `1px solid ${c.border}`, boxShadow: shadow.sm },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 14 },
  opt: { fontWeight: 400, color: c.textLight, fontSize: 12 },
  serviceList: { display: 'flex', flexDirection: 'column', gap: 8 },
  serviceItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: `1px solid ${c.border}`, borderRadius: 8, cursor: 'pointer', background: '#fff' },
  serviceSelected: { borderColor: c.primary, background: c.primarySoft },
  checkbox: { width: 16, height: 16, flexShrink: 0 },
  serviceInfo: { flex: 1 },
  serviceName: { display: 'block', fontWeight: 600, fontSize: 14, color: c.text },
  serviceMeta: { display: 'block', fontSize: 12, color: c.textMuted, marginTop: 2 },
  servicePrice: { fontWeight: 700, color: c.primary, fontSize: 15, flexShrink: 0 },
  dateInput: { padding: '10px 14px', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' },
  slotGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  slotBtn: { padding: '8px 14px', border: `1px solid ${c.border}`, borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: c.text },
  slotOn: { background: c.primary, color: '#fff', borderColor: c.primary },
  slotOff: { background: c.bg, color: c.textLight, cursor: 'not-allowed', borderColor: c.border },
  textarea: { width: '100%', padding: '10px 14px', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' },
  submitBtn: { width: '100%', padding: '14px', background: c.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  summary: { width: 260, flexShrink: 0, position: 'sticky', top: 20 },
  summaryCard: { background: c.surface, borderRadius: 14, padding: 20, border: `1px solid ${c.border}`, boxShadow: shadow.sm },
  summaryTitle: { fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${c.border}` },
  sumItem: { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 },
  sumName: { color: c.textSub },
  sumPrice: { fontWeight: 600, color: c.text },
  sumTotal: { display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, paddingTop: 10, marginTop: 4, borderTop: `1px solid ${c.border}` },
  sumDate: { marginTop: 14, padding: '8px 10px', background: c.bg, borderRadius: 6, fontSize: 13, color: c.textSub },
  sumSlot: { marginTop: 6, padding: '8px 10px', background: c.bg, borderRadius: 6, fontSize: 13, color: c.textSub },
};

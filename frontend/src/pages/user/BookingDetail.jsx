import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { c, STATUS_META } from '../../styles/theme';

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n} type="button"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 30, lineHeight: 1, padding: '2px 3px',
            color: n <= (hover || value) ? '#F59E0B' : 'var(--border)',
            transition: 'color .12s ease, transform .12s ease',
            transform: n <= (hover || value) ? 'scale(1.18)' : 'scale(1)',
          }}
        >★</button>
      ))}
    </div>
  );
}

export default function UserBookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const load = () => api.get(`/bookings/${id}/`).then(r => setBooking(r.data)).catch(() => {});
  useEffect(() => { load(); }, [id]);

  const cancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try { await api.post(`/bookings/${id}/cancel/`); setMsg('Booking cancelled.'); load(); }
    catch (err) { setError(err.response?.data?.detail || 'Error cancelling'); }
  };

  const selectSlot = async slotId => {
    try { await api.post(`/bookings/${id}/select-slot/`, { slot_id: slotId }); setMsg('Slot confirmed! The salon will finalise shortly.'); load(); }
    catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  const submitReview = async () => {
    if (!reviewRating) return setError('Please select a star rating');
    setReviewSubmitting(true); setError('');
    try {
      await api.post(`/bookings/${id}/review/`, { rating: reviewRating, comment: reviewComment });
      setMsg('Thank you for your review!');
      load();
    } catch (err) { setError(err.response?.data?.detail || 'Error submitting review'); }
    finally { setReviewSubmitting(false); }
  };

  if (!booking) return (
    <div style={s.loader}>
      <div style={s.loaderSpinner} />
    </div>
  );

  const meta = STATUS_META[booking.status] || { label: booking.status, color: '#888', bg: '#f0f0f0' };
  const currentRound = booking.negotiation_round;
  const currentSlots = (booking.alternative_slots || []).filter(sl => sl.round_number === currentRound && !sl.is_selected);
  const dt = new Date(booking.requested_datetime);

  return (
    <div style={s.page}>
      <Link to="/user/bookings" style={s.back} className="fade-in">
        ← Back to Bookings
      </Link>

      <div style={s.card} className="fade-up">
        {/* Status bar at top */}
        <div style={{ ...s.statusBar, background: meta.bg, borderBottom: `1px solid ${meta.color}25` }}>
          <div style={{ ...s.statusGlow, background: meta.color }} />
          <span style={{ ...s.statusLabel, color: meta.color }}>{meta.label}</span>
          <span style={s.bookingNum}>Booking #{booking.id}</span>
        </div>

        {/* Salon info */}
        <div style={s.heroSection}>
          <div style={s.salonInitial}>{booking.salon_name?.[0]?.toUpperCase()}</div>
          <div>
            <h2 style={s.salonName}>{booking.salon_name}</h2>
            <div style={s.dtDisplay}>
              <span>◷</span>
              {dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              {' at '}
              {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {error && <div style={s.alert}>{error}</div>}
        {msg   && <div style={s.success}>{msg}</div>}

        {/* Info grid */}
        <div style={s.infoGrid}>
          <div style={s.infoCell}>
            <div style={s.infoCellLabel}>Negotiation Round</div>
            <div style={s.infoCellVal}>
              {booking.negotiation_round} / 5
              <div style={s.roundBar}>
                {[1,2,3,4,5].map(n => (
                  <div key={n} style={{ ...s.roundDot, background: n <= booking.negotiation_round ? meta.color : '#E5E7EB' }} />
                ))}
              </div>
            </div>
          </div>
          {booking.notes && (
            <div style={{ ...s.infoCell, gridColumn: '1 / -1' }}>
              <div style={s.infoCellLabel}>Your Notes</div>
              <div style={{ ...s.infoCellVal, fontWeight: 400, fontStyle: 'italic', color: c.textSub }}>"{booking.notes}"</div>
            </div>
          )}
        </div>

        {/* Services */}
        {booking.booking_services?.length > 0 && (
          <div style={s.servicesSection}>
            <div style={s.sectionTitle}>Services Booked</div>
            <div style={s.serviceChips}>
              {booking.booking_services.map(bs => (
                <span key={bs.id} style={s.serviceChip}>✂ {bs.service_name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Alternative slots */}
        {booking.status === 'awaiting_client' && currentSlots.length > 0 && (
          <div style={s.altSection}>
            <div style={s.altHeader}>
              <span style={s.altIcon}>⚡</span>
              <div>
                <div style={s.altTitle}>Alternative Slots Available</div>
                <div style={s.altSub}>The salon couldn't confirm your original time. Please choose one below.</div>
              </div>
            </div>
            <div style={s.slotList}>
              {currentSlots.map((sl, i) => {
                const slDt = new Date(sl.proposed_datetime);
                return (
                  <div key={sl.id} style={s.slotCard} className={`fade-up d${i + 1}`}>
                    <div style={s.slotDate}>
                      <div style={s.slotDay}>
                        {slDt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div style={s.slotTime}>
                        {slDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button style={s.selectBtn} onClick={() => selectSlot(sl.id)}>
                      Select this slot →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Review section */}
        {booking.status === 'completed' && !booking.has_review && (
          <div style={s.reviewSection}>
            <div style={s.reviewHeader}>
              <span style={{ fontSize: 20 }}>★</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>Leave a Review</div>
                <div style={{ fontSize: 12, color: c.textMuted }}>How was your experience at {booking.salon_name}?</div>
              </div>
            </div>
            <StarPicker value={reviewRating} onChange={setReviewRating} />
            <textarea
              style={s.reviewTextarea}
              rows={3}
              placeholder="Share your experience (optional)…"
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
            />
            <button style={{ ...s.reviewSubmitBtn, opacity: reviewSubmitting ? 0.7 : 1 }} onClick={submitReview} disabled={reviewSubmitting}>
              {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        )}
        {booking.status === 'completed' && booking.has_review && booking.review && (
          <div style={s.reviewSection}>
            <div style={s.reviewHeader}>
              <span style={{ fontSize: 20 }}>★</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>Your Review</div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1,2,3,4,5].map(n => (
                    <span key={n} style={{ fontSize: 18, color: n <= booking.review.rating ? '#F59E0B' : 'var(--border)' }}>★</span>
                  ))}
                </div>
              </div>
            </div>
            {booking.review.comment && (
              <p style={{ fontSize: 13, color: c.textSub, fontStyle: 'italic', margin: '8px 0 0' }}>"{booking.review.comment}"</p>
            )}
          </div>
        )}

        {/* Actions */}
        {!['cancelled','completed','flagged'].includes(booking.status) && (
          <div style={s.actions}>
            <button style={s.cancelBtn} onClick={cancel}>Cancel Booking</button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { maxWidth: 700, margin: '0 auto' },
  loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 },
  loaderSpinner: {
    width: 32, height: 32, borderRadius: '50%',
    border: '3px solid #EDE9FE', borderTopColor: '#7C3AED',
    animation: 'spinSlow .7s linear infinite',
  },
  back: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, color: c.primary, fontWeight: 500, marginBottom: 20,
    transition: 'gap .15s ease',
  },

  card: {
    background: 'var(--surface)', borderRadius: 22,
    boxShadow: '0 8px 32px rgba(124,58,237,.1)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },

  statusBar: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px',
  },
  statusGlow: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
    animation: 'pulseRing 2.5s ease infinite',
  },
  statusLabel: { fontWeight: 700, fontSize: 13 },
  bookingNum: { fontSize: 12, color: c.textMuted, marginLeft: 'auto' },

  heroSection: {
    display: 'flex', gap: 18, alignItems: 'center',
    padding: '24px 28px', borderBottom: '1px solid #F3F4F6',
  },
  salonInitial: {
    width: 56, height: 56, borderRadius: 16, flexShrink: 0,
    background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, fontWeight: 800, boxShadow: '0 4px 14px rgba(124,58,237,.3)',
  },
  salonName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 22, fontWeight: 700, color: c.text, margin: '0 0 6px',
  },
  dtDisplay: { fontSize: 14, color: c.textMuted, display: 'flex', alignItems: 'center', gap: 6 },

  alert: {
    margin: '0 28px 16px',
    background: '#FEF2F2', border: '1px solid #FCA5A5',
    color: '#DC2626', borderRadius: 10, padding: '10px 14px', fontSize: 13,
  },
  success: {
    margin: '0 28px 16px',
    background: '#ECFDF5', border: '1px solid #6EE7B7',
    color: '#059669', borderRadius: 10, padding: '10px 14px', fontSize: 13,
  },

  infoGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
    padding: '20px 28px',
  },
  infoCell: {
    background: 'var(--surface2)', borderRadius: 12, padding: '14px 16px',
    border: '1px solid var(--border)',
  },
  infoCellLabel: {
    fontSize: 10, fontWeight: 700, color: c.textLight,
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
  },
  infoCellVal: { fontSize: 14, fontWeight: 700, color: c.text },
  roundBar: { display: 'flex', gap: 4, marginTop: 6 },
  roundDot: { width: 16, height: 4, borderRadius: 2, transition: 'background .3s ease' },

  servicesSection: { padding: '0 28px 20px' },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, color: c.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
  },
  serviceChips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  serviceChip: {
    padding: '6px 14px', background: c.primarySoft, color: c.primary,
    borderRadius: 20, fontSize: 13, fontWeight: 500, border: '1px solid #DDD6FE',
  },

  altSection: {
    margin: '0 28px 20px',
    background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
    borderRadius: 16, padding: 20,
    border: '1px solid #FDE68A',
  },
  altHeader: { display: 'flex', gap: 12, marginBottom: 16 },
  altIcon: { fontSize: 20, flexShrink: 0 },
  altTitle: { fontWeight: 700, fontSize: 14, color: '#92400E', marginBottom: 3 },
  altSub: { fontSize: 12, color: '#B45309' },
  slotList: { display: 'flex', flexDirection: 'column', gap: 8 },
  slotCard: {
    background: '#fff', borderRadius: 10, padding: '12px 16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    border: '1px solid #FDE68A',
  },
  slotDay: { fontWeight: 600, fontSize: 14, color: c.text, marginBottom: 2 },
  slotTime: { fontSize: 12, color: c.textMuted },
  slotDate: {},
  selectBtn: {
    padding: '8px 18px',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
    fontWeight: 600, fontSize: 13,
    boxShadow: '0 3px 10px rgba(5,150,105,.25)',
  },

  reviewSection: {
    margin: '0 28px 20px',
    background: 'linear-gradient(135deg, #FFFBF0 0%, #FEF9EC 100%)',
    borderRadius: 16, padding: 20,
    border: '1px solid #FDE68A',
  },
  reviewHeader: { display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  reviewTextarea: {
    width: '100%', marginTop: 12, padding: '10px 14px',
    border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
    background: 'var(--input-bg)', color: 'var(--text)',
    boxSizing: 'border-box', minHeight: 80,
  },
  reviewSubmitBtn: {
    marginTop: 10, padding: '9px 22px',
    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    color: '#fff', border: 'none', borderRadius: 10,
    cursor: 'pointer', fontWeight: 700, fontSize: 13,
    boxShadow: '0 4px 12px rgba(245,158,11,.3)',
  },

  actions: {
    padding: '20px 28px 24px',
    borderTop: '1px solid var(--border)',
  },
  cancelBtn: {
    padding: '10px 22px',
    background: '#FEF2F2', color: '#DC2626',
    border: '1px solid #FECACA', borderRadius: 10,
    cursor: 'pointer', fontWeight: 600, fontSize: 13,
  },
};

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { c, STATUS_META } from '../../styles/theme';
import { useIsMobile } from '../../hooks/useMobile';

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
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 32, lineHeight: 1, padding: '2px 3px',
            color: n <= (hover || value) ? '#BF9B65' : 'var(--border)',
            transition: 'color .12s ease, transform .12s ease',
            transform: n <= (hover || value) ? 'scale(1.2)' : 'scale(1)',
            filter: n <= (hover || value) ? 'drop-shadow(0 0 6px rgba(191,155,101,.5))' : 'none',
          }}
        >★</button>
      ))}
    </div>
  );
}

export default function UserBookingDetail() {
  const { id } = useParams();
  const isMobile = useIsMobile();
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
        {/* Status bar */}
        <div style={{ ...s.statusBar, background: meta.bg, borderBottom: `1px solid ${meta.color}22` }}>
          <div style={{ ...s.statusGlow, background: meta.color, boxShadow: `0 0 0 4px ${meta.color}30` }} />
          <span style={{ ...s.statusLabel, color: meta.color }}>{meta.label}</span>
          <span style={s.bookingNum}>Booking #{booking.id}</span>
        </div>

        {/* Salon hero */}
        <div style={s.heroSection}>
          <div style={{ ...s.salonInitial, boxShadow: `0 6px 20px ${meta.color}40` }}>
            {booking.salon_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 style={s.salonName}>{booking.salon_name}</h2>
            <div style={s.dtDisplay}>
              <span style={{ color: meta.color }}>◷</span>
              {dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              {' at '}
              {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {error && <div style={s.alertErr}>{error}</div>}
        {msg   && <div style={s.alertOk}>{msg}</div>}

        {/* Info grid */}
        <div style={{ ...s.infoGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', padding: isMobile ? '16px 18px' : '20px 28px' }}>
          <div style={s.infoCell}>
            <div style={s.infoCellLabel}>Negotiation Round</div>
            <div style={s.infoCellVal}>
              {booking.negotiation_round} / 5
              <div style={s.roundBar}>
                {[1,2,3,4,5].map(n => (
                  <div key={n} style={{ ...s.roundDot, background: n <= booking.negotiation_round ? meta.color : 'var(--border)' }} />
                ))}
              </div>
            </div>
          </div>
          {booking.notes && (
            <div style={{ ...s.infoCell, gridColumn: '1 / -1' }}>
              <div style={s.infoCellLabel}>Your Notes</div>
              <div style={{ ...s.infoCellVal, fontWeight: 400, fontStyle: 'italic', color: 'var(--text-sub)' }}>"{booking.notes}"</div>
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
              <div style={s.altIconWrap}>⚡</div>
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
                    <div>
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

        {/* Review — submit */}
        {booking.status === 'completed' && !booking.has_review && (
          <div style={s.reviewSection}>
            <div style={s.reviewHeader}>
              <div style={s.reviewIconWrap}>★</div>
              <div>
                <div style={s.reviewTitle}>Leave a Review</div>
                <div style={s.reviewSub}>How was your experience at {booking.salon_name}?</div>
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
              {reviewSubmitting ? 'Submitting…' : '★ Submit Review'}
            </button>
          </div>
        )}

        {/* Review — display */}
        {booking.status === 'completed' && booking.has_review && booking.review && (
          <div style={s.reviewSection}>
            <div style={s.reviewHeader}>
              <div style={s.reviewIconWrap}>★</div>
              <div>
                <div style={s.reviewTitle}>Your Review</div>
                <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                  {[1,2,3,4,5].map(n => (
                    <span key={n} style={{ fontSize: 18, color: n <= booking.review.rating ? '#BF9B65' : 'var(--border)' }}>★</span>
                  ))}
                </div>
              </div>
            </div>
            {booking.review.comment && (
              <p style={{ fontSize: 13, color: 'var(--text-sub)', fontStyle: 'italic', margin: '10px 0 0', lineHeight: 1.6 }}>"{booking.review.comment}"</p>
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
    border: '3px solid rgba(124,58,237,.15)', borderTopColor: '#7C3AED',
    animation: 'spinSlow .7s linear infinite',
  },
  back: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, color: '#7C3AED', fontWeight: 600, marginBottom: 22,
    transition: 'gap .15s ease', textDecoration: 'none',
  },

  card: {
    background: 'var(--surface)', borderRadius: 24,
    boxShadow: '0 8px 40px rgba(124,58,237,.1), 0 2px 8px rgba(0,0,0,.04)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },

  statusBar: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px',
  },
  statusGlow: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
    animation: 'pulseRing 2.5s ease infinite',
  },
  statusLabel: { fontWeight: 700, fontSize: 13, letterSpacing: '0.02em' },
  bookingNum: { fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 500 },

  heroSection: {
    display: 'flex', gap: 18, alignItems: 'center',
    padding: '20px 18px', borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap',
  },
  salonInitial: {
    width: 58, height: 58, borderRadius: 17, flexShrink: 0,
    background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 26, fontWeight: 700,
  },
  salonName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px',
    letterSpacing: '-0.01em',
  },
  dtDisplay: { fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 7 },

  alertErr: {
    margin: '0 18px 14px',
    background: '#FEF2F2', border: '1px solid #FCA5A5',
    color: '#DC2626', borderRadius: 12, padding: '11px 16px', fontSize: 13,
  },
  alertOk: {
    margin: '0 18px 14px',
    background: '#ECFDF5', border: '1px solid #6EE7B7',
    color: '#059669', borderRadius: 12, padding: '11px 16px', fontSize: 13,
  },

  infoGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
    padding: '20px 28px',
  },
  infoCell: {
    background: 'var(--surface2)', borderRadius: 14, padding: '14px 16px',
    border: '1px solid var(--border)',
  },
  infoCellLabel: {
    fontSize: 9, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7,
  },
  infoCellVal: { fontSize: 15, fontWeight: 700, color: 'var(--text)' },
  roundBar: { display: 'flex', gap: 4, marginTop: 8 },
  roundDot: { width: 18, height: 4, borderRadius: 2, transition: 'background .3s ease' },

  servicesSection: { padding: '0 18px 20px' },
  sectionTitle: {
    fontSize: 9, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10,
  },
  serviceChips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  serviceChip: {
    padding: '6px 14px', background: 'rgba(124,58,237,.08)', color: '#7C3AED',
    borderRadius: 20, fontSize: 13, fontWeight: 500, border: '1px solid rgba(124,58,237,.18)',
  },

  altSection: {
    margin: '0 18px 20px',
    background: 'rgba(217,119,6,.07)',
    borderRadius: 18, padding: 20,
    border: '1px solid rgba(217,119,6,.25)',
  },
  altHeader: { display: 'flex', gap: 14, marginBottom: 18, alignItems: 'flex-start' },
  altIconWrap: {
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, boxShadow: '0 4px 12px rgba(217,119,6,.3)',
  },
  altTitle: { fontWeight: 700, fontSize: 14, color: '#D97706', marginBottom: 4 },
  altSub: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 },
  slotList: { display: 'flex', flexDirection: 'column', gap: 8 },
  slotCard: {
    background: 'rgba(255,255,255,.85)', borderRadius: 12, padding: '13px 16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    border: '1px solid #FDE68A', backdropFilter: 'blur(8px)',
  },
  slotDay: { fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 2 },
  slotTime: { fontSize: 12, color: 'var(--text-muted)' },
  selectBtn: {
    padding: '9px 20px',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
    fontWeight: 700, fontSize: 13,
    boxShadow: '0 4px 12px rgba(5,150,105,.3)',
  },

  reviewSection: {
    margin: '0 18px 20px',
    background: 'linear-gradient(135deg, rgba(191,155,101,.06) 0%, rgba(245,234,216,.12) 100%)',
    borderRadius: 18, padding: 20,
    border: '1px solid rgba(191,155,101,.3)',
  },
  reviewHeader: { display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' },
  reviewIconWrap: {
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(135deg, #BF9B65 0%, #9A7845 100%)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, boxShadow: '0 4px 12px rgba(191,155,101,.35)',
  },
  reviewTitle: { fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 },
  reviewSub: { fontSize: 12, color: 'var(--text-muted)' },
  reviewTextarea: {
    width: '100%', marginTop: 14, padding: '11px 14px',
    border: '1.5px solid var(--border)', borderRadius: 12,
    fontSize: 13, resize: 'vertical', fontFamily: "'DM Sans', sans-serif",
    background: 'var(--input-bg)', color: 'var(--text)',
    boxSizing: 'border-box', minHeight: 80,
  },
  reviewSubmitBtn: {
    marginTop: 12, padding: '10px 24px',
    background: 'linear-gradient(135deg, #BF9B65 0%, #9A7845 100%)',
    color: '#fff', border: 'none', borderRadius: 10,
    cursor: 'pointer', fontWeight: 700, fontSize: 13,
    boxShadow: '0 4px 14px rgba(191,155,101,.4)',
  },

  actions: {
    padding: '16px 18px 20px',
    borderTop: '1px solid var(--border)',
  },
  cancelBtn: {
    padding: '10px 24px',
    background: '#FEF2F2', color: '#DC2626',
    border: '1px solid #FECACA', borderRadius: 10,
    cursor: 'pointer', fontWeight: 600, fontSize: 13,
    transition: 'background .15s ease',
  },
};

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useMobile';

const MOCK_PHOTOS = [
  { grad: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)', label: 'Styling Area'  },
  { grad: 'linear-gradient(135deg, #1E0A3C 0%, #7C3AED 100%)', label: 'Interior'      },
  { grad: 'linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)', label: 'Nail Station'  },
  { grad: 'linear-gradient(135deg, #059669 0%, #2563EB 100%)', label: 'Skin Room'     },
  { grad: 'linear-gradient(135deg, #D97706 0%, #7C3AED 100%)', label: 'Lounge'        },
];

const MOCK_TEAM = [
  { name: 'Sophie Laurent', role: 'Senior Stylist',   specialty: 'Color & Cuts',     color: '#7C3AED', bg: 'rgba(124,58,237,.12)'  },
  { name: 'James Kai',      role: 'Nail Technician',  specialty: 'Gel & Acrylics',   color: '#EC4899', bg: 'rgba(236,72,153,.12)'  },
  { name: 'Aria Chen',      role: 'Skin Therapist',   specialty: 'Facials & Peels',  color: '#059669', bg: 'rgba(5,150,105,.12)'   },
  { name: 'Luca Moretti',   role: 'Hair Artist',      specialty: 'Balayage & Perms', color: '#2563EB', bg: 'rgba(37,99,235,.12)'   },
];

const MOCK_REVIEWS = [
  { name: 'Emma W.',   rating: 5, date: 'April 2025',  text: 'Absolutely stunning experience! The team is incredibly professional and the salon is gorgeous. Best in the city without a doubt.' },
  { name: 'Marcus B.', rating: 4, date: 'March 2025',  text: 'Great service and a beautifully designed space. My hair has never looked better. Highly recommend to everyone.' },
  { name: 'Priya K.',  rating: 5, date: 'April 2025',  text: 'Pure luxury from start to finish. The attention to detail is incredible — worth every rupee. Will keep returning!' },
];

const CAT_COLORS = {
  Hair: '#7C3AED', Nails: '#EC4899',
  Skin: '#059669', Makeup: '#D97706', Other: '#2563EB',
};

const PALETTE = [
  'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
  'linear-gradient(135deg, #059669 0%, #2563EB 100%)',
  'linear-gradient(135deg, #D97706 0%, #DC2626 100%)',
  'linear-gradient(135deg, #1E0A3C 0%, #7C3AED 100%)',
];

function Stars({ rating, size = 14 }) {
  return (
    <span style={{ letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= rating ? '#BF9B65' : 'var(--border)', fontSize: size }}>★</span>
      ))}
    </span>
  );
}

export default function SalonDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [salon, setSalon]           = useState(null);
  const [services, setServices]     = useState([]);
  const [otherSalons, setOther]     = useState([]);
  const [reviews, setReviews]       = useState([]);
  const [summary, setSummary]       = useState(null);
  const [isFav, setIsFav]           = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    api.get(`/salons/${id}/`).then(r => setSalon(r.data)).catch(() => {});
    api.get(`/salons/${id}/services/`).then(r => setServices(r.data)).catch(() => {});
    api.get('/salons/').then(r =>
      setOther(r.data.filter(s => s.id !== +id && s.status === 'active').slice(0, 4))
    ).catch(() => {});
    api.get(`/salons/${id}/reviews/`).then(r => setReviews(r.data)).catch(() => {});
    api.get(`/salons/${id}/reviews/summary/`).then(r => setSummary(r.data)).catch(() => {});
    if (profile?.role === 'client') {
      api.get(`/salons/${id}/favourite/`).then(r => setIsFav(r.data.is_favourited)).catch(() => {});
    }
  }, [id, profile]);

  const toggleFav = async () => {
    if (!profile || profile.role !== 'client') return;
    setFavLoading(true);
    try {
      const r = await api.post(`/salons/${id}/favourite/`);
      setIsFav(r.data.is_favourited);
    } catch {} finally { setFavLoading(false); }
  };

  if (!salon) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', background: 'var(--bg)' }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', border: '3px solid rgba(124,58,237,.15)', borderTopColor: '#7C3AED', animation: 'spinSlow .7s linear infinite' }} />
    </div>
  );

  const grouped = services.reduce((acc, ss) => {
    const cat = ss.service_category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ss);
    return acc;
  }, {});

  const fullAddress = `${salon.address_street}, ${salon.address_city} ${salon.address_postal}`;
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;
  const isClient = profile?.role === 'client';

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* HERO */}
      <div style={{ ...s.hero, padding: isMobile ? '36px 20px 30px' : '52px 48px 44px' }}>
        <div style={s.heroBg} />
        <div style={{ ...s.heroInner, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 20 : 24 }}>
          <div style={{ ...s.heroLeft, gap: isMobile ? 16 : 22 }}>
            <div style={{ ...s.salonInitial, width: isMobile ? 56 : 72, height: isMobile ? 56 : 72, fontSize: isMobile ? 24 : 34 }}>{salon.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={s.eyebrow}>Featured Salon</div>
              <h1 style={{ ...s.salonName, fontSize: isMobile ? 28 : 42 }}>{salon.name}</h1>

              <div style={s.ratingRow}>
                <Stars rating={summary ? Math.round(summary.average_rating) : 5} size={16} />
                <span style={s.ratingNum}>{summary ? summary.average_rating.toFixed(1) : '—'}</span>
                <span style={s.ratingCt}>({summary ? summary.total_reviews : 0} review{summary?.total_reviews !== 1 ? 's' : ''})</span>
                <span style={s.dot}>·</span>
                <span style={s.openBadge}>
                  <span style={{ color: '#34D399', marginRight: 4 }}>●</span>
                  {salon.status === 'active' ? 'Open Now' : 'Closed'}
                </span>
              </div>

              <div style={s.addrRow}>
                <span style={s.addrText}>📍 {fullAddress}</span>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`}
                  target="_blank" rel="noreferrer"
                  style={s.locationBtn}
                >
                  See Location ↗
                </a>
              </div>

              <div style={s.contactRow}>
                {salon.contact_number && <span style={s.contactTag}>📞 {salon.contact_number}</span>}
                {salon.email && <span style={s.contactTag}>✉ {salon.email}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0, justifyContent: isMobile ? 'center' : 'flex-start' }}>
            {isClient && (
              <button
                onClick={toggleFav}
                disabled={favLoading}
                title={isFav ? 'Remove from favourites' : 'Save to favourites'}
                style={{
                  width: 48, height: 48, borderRadius: 14, border: 'none',
                  background: isFav ? 'rgba(236,72,153,.25)' : 'rgba(255,255,255,.12)',
                  color: isFav ? '#EC4899' : 'rgba(255,255,255,.7)',
                  fontSize: 22, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s ease',
                  boxShadow: isFav ? '0 4px 14px rgba(236,72,153,.35)' : 'none',
                }}
              >
                {isFav ? '♥' : '♡'}
              </button>
            )}
            {isClient && (
              <Link to={`/user/book/${id}`} style={s.heroBookBtn} className="lift-sm">
                ✦ Book Now
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* PHOTOS */}
      <div style={s.photoStrip}>
        <div style={s.photoScroll}>
          {MOCK_PHOTOS.map((p, i) => (
            <div key={i} style={{ ...s.photoCard, background: p.grad }} className="lift-sm fade-up">
              <div style={s.photoLabel}>{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* BODY */}
      <div style={{ ...s.body, padding: isMobile ? '28px 16px 40px' : '44px 48px' }}>

        {/* Services */}
        <section style={s.sec} className="fade-up">
          <div style={s.secHead}>
            <div>
              <div style={s.eyebrowSm}>What We Offer</div>
              <h2 style={s.secTitle}>Available Services</h2>
            </div>
            {isClient && (
              <Link to={`/user/book/${id}`} style={s.bookAllBtn}>Book Appointment →</Link>
            )}
          </div>

          {Object.keys(grouped).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '24px 0' }}>No services listed yet.</p>
          ) : (
            Object.entries(grouped).map(([cat, items]) => {
              const cc = CAT_COLORS[cat] || '#7C3AED';
              return (
                <div key={cat} style={{ marginBottom: 28 }}>
                  <div style={{ ...s.catBadge, background: cc + '14', color: cc, border: `1px solid ${cc}28` }}>{cat}</div>
                  <div style={s.svcGrid}>
                    {items.map(ss => (
                      <div key={ss.id} style={s.svcCard} className="lift-sm">
                        <div style={s.svcName}>{ss.service_name}</div>
                        <div style={s.svcMeta}>
                          <span style={s.svcDur}>⏱ {ss.effective_duration} min</span>
                          <span style={{ ...s.svcPrice, color: cc }}>LKR {ss.effective_price}</span>
                        </div>
                        {isClient && (
                          <Link
                            to={`/user/book/${id}`}
                            style={{ ...s.svcBookBtn, background: cc + '12', color: cc, borderColor: cc + '30' }}
                          >
                            Book →
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* About Us — moved above Team */}
        <section style={s.sec} className="fade-up d1">
          <div style={s.eyebrowSm}>Our Story</div>
          <h2 style={s.secTitle}>About {salon.name}</h2>
          <div style={s.aboutCard}>
            <p style={s.aboutText}>
              {salon.description ||
                `Welcome to ${salon.name}, where beauty meets excellence. Nestled in the heart of ${salon.address_city}, we are dedicated to providing an unparalleled salon experience that combines artistry, expertise, and personalised care.`}
            </p>
            <p style={s.aboutText}>
              Our team of highly trained professionals is passionate about helping you look and feel your absolute best. Whether you're in for a fresh cut, a luxurious treatment, or a complete transformation, we promise results that exceed your expectations.
            </p>
            <div style={{ ...s.aboutStats, gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
              {[
                { val: '500+', label: 'Happy Clients'   },
                { val: '4+',  label: 'Years Experience' },
                { val: '15+', label: 'Expert Staff'     },
                { val: '4.8', label: 'Average Rating'   },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34, fontWeight: 700, color: '#7C3AED', marginBottom: 4 }}>{stat.val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section style={s.sec} className="fade-up d2">
          <div style={s.eyebrowSm}>Meet the Experts</div>
          <h2 style={s.secTitle}>Our Team</h2>
          <div style={s.teamGrid}>
            {MOCK_TEAM.map((m, i) => (
              <div key={i} style={{ ...s.teamCard, borderTop: `3px solid ${m.color}` }} className="lift-sm">
                <div style={{ ...s.teamAvatar, background: m.bg, color: m.color, boxShadow: `0 4px 14px ${m.color}28` }}>
                  {m.name.split(' ').map(w => w[0]).join('')}
                </div>
                <div style={s.teamName}>{m.name}</div>
                <div style={{ ...s.teamRole, color: m.color }}>{m.role}</div>
                <div style={s.teamSpec}>{m.specialty}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section style={s.sec} className="fade-up d2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={s.eyebrowSm}>What Clients Say</div>
              <h2 style={{ ...s.secTitle, margin: 0 }}>Reviews</h2>
            </div>
            {summary && summary.total_reviews > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 52, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{summary.average_rating.toFixed(1)}</div>
                <div>
                  <Stars rating={Math.round(summary.average_rating)} size={16} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Based on {summary.total_reviews} review{summary.total_reviews !== 1 ? 's' : ''}</div>
                </div>
              </div>
            )}
          </div>
          {reviews.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0', fontStyle: 'italic' }}>
              No reviews yet. Be the first to review after your visit!
            </div>
          ) : (
            <div style={s.reviewGrid}>
              {reviews.slice(0, 5).map((r, i) => (
                <div key={r.id} style={s.reviewCard} className={`lift-sm fade-up d${i + 1}`}>
                  <div style={s.reviewTop}>
                    <div style={s.reviewAvatar}>{(r.client_name || 'A')[0].toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={s.reviewName}>{r.client_name || 'Anonymous'}</div>
                      <div style={s.reviewDate}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                    </div>
                    <Stars rating={r.rating} size={13} />
                  </div>
                  {r.comment && <p style={s.reviewText}>"{r.comment}"</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Google Map */}
        <section style={s.sec} className="fade-up d2">
          <div style={s.eyebrowSm}>Location</div>
          <h2 style={s.secTitle}>Find Us</h2>
          <div style={s.mapWrap}>
            <iframe
              title="salon-map"
              src={mapSrc}
              style={s.mapFrame}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div style={s.addrBox}>
            <span style={{ fontSize: 20 }}>📍</span>
            <span style={{ color: 'var(--text)', fontWeight: 500, fontSize: 14 }}>{fullAddress}</span>
          </div>
        </section>

        {/* Working Hours */}
        <section style={s.sec} className="fade-up d3">
          <div style={s.eyebrowSm}>When We're Open</div>
          <h2 style={s.secTitle}>Working Hours</h2>
          <div style={s.hoursCard}>
            {Object.keys(salon.operating_hours || {}).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Hours not specified</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '0 40px' }}>
                {Object.entries(salon.operating_hours).map(([day, hours]) => (
                  <div key={day} style={s.hourRow}>
                    <span style={s.dayLabel}>{day.slice(0, 3).toUpperCase()}</span>
                    <span style={s.hoursVal}>{hours.open} – {hours.close}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Other Salons */}
        {otherSalons.length > 0 && (
          <section style={s.sec} className="fade-up d3">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
              <div>
                <div style={s.eyebrowSm}>Discover More</div>
                <h2 style={{ ...s.secTitle, margin: 0 }}>Other Salons</h2>
              </div>
              <Link to="/salons" style={s.seeAllBtn}>Browse All →</Link>
            </div>
            <div style={s.otherScroll}>
              {otherSalons.map((os, i) => (
                <Link key={os.id} to={`/salons/${os.id}`} style={s.otherCard} className="lift-sm">
                  <div style={{ ...s.otherAvatar, background: PALETTE[i % PALETTE.length] }}>
                    {os.name[0]}
                  </div>
                  <div style={s.otherName}>{os.name}</div>
                  <div style={s.otherCity}>{os.address_city}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: os.status === 'active' ? '#34D399' : '#FBBF24', display: 'inline-block' }} />
                    {os.status === 'active' ? 'Open' : 'Closed'}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        {isClient && (
          <div style={s.cta} className="fade-up d5">
            <div style={s.ctaGlow} />
            <h3 style={s.ctaTitle}>Ready for your next experience?</h3>
            <p style={{ color: 'rgba(255,255,255,.7)', marginBottom: 28, fontSize: 15, position: 'relative', zIndex: 1 }}>
              Book your appointment at {salon.name} today.
            </p>
            <Link to={`/user/book/${id}`} style={s.ctaBtn} className="lift-sm">
              ✦ Book Appointment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  hero: {
    background: 'linear-gradient(135deg, #1E0A3C 0%, #3B0764 40%, #6D28D9 75%, #7C3AED 100%)',
    padding: '52px 48px 44px', position: 'relative', overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at top right, rgba(236,72,153,.28) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  heroInner: {
    maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1,
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    flexWrap: 'wrap', gap: 24,
  },
  heroLeft: { display: 'flex', gap: 22, alignItems: 'flex-start', flex: 1 },
  salonInitial: {
    width: 72, height: 72, borderRadius: 20, flexShrink: 0,
    background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,.25)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 34, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,.2)',
  },
  eyebrow: { fontSize: 10, color: 'rgba(196,181,253,.85)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 },
  salonName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 42, fontWeight: 700, color: '#fff', margin: '0 0 12px', lineHeight: 1.1, letterSpacing: '-0.01em',
  },
  ratingRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  ratingNum: { fontSize: 16, fontWeight: 800, color: '#BF9B65' },
  ratingCt:  { fontSize: 13, color: 'rgba(255,255,255,.6)' },
  dot:       { color: 'rgba(255,255,255,.3)', fontSize: 18 },
  openBadge: { fontSize: 12, color: '#F0FFFE', background: 'rgba(52,211,153,.15)', borderRadius: 20, padding: '3px 10px', fontWeight: 600 },
  addrRow:   { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  addrText:  { fontSize: 14, color: 'rgba(255,255,255,.75)' },
  locationBtn: {
    fontSize: 12, fontWeight: 600, color: '#A78BFA',
    background: 'rgba(124,58,237,.22)', borderRadius: 8, padding: '5px 12px',
    border: '1px solid rgba(124,58,237,.35)', flexShrink: 0,
  },
  contactRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  contactTag: { fontSize: 12, color: 'rgba(255,255,255,.65)', background: 'rgba(255,255,255,.08)', borderRadius: 8, padding: '4px 10px' },
  heroBookBtn: {
    padding: '14px 32px', flexShrink: 0,
    background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
    color: '#fff', borderRadius: 14, fontWeight: 700, fontSize: 16,
    textDecoration: 'none', boxShadow: '0 6px 20px rgba(236,72,153,.45)',
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontFamily: "'DM Sans', sans-serif",
  },

  photoStrip: { background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '20px 0' },
  photoScroll: {
    display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4,
    maxWidth: 1100, margin: '0 auto', padding: '0 16px 4px',
    scrollbarWidth: 'none',
  },
  photoCard: {
    width: 210, height: 145, borderRadius: 16, flexShrink: 0,
    position: 'relative', overflow: 'hidden', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,0,.12)',
  },
  photoLabel: {
    position: 'absolute', bottom: 10, left: 12,
    fontSize: 11, fontWeight: 600, color: '#fff',
    background: 'rgba(0,0,0,.38)', borderRadius: 6, padding: '3px 8px',
    backdropFilter: 'blur(4px)',
  },

  body: { maxWidth: 1100, margin: '0 auto', padding: '44px 48px' },

  sec: { marginBottom: 60 },
  secHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  eyebrowSm: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  secTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 24, letterSpacing: '-0.01em',
  },
  bookAllBtn: {
    padding: '9px 22px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #EC4899 100%)',
    color: '#fff', borderRadius: 11, fontWeight: 700, fontSize: 13,
    textDecoration: 'none', boxShadow: '0 4px 14px rgba(124,58,237,.3)', flexShrink: 0,
    fontFamily: "'DM Sans', sans-serif",
  },

  catBadge: { display: 'inline-flex', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 14 },
  svcGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 },
  svcCard: {
    background: 'var(--surface)', borderRadius: 14, padding: '18px 18px 14px',
    border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  svcName:    { fontWeight: 700, fontSize: 14, color: 'var(--text)' },
  svcMeta:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  svcDur:     { fontSize: 12, color: 'var(--text-muted)' },
  svcPrice:   { fontWeight: 700, fontSize: 15 },
  svcBookBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '7px 0', borderRadius: 9, border: '1px solid',
    fontSize: 13, fontWeight: 700, textDecoration: 'none', marginTop: 4,
    fontFamily: "'DM Sans', sans-serif",
  },

  teamGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  teamCard: {
    background: 'var(--surface)', borderRadius: 16, padding: '26px 20px 22px',
    border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
  },
  teamAvatar: {
    width: 58, height: 58, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20, fontWeight: 700, marginBottom: 12,
  },
  teamName: { fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 3 },
  teamRole: { fontSize: 12, fontWeight: 600, marginBottom: 4 },
  teamSpec: { fontSize: 12, color: 'var(--text-muted)' },

  reviewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 },
  reviewCard: {
    background: 'var(--surface)', borderRadius: 16, padding: '22px 24px',
    border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
  },
  reviewTop:  { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 },
  reviewAvatar: {
    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 17, fontWeight: 700,
  },
  reviewName: { fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 },
  reviewDate: { fontSize: 11, color: 'var(--text-muted)' },
  reviewText: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75, fontStyle: 'italic', margin: 0 },

  mapWrap:  { borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.1)', border: '1px solid var(--border)' },
  mapFrame: { width: '100%', height: 300, border: 'none', display: 'block' },
  addrBox:  {
    display: 'flex', alignItems: 'center', gap: 10, marginTop: 14,
    padding: '12px 18px', background: 'var(--surface)',
    borderRadius: 12, border: '1px solid var(--border)',
  },

  hoursCard: {
    background: 'var(--surface)', borderRadius: 18, padding: '26px 28px',
    border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
  },
  hourRow:  { display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' },
  dayLabel: { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' },
  hoursVal: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },

  otherScroll: { display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 },
  otherCard: {
    background: 'var(--surface)', borderRadius: 16, padding: '22px 20px 18px',
    border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
    minWidth: 200, flexShrink: 0, textDecoration: 'none',
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6,
  },
  otherAvatar: {
    width: 54, height: 54, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4,
  },
  otherName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontWeight: 700, fontSize: 15, color: 'var(--text)',
  },
  otherCity: { fontSize: 12, color: 'var(--text-muted)' },
  seeAllBtn: {
    padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#7C3AED',
    background: 'rgba(124,58,237,.1)', borderRadius: 9,
    border: '1px solid rgba(124,58,237,.2)', textDecoration: 'none', flexShrink: 0,
    fontFamily: "'DM Sans', sans-serif",
  },

  aboutCard: {
    background: 'var(--surface)', borderRadius: 20, padding: '32px 36px',
    border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,.06)',
  },
  aboutText:  { fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.85, marginBottom: 16 },
  aboutStats: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
    marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)',
  },

  cta: {
    background: 'linear-gradient(135deg, #1E0A3C 0%, #7C3AED 100%)',
    borderRadius: 24, padding: '52px 40px', textAlign: 'center',
    boxShadow: '0 10px 40px rgba(124,58,237,.35)', position: 'relative', overflow: 'hidden',
  },
  ctaGlow: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at bottom right, rgba(236,72,153,.3) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  ctaTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 34, fontWeight: 700, color: '#fff', marginBottom: 10,
    position: 'relative', zIndex: 1, letterSpacing: '-0.01em',
  },
  ctaBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '14px 38px',
    background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
    color: '#fff', borderRadius: 14, fontWeight: 700, fontSize: 16,
    textDecoration: 'none', boxShadow: '0 6px 20px rgba(236,72,153,.45)',
    position: 'relative', zIndex: 1,
    fontFamily: "'DM Sans', sans-serif",
  },
};

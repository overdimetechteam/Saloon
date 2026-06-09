import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={s.page}>
      {/* Ambient blobs */}
      <div style={s.blob1} />
      <div style={s.blob2} />
      <div style={s.blob3} />

      <div style={{ ...s.inner, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity .7s ease, transform .7s ease' }}>

        {/* Logo mark */}
        <div style={s.markWrap}>
          <span style={s.mark}>✦</span>
        </div>

        {/* Brand */}
        <h1 style={s.brand}>Saloon</h1>
        <div style={s.tagline}>BEAUTY &amp; WELLNESS PLATFORM</div>

        {/* Divider */}
        <div style={s.divider} />

        {/* Bio */}
        <p style={s.bio}>
          Sri Lanka's premier salon booking platform — connecting you to the finest
          beauty professionals, barbers, and wellness studios island-wide.
          Book appointments in seconds, discover nearby salons, and experience
          luxury grooming on your schedule.
        </p>

        {/* Feature pills */}
        <div style={s.pills}>
          {[
            { icon: '◈', label: 'Premium Salons' },
            { icon: '⏱', label: 'Instant Booking' },
            { icon: '✦', label: 'Trusted & Verified' },
            { icon: '🏠', label: 'Home Visits' },
          ].map(f => (
            <div key={f.label} style={s.pill}>
              <span style={s.pillIcon}>{f.icon}</span>
              <span style={s.pillLabel}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div style={s.stats}>
          {[
            { val: '200+', label: 'Salons' },
            { val: '50K+', label: 'Bookings' },
            { val: '4.9★', label: 'Avg Rating' },
          ].map(st => (
            <div key={st.label} style={s.stat}>
              <div style={s.statVal}>{st.val}</div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button style={s.cta} onClick={() => navigate('/portal')}>
          Proceed
          <span style={s.ctaArrow}>→</span>
        </button>

        <p style={s.hint}>Choose your experience on the next screen</p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(145deg, #080f0d 0%, #0a1f1c 35%, #0b2e28 65%, #0D9488 100%)',
    position: 'relative', overflow: 'hidden', padding: '40px 24px',
  },
  blob1: {
    position: 'absolute', width: 500, height: 500,
    background: 'radial-gradient(circle, rgba(13,148,136,.18) 0%, transparent 70%)',
    top: -100, right: -100, pointerEvents: 'none', filter: 'blur(60px)',
  },
  blob2: {
    position: 'absolute', width: 400, height: 400,
    background: 'radial-gradient(circle, rgba(20,184,166,.12) 0%, transparent 70%)',
    bottom: -80, left: -80, pointerEvents: 'none', filter: 'blur(70px)',
  },
  blob3: {
    position: 'absolute', width: 300, height: 300,
    background: 'radial-gradient(circle, rgba(212,175,55,.06) 0%, transparent 70%)',
    top: '40%', left: '10%', pointerEvents: 'none', filter: 'blur(80px)',
  },
  inner: {
    position: 'relative', zIndex: 2,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', maxWidth: 620, width: '100%',
  },
  markWrap: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'rgba(13,148,136,.15)',
    border: '1.5px solid rgba(13,148,136,.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    boxShadow: '0 0 40px rgba(13,148,136,.25)',
  },
  mark: { fontSize: 26, color: '#14B8A8', filter: 'drop-shadow(0 0 10px rgba(20,184,166,.6))' },
  brand: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 72, fontWeight: 700, color: '#ffffff',
    margin: '0 0 6px', letterSpacing: '-0.03em', lineHeight: 1,
  },
  tagline: {
    fontSize: 11, color: 'rgba(153,246,228,.65)',
    letterSpacing: '0.28em', textTransform: 'uppercase', fontWeight: 600,
    margin: '0 0 36px',
  },
  divider: {
    width: 48, height: 1.5,
    background: 'linear-gradient(90deg, transparent, #0D9488, transparent)',
    marginBottom: 32,
  },
  bio: {
    fontSize: 16, color: 'rgba(255,255,255,.6)', lineHeight: 1.8,
    maxWidth: 520, margin: '0 0 36px', fontWeight: 400,
  },
  pills: {
    display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center',
    marginBottom: 36,
  },
  pill: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '8px 16px',
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 30,
  },
  pillIcon: { fontSize: 14, color: '#14B8A8' },
  pillLabel: { fontSize: 13, color: 'rgba(255,255,255,.75)', fontWeight: 600 },
  stats: {
    display: 'flex', gap: 48, marginBottom: 44,
  },
  stat: { textAlign: 'center' },
  statVal: {
    fontSize: 26, fontWeight: 800, color: '#ffffff',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    letterSpacing: '-0.02em',
  },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 },
  cta: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 52px',
    background: 'linear-gradient(135deg, #0D9488, #14B8A8)',
    color: '#fff', border: 'none', borderRadius: 14,
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(13,148,136,.45), inset 0 1px 0 rgba(255,255,255,.15)',
    letterSpacing: '0.02em', marginBottom: 16,
    transition: 'transform .15s, box-shadow .15s',
    fontFamily: "'DM Sans', sans-serif",
  },
  ctaArrow: { fontSize: 18, fontWeight: 400 },
  hint: { fontSize: 12, color: 'rgba(255,255,255,.3)', margin: 0 },
};

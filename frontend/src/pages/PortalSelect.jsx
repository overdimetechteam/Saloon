import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function PortalSelect() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  return (
    <div style={s.page}>
      <div style={s.blob1} />
      <div style={s.blob2} />

      <div style={s.inner}>
        {/* Header */}
        <div style={s.logoRow}>
          <span style={s.mark}>✦</span>
          <span style={s.brand}>BookMyStyle</span>
        </div>
        <h2 style={s.heading}>How would you like to continue?</h2>
        <p style={s.sub}>Choose your portal to get started</p>

        {/* Cards */}
        <div style={s.cards}>

          {/* Customer card */}
          <div
            style={{
              ...s.card,
              ...(hovered === 'client' ? s.cardHover : {}),
              borderColor: hovered === 'client' ? '#0D9488' : 'rgba(255,255,255,.1)',
            }}
            onMouseEnter={() => setHovered('client')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => navigate('/login')}
          >
            <div style={{ ...s.cardIcon, background: 'linear-gradient(135deg,#0D9488,#14B8A8)' }}>
              <span style={s.iconGlyph}>◈</span>
            </div>
            <div style={s.cardTitle}>Salon Customer</div>
            <div style={s.cardDesc}>
              Browse salons, book appointments, track your beauty journey
            </div>
            <div style={s.cardPerks}>
              {['Discover nearby salons', 'Book in seconds', 'Home visits available'].map(p => (
                <div key={p} style={s.perk}><span style={s.perkDot}>✦</span>{p}</div>
              ))}
            </div>
            <button
              style={{ ...s.cardBtn, background: 'linear-gradient(135deg,#0D9488,#14B8A8)' }}
              onClick={e => { e.stopPropagation(); navigate('/login'); }}
            >
              Continue as Customer →
            </button>
          </div>

          {/* Owner card */}
          <div
            style={{
              ...s.card,
              ...(hovered === 'owner' ? s.cardHover : {}),
              borderColor: hovered === 'owner' ? '#D4AF37' : 'rgba(255,255,255,.1)',
            }}
            onMouseEnter={() => setHovered('owner')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => navigate('/owner/login')}
          >
            <div style={{ ...s.cardIcon, background: 'linear-gradient(135deg,#92701a,#D4AF37)' }}>
              <span style={s.iconGlyph}>◉</span>
            </div>
            <div style={s.cardTitle}>Salon Owner</div>
            <div style={s.cardDesc}>
              Manage your salon, bookings, staff, inventory and grow your business
            </div>
            <div style={s.cardPerks}>
              {['Full booking management', 'Staff & inventory tools', 'Analytics & reports'].map(p => (
                <div key={p} style={s.perk}><span style={{ ...s.perkDot, color: '#D4AF37' }}>✦</span>{p}</div>
              ))}
            </div>
            <button
              style={{ ...s.cardBtn, background: 'linear-gradient(135deg,#92701a,#D4AF37)', color: '#1a1200' }}
              onClick={e => { e.stopPropagation(); navigate('/owner/login'); }}
            >
              Continue as Owner →
            </button>
          </div>

        </div>

        <button
          style={s.back}
          onClick={() => navigate('/')}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(145deg, #080f0d 0%, #0a1f1c 50%, #0c2925 100%)',
    position: 'relative', overflow: 'hidden', padding: '40px 20px',
  },
  blob1: {
    position: 'absolute', width: 500, height: 500,
    background: 'radial-gradient(circle, rgba(13,148,136,.14) 0%, transparent 70%)',
    top: -100, right: -100, pointerEvents: 'none', filter: 'blur(70px)',
  },
  blob2: {
    position: 'absolute', width: 400, height: 400,
    background: 'radial-gradient(circle, rgba(212,175,55,.08) 0%, transparent 70%)',
    bottom: -60, left: -60, pointerEvents: 'none', filter: 'blur(80px)',
  },
  inner: {
    position: 'relative', zIndex: 2,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', width: '100%', maxWidth: 900,
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 },
  mark: { fontSize: 22, color: '#14B8A8', filter: 'drop-shadow(0 0 8px rgba(20,184,166,.5))' },
  brand: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em',
  },
  heading: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 38, fontWeight: 700, color: '#ffffff',
    margin: '0 0 8px', letterSpacing: '-0.02em',
  },
  sub: { fontSize: 15, color: 'rgba(255,255,255,.45)', margin: '0 0 48px' },
  cards: {
    display: 'flex', gap: 24, width: '100%', justifyContent: 'center',
    flexWrap: 'wrap',
  },
  card: {
    flex: '1 1 340px', maxWidth: 400,
    background: 'rgba(255,255,255,.04)',
    border: '1.5px solid rgba(255,255,255,.1)',
    borderRadius: 20, padding: '36px 32px',
    cursor: 'pointer', textAlign: 'left',
    transition: 'border-color .2s, transform .2s, box-shadow .2s',
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  cardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 20px 60px rgba(0,0,0,.3)',
    background: 'rgba(255,255,255,.065)',
  },
  cardIcon: {
    width: 52, height: 52, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  iconGlyph: { fontSize: 22, color: '#ffffff' },
  cardTitle: {
    fontSize: 22, fontWeight: 800, color: '#ffffff',
    fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em',
  },
  cardDesc: { fontSize: 14, color: 'rgba(255,255,255,.5)', lineHeight: 1.65 },
  cardPerks: { display: 'flex', flexDirection: 'column', gap: 8, margin: '4px 0' },
  perk: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,.65)' },
  perkDot: { fontSize: 8, color: '#14B8A8', flexShrink: 0 },
  cardBtn: {
    marginTop: 8, padding: '13px 20px',
    border: 'none', borderRadius: 12,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    color: '#ffffff', width: '100%',
    fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.01em',
  },
  back: {
    marginTop: 36, background: 'none', border: 'none',
    color: 'rgba(255,255,255,.35)', fontSize: 13, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
};

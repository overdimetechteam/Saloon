import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { useBreakpoint } from '../hooks/useMobile';

const STAR_COUNT = 80;

function useStars() {
  return useMemo(() =>
    Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.6 + 0.3,
      twinkleDur: (Math.random() * 3 + 2).toFixed(2),
      twinkleDelay: (Math.random() * 6).toFixed(2),
      floatDur: (Math.random() * 10 + 8).toFixed(2),
      floatDelay: (Math.random() * 8).toFixed(2),
      baseOpacity: (Math.random() * 0.45 + 0.1).toFixed(2),
    })),
  []);
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [visible, setVisible] = useState(false);
  const stars = useStars();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={s.page}>
      <style>{`
        @keyframes twinkle {
          0%,100% { opacity: var(--base-op); }
          50%      { opacity: calc(var(--base-op) * 0.15); }
        }
        @keyframes floatUp {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-14px); }
        }
      `}</style>

      <div style={s.starLayer} aria-hidden>
        {stars.map(st => (
          <div key={st.id} style={{
            position: 'absolute', left: `${st.x}%`, top: `${st.y}%`,
            width: st.size, height: st.size, borderRadius: '50%', background: '#ffffff',
            '--base-op': st.baseOpacity,
            animation: `twinkle ${st.twinkleDur}s ${st.twinkleDelay}s ease-in-out infinite, floatUp ${st.floatDur}s ${st.floatDelay}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      <div style={s.blob1} />
      <div style={s.blob2} />
      <div style={s.blob3} />

      <div style={{
        ...s.inner,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity .6s ease, transform .6s ease',
        padding: isMobile ? '0 20px' : '0 24px',
      }}>

        {/* Logo */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: isMobile ? '16px 28px' : '20px 40px',
          marginBottom: isMobile ? 20 : 28,
          boxShadow: '0 0 70px rgba(13,148,136,.55), 0 0 140px rgba(13,148,136,.2), 0 20px 48px rgba(0,0,0,.6)',
        }}>
          <img
            src="/logo.png"
            alt="BookMyStyle"
            style={{ width: isMobile ? 150 : 210, height: 'auto', display: 'block' }}
          />
        </div>

        <div style={{ ...s.tagline, letterSpacing: isMobile ? '0.18em' : '0.3em', fontSize: isMobile ? 9 : 10 }}>
          BEAUTY &amp; WELLNESS PLATFORM
        </div>

        <div style={s.divider} />

        <p style={{ ...s.bio, fontSize: isMobile ? 13 : 15, margin: isMobile ? '0 0 20px' : '0 0 28px' }}>
          Sri Lanka's premier salon booking platform — the finest beauty professionals island-wide.
        </p>

        {/* Feature pills — 2×2 on mobile, single row on desktop */}
        <div style={{ ...s.pills, gap: isMobile ? 7 : 9, marginBottom: isMobile ? 24 : 32 }}>
          {[
            { icon: '◈', label: 'Premium Salons' },
            { icon: '⚡', label: 'Instant Booking' },
            { icon: '✦', label: 'Trusted & Verified' },
            { icon: '🏠', label: 'Home Visits' },
          ].map(f => (
            <div key={f.label} style={{ ...s.pill, padding: isMobile ? '6px 11px' : '7px 14px' }}>
              <span style={s.pillIcon}>{f.icon}</span>
              <span style={{ ...s.pillLabel, fontSize: isMobile ? 11 : 12 }}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button style={{ ...s.cta, padding: isMobile ? '13px 44px' : '15px 56px', fontSize: isMobile ? 15 : 16 }} onClick={() => navigate('/portal')}>
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
    height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(145deg, #040c0a 0%, #071812 40%, #092420 70%, #0b3530 100%)',
    position: 'relative', overflow: 'hidden',
  },
  starLayer: { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 },
  blob1: {
    position: 'absolute', width: 560, height: 560,
    background: 'radial-gradient(circle, rgba(13,148,136,.16) 0%, transparent 70%)',
    top: -140, right: -120, pointerEvents: 'none', filter: 'blur(70px)', zIndex: 1,
  },
  blob2: {
    position: 'absolute', width: 420, height: 420,
    background: 'radial-gradient(circle, rgba(20,184,166,.1) 0%, transparent 70%)',
    bottom: -100, left: -100, pointerEvents: 'none', filter: 'blur(80px)', zIndex: 1,
  },
  blob3: {
    position: 'absolute', width: 280, height: 280,
    background: 'radial-gradient(circle, rgba(212,175,55,.05) 0%, transparent 70%)',
    top: '45%', left: '8%', pointerEvents: 'none', filter: 'blur(90px)', zIndex: 1,
  },
  inner: {
    position: 'relative', zIndex: 2,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', maxWidth: 600, width: '100%',
  },
  markWrap: {
    width: 50, height: 50, borderRadius: '50%',
    background: 'rgba(13,148,136,.13)', border: '1.5px solid rgba(13,148,136,.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    boxShadow: '0 0 36px rgba(13,148,136,.22), 0 0 80px rgba(13,148,136,.08)',
  },
  brand: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontWeight: 700, color: '#ffffff',
    margin: '0 0 6px', letterSpacing: '-0.03em', lineHeight: 1,
  },
  tagline: {
    color: 'rgba(153,246,228,.55)', textTransform: 'uppercase', fontWeight: 600,
    margin: '0 0 22px',
  },
  divider: {
    width: 44, height: 1.5,
    background: 'linear-gradient(90deg, transparent, #0D9488, transparent)',
    marginBottom: 20,
  },
  bio: {
    color: 'rgba(255,255,255,.52)', lineHeight: 1.7,
    maxWidth: 420, fontWeight: 400,
  },
  pills: { display: 'flex', flexWrap: 'wrap', gap: 9, justifyContent: 'center' },
  pill: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.09)',
    borderRadius: 30, backdropFilter: 'blur(6px)',
  },
  pillIcon: { fontSize: 11, color: '#14B8A8' },
  pillLabel: { color: 'rgba(255,255,255,.72)', fontWeight: 600, letterSpacing: '0.01em' },
  cta: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'linear-gradient(135deg, #0D9488, #14B8A8)',
    color: '#fff', border: 'none', borderRadius: 14,
    fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 8px 30px rgba(13,148,136,.45), inset 0 1px 0 rgba(255,255,255,.15)',
    letterSpacing: '0.02em', marginBottom: 12,
    fontFamily: "'DM Sans', sans-serif",
  },
  ctaArrow: { fontSize: 17, fontWeight: 400 },
  hint: { fontSize: 11, color: 'rgba(255,255,255,.28)', margin: 0, letterSpacing: '0.03em' },
};

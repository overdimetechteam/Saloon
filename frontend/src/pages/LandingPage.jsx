import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';

const STAR_COUNT = 110; // v2

function useStars() {
  return useMemo(() =>
    Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.8 + 0.4,
      twinkleDur: (Math.random() * 3 + 2).toFixed(2),
      twinkleDelay: (Math.random() * 6).toFixed(2),
      floatDur: (Math.random() * 10 + 8).toFixed(2),
      floatDelay: (Math.random() * 8).toFixed(2),
      baseOpacity: (Math.random() * 0.5 + 0.15).toFixed(2),
    })),
  []);
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const stars = useStars();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={s.page}>
      {/* ── Star animations ── */}
      <style>{`
        @keyframes twinkle {
          0%,100% { opacity: var(--base-op); }
          50%      { opacity: calc(var(--base-op) * 0.15); }
        }
        @keyframes floatUp {
          0%   { transform: translateY(0); }
          50%  { transform: translateY(-18px); }
          100% { transform: translateY(0); }
        }
      `}</style>

      {/* Stars */}
      <div style={s.starLayer} aria-hidden>
        {stars.map(st => (
          <div
            key={st.id}
            style={{
              position: 'absolute',
              left: `${st.x}%`,
              top: `${st.y}%`,
              width: st.size,
              height: st.size,
              borderRadius: '50%',
              background: '#ffffff',
              '--base-op': st.baseOpacity,
              animation: `twinkle ${st.twinkleDur}s ${st.twinkleDelay}s ease-in-out infinite,
                           floatUp   ${st.floatDur}s   ${st.floatDelay}s  ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Ambient blobs */}
      <div style={s.blob1} />
      <div style={s.blob2} />
      <div style={s.blob3} />

      {/* Content */}
      <div
        style={{
          ...s.inner,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity .65s ease, transform .65s ease',
        }}
      >
        {/* Logo mark */}
        <div style={s.markWrap}>
          <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
            <path d="M24,10 L25.8,22.2 L38,24 L25.8,25.8 L24,38 L22.2,25.8 L10,24 L22.2,22.2 Z" fill="#14B8A8"/>
          </svg>
        </div>

        <h1 style={s.brand}>Saloon</h1>
        <div style={s.tagline}>BEAUTY &amp; WELLNESS PLATFORM</div>

        <div style={s.divider} />

        <p style={s.bio}>
          Sri Lanka's premier salon booking platform — connecting you to the finest
          beauty professionals, barbers, and wellness studios island-wide.
        </p>

        {/* Feature pills */}
        <div style={s.pills}>
          {[
            { icon: '◈', label: 'Premium Salons' },
            { icon: '⚡', label: 'Instant Booking' },
            { icon: '✦', label: 'Trusted & Verified' },
            { icon: '🏠', label: 'Home Visits' },
          ].map(f => (
            <div key={f.label} style={s.pill}>
              <span style={s.pillIcon}>{f.icon}</span>
              <span style={s.pillLabel}>{f.label}</span>
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
    height: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(145deg, #040c0a 0%, #071812 40%, #092420 70%, #0b3530 100%)',
    position: 'relative', overflow: 'hidden',
    padding: '0 24px',
  },
  starLayer: {
    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
  },
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
    width: 58, height: 58, borderRadius: '50%',
    background: 'rgba(13,148,136,.13)',
    border: '1.5px solid rgba(13,148,136,.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
    boxShadow: '0 0 36px rgba(13,148,136,.22), 0 0 80px rgba(13,148,136,.08)',
  },
  brand: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 68, fontWeight: 700, color: '#ffffff',
    margin: '0 0 6px', letterSpacing: '-0.03em', lineHeight: 1,
  },
  tagline: {
    fontSize: 10, color: 'rgba(153,246,228,.55)',
    letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 600,
    margin: '0 0 28px',
  },
  divider: {
    width: 44, height: 1.5,
    background: 'linear-gradient(90deg, transparent, #0D9488, transparent)',
    marginBottom: 24,
  },
  bio: {
    fontSize: 15, color: 'rgba(255,255,255,.52)', lineHeight: 1.75,
    maxWidth: 480, margin: '0 0 28px', fontWeight: 400,
  },
  pills: {
    display: 'flex', flexWrap: 'wrap', gap: 9, justifyContent: 'center',
    marginBottom: 32,
  },
  pill: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px',
    background: 'rgba(255,255,255,.045)',
    border: '1px solid rgba(255,255,255,.09)',
    borderRadius: 30,
    backdropFilter: 'blur(6px)',
  },
  pillIcon: { fontSize: 12, color: '#14B8A8' },
  pillLabel: { fontSize: 12, color: 'rgba(255,255,255,.72)', fontWeight: 600, letterSpacing: '0.01em' },
  cta: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '15px 56px',
    background: 'linear-gradient(135deg, #0D9488, #14B8A8)',
    color: '#fff', border: 'none', borderRadius: 14,
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 8px 30px rgba(13,148,136,.45), inset 0 1px 0 rgba(255,255,255,.15)',
    letterSpacing: '0.02em', marginBottom: 14,
    fontFamily: "'DM Sans', sans-serif",
  },
  ctaArrow: { fontSize: 18, fontWeight: 400 },
  hint: { fontSize: 12, color: 'rgba(255,255,255,.28)', margin: 0, letterSpacing: '0.03em' },
};

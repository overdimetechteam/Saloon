import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useBreakpoint } from '../hooks/useMobile';

export default function PortalSelect() {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const options = [
    {
      key: 'client',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      iconBg: 'linear-gradient(135deg,#0D9488,#14B8A8)',
      accent: '#0D9488',
      title: 'Salon Customer',
      desc: 'Browse salons, book appointments, track your beauty journey',
      route: '/salons',
    },
    {
      key: 'owner',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      iconBg: 'linear-gradient(135deg,#92701a,#D4AF37)',
      accent: '#D4AF37',
      title: 'Salon Owner',
      desc: 'Manage bookings, staff, inventory and grow your business',
      route: '/owner/login',
    },
  ];

  return (
    <div style={s.page}>
      <div style={s.blob1} />
      <div style={s.blob2} />

      <div style={{
        ...s.inner,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity .55s ease, transform .55s ease',
        maxWidth: isMobile ? 340 : 420,
        padding: isMobile ? '0 20px' : '0 24px',
      }}>

        {/* Brand */}
        <div style={{ ...s.logoRow, justifyContent: 'center' }}>
          <img src="/logo.png" alt="BookMyStyle" style={{ height: isMobile ? 48 : 56, width: 'auto', borderRadius: 10 }} />
        </div>

        <h2 style={{ ...s.heading, fontSize: isMobile ? 22 : 28 }}>
          How would you like<br />to continue?
        </h2>
        <p style={{ ...s.sub, fontSize: isMobile ? 13 : 14 }}>Select your experience below</p>

        {/* Option rows */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {options.map(opt => (
            <button
              key={opt.key}
              onMouseDown={() => setPressed(opt.key)}
              onMouseUp={() => setPressed(null)}
              onMouseLeave={() => setPressed(null)}
              onClick={() => navigate(opt.route)}
              style={{
                width: '100%', textAlign: 'left', background: 'rgba(255,255,255,.04)',
                border: `1.5px solid ${pressed === opt.key ? opt.accent : 'rgba(255,255,255,.1)'}`,
                borderRadius: 16, padding: isMobile ? '14px 16px' : '16px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer',
                transition: 'border-color .15s ease, background .15s ease',
                transform: pressed === opt.key ? 'scale(0.985)' : 'scale(1)',
              }}
            >
              {/* Icon */}
              <div style={{
                width: isMobile ? 40 : 44, height: isMobile ? 40 : 44,
                borderRadius: 12, flexShrink: 0,
                background: opt.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
              }}>
                {opt.icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, color: '#fff', marginBottom: 2, fontFamily: "'DM Sans',sans-serif" }}>
                  {opt.title}
                </div>
                <div style={{ fontSize: isMobile ? 12 : 13, color: 'rgba(255,255,255,.45)', lineHeight: 1.4 }}>
                  {opt.desc}
                </div>
              </div>

              {/* Arrow */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={opt.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <button style={s.back} onClick={() => navigate('/')}>
            ← Back to home
          </button>
          <button style={{ ...s.back, color: 'rgba(255,255,255,.18)', fontSize: 11 }} onClick={() => navigate('/salon-portal')}>
            Admin Portal →
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(145deg, #080f0d 0%, #0a1f1c 50%, #0c2925 100%)',
    position: 'relative', overflow: 'hidden',
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
    textAlign: 'center', width: '100%',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 9, marginBottom: 28 },
  logoMark: {
    width: 34, height: 34, borderRadius: 10,
    background: 'rgba(13,148,136,.15)', border: '1px solid rgba(13,148,136,.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  brand: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em',
  },
  heading: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontWeight: 700, color: '#ffffff',
    margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.25,
  },
  sub: { color: 'rgba(255,255,255,.38)', margin: '0 0 24px', fontFamily: "'DM Sans',sans-serif" },
  back: {
    background: 'none', border: 'none',
    color: 'rgba(255,255,255,.3)', fontSize: 12, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
};

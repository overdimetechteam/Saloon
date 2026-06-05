import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const COUNT = 65;
const r = (min, max) => Math.random() * (max - min) + min;

const KEYFRAMES = `
@keyframes snow-fall {
  0%   { transform: translateY(-12px) translateX(0px); opacity: 0; }
  8%   { opacity: 1; }
  92%  { opacity: 0.7; }
  100% { transform: translateY(101vh) translateX(var(--snow-drift)); opacity: 0; }
}`;

export default function SnowEffect() {
  const { profile } = useAuth();
  const now          = new Date();
  const month        = now.getMonth(); // 0=Jan … 11=Dec
  const day          = now.getDate();
  const isSnowSeason = month === 11 || (month === 0 && day <= 25); // Dec 1 – Jan 25
  const isStaff      = profile && ['salon_owner', 'system_admin', 'employee'].includes(profile.role);

  const flakes = useMemo(() =>
    Array.from({ length: COUNT }, (_, i) => ({
      id:       i,
      left:     r(0, 100),
      size:     r(2, 5),
      opacity:  r(0.3, 0.7),
      blur:     r(0, 0.8),
      duration: r(7, 16),
      delay:    r(0, 12),
      drift:    r(-30, 30),
    })),
  []);

  if (isStaff || !isSnowSeason) return null;

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{
        position: 'fixed', inset: 0,
        pointerEvents: 'none',
        zIndex: 10000,
        overflow: 'hidden',
      }}>
        {flakes.map(f => (
          <div
            key={f.id}
            style={{
              position: 'absolute',
              top: '-12px',
              left: `${f.left}%`,
              width:  f.size,
              height: f.size,
              borderRadius: '50%',
              background: '#fff',
              opacity: f.opacity,
              filter: `blur(${f.blur}px)`,
              '--snow-drift': `${f.drift}px`,
              animation: `snow-fall ${f.duration}s ${f.delay}s linear infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}

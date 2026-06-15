import { useState, useEffect } from 'react';

const KEY = 'cookieConsent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [detail, setDetail]   = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) {
      // Small delay so it doesn't flash immediately on first paint
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = choice => {
    localStorage.setItem(KEY, choice);
    setLeaving(true);
    setTimeout(() => setVisible(false), 420);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99998,
      padding: '0 0 env(safe-area-inset-bottom)',
      animation: leaving
        ? 'cookieSlideOut .42s cubic-bezier(.4,0,1,1) both'
        : 'cookieSlideIn .48s cubic-bezier(.16,1,.3,1) both',
    }}>
      <style>{`
        @keyframes cookieSlideIn  { from { transform:translateY(110%); opacity:0 } to { transform:translateY(0); opacity:1 } }
        @keyframes cookieSlideOut { from { transform:translateY(0);    opacity:1 } to { transform:translateY(110%); opacity:0 } }
      `}</style>

      <div style={{
        margin: '0 auto',
        maxWidth: detail ? 600 : 900,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: detail ? '20px 20px 0 0' : '20px 20px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,.28)',
        padding: detail ? '28px 28px 24px' : '20px 28px',
        transition: 'max-width .3s ease',
      }}>

        {/* ── Simple view ── */}
        {!detail && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>🍪</span>
            <div style={{ flex: 1, minWidth: 220 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                We use cookies &amp; local storage
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>
                to keep you signed in and personalise your experience.{' '}
                <button
                  onClick={() => setDetail(true)}
                  style={{ background: 'none', border: 'none', color: '#0D9488', cursor: 'pointer', fontSize: 13, padding: 0, textDecoration: 'underline' }}
                >
                  Learn more
                </button>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <button
                onClick={() => dismiss('declined')}
                style={btnOutline}
              >
                Decline
              </button>
              <button
                onClick={() => dismiss('accepted')}
                style={btnPrimary}
              >
                Accept All
              </button>
            </div>
          </div>
        )}

        {/* ── Detail / manage view ── */}
        {detail && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 22 }}>🍪</span>
              <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Cookie &amp; Storage Policy
              </h3>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 18px' }}>
              BookMyStyle uses browser storage to provide core functionality. We do <strong style={{ color: 'var(--text)' }}>not</strong> use
              third-party advertising or tracking cookies.
            </p>

            {[
              {
                icon: '🔐',
                label: 'Authentication (Essential)',
                desc: 'JWT access & refresh tokens stored in sessionStorage keep you signed in. Isolated per browser tab for security.',
                always: true,
              },
              {
                icon: '🎨',
                label: 'Preferences (Essential)',
                desc: 'Your theme choice (light/dark) and other UI preferences are saved locally so they persist between visits.',
                always: true,
              },
              {
                icon: '🛒',
                label: 'Cart & Session (Essential)',
                desc: 'Items added to your cart and your current session state are held in memory while you browse.',
                always: true,
              },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', gap: 14, padding: '13px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{row.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{row.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{row.desc}</div>
                </div>
                <div style={{
                  flexShrink: 0, fontSize: 11, fontWeight: 700, padding: '3px 10px',
                  borderRadius: 20, background: 'rgba(13,148,136,.12)', color: '#0D9488',
                  alignSelf: 'flex-start', marginTop: 2,
                }}>Always On</div>
              </div>
            ))}

            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '14px 0 18px', lineHeight: 1.6 }}>
              By using BookMyStyle you agree to essential storage. Since we only use essential storage,
              declining has no functional effect — your data is never sold or shared with advertisers.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDetail(false)} style={btnOutline}>Back</button>
              <button onClick={() => dismiss('declined')} style={btnOutline}>Decline</button>
              <button onClick={() => dismiss('accepted')} style={btnPrimary}>Accept &amp; Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const btnPrimary = {
  padding: '9px 22px',
  background: 'linear-gradient(135deg,#0D9488,#14B8A8)',
  color: '#fff', border: 'none', borderRadius: 10,
  fontSize: 13, fontWeight: 700, cursor: 'pointer',
  fontFamily: "'DM Sans',sans-serif",
  boxShadow: '0 4px 14px rgba(13,148,136,.3)',
  whiteSpace: 'nowrap',
};

const btnOutline = {
  padding: '9px 22px',
  background: 'transparent',
  color: 'var(--text-muted)',
  border: '1.5px solid var(--border)',
  borderRadius: 10, fontSize: 13, fontWeight: 600,
  cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
  whiteSpace: 'nowrap',
};

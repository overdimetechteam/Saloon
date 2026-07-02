import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { useBreakpoint } from '../../hooks/useMobile';

/* ── Upload Modal ─────────────────────────────────────────────────── */
function UploadModal({ onClose, onUpload, uploading, error, accentGradient, accentShadow, title }) {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const fileRef = useRef(null);

  const pick = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = () => { if (file) onUpload(file, caption); };

  const close = () => {
    if (preview) URL.revokeObjectURL(preview);
    onClose();
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)',
    }}>
      <div onClick={close} style={{ position: 'absolute', inset: 0 }} />
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'var(--surface)', borderRadius: 22,
        padding: '28px 28px 24px',
        width: '100%', maxWidth: 480,
        border: '1.5px solid rgba(13,148,136,.2)',
        boxShadow: '0 24px 64px rgba(0,0,0,.22)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
          <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 8 }}>✕</button>
        </div>

        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        {/* Drop zone / preview */}
        <div
          onClick={() => !file && fileRef.current?.click()}
          style={{
            width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden',
            border: file ? 'none' : '2px dashed var(--border)',
            background: file ? 'transparent' : 'var(--surface2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: file ? 'default' : 'pointer', marginBottom: 16,
            position: 'relative',
          }}
        >
          {preview ? (
            <>
              <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button
                onClick={e => { e.stopPropagation(); URL.revokeObjectURL(preview); setPreview(null); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.6)', border: 'none', borderRadius: '50%', width: 26, height: 26, color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>⊕</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Click to select image</div>
              <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>PNG, JPG or WEBP</div>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={pick} />

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Caption (optional)</label>
          <input
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 11, fontSize: 14, background: 'var(--input-bg)', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }}
            placeholder="e.g. Our styling area"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            maxLength={100}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={close} style={{ padding: '10px 22px', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!file || uploading}
            style={{ padding: '10px 24px', background: accentGradient, color: '#fff', border: 'none', borderRadius: 12, cursor: file && !uploading ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 700, boxShadow: accentShadow, fontFamily: "'DM Sans', sans-serif", opacity: !file || uploading ? 0.6 : 1 }}
          >
            {uploading ? 'Uploading…' : 'Upload Photo'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Profile Preview ──────────────────────────────────────────────── */
function ProfilePreview({ salon, logoSrc, coverSrc }) {
  const cover = coverSrc || salon.cover_image_url;
  const logo  = logoSrc  || salon.logo_url;
  const name  = salon.name;
  const addr  = [salon.address_street, salon.address_city, salon.address_postal].filter(Boolean).join(', ') || null;
  const phone = salon.contact_number || null;
  const email = salon.email || null;

  /* Shared logo thumbnail */
  const LogoEl = ({ size, radius }) => (
    <div style={{
      width: size, height: size, borderRadius: radius,
      border: '2px solid rgba(255,255,255,.22)',
      overflow: 'hidden', flexShrink: 0,
      background: '#1a0a2e',
      boxShadow: '0 4px 18px rgba(0,0,0,.5)',
    }}>
      {logo
        ? <img src={logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: size * 0.4, fontWeight: 700, color: '#a78bfa' }}>{name[0]}</div>
      }
    </div>
  );

  const StarRow = ({ sz = 7 }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#D4AF37', fontSize: sz }}>★</span>)}
      <span style={{ color: 'rgba(255,255,255,.55)', fontSize: sz, marginLeft: 3 }}>0.0</span>
      <span style={{ color: 'rgba(255,255,255,.35)', fontSize: sz }}> · </span>
      <span style={{ color: 'rgba(255,255,255,.45)', fontSize: sz }}>(0 reviews)</span>
    </span>
  );

  /* ── Desktop browser mockup ── */
  const DesktopFrame = () => (
    <div style={{ flex: '1 1 0', minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Desktop View</div>
      <div style={{ border: '1.5px solid rgba(255,255,255,.08)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,.35)', background: '#0d0b18' }}>

        {/* Browser chrome bar */}
        <div style={{ background: '#18181b', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {['#FF5F57','#FFBD2E','#28CA41'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
          </div>
          <div style={{ flex: 1, background: '#27272a', borderRadius: 5, padding: '2px 10px', fontSize: 8.5, color: '#71717a', fontFamily: 'monospace', letterSpacing: '0.01em', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            bookmystyle.lk/salons/{salon.id}
          </div>
        </div>

        {/* Site navbar */}
        <div style={{ background: '#100d20', padding: '7px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: 8, fontWeight: 900, lineHeight: 1 }}>✦</span>
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.01em', lineHeight: 1 }}>BookMyStyle</div>
              <div style={{ color: 'rgba(167,139,250,.6)', fontSize: 6.5, fontWeight: 600, letterSpacing: '0.12em', lineHeight: 1.2 }}>BEAUTY &amp; WELLNESS</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,.45)', fontSize: 8 }}>Browse Salons</span>
            <span style={{ color: 'rgba(255,255,255,.45)', fontSize: 8 }}>Sign In</span>
            <div style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', borderRadius: 6, padding: '4px 10px', boxShadow: '0 2px 8px rgba(124,58,237,.4)' }}>
              <span style={{ color: '#fff', fontSize: 8, fontWeight: 700 }}>Get Started</span>
            </div>
          </div>
        </div>

        {/* Hero area */}
        <div style={{ position: 'relative', height: 185, overflow: 'hidden', background: '#1a0a2e' }}>
          {cover
            ? <img src={cover} alt="cover" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b69 60%, #1e3a5f 100%)' }} />
          }
          {/* Gradient overlay — strong dark left, fades right (matches real page) */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(10,6,22,.92) 0%, rgba(10,6,22,.78) 35%, rgba(10,6,22,.45) 60%, rgba(10,6,22,.18) 100%)' }} />

          {/* Back arrow */}
          <div style={{ position: 'absolute', top: 12, left: 12, width: 20, height: 20, background: 'rgba(255,255,255,.12)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: 1 }}>‹</span>
          </div>

          {/* Left content */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 18px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: '62%' }}>
              <LogoEl size={52} radius={11} />
              <div style={{ paddingTop: 2 }}>
                <div style={{ fontSize: 7.5, fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>FEATURED SALON</div>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 6, textShadow: '0 2px 8px rgba(0,0,0,.6)' }}>{name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                  <StarRow sz={7} />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(16,185,129,.18)', border: '1px solid rgba(16,185,129,.35)', borderRadius: 8, padding: '2px 7px' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 4px #10B981' }} />
                    <span style={{ color: '#10B981', fontSize: 7, fontWeight: 700 }}>Open Now</span>
                  </span>
                </div>
                {addr && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                    <span style={{ fontSize: 7.5 }}>📍</span>
                    <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 7.5 }}>{addr}</span>
                    <span style={{ color: '#a78bfa', fontSize: 7.5 }}>See Location ↗</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12 }}>
                  {phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 7.5 }}>📞</span>
                      <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 7.5 }}>{phone}</span>
                    </div>
                  )}
                  {email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 7.5 }}>✉️</span>
                      <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 7.5 }}>{email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: CTA pill buttons */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
              <div style={{ background: '#7C3AED', borderRadius: 20, padding: '8px 16px', boxShadow: '0 4px 16px rgba(124,58,237,.5)', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>✦ Book Now</span>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #D97706, #B45309)', borderRadius: 20, padding: '8px 14px', boxShadow: '0 4px 16px rgba(217,119,6,.45)', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>✿ Cosmetics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ background: '#100d20', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'center', gap: 28, padding: '8px 0' }}>
          {['Services','Team','Reviews','Info'].map((t, i) => (
            <span key={t} style={{ fontSize: 8.5, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? '#a78bfa' : 'rgba(255,255,255,.35)', borderBottom: i === 0 ? '1.5px solid #7C3AED' : 'none', paddingBottom: i === 0 ? 2 : 0 }}>{t}</span>
          ))}
        </div>

      </div>
    </div>
  );

  /* ── Mobile phone mockup ── */
  const MobileFrame = () => (
    <div style={{ flexShrink: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Mobile View</div>

      {/* Phone shell */}
      <div style={{ width: 168, background: '#0d0b18', border: '3px solid #2a2a35', borderRadius: 28, overflow: 'hidden', boxShadow: '0 16px 52px rgba(0,0,0,.45)', position: 'relative' }}>

        {/* Status bar */}
        <div style={{ background: '#100d20', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px 4px' }}>
          <span style={{ color: 'rgba(255,255,255,.45)', fontSize: 7, fontWeight: 600 }}>9:41</span>
          <div style={{ width: 28, height: 4, borderRadius: 10, background: '#2a2a35' }} />
          <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 7 }}>▲▲▲</span>
        </div>

        {/* Site navbar */}
        <div style={{ background: '#100d20', padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 7, fontWeight: 900 }}>✦</span>
            </div>
            <span style={{ color: '#fff', fontSize: 8, fontWeight: 800 }}>BookMyStyle</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,.45)', fontSize: 7.5 }}>Sign In</span>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 8 }}>✦</span>
            </div>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 8 }}>≡</span>
            </div>
          </div>
        </div>

        {/* Hero — cover image with dark overlay + back button + logo centered */}
        <div style={{ position: 'relative', height: 185, overflow: 'hidden', background: '#1a0a2e' }}>
          {cover
            ? <img src={cover} alt="cover" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #1a0a2e 0%, #2d1b69 60%, #1e3a5f 100%)' }} />
          }
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,5,18,.5)' }} />

          {/* Back button */}
          <div style={{ position: 'absolute', top: 10, left: 10, width: 22, height: 22, background: 'rgba(255,255,255,.14)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>‹</span>
          </div>

          {/* Centered hero content */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '0 14px' }}>
            <LogoEl size={54} radius={14} />
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.15, textShadow: '0 2px 8px rgba(0,0,0,.7)' }}>{name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,.16)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 10, padding: '3px 9px' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 4px #10B981' }} />
              <span style={{ color: '#10B981', fontSize: 8, fontWeight: 700 }}>Open Now</span>
            </div>
            <StarRow sz={7.5} />
          </div>
        </div>

        {/* Info rows (dark bg, below hero — matches real page) */}
        <div style={{ background: '#100d20', padding: '9px 12px 6px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {addr && (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                <span style={{ fontSize: 8, lineHeight: 1.4 }}>📍</span>
                <span style={{ color: 'rgba(255,255,255,.65)', fontSize: 7.5, lineHeight: 1.4 }}>{addr}</span>
              </div>
              <div style={{ paddingLeft: 13 }}>
                <span style={{ color: '#a78bfa', fontSize: 7, fontWeight: 600 }}>See on Maps ↗</span>
              </div>
            </div>
          )}
          {phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 8 }}>📞</span>
              <span style={{ color: 'rgba(255,255,255,.65)', fontSize: 7.5 }}>{phone}</span>
            </div>
          )}
          {email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 8 }}>✉️</span>
              <span style={{ color: 'rgba(255,255,255,.65)', fontSize: 7.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{email}</span>
            </div>
          )}
        </div>

        {/* CTA buttons */}
        <div style={{ padding: '6px 10px 12px', display: 'flex', flexDirection: 'column', gap: 6, background: '#100d20' }}>
          <div style={{ background: '#7C3AED', borderRadius: 14, padding: '9px 0', textAlign: 'center', boxShadow: '0 4px 14px rgba(124,58,237,.45)' }}>
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✦ Book Now</span>
          </div>
          <div style={{ background: '#1a1208', border: '1px solid rgba(212,175,55,.25)', borderRadius: 14, padding: '9px 0', textAlign: 'center' }}>
            <span style={{ color: '#D4AF37', fontSize: 10, fontWeight: 700 }}>✿ Shop Cosmetics</span>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1.5px solid rgba(13,148,136,.15)', marginBottom: 28, overflow: 'hidden', boxShadow: '0 4px 20px rgba(13,148,136,.07)' }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>Profile Page Preview</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Updates live as you pick a new logo or cover image</div>
        </div>
        <Link to={`/salons/${salon.id}`} target="_blank" style={{ fontSize: 12, fontWeight: 700, color: '#0D9488', textDecoration: 'none', padding: '6px 14px', borderRadius: 10, background: 'rgba(13,148,136,.08)', border: '1px solid rgba(13,148,136,.2)' }}>
          View Live →
        </Link>
      </div>
      <div style={{ padding: '20px 24px', display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <DesktopFrame />
        <MobileFrame />
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────── */
export default function OwnerGallery() {
  const { salon, setSalon } = useOwner();
  const { isMobile } = useBreakpoint();
  const [images, setImages]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoFile, setLogoFile]   = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadError, setUploadError]         = useState('');
  const [uploading, setUploading]             = useState(false);
  const logoFileRef  = useRef(null);
  const coverFileRef = useRef(null);

  /* ── Cosmetics gallery state ── */
  const [cosGallery, setCosGallery]     = useState([]);
  const [showCosModal, setShowCosModal] = useState(false);
  const [cosError, setCosError]         = useState('');
  const [cosUploading, setCosUploading] = useState(false);
  const cosFileRef = useRef(null);

  const load = () => {
    if (!salon) return;
    setLoading(true);
    api.get(`/salons/${salon.id}/images/`)
      .then(r => setImages(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadCosGallery = () => {
    if (!salon) return;
    api.get(`/salons/${salon.id}/cosmetics-gallery/`)
      .then(r => setCosGallery(r.data))
      .catch(() => {});
  };

  useEffect(() => { load(); loadCosGallery(); }, [salon]);

  /* ── Logo handlers ── */
  const pickLogo = e => {
    const f = e.target.files[0];
    if (!f) return;
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  const uploadLogo = async () => {
    if (!logoFile) return;
    setLogoUploading(true);
    const fd = new FormData();
    fd.append('logo', logoFile);
    try {
      const r = await api.post(`/salons/${salon.id}/logo/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSalon(r.data);
      setLogoFile(null);
      if (logoPreview) { URL.revokeObjectURL(logoPreview); setLogoPreview(null); }
      if (logoFileRef.current) logoFileRef.current.value = '';
      setMsg('Logo updated successfully.');
    } catch { setMsg('Error uploading logo.'); }
    finally { setLogoUploading(false); }
  };

  const removeLogo = async () => {
    if (!window.confirm('Remove the salon logo?')) return;
    try {
      await api.delete(`/salons/${salon.id}/logo/`);
      setSalon(prev => ({ ...prev, logo_url: null }));
      setMsg('Logo removed.');
    } catch { setMsg('Error removing logo.'); }
  };

  const cancelLogoChange = () => {
    setLogoFile(null);
    if (logoPreview) { URL.revokeObjectURL(logoPreview); setLogoPreview(null); }
    if (logoFileRef.current) logoFileRef.current.value = '';
  };

  /* ── Cover handlers ── */
  const pickCover = e => {
    const f = e.target.files[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  };

  const uploadCover = async () => {
    if (!coverFile) return;
    setCoverUploading(true);
    const fd = new FormData();
    fd.append('cover_image', coverFile);
    try {
      const r = await api.post(`/salons/${salon.id}/cover/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSalon(r.data);
      setCoverFile(null);
      if (coverPreview) { URL.revokeObjectURL(coverPreview); setCoverPreview(null); }
      if (coverFileRef.current) coverFileRef.current.value = '';
      setMsg('Cover image updated successfully.');
    } catch { setMsg('Error uploading cover image.'); }
    finally { setCoverUploading(false); }
  };

  const removeCover = async () => {
    if (!window.confirm('Remove the hero cover image?')) return;
    try {
      await api.delete(`/salons/${salon.id}/cover/`);
      setSalon(prev => ({ ...prev, cover_image_url: null }));
      setMsg('Cover image removed.');
    } catch { setMsg('Error removing cover image.'); }
  };

  const cancelCoverChange = () => {
    setCoverFile(null);
    if (coverPreview) { URL.revokeObjectURL(coverPreview); setCoverPreview(null); }
    if (coverFileRef.current) coverFileRef.current.value = '';
  };

  /* ── Photo upload ── */
  const handleUpload = async (file, caption) => {
    setUploadError(''); setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('caption', caption);
    fd.append('sort_order', images.length);
    try {
      await api.post(`/salons/${salon.id}/images/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowUploadModal(false); load(); setMsg('Photo uploaded.');
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally { setUploading(false); }
  };

  const deleteImage = async img => {
    if (!window.confirm('Remove this photo?')) return;
    try {
      await api.delete(`/salons/${salon.id}/images/${img.id}/`);
      setMsg('Photo removed.'); load();
    } catch { setMsg('Error removing photo.'); }
  };

  const updateCaption = async (img, newCaption) => {
    try {
      await api.patch(`/salons/${salon.id}/images/${img.id}/`, { caption: newCaption });
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, caption: newCaption } : i));
    } catch {}
  };

  const moveImage = async (img, direction) => {
    const idx = images.findIndex(i => i.id === img.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= images.length) return;
    const updated = [...images];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    setImages(updated);
    try {
      await Promise.all([
        api.patch(`/salons/${salon.id}/images/${updated[idx].id}/`, { sort_order: idx }),
        api.patch(`/salons/${salon.id}/images/${updated[swapIdx].id}/`, { sort_order: swapIdx }),
      ]);
    } catch { load(); }
  };

  /* ── Cosmetics upload ── */
  const handleCosUpload = async (file, caption) => {
    setCosError(''); setCosUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('caption', caption);
    fd.append('sort_order', cosGallery.length);
    try {
      await api.post(`/salons/${salon.id}/cosmetics-gallery/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowCosModal(false); loadCosGallery(); setMsg('Cosmetics gallery photo uploaded.');
    } catch (err) {
      setCosError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally { setCosUploading(false); }
  };

  const deleteCosImage = async img => {
    if (!window.confirm('Remove this cosmetics gallery photo?')) return;
    try {
      await api.delete(`/salons/${salon.id}/cosmetics-gallery/${img.id}/`);
      setMsg('Photo removed.'); loadCosGallery();
    } catch { setMsg('Error removing photo.'); }
  };

  if (!salon) return <div style={{ color: 'var(--text-muted)', padding: 40 }}>Loading salon…</div>;

  const currentLogo  = logoPreview  || salon.logo_url;
  const currentCover = coverPreview || salon.cover_image_url;

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={{ ...s.header, flexDirection: isMobile ? 'column' : 'row' }} className="fade-up">
        <div>
          <div style={s.eyebrow}>Media</div>
          <h1 style={s.title}>Gallery</h1>
          <p style={s.sub}>Manage your salon logo and gallery photos</p>
        </div>
      </div>

      {msg && (
        <div style={s.toast} className="fade-in">
          {msg}
          <button style={s.toastClose} onClick={() => setMsg('')}>✕</button>
        </div>
      )}

      {/* ── PROFILE PREVIEW ── */}
      <ProfilePreview salon={salon} logoSrc={currentLogo} coverSrc={currentCover} />

      {/* ── LOGO SECTION ── */}
      <div style={s.logoCard} className="fade-up">
        <div style={s.logoSectionHead}>
          <div>
            <div style={s.logoSectionTitle}>Salon Logo</div>
            <div style={s.logoSectionSub}>Shown on your booking page and salon profile</div>
          </div>
        </div>
        <div style={{ ...s.logoBody, flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={s.logoDisplayWrap}>
            {currentLogo ? (
              <img src={currentLogo} alt="Salon logo" style={s.logoImg} />
            ) : (
              <div style={s.logoPlaceholder}>
                <span style={s.logoPlaceholderInitial}>{salon.name[0]}</span>
                <span style={s.logoPlaceholderText}>No logo uploaded</span>
              </div>
            )}
            {logoPreview && <div style={s.logoNewBadge}>New</div>}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
            {logoFile ? (
              <>
                <div style={s.logoPendingNote}>Logo selected — click Upload to apply</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={s.logoCancelBtn} onClick={cancelLogoChange}>Cancel</button>
                  <button style={{ ...s.logoUploadBtn, opacity: logoUploading ? 0.7 : 1 }} onClick={uploadLogo} disabled={logoUploading}>
                    {logoUploading ? 'Uploading…' : 'Upload Logo'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <button style={s.logoPickBtn} onClick={() => logoFileRef.current?.click()}>
                  {salon.logo_url ? '↺ Replace Logo' : '+ Upload Logo'}
                </button>
                {salon.logo_url && <button style={s.logoRemoveBtn} onClick={removeLogo}>Remove Logo</button>}
                <div style={s.logoHint}>Recommended: square image (PNG or JPG), at least 200×200px</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={logoFileRef}  type="file" accept="image/*" style={{ display: 'none' }} onChange={pickLogo} />
      <input ref={coverFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickCover} />
      <input ref={cosFileRef}   type="file" accept="image/*" style={{ display: 'none' }} onChange={() => {}} />

      {/* ── COVER IMAGE SECTION ── */}
      <div style={s.logoCard} className="fade-up">
        <div style={s.logoSectionHead}>
          <div>
            <div style={s.logoSectionTitle}>Hero Cover Image</div>
            <div style={s.logoSectionSub}>Displayed as the full-width background in the salon's hero section</div>
          </div>
        </div>
        <div style={{ ...s.logoBody, flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ ...s.logoDisplayWrap, width: isMobile ? '100%' : 220, height: 110, borderRadius: 14 }}>
            {currentCover ? (
              <img src={currentCover} alt="Cover" style={s.logoImg} />
            ) : (
              <div style={s.logoPlaceholder}>
                <span style={{ fontSize: 26, color: '#0D9488' }}>◈</span>
                <span style={s.logoPlaceholderText}>No cover image</span>
              </div>
            )}
            {coverPreview && <div style={s.logoNewBadge}>New</div>}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
            {coverFile ? (
              <>
                <div style={s.logoPendingNote}>Cover selected — click Upload to apply</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={s.logoCancelBtn} onClick={cancelCoverChange}>Cancel</button>
                  <button style={{ ...s.logoUploadBtn, opacity: coverUploading ? 0.7 : 1 }} onClick={uploadCover} disabled={coverUploading}>
                    {coverUploading ? 'Uploading…' : 'Upload Cover'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <button style={s.logoPickBtn} onClick={() => coverFileRef.current?.click()}>
                  {salon.cover_image_url ? '↺ Replace Cover' : '+ Upload Cover Image'}
                </button>
                {salon.cover_image_url && <button style={s.logoRemoveBtn} onClick={removeCover}>Remove Cover</button>}
                <div style={s.logoHint}>Recommended: wide landscape image (JPG or PNG), at least 1400×500px</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── COSMETICS GALLERY SECTION ── */}
      {salon.cosmetics_enabled && (
        <>
          <div style={{ ...s.gallerySectionHead, marginTop: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ ...s.gallerySectionTitle, display: 'flex', alignItems: 'center', gap: 10 }}>
                Cosmetics Gallery
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(201,107,81,.12)', color: '#C96B51', letterSpacing: '0.06em' }}>COSMETICS</span>
              </div>
              <div style={s.gallerySectionSub}>These images appear in the gallery slider on your cosmetics page — upload product lifestyle shots or promo banners</div>
            </div>
            <button
              style={{ ...s.uploadBtn, background: 'linear-gradient(135deg, #C96B51, #D4AF37)', boxShadow: '0 6px 18px rgba(201,107,81,.35)', flexShrink: 0, marginLeft: 16 }}
              onClick={() => { setCosError(''); setShowCosModal(true); }}
            >
              + Add Image
            </button>
          </div>

          {cosGallery.length === 0 ? (
            <div style={{ ...s.empty, padding: '40px 28px', marginBottom: 36 }} className="scale-in">
              <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.4 }}>🛍</div>
              <h3 style={{ ...s.emptyTitle, fontSize: 18 }}>No cosmetics gallery images yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 18 }}>Upload product lifestyle shots or promo banners.</p>
              <button style={{ ...s.uploadBtn, background: 'linear-gradient(135deg, #C96B51, #D4AF37)', boxShadow: '0 4px 14px rgba(201,107,81,.35)' }} onClick={() => { setCosError(''); setShowCosModal(true); }}>
                + Upload First Image
              </button>
            </div>
          ) : (
            <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: 36 }} className="fade-up">
              {cosGallery.map((img, idx) => (
                <div key={img.id} style={s.card}>
                  <div style={{ ...s.imgWrap, aspectRatio: '16/9' }}>
                    <img src={img.image_url} alt={img.caption || 'Gallery'} style={s.img} />
                    <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(201,107,81,.85)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8 }}>#{idx + 1}</div>
                  </div>
                  <div style={s.cardBody}>
                    {img.caption && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>{img.caption}</div>}
                    <button style={{ ...s.deleteBtn, width: '100%', textAlign: 'center' }} onClick={() => deleteCosImage(img)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── GALLERY PHOTOS ── */}
      <div style={{ ...s.gallerySectionHead, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={s.gallerySectionTitle}>Gallery Photos</div>
          <div style={s.gallerySectionSub}>Reorder using arrows · click captions to edit</div>
        </div>
        <button style={{ ...s.uploadBtn, flexShrink: 0 }} onClick={() => { setUploadError(''); setShowUploadModal(true); }}>
          + Add Photo
        </button>
      </div>

      {loading ? (
        <div style={s.grid}>
          {[1, 2, 3].map(i => <div key={i} style={s.skeleton} className="shimmer" />)}
        </div>
      ) : images.length === 0 ? (
        <div style={s.empty} className="scale-in">
          <div style={s.emptyIcon}>◈</div>
          <h3 style={s.emptyTitle}>No photos yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Add photos to showcase your salon on your public profile page.</p>
          <button style={s.uploadBtn} onClick={() => { setUploadError(''); setShowUploadModal(true); }}>+ Upload First Photo</button>
        </div>
      ) : (
        <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(240px, 1fr))' }} className="fade-up">
          {images.map((img, idx) => (
            <div key={img.id} style={s.card}>
              <div style={s.imgWrap}>
                <img src={img.image_url} alt={img.caption || 'Salon photo'} style={s.img} />
                <div style={s.imgOverlay}>
                  <button style={{ ...s.orderBtn, opacity: idx === 0 ? 0.4 : 1 }} onClick={() => moveImage(img, 'up')} disabled={idx === 0}>←</button>
                  <button style={{ ...s.orderBtn, opacity: idx === images.length - 1 ? 0.4 : 1 }} onClick={() => moveImage(img, 'down')} disabled={idx === images.length - 1}>→</button>
                </div>
              </div>
              <div style={s.cardBody}>
                <input
                  style={s.captionInput}
                  placeholder="Add a caption…"
                  defaultValue={img.caption}
                  onBlur={e => updateCaption(img, e.target.value)}
                  maxLength={100}
                />
                <div style={s.cardActions}>
                  <span style={s.orderNum}>#{idx + 1}</span>
                  <button style={s.deleteBtn} onClick={() => deleteImage(img)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {showUploadModal && (
        <UploadModal
          title="Add Gallery Photo"
          accentGradient="linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)"
          accentShadow="0 4px 14px rgba(13,148,136,.3)"
          uploading={uploading}
          error={uploadError}
          onClose={() => { setShowUploadModal(false); setUploadError(''); }}
          onUpload={handleUpload}
        />
      )}
      {showCosModal && (
        <UploadModal
          title="Add Cosmetics Photo"
          accentGradient="linear-gradient(135deg, #C96B51, #D4AF37)"
          accentShadow="0 4px 14px rgba(201,107,81,.35)"
          uploading={cosUploading}
          error={cosError}
          onClose={() => { setShowCosModal(false); setCosError(''); }}
          onUpload={handleCosUpload}
        />
      )}
    </div>
  );
}

const s = {
  page:    { maxWidth: 960, margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title:   { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' },
  sub:     { fontSize: 14, color: 'var(--text-muted)', margin: 0 },
  uploadBtn: { padding: '11px 24px', background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 6px 18px rgba(13,148,136,.35)', flexShrink: 0 },

  toast:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0FDFA', border: '1px solid #99F6E4', color: '#0D9488', borderRadius: 12, padding: '11px 18px', fontSize: 13, marginBottom: 22 },
  toastClose: { background: 'none', border: 'none', cursor: 'pointer', color: '#0D9488', fontSize: 14 },

  logoCard:          { background: 'var(--surface)', borderRadius: 20, border: '1.5px solid rgba(13,148,136,.15)', marginBottom: 28, overflow: 'hidden', boxShadow: '0 4px 20px rgba(13,148,136,.07)' },
  logoSectionHead:   { padding: '18px 24px 14px', borderBottom: '1px solid var(--border)' },
  logoSectionTitle:  { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 3 },
  logoSectionSub:    { fontSize: 12, color: 'var(--text-muted)' },
  logoBody:          { display: 'flex', gap: 24, padding: 24, alignItems: 'center' },
  logoDisplayWrap:   { position: 'relative', width: 110, height: 110, flexShrink: 0, borderRadius: 20, overflow: 'hidden', border: '2px solid var(--border)', background: 'var(--surface2)', boxShadow: '0 4px 14px rgba(0,0,0,.08)' },
  logoImg:           { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  logoPlaceholder:   { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 },
  logoPlaceholderInitial: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 36, fontWeight: 700, color: '#0D9488', lineHeight: 1 },
  logoPlaceholderText:    { fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' },
  logoNewBadge:      { position: 'absolute', top: 6, right: 6, background: '#0D9488', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 6, letterSpacing: '0.06em' },
  logoPendingNote:   { fontSize: 12, color: '#0D9488', fontWeight: 600 },
  logoPickBtn:       { padding: '10px 20px', background: 'linear-gradient(135deg, #0D9488, #0D9488)', color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 12px rgba(13,148,136,.3)', alignSelf: 'flex-start' },
  logoUploadBtn:     { padding: '10px 22px', background: 'linear-gradient(135deg, #0D9488, #0B7A70)', color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 12px rgba(13,148,136,.3)' },
  logoCancelBtn:     { padding: '10px 18px', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 11, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' },
  logoRemoveBtn:     { padding: '8px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#DC2626', alignSelf: 'flex-start' },
  logoHint:          { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 },

  gallerySectionHead:  { marginBottom: 16 },
  gallerySectionTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 3 },
  gallerySectionSub:   { fontSize: 12, color: 'var(--text-muted)' },

  grid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 },
  skeleton: { height: 280, borderRadius: 18 },
  card:     { background: 'var(--surface)', borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(13,148,136,.06)' },
  imgWrap:  { position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: 'var(--surface2)' },
  img:      { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  imgOverlay: { position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6, alignItems: 'center' },
  orderBtn: { width: 30, height: 30, borderRadius: 8, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: '12px 14px' },
  captionInput: { width: '100%', padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12, background: 'var(--input-bg)', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: 10 },
  cardActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  orderNum: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--border)' },
  deleteBtn: { fontSize: 12, fontWeight: 600, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' },

  empty:      { textAlign: 'center', padding: '72px 40px', background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(13,148,136,.06)' },
  emptyIcon:  { fontSize: 30, marginBottom: 18, display: 'inline-flex', width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0D9488 0%, #0D9488 100%)', color: '#fff', boxShadow: '0 8px 24px rgba(13,148,136,.35)' },
  emptyTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' },
};

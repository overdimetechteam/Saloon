import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { useBreakpoint } from '../../hooks/useMobile';

export default function OwnerGallery() {
  const { salon, setSalon } = useOwner();
  const { isMobile } = useBreakpoint();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileRef = useRef(null);
  const logoFileRef = useRef(null);

  const load = () => {
    if (!salon) return;
    setLoading(true);
    api.get(`/salons/${salon.id}/images/`)
      .then(r => setImages(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [salon]);

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
      const r = await api.post(`/salons/${salon.id}/logo/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSalon(r.data);
      setLogoFile(null);
      if (logoPreview) { URL.revokeObjectURL(logoPreview); setLogoPreview(null); }
      if (logoFileRef.current) logoFileRef.current.value = '';
      setMsg('Logo updated successfully.');
    } catch {
      setMsg('Error uploading logo.');
    } finally { setLogoUploading(false); }
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

  /* ── Photo handlers ── */
  const pickFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clearUpload = () => {
    setFile(null); setCaption('');
    if (preview) { URL.revokeObjectURL(preview); setPreview(null); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const upload = async e => {
    e.preventDefault();
    if (!file) return setError('Please select an image file');
    setError(''); setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('caption', caption);
    fd.append('sort_order', images.length);
    try {
      await api.post(`/salons/${salon.id}/images/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearUpload(); load(); setMsg('Photo uploaded.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
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

  if (!salon) return <div style={{ color: 'var(--text-muted)', padding: 40 }}>Loading salon…</div>;

  const currentLogo = logoPreview || salon.logo_url;

  return (
    <div style={s.page}>
      <div style={{ ...s.header, flexDirection: isMobile ? 'column' : 'row' }} className="fade-up">
        <div>
          <div style={s.eyebrow}>Media</div>
          <h1 style={s.title}>Gallery</h1>
          <p style={s.sub}>Manage your salon logo and gallery photos</p>
        </div>
        <button style={{ ...s.uploadBtn, alignSelf: isMobile ? 'stretch' : 'auto' }}
          onClick={() => fileRef.current?.click()}>
          + Add Photo
        </button>
      </div>

      {msg && (
        <div style={s.toast} className="fade-in">
          {msg}
          <button style={s.toastClose} onClick={() => setMsg('')}>✕</button>
        </div>
      )}

      {/* ── LOGO SECTION ── */}
      <div style={s.logoCard} className="fade-up">
        <div style={s.logoSectionHead}>
          <div>
            <div style={s.logoSectionTitle}>Salon Logo</div>
            <div style={s.logoSectionSub}>Shown on your booking page and salon profile</div>
          </div>
        </div>
        <div style={{ ...s.logoBody, flexDirection: isMobile ? 'column' : 'row' }}>
          {/* Current logo display */}
          <div style={s.logoDisplayWrap}>
            {currentLogo ? (
              <img src={currentLogo} alt="Salon logo" style={s.logoImg} />
            ) : (
              <div style={s.logoPlaceholder}>
                <span style={s.logoPlaceholderInitial}>{salon.name[0]}</span>
                <span style={s.logoPlaceholderText}>No logo uploaded</span>
              </div>
            )}
            {logoPreview && (
              <div style={s.logoNewBadge}>New</div>
            )}
          </div>

          {/* Logo actions */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
            {logoFile ? (
              <>
                <div style={s.logoPendingNote}>Logo selected — click Upload to apply</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={s.logoCancelBtn} onClick={cancelLogoChange}>Cancel</button>
                  <button
                    style={{ ...s.logoUploadBtn, opacity: logoUploading ? 0.7 : 1 }}
                    onClick={uploadLogo}
                    disabled={logoUploading}
                  >
                    {logoUploading ? 'Uploading…' : 'Upload Logo'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <button style={s.logoPickBtn} onClick={() => logoFileRef.current?.click()}>
                  {salon.logo_url ? '↺ Replace Logo' : '+ Upload Logo'}
                </button>
                {salon.logo_url && (
                  <button style={s.logoRemoveBtn} onClick={removeLogo}>Remove Logo</button>
                )}
                <div style={s.logoHint}>
                  Recommended: square image (PNG or JPG), at least 200×200px
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={logoFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickLogo} />
      <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={pickFile} />

      {/* ── PHOTO UPLOAD PANEL ── */}
      {file && (
        <div style={s.uploadPanel} className="scale-in">
          <div style={s.uploadPanelTitle}>New Photo</div>
          {error && <div style={s.alert}>{error}</div>}
          <div style={{ display: 'flex', gap: 18, flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start' }}>
            <div style={s.previewWrap}>
              <img src={preview} alt="preview" style={s.previewImg} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Caption (optional)</label>
              <input
                style={s.input}
                placeholder="e.g. Our styling area"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                maxLength={100}
              />
              <div style={s.uploadActions}>
                <button style={s.cancelBtn} onClick={clearUpload} type="button">Cancel</button>
                <button
                  style={{ ...s.saveBtn, opacity: uploading ? 0.7 : 1 }}
                  onClick={upload}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading…' : 'Upload Photo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GALLERY PHOTOS ── */}
      <div style={s.gallerySectionHead}>
        <div style={s.gallerySectionTitle}>Gallery Photos</div>
        <div style={s.gallerySectionSub}>Reorder using arrows · click captions to edit</div>
      </div>

      {loading ? (
        <div style={s.grid}>
          {[1, 2, 3].map(i => <div key={i} style={s.skeleton} className="shimmer" />)}
        </div>
      ) : images.length === 0 ? (
        <div style={s.empty} className="scale-in">
          <div style={s.emptyIcon}>◈</div>
          <h3 style={s.emptyTitle}>No photos yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            Add photos to showcase your salon on your public profile page.
          </p>
          <button style={s.uploadBtn} onClick={() => fileRef.current?.click()}>+ Upload First Photo</button>
        </div>
      ) : (
        <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(240px, 1fr))' }} className="fade-up">
          {images.map((img, idx) => (
            <div key={img.id} style={s.card}>
              <div style={s.imgWrap}>
                <img src={img.image_url} alt={img.caption || 'Salon photo'} style={s.img} />
                <div style={s.imgOverlay}>
                  <button style={{ ...s.orderBtn, opacity: idx === 0 ? 0.4 : 1 }} onClick={() => moveImage(img, 'up')} disabled={idx === 0} title="Move left">←</button>
                  <button style={{ ...s.orderBtn, opacity: idx === images.length - 1 ? 0.4 : 1 }} onClick={() => moveImage(img, 'down')} disabled={idx === images.length - 1} title="Move right">→</button>
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
    </div>
  );
}

const s = {
  page: { maxWidth: 960, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' },
  sub: { fontSize: 14, color: 'var(--text-muted)', margin: 0 },
  uploadBtn: { padding: '11px 24px', background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #0D9488 100%)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 6px 18px rgba(124,58,237,.35)', flexShrink: 0 },

  toast: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', borderRadius: 12, padding: '11px 18px', fontSize: 13, marginBottom: 22 },
  toastClose: { background: 'none', border: 'none', cursor: 'pointer', color: '#059669', fontSize: 14 },

  /* Logo section */
  logoCard: { background: 'var(--surface)', borderRadius: 20, border: '1.5px solid rgba(124,58,237,.15)', marginBottom: 28, overflow: 'hidden', boxShadow: '0 4px 20px rgba(124,58,237,.07)' },
  logoSectionHead: { padding: '18px 24px 14px', borderBottom: '1px solid var(--border)' },
  logoSectionTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 3 },
  logoSectionSub: { fontSize: 12, color: 'var(--text-muted)' },
  logoBody: { display: 'flex', gap: 24, padding: 24, alignItems: 'center' },
  logoDisplayWrap: { position: 'relative', width: 110, height: 110, flexShrink: 0, borderRadius: 20, overflow: 'hidden', border: '2px solid var(--border)', background: 'var(--surface2)', boxShadow: '0 4px 14px rgba(0,0,0,.08)' },
  logoImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  logoPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 },
  logoPlaceholderInitial: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 36, fontWeight: 700, color: '#7C3AED', lineHeight: 1 },
  logoPlaceholderText: { fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' },
  logoNewBadge: { position: 'absolute', top: 6, right: 6, background: '#0D9488', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 6, letterSpacing: '0.06em' },
  logoPendingNote: { fontSize: 12, color: '#0D9488', fontWeight: 600 },
  logoPickBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #7C3AED, #0D9488)', color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 12px rgba(124,58,237,.3)', alignSelf: 'flex-start' },
  logoUploadBtn: { padding: '10px 22px', background: 'linear-gradient(135deg, #0D9488, #059669)', color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 12px rgba(13,148,136,.3)' },
  logoCancelBtn: { padding: '10px 18px', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 11, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' },
  logoRemoveBtn: { padding: '8px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#DC2626', alignSelf: 'flex-start' },
  logoHint: { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 },

  /* Gallery section label */
  gallerySectionHead: { marginBottom: 16 },
  gallerySectionTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 3 },
  gallerySectionSub: { fontSize: 12, color: 'var(--text-muted)' },

  uploadPanel: { background: 'var(--surface)', borderRadius: 20, padding: 24, border: '1.5px solid rgba(124,58,237,.2)', marginBottom: 28, boxShadow: '0 4px 24px rgba(124,58,237,.08)' },
  uploadPanelTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 18 },
  alert: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  previewWrap: { width: 160, height: 160, borderRadius: 14, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  label: { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 11, fontSize: 14, background: 'var(--input-bg)', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: 16 },
  uploadActions: { display: 'flex', gap: 10 },
  cancelBtn: { padding: '10px 22px', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" },
  saveBtn: { padding: '10px 24px', background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #0D9488 100%)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 14px rgba(124,58,237,.3)', fontFamily: "'DM Sans', sans-serif" },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 },
  skeleton: { height: 280, borderRadius: 18 },
  card: { background: 'var(--surface)', borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(124,58,237,.06)' },
  imgWrap: { position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: 'var(--surface2)' },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  imgOverlay: { position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6 },
  orderBtn: { width: 30, height: 30, borderRadius: 8, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: '12px 14px' },
  captionInput: { width: '100%', padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12, background: 'var(--input-bg)', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: 10 },
  cardActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  orderNum: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--border)' },
  deleteBtn: { fontSize: 12, fontWeight: 600, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' },

  empty: { textAlign: 'center', padding: '72px 40px', background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(124,58,237,.06)' },
  emptyIcon: { fontSize: 30, marginBottom: 18, display: 'inline-flex', width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)', color: '#fff', boxShadow: '0 8px 24px rgba(124,58,237,.35)' },
  emptyTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' },
};

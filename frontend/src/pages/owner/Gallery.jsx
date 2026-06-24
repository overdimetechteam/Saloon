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
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const fileRef = useRef(null);
  const logoFileRef = useRef(null);
  const coverFileRef = useRef(null);

  /* ── Cosmetics gallery state ── */
  const [cosGallery, setCosGallery] = useState([]);
  const [cosFile, setCosFile] = useState(null);
  const [cosPreview, setCosPreview] = useState(null);
  const [cosCaption, setCosCaption] = useState('');
  const [cosUploading, setCosUploading] = useState(false);
  const [cosError, setCosError] = useState('');
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

  /* ── Cover image handlers ── */
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
      const r = await api.post(`/salons/${salon.id}/cover/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSalon(r.data);
      setCoverFile(null);
      if (coverPreview) { URL.revokeObjectURL(coverPreview); setCoverPreview(null); }
      if (coverFileRef.current) coverFileRef.current.value = '';
      setMsg('Cover image updated successfully.');
    } catch {
      setMsg('Error uploading cover image.');
    } finally { setCoverUploading(false); }
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

  /* ── Cosmetics gallery handlers ── */
  const pickCosFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setCosFile(f);
    setCosPreview(URL.createObjectURL(f));
  };

  const clearCosUpload = () => {
    setCosFile(null); setCosCaption(''); setCosError('');
    if (cosPreview) { URL.revokeObjectURL(cosPreview); setCosPreview(null); }
    if (cosFileRef.current) cosFileRef.current.value = '';
  };

  const uploadCosImage = async e => {
    e.preventDefault();
    if (!cosFile) return setCosError('Please select an image file');
    setCosError(''); setCosUploading(true);
    const fd = new FormData();
    fd.append('image', cosFile);
    fd.append('caption', cosCaption);
    fd.append('sort_order', cosGallery.length);
    try {
      await api.post(`/salons/${salon.id}/cosmetics-gallery/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearCosUpload(); loadCosGallery(); setMsg('Cosmetics gallery photo uploaded.');
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
      <input ref={coverFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickCover} />
      <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={pickFile} />
      <input ref={cosFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickCosFile} />

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
            {(coverPreview || salon.cover_image_url) ? (
              <img src={coverPreview || salon.cover_image_url} alt="Cover" style={s.logoImg} />
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
                  <button
                    style={{ ...s.logoUploadBtn, opacity: coverUploading ? 0.7 : 1 }}
                    onClick={uploadCover}
                    disabled={coverUploading}
                  >
                    {coverUploading ? 'Uploading…' : 'Upload Cover'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <button style={s.logoPickBtn} onClick={() => coverFileRef.current?.click()}>
                  {salon.cover_image_url ? '↺ Replace Cover' : '+ Upload Cover Image'}
                </button>
                {salon.cover_image_url && (
                  <button style={s.logoRemoveBtn} onClick={removeCover}>Remove Cover</button>
                )}
                <div style={s.logoHint}>
                  Recommended: wide landscape image (JPG or PNG), at least 1400×500px
                </div>
              </>
            )}
          </div>
        </div>
      </div>

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
              onClick={() => cosFileRef.current?.click()}
            >
              + Add Image
            </button>
          </div>

          {/* Cosmetics upload panel */}
          {cosFile && (
            <div style={{ ...s.uploadPanel, border: '1.5px solid rgba(201,107,81,.25)', marginBottom: 20 }} className="scale-in">
              <div style={s.uploadPanelTitle}>New Cosmetics Photo</div>
              {cosError && <div style={s.alert}>{cosError}</div>}
              <div style={{ display: 'flex', gap: 18, flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start' }}>
                <div style={s.previewWrap}>
                  <img src={cosPreview} alt="preview" style={s.previewImg} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Caption (optional)</label>
                  <input
                    style={s.input}
                    placeholder="e.g. Summer skincare bundle"
                    value={cosCaption}
                    onChange={e => setCosCaption(e.target.value)}
                    maxLength={150}
                  />
                  <div style={s.uploadActions}>
                    <button style={s.cancelBtn} onClick={clearCosUpload} type="button">Cancel</button>
                    <button
                      style={{ ...s.saveBtn, background: 'linear-gradient(135deg, #C96B51, #D4AF37)', boxShadow: '0 4px 14px rgba(201,107,81,.35)', opacity: cosUploading ? 0.7 : 1 }}
                      onClick={uploadCosImage}
                      disabled={cosUploading}
                    >
                      {cosUploading ? 'Uploading…' : 'Upload Photo'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cosmetics images grid */}
          {cosGallery.length === 0 ? (
            <div style={{ ...s.empty, padding: '40px 28px', marginBottom: 36 }} className="scale-in">
              <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.4 }}>🛍</div>
              <h3 style={{ ...s.emptyTitle, fontSize: 18 }}>No cosmetics gallery images yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 18 }}>
                Upload product lifestyle shots or promo banners — they'll display as a sliding gallery on your cosmetics page.
              </p>
              <button
                style={{ ...s.uploadBtn, background: 'linear-gradient(135deg, #C96B51, #D4AF37)', boxShadow: '0 4px 14px rgba(201,107,81,.35)' }}
                onClick={() => cosFileRef.current?.click()}
              >
                + Upload First Image
              </button>
            </div>
          ) : (
            <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: 36 }} className="fade-up">
              {cosGallery.map((img, idx) => (
                <div key={img.id} style={s.card}>
                  <div style={{ ...s.imgWrap, aspectRatio: '16/9' }}>
                    <img src={img.image_url} alt={img.caption || 'Gallery'} style={s.img} />
                    <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(201,107,81,.85)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8 }}>
                      #{idx + 1}
                    </div>
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
  uploadBtn: { padding: '11px 24px', background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 6px 18px rgba(13,148,136,.35)', flexShrink: 0 },

  toast: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0FDFA', border: '1px solid #99F6E4', color: '#0D9488', borderRadius: 12, padding: '11px 18px', fontSize: 13, marginBottom: 22 },
  toastClose: { background: 'none', border: 'none', cursor: 'pointer', color: '#0D9488', fontSize: 14 },

  /* Logo section */
  logoCard: { background: 'var(--surface)', borderRadius: 20, border: '1.5px solid rgba(13,148,136,.15)', marginBottom: 28, overflow: 'hidden', boxShadow: '0 4px 20px rgba(13,148,136,.07)' },
  logoSectionHead: { padding: '18px 24px 14px', borderBottom: '1px solid var(--border)' },
  logoSectionTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 3 },
  logoSectionSub: { fontSize: 12, color: 'var(--text-muted)' },
  logoBody: { display: 'flex', gap: 24, padding: 24, alignItems: 'center' },
  logoDisplayWrap: { position: 'relative', width: 110, height: 110, flexShrink: 0, borderRadius: 20, overflow: 'hidden', border: '2px solid var(--border)', background: 'var(--surface2)', boxShadow: '0 4px 14px rgba(0,0,0,.08)' },
  logoImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  logoPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 },
  logoPlaceholderInitial: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 36, fontWeight: 700, color: '#0D9488', lineHeight: 1 },
  logoPlaceholderText: { fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' },
  logoNewBadge: { position: 'absolute', top: 6, right: 6, background: '#0D9488', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 6, letterSpacing: '0.06em' },
  logoPendingNote: { fontSize: 12, color: '#0D9488', fontWeight: 600 },
  logoPickBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #0D9488, #0D9488)', color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 12px rgba(13,148,136,.3)', alignSelf: 'flex-start' },
  logoUploadBtn: { padding: '10px 22px', background: 'linear-gradient(135deg, #0D9488, #0B7A70)', color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 12px rgba(13,148,136,.3)' },
  logoCancelBtn: { padding: '10px 18px', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 11, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' },
  logoRemoveBtn: { padding: '8px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#DC2626', alignSelf: 'flex-start' },
  logoHint: { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 },

  /* Gallery section label */
  gallerySectionHead: { marginBottom: 16 },
  gallerySectionTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 3 },
  gallerySectionSub: { fontSize: 12, color: 'var(--text-muted)' },

  uploadPanel: { background: 'var(--surface)', borderRadius: 20, padding: 24, border: '1.5px solid rgba(13,148,136,.2)', marginBottom: 28, boxShadow: '0 4px 24px rgba(13,148,136,.08)' },
  uploadPanelTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 18 },
  alert: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  previewWrap: { width: 160, height: 160, borderRadius: 14, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  label: { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 11, fontSize: 14, background: 'var(--input-bg)', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: 16 },
  uploadActions: { display: 'flex', gap: 10 },
  cancelBtn: { padding: '10px 22px', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" },
  saveBtn: { padding: '10px 24px', background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 14px rgba(13,148,136,.3)', fontFamily: "'DM Sans', sans-serif" },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 },
  skeleton: { height: 280, borderRadius: 18 },
  card: { background: 'var(--surface)', borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(13,148,136,.06)' },
  imgWrap: { position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: 'var(--surface2)' },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  imgOverlay: { position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6, alignItems: 'center' },
  orderBtn: { width: 30, height: 30, borderRadius: 8, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: '12px 14px' },
  captionInput: { width: '100%', padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12, background: 'var(--input-bg)', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: 10 },
  cardActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  orderNum: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--border)' },
  deleteBtn: { fontSize: 12, fontWeight: 600, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' },

  empty: { textAlign: 'center', padding: '72px 40px', background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(13,148,136,.06)' },
  emptyIcon: { fontSize: 30, marginBottom: 18, display: 'inline-flex', width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0D9488 0%, #0D9488 100%)', color: '#fff', boxShadow: '0 8px 24px rgba(13,148,136,.35)' },
  emptyTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' },
};

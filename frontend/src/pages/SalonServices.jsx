import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useBreakpoint } from '../hooks/useMobile';
import { formatDuration } from '../utils/format';
import { SALON_PALETTES } from '../styles/theme';

const CAT_COLORS = {
  Hair: '#0D9488', Nails: '#D4AF37', Skin: '#0B7A70',
  Makeup: '#C96B51', Cosmetics: '#C96B51', Other: '#0D9488',
};

export default function SalonServices() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { profile } = useAuth();
  const { isMobile } = useBreakpoint();

  const [salon, setSalon]       = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  const isClient = profile?.role === 'client';

  useEffect(() => {
    Promise.all([
      api.get(`/salons/${id}/`),
      api.get(`/salons/${id}/services/`),
    ]).then(([s, sv]) => {
      setSalon(s.data);
      setServices(sv.data);
    }).finally(() => setLoading(false));
  }, [id]);

  // Group all services by category
  const grouped = services.reduce((acc, s) => {
    const cat = s.category || 'Other';
    (acc[cat] = acc[cat] || []).push(s);
    return acc;
  }, {});

  const toggle = (sid) => setSelected(prev => {
    const next = new Set(prev);
    next.has(sid) ? next.delete(sid) : next.add(sid);
    return next;
  });

  const selectedList  = services.filter(s => selected.has(s.id));
  const subtotal      = selectedList.reduce((sum, s) => sum + Number(s.effective_price), 0);

  const goBack = useCallback(() => {
    if (selected.size > 0) { setShowConfirm(true); return; }
    navigate(`/salons/${id}`);
  }, [selected.size, navigate, id]);

  const confirmBack = () => { setShowConfirm(false); navigate(`/salons/${id}`); };

  const handleContinue = () => {
    if (selected.size === 0) return;
    navigate(`/user/book/${id}?services=${[...selected].join(',')}`);
  };

  const pal = salon ? SALON_PALETTES[salon.color_palette || 'teal'] : SALON_PALETTES.teal;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${pal.main}30`, borderTopColor: pal.main, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: isClient ? 88 : 24 }}>

      {/* ── Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 80,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: isMobile ? '12px 14px' : '14px 24px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={goBack} style={s.backBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: isMobile ? 17 : 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
            {salon?.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            All Services — select one or more to book
          </div>
        </div>
        {selected.size > 0 && (
          <div style={{ background: `${pal.main}18`, color: pal.main, border: `1px solid ${pal.main}40`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {selected.size} selected
          </div>
        )}
      </div>

      {/* ── Services by category ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '16px 12px' : '24px 24px' }}>
        {Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            No services listed yet.
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => {
            const catColor = CAT_COLORS[cat] || pal.main;
            return (
              <div key={cat} style={{ marginBottom: 28 }}>
                {/* Category label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: catColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: catColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{cat}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>({items.length})</span>
                </div>

                {/* Service cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(svc => {
                    const on = selected.has(svc.id);
                    return (
                      <button
                        key={svc.id}
                        onClick={() => isClient && toggle(svc.id)}
                        style={{
                          width: '100%', textAlign: 'left', cursor: isClient ? 'pointer' : 'default',
                          background: on ? `${catColor}0D` : 'var(--surface)',
                          border: `1.5px solid ${on ? catColor : 'var(--border)'}`,
                          borderRadius: 12, padding: 0, overflow: 'hidden',
                          display: 'flex', flexDirection: svc.image_url ? 'column' : 'row',
                          alignItems: svc.image_url ? 'stretch' : 'center',
                          gap: svc.image_url ? 0 : 12,
                          transition: 'border-color .15s ease, background .15s ease',
                          boxShadow: on ? `0 0 0 3px ${catColor}14` : 'none',
                        }}
                      >
                        {/* Image banner — shown when image exists */}
                        {svc.image_url && (
                          <div style={{ width: '100%', height: isMobile ? 140 : 160, flexShrink: 0, position: 'relative' }}>
                            <img src={svc.image_url} alt={svc.service_name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            {/* bottom scrim so text below reads cleanly */}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.18) 0%, transparent 60%)' }} />
                          </div>
                        )}

                        {/* Row: checkbox + name/duration + price */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: isMobile ? '12px 14px' : '14px 18px', flex: 1,
                        }}>
                          {/* Checkbox */}
                          {isClient && (
                            <div style={{
                              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                              border: `2px solid ${on ? catColor : 'var(--border)'}`,
                              background: on ? catColor : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all .15s ease',
                            }}>
                              {on && (
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                  <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                          )}

                          {/* Name + duration */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, color: on ? catColor : 'var(--text)', marginBottom: 2, lineHeight: 1.3 }}>
                              {svc.service_name}
                            </div>
                            {svc.description && (
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? 160 : 360 }}>
                                {svc.description}
                              </div>
                            )}
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              ⏱ {formatDuration(svc.effective_duration)}
                            </div>
                          </div>

                          {/* Price */}
                          <div style={{ flexShrink: 0, textAlign: 'right' }}>
                            <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: on ? catColor : 'var(--text)' }}>
                              {svc.is_price_starting_from && <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>From </span>}
                              LKR {Number(svc.effective_price).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Sticky bottom bar — always visible for clients ── */}
      {isClient && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 310,
          background: 'var(--surface)', borderTop: `1.5px solid ${selected.size > 0 ? pal.main + '40' : 'var(--border)'}`,
          padding: isMobile ? '10px 16px' : '12px 24px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 -4px 24px rgba(0,0,0,.12)',
          transition: 'border-color .2s ease',
        }}>
          {/* Subtotal (left) */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {selected.size > 0 ? (
              <>
                <div style={{ fontSize: 10, color: pal.main, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {selected.size} service{selected.size !== 1 ? 's' : ''} selected
                </div>
                <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: 'var(--text)', marginTop: 1, lineHeight: 1 }}>
                  LKR {subtotal.toLocaleString()}
                  {selectedList.some(s => s.is_price_starting_from) && (
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>est.</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Subtotal
                </div>
                <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: 'var(--text-muted)', marginTop: 1 }}>
                  Select services
                </div>
              </>
            )}
          </div>

          {/* Proceed button (right) */}
          <button
            onClick={handleContinue}
            disabled={selected.size === 0}
            style={{
              padding: isMobile ? '11px 22px' : '13px 28px',
              background: selected.size > 0
                ? `linear-gradient(135deg, ${pal.main}, ${pal.light || pal.main})`
                : 'var(--surface2)',
              color: selected.size > 0 ? '#fff' : 'var(--text-muted)',
              border: `1.5px solid ${selected.size > 0 ? 'transparent' : 'var(--border)'}`,
              borderRadius: 12,
              fontSize: isMobile ? 14 : 15, fontWeight: 700,
              cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: selected.size > 0 ? `0 4px 14px ${pal.main}50` : 'none',
              flexShrink: 0,
              transition: 'all .2s ease',
            }}
          >
            Proceed →
          </button>
        </div>
      )}

      {/* ── Back confirmation modal ── */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setShowConfirm(false)}>
          <div style={{
            background: 'var(--surface)', borderRadius: 18, padding: '28px 24px',
            maxWidth: 360, width: '100%', textAlign: 'center',
            boxShadow: '0 24px 60px rgba(0,0,0,.3)', border: '1px solid var(--border)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              Discard selection?
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
              You have {selected.size} service{selected.size !== 1 ? 's' : ''} selected. Going back will clear your selection.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '12px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'none', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Stay
              </button>
              <button onClick={confirmBack} style={{ flex: 1, padding: '12px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  backBtn: {
    width: 34, height: 34, borderRadius: 10, border: '1.5px solid var(--border)',
    background: 'var(--bg)', color: 'var(--text)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
  },
};

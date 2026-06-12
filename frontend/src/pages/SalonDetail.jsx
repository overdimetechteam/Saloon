import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useBreakpoint } from '../hooks/useMobile';
import { SALON_PALETTES } from '../styles/theme';

const FACILITY_MAP = {
  parking:          { label: 'Free Parking',             emoji: '🅿️' },
  street_parking:   { label: 'Street Parking Nearby',    emoji: '🚗' },
  wifi:             { label: 'Free Wi-Fi',               emoji: '📶' },
  coffee:           { label: 'Complimentary Coffee',     emoji: '☕' },
  tea:              { label: 'Complimentary Tea',        emoji: '🍵' },
  drinks:           { label: 'Refreshments Available',   emoji: '🧃' },
  ac:               { label: 'Air Conditioning',         emoji: '❄️' },
  kids_area:        { label: 'Kids Play Area',           emoji: '🧸' },
  wheelchair:       { label: 'Wheelchair Accessible',    emoji: '♿' },
  waiting_lounge:   { label: 'Comfortable Waiting Area', emoji: '🛋️' },
  tv:               { label: 'Entertainment / TV',       emoji: '📺' },
  music:            { label: 'Relaxing Music',           emoji: '🎵' },
  restroom:         { label: 'Clean Restrooms',          emoji: '🚻' },
  prayer_room:      { label: 'Prayer Room',              emoji: '🕌' },
  card_payment:     { label: 'Card Payment Accepted',    emoji: '💳' },
  online_payment:   { label: 'Online Payment Accepted',  emoji: '📱' },
  gift_vouchers:    { label: 'Gift Vouchers Available',  emoji: '🎁' },
  loyalty_program:  { label: 'Loyalty Program',          emoji: '⭐' },
  private_rooms:    { label: 'Private Treatment Rooms',  emoji: '🚪' },
  consultation:     { label: 'Free Consultation',        emoji: '💬' },
  home_visit:       { label: 'Home Visit Available',     emoji: '🏠' },
  instagram_worthy: { label: 'Instagram-Worthy Decor',   emoji: '📸' },
};

const getMockPalette = pal => [
  `linear-gradient(135deg, ${pal.main} 0%, ${pal.light} 100%)`,
  `linear-gradient(135deg, ${pal.main} 0%, #D4AF37 100%)`,
  `linear-gradient(135deg, #D4AF37 0%, #B8932A 100%)`,
  `linear-gradient(135deg, ${pal.darkBg} 0%, ${pal.main} 100%)`,
];

function isOpenNow(operatingHours) {
  if (!operatingHours || !Object.keys(operatingHours).length) return false;
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const today = days[new Date().getDay()];
  const h = operatingHours[today];
  if (!h) return false;
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const [oh, om] = h.open.split(':').map(Number);
  const [ch, cm] = h.close.split(':').map(Number);
  return now >= oh * 60 + om && now < ch * 60 + cm;
}

function Stars({ rating, size = 14 }) {
  return (
    <span style={{ letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= rating ? '#D4AF37' : 'rgba(212,175,55,.25)', fontSize: size }}>★</span>
      ))}
    </span>
  );
}

export default function SalonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { setNavPalette } = useTheme();
  const { isMobile, isTablet } = useBreakpoint();
  const [salon, setSalon]           = useState(null);
  const [services, setServices]     = useState([]);
  const [otherSalons, setOther]     = useState([]);
  const [reviews, setReviews]       = useState([]);
  const [summary, setSummary]       = useState(null);
  const [isFav, setIsFav]           = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [offers, setOffers]         = useState([]);
  const [salonImages, setSalonImages] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [activeServiceCat, setActiveServiceCat] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const servicesRef  = useRef(null);
  const teamRef      = useRef(null);
  const reviewsRef   = useRef(null);
  const infoRef      = useRef(null);
  const svcScrollRef   = useRef(null);
  const teamScrollRef  = useRef(null);
  const photoScrollRef = useRef(null);
  const heroRef        = useRef(null);
  const [heroVisible, setHeroVisible] = useState(true);

  useEffect(() => {
    api.get(`/salons/${id}/`).then(r => setSalon(r.data)).catch(() => {});
    api.get(`/salons/${id}/services/`).then(r => setServices(r.data)).catch(() => {});
    api.get('/salons/').then(r =>
      setOther(r.data.filter(s => s.id !== +id && s.status === 'active').slice(0, 4))
    ).catch(() => {});
    api.get(`/salons/${id}/reviews/`).then(r => setReviews(r.data)).catch(() => {});
    api.get(`/salons/${id}/reviews/summary/`).then(r => setSummary(r.data)).catch(() => {});
    api.get(`/salons/${id}/offers/`).then(r => setOffers(r.data)).catch(() => {});
    api.get(`/salons/${id}/images/`).then(r => setSalonImages(r.data)).catch(() => {});
    api.get(`/salons/${id}/team/`).then(r => setTeamMembers(r.data)).catch(() => {});
    if (profile?.role === 'client') {
      api.get(`/salons/${id}/favourite/`).then(r => setIsFav(r.data.is_favourited)).catch(() => {});
    }
  }, [id, profile]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [salon]);

  const toggleFav = async () => {
    if (!profile || profile.role !== 'client') return;
    setFavLoading(true);
    try {
      const r = await api.post(`/salons/${id}/favourite/`);
      setIsFav(r.data.is_favourited);
    } catch {} finally { setFavLoading(false); }
  };

  const submitReview = async () => {
    if (!reviewRating) return;
    setReviewSubmitting(true);
    setReviewMsg('');
    try {
      await api.post(`/salons/${id}/reviews/`, { rating: reviewRating, comment: reviewText });
      setReviewMsg('Thank you! Your review has been submitted.');
      setReviewRating(0);
      setReviewText('');
      const [rv, sum] = await Promise.all([
        api.get(`/salons/${id}/reviews/`),
        api.get(`/salons/${id}/reviews/summary/`),
      ]);
      setReviews(rv.data);
      setSummary(sum.data);
    } catch (e) {
      setReviewMsg(e.response?.data?.detail || 'Unable to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    if (!salon) return;
    const pal = SALON_PALETTES[salon.color_palette || 'teal'];
    setNavPalette(pal);
    return () => setNavPalette(null);
  }, [salon, setNavPalette]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = e => {
      if (e.key === 'ArrowRight') setLightboxIdx(i => Math.min(i + 1, salonImages.length - 1));
      if (e.key === 'ArrowLeft')  setLightboxIdx(i => Math.max(i - 1, 0));
      if (e.key === 'Escape')     setLightboxIdx(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIdx, salonImages.length]);

  useEffect(() => {
    if (!selectedMember) return;
    const handler = e => { if (e.key === 'Escape') setSelectedMember(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedMember]);

  useEffect(() => {
    if (!salon) return;
    const prevTitle = document.title;
    document.title = `${salon.name} — Luxe Salons`;

    const setMeta = (key, val, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute('content', val);
    };

    const desc = salon.description
      ? salon.description.slice(0, 155)
      : `Book at ${salon.name} — a premium salon in ${salon.address_city}. Hair, nails, skin & more.`;
    const heroImg = salonImages[0]?.image_url || salon.logo_url || '';

    setMeta('description', desc);
    setMeta('keywords', `salon, ${salon.name}, beauty, ${salon.address_city}, hair, nails, skin, spa, booking`);
    setMeta('og:title',       `${salon.name} | Luxe Salons`, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:image',       heroImg, 'property');
    setMeta('og:type',        'business.business', 'property');
    setMeta('twitter:card',        'summary_large_image');
    setMeta('twitter:title',       `${salon.name} | Luxe`);
    setMeta('twitter:description', desc);
    if (heroImg) setMeta('twitter:image', heroImg);

    return () => { document.title = prevTitle; };
  }, [salon, salonImages]);

  if (!salon) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', background: 'var(--bg)' }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', border: '3px solid rgba(13,148,136,.15)', borderTopColor: '#0D9488', animation: 'spinSlow .7s linear infinite' }} />
    </div>
  );

  const pal = SALON_PALETTES[salon.color_palette || 'teal'];
  const R = pal.rgb;
  const s = makeS(pal);
  const catColors = { Hair: pal.main, Nails: '#D4AF37', Skin: pal.dark, Makeup: '#C96B51', Cosmetics: '#C96B51', Other: pal.main };
  const mockPalette = getMockPalette(pal);
  const openNow = salon.status === 'active' && isOpenNow(salon.operating_hours);
  const coverPhoto = salon?.cover_image_url || null;

  const grouped = services.reduce((acc, ss) => {
    const cat = ss.service_category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ss);
    return acc;
  }, {});

  const fullAddress = `${salon.address_street}, ${salon.address_city} ${salon.address_postal}`;
  const isClient = profile?.role === 'client';
  const showBookBtn = profile?.role !== 'salon_owner';

  const cats = Object.keys(grouped);
  const activeCat = activeServiceCat && cats.includes(activeServiceCat) ? activeServiceCat : cats[0];
  const activeCatColor = catColors[activeCat] || pal.main;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── MOBILE HERO (iOS-style, full-screen) ── */}
      {isMobile ? (
        <div ref={heroRef} style={{ position: 'relative', minHeight: '100svh', overflow: 'hidden', background: '#0D0D16', display: 'flex', flexDirection: 'column' }}>
          {/* Cover photo + fade overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: coverPhoto
              ? `url(${coverPhoto}) center/cover no-repeat`
              : `linear-gradient(145deg, #0D0D16 0%, ${pal.darkBg} 40%, ${pal.dark} 75%, ${pal.main} 100%)`,
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(13,13,22,.18) 0%, rgba(13,13,22,.22) 32%, rgba(13,13,22,.88) 52%, #0D0D16 72%)',
            }} />
          </div>

          {/* Centered content */}
          <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 28px 32px', gap: 10 }}>

            {/* Logo */}
            <div style={{
              width: 92, height: 92, borderRadius: 26, overflow: 'hidden', flexShrink: 0,
              background: `rgba(${R},.22)`, backdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(255,255,255,.22)',
              boxShadow: '0 16px 48px rgba(0,0,0,.55), 0 2px 8px rgba(0,0,0,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6,
            }}>
              {salon.logo_url
                ? <img src={salon.logo_url} alt={salon.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 42, fontWeight: 700, color: '#fff' }}>{salon.name[0]}</span>
              }
            </div>

            {/* Name */}
            <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 30, fontWeight: 700, color: '#fff', textAlign: 'center', margin: 0, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              {salon.name}
            </h1>

            {/* Open Now — fade starts here */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
              background: openNow ? `rgba(${R},.2)` : 'rgba(107,114,128,.15)',
              color: openNow ? pal.light : 'rgba(255,255,255,.5)',
              border: `1px solid ${openNow ? `rgba(${R},.45)` : 'rgba(107,114,128,.3)'}`,
              borderRadius: 20, padding: '6px 14px',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: openNow ? pal.light : '#6B7280', display: 'inline-block', flexShrink: 0 }} />
              {openNow ? 'Open Now' : 'Closed'}
            </span>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Stars rating={summary ? Math.round(summary.average_rating) : 5} size={14} />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#D4AF37', fontFamily: "'DM Sans',sans-serif" }}>
                {summary ? summary.average_rating.toFixed(1) : '—'}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
                ({summary ? summary.total_reviews : 0} review{summary?.total_reviews !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Info rows */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 11, marginTop: 10, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.07)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 15, lineHeight: 1.5, flexShrink: 0 }}>📍</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.72)', lineHeight: 1.5 }}>{fullAddress}</span>
                  <a href={`https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`} target="_blank" rel="noreferrer"
                    style={{ display: 'block', fontSize: 11, color: pal.light, fontWeight: 600, marginTop: 3, textDecoration: 'none' }}>
                    See on Maps ↗
                  </a>
                </div>
              </div>
              {salon.contact_number && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>📞</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.72)' }}>{salon.contact_number}</span>
                </div>
              )}
              {salon.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>✉</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.72)' }}>{salon.email}</span>
                </div>
              )}
            </div>

            {/* CTA buttons */}
            <div style={{ width: '100%', display: 'flex', gap: 12, marginTop: 14 }}>
              {isClient && (
                <button onClick={toggleFav} disabled={favLoading} style={{
                  width: 54, height: 54, borderRadius: 16, border: 'none', flexShrink: 0, cursor: 'pointer',
                  background: isFav ? `rgba(${R},.28)` : 'rgba(255,255,255,.1)',
                  color: isFav ? pal.light : 'rgba(255,255,255,.65)', fontSize: 22,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isFav ? `0 4px 16px rgba(${R},.4)` : 'none',
                  transition: 'all .2s ease',
                }}>
                  {isFav ? '♥' : '♡'}
                </button>
              )}
              {showBookBtn && (
                <Link to={`/user/book/${id}`} style={{
                  flex: 1, padding: '16px 20px',
                  background: `linear-gradient(135deg, ${pal.main} 0%, ${pal.light} 100%)`,
                  color: '#fff', borderRadius: 16, fontWeight: 700, fontSize: 16,
                  textDecoration: 'none', textAlign: 'center',
                  boxShadow: `0 8px 28px rgba(${R},.5)`,
                  fontFamily: "'DM Sans',sans-serif", letterSpacing: '0.01em',
                }}>✦ Book Now</Link>
              )}
              {!showBookBtn && salon.cosmetics_enabled && (
                <Link to={`/salons/${id}/cosmetics`} style={{
                  flex: 1, padding: '16px 20px',
                  background: 'linear-gradient(135deg,#C96B51,#D4AF37)',
                  color: '#fff', borderRadius: 16, fontWeight: 700, fontSize: 16,
                  textDecoration: 'none', textAlign: 'center',
                }}>✿ Cosmetics</Link>
              )}
            </div>
            {showBookBtn && salon.cosmetics_enabled && (
              <Link to={`/salons/${id}/cosmetics`} style={{
                width: '100%', padding: '13px 20px',
                background: 'rgba(201,107,81,.1)', color: '#D4AF37',
                border: '1px solid rgba(201,107,81,.25)', borderRadius: 16,
                fontWeight: 700, fontSize: 14, textDecoration: 'none', textAlign: 'center',
                fontFamily: "'DM Sans',sans-serif",
              }}>✿ Shop Cosmetics</Link>
            )}
          </div>
        </div>

      ) : (
        /* ── DESKTOP HERO ── */
        <div ref={heroRef} style={{
          ...s.hero, padding: '52px 48px 44px',
          background: coverPhoto
            ? `linear-gradient(160deg,rgba(13,13,22,.78) 0%,rgba(13,13,22,.58) 35%,rgba(11,56,50,.38) 68%,rgba(${R},.15) 100%),url(${coverPhoto}) center/cover no-repeat`
            : `linear-gradient(145deg,#0D0D16 0%,${pal.darkBg} 40%,${pal.dark} 75%,${pal.main} 100%)`,
        }}>
          <div style={s.heroBg} />
          <div style={{ ...s.heroInner, flexDirection: 'row', gap: 24 }}>
            <div style={{ ...s.heroLeft, gap: 22 }}>
              <div style={{ ...s.salonInitial, width: 72, height: 72, fontSize: 34, padding: 0, overflow: 'hidden' }}>
                {salon.logo_url
                  ? <img src={salon.logo_url} alt={salon.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : salon.name[0]
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={s.eyebrow}>Featured Salon</div>
                <h1 style={{ ...s.salonName, fontSize: 42 }}>{salon.name}</h1>
                <div style={s.ratingRow}>
                  <Stars rating={summary ? Math.round(summary.average_rating) : 5} size={16} />
                  <span style={{ ...s.ratingNum, fontSize: 16 }}>{summary ? summary.average_rating.toFixed(1) : '—'}</span>
                  <span style={{ ...s.ratingCt, fontSize: 13 }}>({summary ? summary.total_reviews : 0} review{summary?.total_reviews !== 1 ? 's' : ''})</span>
                  <span style={s.dot}>·</span>
                  <span style={{ ...s.openBadge, background: openNow ? `rgba(${R},.15)` : 'rgba(107,114,128,.1)', color: openNow ? '#F0FFFE' : 'rgba(255,255,255,.6)' }}>
                    <span style={{ color: openNow ? pal.light : '#9CA3AF', marginRight: 4 }}>●</span>
                    {openNow ? 'Open Now' : 'Closed'}
                  </span>
                </div>
                <div style={{ ...s.addrRow, alignItems: 'center', gap: 12 }}>
                  <span style={{ ...s.addrText, fontSize: 14 }}>📍 {fullAddress}</span>
                  <a href={`https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`} target="_blank" rel="noreferrer"
                    style={{ ...s.locationBtn, color: pal.textLight, background: `rgba(${R},.22)`, border: `1px solid rgba(${R},.35)`, fontSize: 12 }}>
                    See Location ↗
                  </a>
                </div>
                <div style={s.contactRow}>
                  {salon.contact_number && salon.contact_number.length <= 25 && <span style={{ ...s.contactTag, fontSize: 12 }}>📞 {salon.contact_number}</span>}
                  {salon.email && <span style={{ ...s.contactTag, fontSize: 12 }}>✉ {salon.email}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
              {isClient && (
                <button onClick={toggleFav} disabled={favLoading}
                  style={{ width: 48, height: 48, borderRadius: 14, border: 'none', flexShrink: 0, background: isFav ? `rgba(${R},.25)` : 'rgba(255,255,255,.12)', color: isFav ? pal.textLight : 'rgba(255,255,255,.7)', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease', boxShadow: isFav ? `0 4px 14px rgba(${R},.35)` : 'none' }}>
                  {isFav ? '♥' : '♡'}
                </button>
              )}
              {showBookBtn && (
                <Link to={`/user/book/${id}`} style={{ ...s.heroBookBtn, background: pal.main, boxShadow: `0 6px 20px rgba(${R},.45)`, padding: '14px 32px', fontSize: 16 }} className="lift-sm">
                  ✦ Book Now
                </Link>
              )}
              {salon.cosmetics_enabled && (
                <Link to={`/salons/${id}/cosmetics`} style={{ ...s.heroCosmeticsBtn, padding: '14px 26px', fontSize: 15 }} className="lift-sm">
                  ✿ Cosmetics
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB BAR — sticky top on desktop, fixed bottom (slides up) on mobile */}
      <div style={{
        ...(isMobile ? {
          position: 'fixed', bottom: 0, left: 0, right: 0,
          opacity: heroVisible ? 0 : 1,
          transform: heroVisible ? 'translateY(100%)' : 'translateY(0)',
          transition: 'opacity .3s cubic-bezier(.16,1,.3,1), transform .3s cubic-bezier(.16,1,.3,1)',
          paddingBottom: isClient ? 64 : 0,
        } : {
          position: 'sticky', top: 64,
        }),
        background: 'var(--surface)',
        borderTop: isMobile ? '1px solid var(--border)' : 'none',
        borderBottom: !isMobile ? '1px solid var(--border)' : 'none',
        boxShadow: isMobile ? '0 -4px 24px rgba(0,0,0,.18)' : '0 2px 12px rgba(0,0,0,.08)',
        zIndex: 100,
      }}>
        <div style={s.tabBarInner}>
          <div style={s.tabBtns}>
            {[
              { label: 'Services', ref: servicesRef },
              { label: 'Team',     ref: teamRef     },
              { label: 'Reviews',  ref: reviewsRef  },
              { label: 'Info',     ref: infoRef     },
            ].map(tab => (
              <button key={tab.label} style={s.tabBtn}
                onClick={() => tab.ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                {tab.label}
              </button>
            ))}
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 8 }}>
              {showBookBtn && (
                <Link to={`/user/book/${id}`} style={{ ...s.tabBookBtn, background: pal.main, boxShadow: `0 4px 14px rgba(${R},.3)`, opacity: heroVisible ? 0 : 1, transform: heroVisible ? 'translateY(-6px) scale(0.92)' : 'translateY(0) scale(1)', pointerEvents: heroVisible ? 'none' : 'auto', transition: 'opacity .25s ease, transform .25s ease' }}>✦ Book Now</Link>
              )}
              {salon.cosmetics_enabled && (
                <Link to={`/salons/${id}/cosmetics`} style={{ ...s.tabCosmeticsBtn, opacity: heroVisible ? 0 : 1, transform: heroVisible ? 'translateY(-6px) scale(0.92)' : 'translateY(0) scale(1)', pointerEvents: heroVisible ? 'none' : 'auto', transition: 'opacity .25s ease, transform .25s ease' }}>✿ Cosmetics</Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PHOTOS */}
      <div style={s.photoStrip}>
        <div style={{ position: 'relative', padding: '0 48px' }}>
          {!isMobile && (
            <button style={{ ...s.carouselArrow, left: 4, boxShadow: '0 4px 18px rgba(0,0,0,.14)' }}
              onClick={() => photoScrollRef.current?.scrollBy({ left: -(isMobile ? 214 : 354), behavior: 'smooth' })}>‹</button>
          )}
          <div ref={photoScrollRef} style={{ ...s.photoScroll, maxWidth: 'none', margin: 0, padding: '0 0 4px' }}>
            {salonImages.length > 0
              ? salonImages.map((img, i) => (
                  <div key={img.id} style={{ ...s.photoCard, width: isMobile ? 200 : 340, height: isMobile ? 140 : 240, cursor: 'pointer' }} className="lift-sm fade-up"
                    onClick={() => setLightboxIdx(i)}>
                    <img src={img.image_url} alt={img.caption || `Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', display: 'block' }} />
                    {img.caption && <div style={s.photoLabel}>{img.caption}</div>}
                    <div style={s.photoClickHint}>⊕</div>
                  </div>
                ))
              : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 8px', color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                  <span style={{ fontSize: 22, opacity: 0.35 }}>🖼</span>
                  No gallery photos uploaded yet.
                </div>
              )
            }
          </div>
          {!isMobile && (
            <button style={{ ...s.carouselArrow, right: 4, boxShadow: '0 4px 18px rgba(0,0,0,.14)' }}
              onClick={() => photoScrollRef.current?.scrollBy({ left: isMobile ? 214 : 354, behavior: 'smooth' })}>›</button>
          )}
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightboxIdx !== null && salonImages.length > 0 && createPortal(
        <div style={lb.overlay} onClick={() => setLightboxIdx(null)}>
          <button style={lb.closeBtn} onClick={() => setLightboxIdx(null)}>✕</button>

          {lightboxIdx > 0 && (
            <button style={{ ...lb.navBtn, left: 16 }}
              onClick={e => { e.stopPropagation(); setLightboxIdx(i => i - 1); }}>
              ‹
            </button>
          )}
          {lightboxIdx < salonImages.length - 1 && (
            <button style={{ ...lb.navBtn, right: 16 }}
              onClick={e => { e.stopPropagation(); setLightboxIdx(i => i + 1); }}>
              ›
            </button>
          )}

          <div style={lb.imgWrap} onClick={e => e.stopPropagation()}>
            <img
              src={salonImages[lightboxIdx].image_url}
              alt={salonImages[lightboxIdx].caption || `Photo ${lightboxIdx + 1}`}
              style={lb.img}
            />
            {salonImages[lightboxIdx].caption && (
              <div style={lb.caption}>{salonImages[lightboxIdx].caption}</div>
            )}
          </div>

          <div style={lb.counter}>{lightboxIdx + 1} / {salonImages.length}</div>

          {/* Thumbnail strip */}
          {salonImages.length > 1 && (
            <div style={lb.thumbStrip} onClick={e => e.stopPropagation()}>
              {salonImages.map((img, i) => (
                <div key={img.id}
                  style={{ ...lb.thumb, ...(i === lightboxIdx ? lb.thumbActive : {}) }}
                  onClick={() => setLightboxIdx(i)}>
                  <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}

      {/* EMPLOYEE MODAL */}
      {selectedMember && createPortal(
        <div style={lb.overlay} onClick={() => setSelectedMember(null)}>
          <div style={tm.modal} onClick={e => e.stopPropagation()}>
            <button style={tm.closeBtn} onClick={() => setSelectedMember(null)}>✕</button>
            <div style={{
              ...tm.avatar,
              background: selectedMember._bg || `rgba(${R},.15)`,
              color: selectedMember._color || pal.main,
              boxShadow: `0 8px 28px ${selectedMember._color || pal.main}44`,
              overflow: 'hidden', padding: 0,
            }}>
              {selectedMember.photo_url
                ? <img src={selectedMember.photo_url} alt={selectedMember.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 38, fontWeight: 700 }}>
                    {selectedMember.full_name.split(' ').map(w => w[0]).join('')}
                  </span>
              }
            </div>
            <h3 style={tm.name}>{selectedMember.full_name}</h3>
            <div style={{ ...tm.role, color: selectedMember._color || pal.main }}>{selectedMember.role}</div>
            {selectedMember.bio
              ? <p style={tm.bio}>{selectedMember.bio}</p>
              : <p style={{ ...tm.bio, color: 'var(--text-muted)', fontStyle: 'italic' }}>No description provided.</p>
            }
          </div>
        </div>,
        document.body
      )}

      {/* BODY */}
      <div style={{ ...s.body, padding: isMobile ? `20px 16px ${isClient ? 148 : 96}px` : isTablet ? '28px 20px' : '44px 48px' }}>

        {/* Services */}
        <section ref={servicesRef} style={s.sec} className="fade-up">
          <div style={{ marginBottom: 24 }}>
            <div style={s.eyebrowSm}>What We Offer</div>
            <h2 style={s.secTitle}>Available Services</h2>
          </div>

          {cats.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '24px 0' }}>No services listed yet.</p>
          ) : (
            <>
              <div style={s.catTabs}>
                {cats.map(cat => {
                  const isActive = cat === activeCat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveServiceCat(cat)}
                      style={{
                        ...s.catTab,
                        background: isActive ? (catColors[cat] || pal.main) : 'transparent',
                        color: isActive ? '#fff' : (catColors[cat] || pal.main),
                        border: `1px solid ${(catColors[cat] || pal.main)}40`,
                        boxShadow: isActive ? `0 3px 10px ${(catColors[cat] || pal.main)}40` : 'none',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              <div style={s.carouselWrap}>
                {!isMobile && (
                  <button style={{ ...s.carouselArrow, left: -20 }}
                    onClick={() => svcScrollRef.current?.scrollBy({ left: -290, behavior: 'smooth' })}>‹</button>
                )}
                <div ref={svcScrollRef} style={s.svcScroll}>
                  {(grouped[activeCat] || []).map(ss => {
                    const inner = (
                      <div style={{ ...s.svcCard, width: isMobile ? 230 : 268, flexShrink: 0, cursor: isClient ? 'pointer' : 'default' }}>
                        <div style={s.svcName}>{ss.service_name}</div>
                        {ss.description ? (
                          <div style={s.svcDesc}>{ss.description}</div>
                        ) : null}
                        <div style={s.svcMeta}>
                          <span style={s.svcDur}>⏱ {ss.effective_duration} min</span>
                          <span style={{ ...s.svcPrice, background: `${activeCatColor}18`, color: activeCatColor, border: `1px solid ${activeCatColor}38`, padding: '3px 10px', borderRadius: 8 }}>
                            {ss.is_price_starting_from && <span style={s.svcStarting}>Starting From </span>}
                            LKR {ss.effective_price}
                          </span>
                        </div>
                        {isClient && <div style={{ ...s.svcBookHint, color: pal.main }}>Tap to book →</div>}
                      </div>
                    );
                    return isClient ? (
                      <Link key={ss.id} to={`/user/book/${id}?services=${ss.id}`} style={{ textDecoration: 'none', display: 'block', flexShrink: 0 }} className="lift-sm">
                        {inner}
                      </Link>
                    ) : (
                      <div key={ss.id} style={{ flexShrink: 0 }} className="lift-sm">{inner}</div>
                    );
                  })}
                </div>
                {!isMobile && (
                  <button style={{ ...s.carouselArrow, right: -20 }}
                    onClick={() => svcScrollRef.current?.scrollBy({ left: 290, behavior: 'smooth' })}>›</button>
                )}
              </div>
            </>
          )}
        </section>

        {/* Ongoing Offers */}
        {offers.length > 0 && (
          <section style={s.sec} className="fade-up d1">
            <div style={s.eyebrowSm}>Limited Time</div>
            <h2 style={s.secTitle}>Ongoing Offers</h2>
            <div style={s.offersGrid}>
              {offers.map((o, i) => {
                const oc = [pal.main, '#D4AF37', pal.dark, '#D4AF37'][i % 4];
                const daysLeft = Math.ceil((new Date(o.end_date) - new Date()) / 86400000);
                return (
                  <div key={o.id} style={{ ...s.offerCard, borderLeft: `4px solid ${oc}` }}>
                    <div style={{ ...s.offerDiscount, color: oc }}>
                      {o.discount_value}{o.discount_type === 'percentage' ? '%' : ' LKR'} off
                    </div>
                    <div style={s.offerCardTitle}>{o.title}</div>
                    {o.description && <p style={s.offerDesc}>{o.description}</p>}
                    {o.note && <div style={s.offerNote}>💬 {o.note}</div>}
                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 8, color: daysLeft <= 3 ? '#DC2626' : 'var(--text-muted)' }}>
                      Valid until {o.end_date}{daysLeft > 0 ? ` (${daysLeft}d left)` : ' — expires today'}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* About Us — full width */}
        <section ref={infoRef} style={s.sec} className="fade-up d1">
          <div style={s.eyebrowSm}>Our Story</div>
          <h2 style={s.secTitle}>About {salon.name}</h2>
          <div style={s.aboutCard}>
            <p style={s.aboutText}>
              {salon.description ||
                `Welcome to ${salon.name}, where beauty meets excellence. Nestled in the heart of ${salon.address_city}, we are dedicated to providing an unparalleled salon experience that combines artistry, expertise, and personalised care.`}
            </p>
            <p style={s.aboutText}>
              Our team of highly trained professionals is passionate about helping you look and feel your absolute best. Whether you're in for a fresh cut, a luxurious treatment, or a complete transformation, we promise results that exceed your expectations.
            </p>
            <div style={{ ...s.aboutStats, gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
              {[
                { val: summary ? `${summary.total_reviews}` : '0',   label: 'Client Reviews',  color: pal.main  },
                { val: salon.created_at ? `${Math.max(1, new Date().getFullYear() - new Date(salon.created_at).getFullYear())}+` : '—', label: 'Years in Business', color: '#D4AF37' },
                { val: teamMembers.length > 0 ? `${teamMembers.length}` : '—', label: 'Team Members',   color: pal.main  },
                { val: summary && summary.total_reviews > 0 ? summary.average_rating.toFixed(1) : '—', label: 'Average Rating', color: '#D4AF37' },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center', padding: '14px 8px', background: `${stat.color}0D`, borderRadius: 14, border: `1px solid ${stat.color}28` }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Opening Hours | Facilities — side by side below About */}
          <div style={{ display: 'flex', gap: 20, marginTop: 20, flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start' }}>

            {/* Opening Hours */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...s.eyebrowSm, marginBottom: 10 }}>When We're Open</div>
              <div style={{ ...s.hoursCard, padding: '14px 18px' }}>
                {Object.keys(salon.operating_hours || {}).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Hours not specified</p>
                ) : (
                  Object.entries(salon.operating_hours).map(([day, hours]) => (
                    <div key={day} style={{ ...s.hourRow, padding: '7px 0' }}>
                      <span style={s.dayLabel}>{day.slice(0, 3).toUpperCase()}</span>
                      <span style={{ ...s.hoursVal, fontSize: 12 }}>{hours.open} – {hours.close}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Facilities */}
            {Array.isArray(salon.facilities) && salon.facilities.length > 0 && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...s.eyebrowSm, marginBottom: 10 }}>Facilities &amp; Amenities</div>
                <div style={{ ...s.hoursCard, padding: '14px 18px' }}>
                  {salon.facilities.map(key => {
                    const f = FACILITY_MAP[key];
                    if (!f) return null;
                    return (
                      <div key={key} style={{ ...s.hourRow, padding: '7px 0', gap: 10 }}>
                        <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{f.emoji}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{f.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* Team */}
        <section ref={teamRef} style={s.sec} className="fade-up d2">
          <div style={s.eyebrowSm}>Meet the Experts</div>
          <h2 style={s.secTitle}>Our Team</h2>
          <div style={s.carouselWrap}>
            {!isMobile && (
              <button style={{ ...s.carouselArrow, left: -20 }}
                onClick={() => teamScrollRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}>‹</button>
            )}
            {teamMembers.length > 0 ? (
              <div ref={teamScrollRef} style={s.teamScroll}>
                {teamMembers.map(m => (
                  <div key={m.id} style={{ ...s.teamCard, borderTop: `3px solid ${pal.main}`, cursor: 'pointer' }} className="lift-sm"
                    onClick={() => setSelectedMember(m)}>
                    <div style={{ ...s.teamAvatar, background: `rgba(${R},.12)`, color: pal.main, boxShadow: `0 4px 14px ${pal.main}28`, overflow: 'hidden', padding: 0 }}>
                      {m.photo_url
                        ? <img src={m.photo_url} alt={m.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : <span style={{ fontSize: 24, fontWeight: 700 }}>{m.full_name.split(' ').map(w => w[0]).join('')}</span>
                      }
                    </div>
                    <div style={s.teamName}>{m.full_name}</div>
                    <div style={{ ...s.teamRole, color: pal.main, textTransform: 'capitalize' }}>{m.role}</div>
                    {m.bio && <div style={s.teamSpec}>{m.bio}</div>}
                    <div style={{ fontSize: 11, color: pal.main, marginTop: 'auto', paddingTop: 10, fontWeight: 600 }}>View Profile →</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '32px 0', color: 'var(--text-muted)', fontSize: 14, fontStyle: 'italic' }}>
                No team profiles added yet.
              </div>
            )}
            {!isMobile && (
              <button style={{ ...s.carouselArrow, right: -20 }}
                onClick={() => teamScrollRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}>›</button>
            )}
          </div>
        </section>

        {/* Reviews */}
        <section ref={reviewsRef} style={s.sec} className="fade-up d2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={s.eyebrowSm}>What Clients Say</div>
              <h2 style={{ ...s.secTitle, margin: 0 }}>Reviews</h2>
            </div>
            {summary && summary.total_reviews > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 52, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{summary.average_rating.toFixed(1)}</div>
                <div>
                  <Stars rating={Math.round(summary.average_rating)} size={16} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Based on {summary.total_reviews} review{summary.total_reviews !== 1 ? 's' : ''}</div>
                </div>
              </div>
            )}
          </div>
          {reviews.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0', fontStyle: 'italic' }}>
              No reviews yet. Be the first to review after your visit!
            </div>
          ) : (
            <div style={{ ...s.reviewGrid, gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(auto-fill,minmax(290px,1fr))' }}>
              {(showAllReviews ? reviews : reviews.slice(0, 5)).map((r, i) => (
                <div key={r.id} style={s.reviewCard} className={`lift-sm fade-up d${i + 1}`}>
                  <div style={s.reviewTop}>
                    <div style={{ ...s.reviewAvatar, background: pal.main }}>{(r.client_name || 'A')[0].toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={s.reviewName}>{r.client_name || 'Anonymous'}</div>
                      <div style={s.reviewDate}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                    </div>
                    <Stars rating={r.rating} size={13} />
                  </div>
                  {r.comment && <p style={s.reviewText}>"{r.comment}"</p>}
                </div>
              ))}
            </div>
          )}

          {reviews.length > 5 && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                style={{ padding: '9px 22px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}
                onClick={() => setShowAllReviews(v => !v)}
              >
                {showAllReviews ? 'Show less' : `Show all ${reviews.length} reviews`}
              </button>
            </div>
          )}

          {isClient && (
            <div style={s.reviewForm}>
              <div style={s.reviewFormTitle}>Leave a Review</div>
              <div style={s.reviewFormStars}>
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    style={{ ...s.reviewStarBtn, color: i <= reviewRating ? '#D4AF37' : 'rgba(212,175,55,.25)', transform: i <= reviewRating ? 'scale(1.15)' : 'scale(1)' }}
                    onClick={() => setReviewRating(i)}
                  >★</button>
                ))}
                {reviewRating > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 6 }}>
                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][reviewRating]}
                  </span>
                )}
              </div>
              {reviewRating > 0 && (
                <textarea
                  style={s.reviewTextarea}
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Share your experience…"
                  rows={3}
                />
              )}
              {reviewMsg && (
                <div style={{ ...s.reviewMsg, color: reviewMsg.startsWith('Thank') ? pal.main : '#DC2626' }}>
                  {reviewMsg}
                </div>
              )}
              <button
                style={{ ...s.reviewSubmitBtn, background: pal.main, boxShadow: `0 4px 14px rgba(${R},.3)`, opacity: !reviewRating || reviewSubmitting ? 0.5 : 1 }}
                onClick={submitReview}
                disabled={!reviewRating || reviewSubmitting}
              >
                {reviewSubmitting ? 'Submitting…' : '★ Submit Review'}
              </button>
            </div>
          )}
        </section>


        {/* Other Salons */}
        {otherSalons.length > 0 && (
          <section style={s.sec} className="fade-up d3">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
              <div>
                <div style={s.eyebrowSm}>Discover More</div>
                <h2 style={{ ...s.secTitle, margin: 0 }}>Other Salons</h2>
              </div>
              <Link to="/salons" style={{ ...s.seeAllBtn, color: pal.main, background: `rgba(${R},.1)`, border: `1px solid rgba(${R},.2)` }}>Browse All →</Link>
            </div>
            <div style={s.otherScroll}>
              {otherSalons.map((os, i) => (
                <Link key={os.id} to={`/salons/${os.id}`} style={s.otherCard} className="lift-sm">
                  <div style={{ ...s.otherAvatar, background: mockPalette[i % mockPalette.length], overflow: 'hidden', padding: 0 }}>
                    {os.logo_url
                      ? <img src={os.logo_url} alt={os.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, color: '#fff' }}>{os.name[0]}</span>
                    }
                  </div>
                  <div style={s.otherName}>{os.name}</div>
                  <div style={s.otherCity}>{os.address_city}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: os.status === 'active' ? pal.light : '#D4AF37', display: 'inline-block' }} />
                    {os.status === 'active' ? 'Open' : 'Closed'}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        {isClient && (
          <div style={{ ...s.cta, background: `linear-gradient(135deg, #0D0D16 0%, ${pal.darkBg} 50%, ${pal.main} 100%)`, boxShadow: `0 10px 40px rgba(${R},.35)` }} className="fade-up d5">
            <div style={s.ctaGlow} />
            <h3 style={s.ctaTitle}>Ready for your next experience?</h3>
            <p style={{ color: 'rgba(255,255,255,.7)', marginBottom: 28, fontSize: 15, position: 'relative', zIndex: 1 }}>
              Book your appointment at {salon.name} today.
            </p>
            <Link to={`/user/book/${id}`} style={{ ...s.ctaBtn, background: pal.main, boxShadow: `0 6px 20px rgba(${R},.45)` }} className="lift-sm">
              ✦ Book Appointment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function makeS(pal) {
  const C = pal.main, R = pal.rgb, Cdark = pal.dark, Clight = pal.light, TL = pal.textLight;
  return {
  hero: {
    background: `linear-gradient(145deg, #0D0D16 0%, ${pal.darkBg} 40%, ${Cdark} 75%, ${C} 100%)`,
    padding: '52px 48px 44px', position: 'relative', overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at top right, rgba(212,175,55,.2) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  heroInner: {
    maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1,
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    flexWrap: 'wrap', gap: 24,
  },
  heroLeft: { display: 'flex', gap: 22, alignItems: 'flex-start', flex: 1 },
  salonInitial: {
    width: 72, height: 72, borderRadius: 20, flexShrink: 0,
    background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,.25)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 34, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,.2)',
  },
  eyebrow: { fontSize: 10, color: TL, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 },
  salonName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 42, fontWeight: 700, color: '#fff', margin: '0 0 12px', lineHeight: 1.1, letterSpacing: '-0.01em',
  },
  ratingRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  ratingNum: { fontSize: 16, fontWeight: 800, color: '#D4AF37', fontFamily: "'DM Sans', sans-serif" },
  ratingCt:  { fontSize: 13, color: 'rgba(255,255,255,.6)' },
  dot:       { color: 'rgba(255,255,255,.3)', fontSize: 18 },
  openBadge: { fontSize: 12, color: '#F0FFFE', background: `rgba(${R},.15)`, borderRadius: 20, padding: '3px 10px', fontWeight: 600 },
  addrRow:   { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  addrText:  { fontSize: 14, color: 'rgba(255,255,255,.75)' },
  locationBtn: {
    fontSize: 12, fontWeight: 600, color: TL,
    background: `rgba(${R},.22)`, borderRadius: 8, padding: '5px 12px',
    border: `1px solid rgba(${R},.35)`, flexShrink: 0,
  },
  contactRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  contactTag: { fontSize: 12, color: 'rgba(255,255,255,.65)', background: 'rgba(255,255,255,.08)', borderRadius: 8, padding: '4px 10px' },
  heroBookBtn: {
    padding: '14px 32px', flexShrink: 0,
    background: C,
    color: '#fff', borderRadius: 14, fontWeight: 700, fontSize: 16,
    textDecoration: 'none', boxShadow: `0 6px 20px rgba(${R},.45)`,
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontFamily: "'DM Sans', sans-serif",
  },
  heroCosmeticsBtn: {
    padding: '14px 26px', flexShrink: 0,
    background: 'linear-gradient(135deg, #C96B51 0%, #D4AF37 100%)',
    color: '#fff', borderRadius: 14, fontWeight: 700, fontSize: 15,
    textDecoration: 'none', boxShadow: '0 6px 20px rgba(201,107,81,.38)',
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontFamily: "'DM Sans', sans-serif",
    border: 'none', cursor: 'pointer',
  },

  tabBar: {
    position: 'sticky', top: 64, zIndex: 100,
    background: 'var(--surface)', borderBottom: '1px solid var(--border)',
    boxShadow: '0 2px 12px rgba(0,0,0,.08)',
  },
  tabBarInner: {
    maxWidth: 1100, margin: '0 auto', padding: '0 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  },
  tabBtns: { display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 1, minWidth: 0 },
  tabBtn: {
    padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
    transition: 'color .15s ease', fontFamily: "'DM Sans', sans-serif",
    whiteSpace: 'nowrap',
  },
  tabBookBtn: {
    padding: '8px 18px',
    background: C,
    color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 13,
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
    boxShadow: `0 4px 14px rgba(${R},.3)`,
    fontFamily: "'DM Sans', sans-serif",
  },
  tabCosmeticsBtn: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #C96B51 0%, #D4AF37 100%)',
    color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 13,
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
    boxShadow: '0 4px 14px rgba(201,107,81,.28)',
    fontFamily: "'DM Sans', sans-serif",
  },

  photoStrip: { background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '20px 0' },
  photoScroll: {
    display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4,
    maxWidth: 1100, margin: '0 auto', padding: '0 16px 4px',
    scrollbarWidth: 'none',
  },
  photoCard: {
    width: 210, height: 145, borderRadius: 16, flexShrink: 0,
    position: 'relative', overflow: 'hidden', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,0,.12)',
  },
  photoLabel: {
    position: 'absolute', bottom: 10, left: 12,
    fontSize: 11, fontWeight: 600, color: '#fff',
    background: 'rgba(0,0,0,.38)', borderRadius: 6, padding: '3px 8px',
    backdropFilter: 'blur(4px)',
  },
  photoClickHint: {
    position: 'absolute', top: 8, right: 10,
    fontSize: 16, color: 'rgba(255,255,255,.7)', pointerEvents: 'none',
  },

  body: { maxWidth: 1100, margin: '0 auto', padding: '44px 48px' },

  sec: { marginBottom: 60 },
  secHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  eyebrowSm: { fontSize: 10, fontWeight: 700, color: TL, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  secTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 'clamp(20px, 3.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: 24, letterSpacing: '-0.01em',
  },
  catBadge: { display: 'inline-flex', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 14 },
  catTabs: {
    display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none',
    marginBottom: 20, paddingBottom: 2,
  },
  catTab: {
    padding: '7px 18px', borderRadius: 20, cursor: 'pointer',
    fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
    transition: 'all .2s ease', fontFamily: "'DM Sans', sans-serif",
    flexShrink: 0,
  },
  svcGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 },
  carouselWrap: { position: 'relative' },
  carouselArrow: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    zIndex: 10, width: 38, height: 38, borderRadius: '50%',
    background: 'var(--surface)', border: '1.5px solid var(--border)',
    boxShadow: '0 4px 16px rgba(0,0,0,.1)',
    color: 'var(--text)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, lineHeight: 1, fontWeight: 300,
    transition: 'box-shadow .18s ease, border-color .18s ease',
  },
  svcScroll: {
    display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 14, paddingTop: 4,
    scrollbarWidth: 'none', msOverflowStyle: 'none',
  },
  svcCard: {
    background: 'var(--surface)', borderRadius: 14, padding: '18px 18px 14px',
    border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
    display: 'flex', flexDirection: 'column', gap: 8, height: '100%',
  },
  svcName:    { fontWeight: 700, fontSize: 14, color: 'var(--text)' },
  svcMeta:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  svcDur:     { fontSize: 12, color: 'var(--text-muted)' },
  svcPrice:   { fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif" },
  svcDesc:    { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: '4px 0 6px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  svcStarting: { fontSize: 10, fontWeight: 700, opacity: 0.8, letterSpacing: '0.04em' },
  svcBookHint: { fontSize: 11, fontWeight: 600, color: C, marginTop: 8, letterSpacing: '0.02em' },

  teamGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  teamScroll: {
    display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 14, paddingTop: 4,
    scrollbarWidth: 'none', msOverflowStyle: 'none',
  },
  teamCard: {
    background: 'var(--surface)', borderRadius: 16, padding: '26px 20px 22px',
    border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    minWidth: 185, maxWidth: 220, flexShrink: 0,
  },
  teamAvatar: {
    width: 58, height: 58, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20, fontWeight: 700, marginBottom: 12,
  },
  teamName: { fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 3 },
  teamRole: { fontSize: 12, fontWeight: 600, marginBottom: 4 },
  teamSpec: { fontSize: 12, color: 'var(--text-muted)' },

  reviewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 },
  reviewCard: {
    background: 'var(--surface)', borderRadius: 16, padding: '22px 24px',
    border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
  },
  reviewTop:  { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 },
  reviewAvatar: {
    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
    background: C,
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 17, fontWeight: 700,
  },
  reviewName: { fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 },
  reviewDate: { fontSize: 11, color: 'var(--text-muted)' },
  reviewText: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75, fontStyle: 'italic', margin: 0 },

  mapWrap:  { borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.1)', border: '1px solid var(--border)' },
  mapFrame: { width: '100%', height: 300, border: 'none', display: 'block' },
  addrBox:  {
    display: 'flex', alignItems: 'center', gap: 10, marginTop: 14,
    padding: '12px 18px', background: 'var(--surface)',
    borderRadius: 12, border: '1px solid var(--border)',
  },

  hoursCard: {
    background: 'var(--surface)', borderRadius: 18, padding: '26px 28px',
    border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
  },
  hourRow:  { display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' },
  dayLabel: { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' },
  hoursVal: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },

  otherScroll: { display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 },
  otherCard: {
    background: 'var(--surface)', borderRadius: 16, padding: '22px 20px 18px',
    border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
    minWidth: 200, flexShrink: 0, textDecoration: 'none',
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6,
  },
  otherAvatar: {
    width: 54, height: 54, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4,
  },
  otherName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontWeight: 700, fontSize: 15, color: 'var(--text)',
  },
  otherCity: { fontSize: 12, color: 'var(--text-muted)' },
  seeAllBtn: {
    padding: '8px 18px', fontSize: 13, fontWeight: 600, color: C,
    background: `rgba(${R},.1)`, borderRadius: 9,
    border: `1px solid rgba(${R},.2)`, textDecoration: 'none', flexShrink: 0,
    fontFamily: "'DM Sans', sans-serif",
  },

  offersGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 },
  offerCard:       { background: 'var(--surface)', borderRadius: 14, padding: '18px 20px', border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,.05)' },
  offerDiscount:   { fontFamily: "'DM Sans', sans-serif", fontSize: 26, fontWeight: 800, lineHeight: 1, marginBottom: 6 },
  offerCardTitle:  { fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 },
  offerDesc:       { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 6px' },
  offerNote:       { fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' },

  aboutCard: {
    background: 'var(--surface)', borderRadius: 20, padding: '32px 36px',
    border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,.06)',
  },
  aboutText:  { fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.85, marginBottom: 16 },
  aboutStats: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
    marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)',
  },

  reviewForm: {
    background: 'var(--surface)', borderRadius: 18, padding: '24px 26px',
    border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
    marginTop: 24,
  },
  reviewFormTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 14, letterSpacing: '-0.01em',
  },
  reviewFormStars: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14 },
  reviewStarBtn: {
    fontSize: 28, background: 'none', border: 'none', cursor: 'pointer',
    padding: '0 1px', lineHeight: 1, transition: 'transform .12s ease, color .12s ease',
  },
  reviewTextarea: {
    width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)',
    borderRadius: 12, fontSize: 14, background: 'var(--input-bg)', color: 'var(--text)',
    fontFamily: "'DM Sans', sans-serif", outline: 'none', resize: 'vertical',
    boxSizing: 'border-box', marginBottom: 12, lineHeight: 1.6, minHeight: 90,
    display: 'block',
  },
  reviewMsg: { fontSize: 13, fontWeight: 600, marginBottom: 12 },
  reviewSubmitBtn: {
    padding: '10px 24px',
    background: C,
    color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 13,
    border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    boxShadow: `0 4px 14px rgba(${R},.3)`,
    transition: 'opacity .2s ease',
  },

  cta: {
    background: `linear-gradient(135deg, #0D0D16 0%, ${pal.darkBg} 50%, ${C} 100%)`,
    borderRadius: 24, padding: '52px 40px', textAlign: 'center',
    boxShadow: `0 10px 40px rgba(${R},.35)`, position: 'relative', overflow: 'hidden',
  },
  ctaGlow: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at bottom right, rgba(212,175,55,.2) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  ctaTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 34, fontWeight: 700, color: '#fff', marginBottom: 10,
    position: 'relative', zIndex: 1, letterSpacing: '-0.01em',
  },
  ctaBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '14px 38px',
    background: C,
    color: '#fff', borderRadius: 14, fontWeight: 700, fontSize: 16,
    textDecoration: 'none', boxShadow: `0 6px 20px rgba(${R},.45)`,
    position: 'relative', zIndex: 1,
    fontFamily: "'DM Sans', sans-serif",
  },
}; }

const lb = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,.92)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    animation: 'confirmReveal .2s ease both',
  },
  imgWrap: {
    maxWidth: '90vw', maxHeight: '75vh',
    borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(0,0,0,.6)',
    position: 'relative',
    display: 'flex', flexDirection: 'column',
  },
  img: {
    maxWidth: '90vw', maxHeight: '70vh',
    objectFit: 'contain', display: 'block',
    borderRadius: 16,
  },
  caption: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '10px 16px',
    background: 'linear-gradient(transparent, rgba(0,0,0,.65))',
    color: '#fff', fontSize: 13, fontWeight: 500,
    borderRadius: '0 0 16px 16px',
  },
  closeBtn: {
    position: 'absolute', top: 18, right: 18,
    width: 40, height: 40, borderRadius: '50%',
    background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)',
    color: '#fff', border: 'none', cursor: 'pointer',
    fontSize: 18, fontWeight: 700, zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  navBtn: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: 48, height: 48, borderRadius: '50%',
    background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)',
    color: '#fff', border: 'none', cursor: 'pointer',
    fontSize: 30, fontWeight: 300, zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  counter: {
    marginTop: 16, fontSize: 13, fontWeight: 600,
    color: 'rgba(255,255,255,.55)', letterSpacing: '0.08em',
  },
  thumbStrip: {
    display: 'flex', gap: 8, marginTop: 12,
    maxWidth: '90vw', overflowX: 'auto',
    paddingBottom: 4,
  },
  thumb: {
    width: 52, height: 52, borderRadius: 8, overflow: 'hidden',
    flexShrink: 0, cursor: 'pointer', opacity: 0.5,
    border: '2px solid transparent',
    transition: 'opacity .15s ease, border-color .15s ease',
  },
  thumbActive: {
    opacity: 1, borderColor: '#fff',
  },
};

const tm = {
  modal: {
    background: 'var(--surface)', borderRadius: 26, padding: '44px 36px 36px',
    maxWidth: 400, width: '90vw', position: 'relative',
    boxShadow: '0 40px 100px rgba(0,0,0,.55)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    animation: 'scaleIn .28s cubic-bezier(.34,1.56,.64,1) both',
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14,
    width: 36, height: 36, borderRadius: '50%',
    background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', cursor: 'pointer',
    fontSize: 15, fontWeight: 700, zIndex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 100, height: 100, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  name: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.01em',
  },
  role: {
    fontSize: 13, fontWeight: 700, marginBottom: 18,
    textTransform: 'capitalize', letterSpacing: '0.04em',
  },
  bio: {
    fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8,
    margin: 0, maxWidth: 300,
  },
};

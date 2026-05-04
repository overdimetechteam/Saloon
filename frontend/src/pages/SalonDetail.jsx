import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { c, shadow } from '../styles/theme';

const CAT_COLORS = { Hair: '#8B5CF6', Nails: '#EC4899', Skin: '#10B981', Makeup: '#F59E0B' };

export default function SalonDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);

  useEffect(() => {
    api.get(`/salons/${id}/`).then(r => setSalon(r.data)).catch(() => {});
    api.get(`/salons/${id}/services/`).then(r => setServices(r.data)).catch(() => {});
  }, [id]);

  if (!salon) return <div style={s.loading}>Loading…</div>;

  const grouped = services.reduce((acc, ss) => {
    const cat = ss.service_category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ss); return acc;
  }, {});

  return (
    <div style={s.page}>
      <div style={s.banner}>
        <div style={s.bannerContent}>
          <div style={s.bannerAvatar}>{salon.name[0]}</div>
          <div>
            <h1 style={s.salonName}>{salon.name}</h1>
            <p style={s.addr}>📍 {salon.address_street}, {salon.address_city} {salon.address_postal}</p>
            <div style={s.contacts}>
              <span style={s.contact}>📞 {salon.contact_number}</span>
              <span style={s.contact}>✉️ {salon.email}</span>
            </div>
          </div>
          {profile?.role === 'client' && (
            <Link to={`/user/book/${id}`} style={s.bookBtn}>Book Appointment</Link>
          )}
        </div>
      </div>

      <div style={s.body}>
        <div style={s.main}>
          {Object.keys(grouped).length === 0 && (
            <div style={s.emptyBox}><p style={{ color: c.textMuted }}>No services listed for this salon yet.</p></div>
          )}
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} style={s.catSection}>
              <div style={s.catHeader}>
                <span style={{ ...s.catBadge, background: (CAT_COLORS[cat] || c.primary) + '20', color: CAT_COLORS[cat] || c.primary }}>{cat}</span>
              </div>
              <div style={s.serviceGrid}>
                {items.map(ss => (
                  <div key={ss.id} style={s.serviceCard}>
                    <div style={s.serviceName}>{ss.service_name}</div>
                    <div style={s.serviceMeta}>
                      <span style={s.duration}>⏱ {ss.effective_duration} min</span>
                      <span style={s.price}>LKR {ss.effective_price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <aside style={s.side}>
          <div style={s.infoCard}>
            <h4 style={s.infoTitle}>Operating Hours</h4>
            {Object.keys(salon.operating_hours || {}).length === 0 ? (
              <p style={{ color: c.textMuted, fontSize: 13 }}>Hours not specified</p>
            ) : (
              Object.entries(salon.operating_hours).map(([day, hours]) => (
                <div key={day} style={s.hourRow}>
                  <span style={s.dayLabel}>{day.slice(0,3).toUpperCase()}</span>
                  <span style={s.dayHours}>{hours.open} – {hours.close}</span>
                </div>
              ))
            )}
          </div>
          {profile?.role === 'client' && (
            <Link to={`/user/book/${id}`} style={s.bookBtnSide}>📅 Book Now</Link>
          )}
        </aside>
      </div>
    </div>
  );
}

const s = {
  page: { background: c.bg, minHeight: '100vh' },
  loading: { padding: 60, textAlign: 'center', color: c.textMuted },
  banner: { background: `linear-gradient(135deg, ${c.primary} 0%, #4F46E5 100%)`, padding: '40px 48px' },
  bannerContent: { maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' },
  bannerAvatar: { width: 80, height: 80, borderRadius: 20, background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, flexShrink: 0 },
  salonName: { fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, marginBottom: 6 },
  addr: { color: 'rgba(255,255,255,0.85)', fontSize: 14, margin: 0, marginBottom: 8 },
  contacts: { display: 'flex', gap: 20 },
  contact: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  bookBtn: { marginLeft: 'auto', padding: '12px 28px', background: '#fff', color: c.primary, borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15, flexShrink: 0 },
  body: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 24, alignItems: 'flex-start' },
  main: { flex: 1 },
  side: { width: 240, flexShrink: 0, position: 'sticky', top: 20 },
  catSection: { marginBottom: 28 },
  catHeader: { marginBottom: 12 },
  catBadge: { display: 'inline-flex', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 },
  serviceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 12 },
  serviceCard: { background: c.surface, borderRadius: 10, padding: 16, boxShadow: shadow.sm, border: `1px solid ${c.border}` },
  serviceName: { fontWeight: 600, fontSize: 14, color: c.text, marginBottom: 10 },
  serviceMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  duration: { fontSize: 12, color: c.textMuted },
  price: { fontWeight: 700, fontSize: 15, color: c.primary },
  emptyBox: { padding: '40px 0', textAlign: 'center' },
  infoCard: { background: c.surface, borderRadius: 12, padding: 20, boxShadow: shadow.sm, border: `1px solid ${c.border}`, marginBottom: 16 },
  infoTitle: { fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 14 },
  hourRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${c.border}` },
  dayLabel: { fontSize: 12, fontWeight: 700, color: c.textMuted },
  dayHours: { fontSize: 12, color: c.text },
  bookBtnSide: { display: 'block', textAlign: 'center', padding: '12px', background: c.primary, color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14 },
};

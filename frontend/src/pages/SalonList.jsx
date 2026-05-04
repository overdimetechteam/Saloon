import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { c, shadow } from '../styles/theme';

export default function SalonList() {
  const [salons, setSalons] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/salons/?name=${search}`).then(r => setSalons(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [search]);

  return (
    <div style={s.page}>
      <div style={s.hero}>
        <h1 style={s.heroTitle}>Find Your Perfect Salon</h1>
        <p style={s.heroSub}>Browse and book from our curated list of top salons</p>
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input style={s.search} placeholder="Search salons by name…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div style={s.results}>
        {loading && <p style={s.msg}>Loading salons…</p>}
        {!loading && salons.length === 0 && <p style={s.msg}>No salons found for "{search}".</p>}
        <div style={s.grid}>
          {salons.map(salon => (
            <div key={salon.id} style={s.card}>
              <div style={s.cardTop}>
                <div style={s.salonAvatar}>{salon.name[0]}</div>
                <div>
                  <h3 style={s.salonName}>{salon.name}</h3>
                  <p style={s.salonCity}>📍 {salon.address_city}, {salon.address_district}</p>
                </div>
              </div>
              <div style={s.cardBody}>
                <p style={s.detail}>📞 {salon.contact_number}</p>
                <p style={s.detail}>✉️ {salon.email}</p>
              </div>
              <Link to={`/salons/${salon.id}`} style={s.viewBtn}>View Salon →</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: c.bg },
  hero: { background: `linear-gradient(135deg, ${c.primary} 0%, #4F46E5 100%)`, padding: '64px 40px 80px', textAlign: 'center' },
  heroTitle: { fontSize: 40, fontWeight: 800, color: '#fff', margin: 0, marginBottom: 12 },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 32 },
  searchWrap: { display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 50, padding: '12px 20px', gap: 10, maxWidth: 500, margin: '0 auto', boxShadow: shadow.lg },
  searchIcon: { fontSize: 18, flexShrink: 0 },
  search: { border: 'none', outline: 'none', fontSize: 15, flex: 1, background: 'transparent', color: c.text },
  results: { maxWidth: 1100, margin: '-40px auto 0', padding: '0 24px 60px' },
  msg: { textAlign: 'center', color: c.textMuted, padding: '60px 0', fontSize: 15 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 },
  card: { background: c.surface, borderRadius: 14, overflow: 'hidden', boxShadow: shadow.md, display: 'flex', flexDirection: 'column' },
  cardTop: { display: 'flex', alignItems: 'center', gap: 14, padding: '20px 20px 14px' },
  salonAvatar: { width: 50, height: 50, borderRadius: 12, background: c.primaryLight, color: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0 },
  salonName: { fontSize: 16, fontWeight: 700, color: c.text, margin: 0, marginBottom: 2 },
  salonCity: { fontSize: 13, color: c.textMuted, margin: 0 },
  cardBody: { padding: '0 20px 14px', flex: 1 },
  detail: { fontSize: 13, color: c.textMuted, margin: '3px 0' },
  viewBtn: { display: 'block', padding: '12px 20px', background: c.primarySoft, color: c.primary, textDecoration: 'none', fontWeight: 600, fontSize: 14, textAlign: 'center', borderTop: `1px solid ${c.border}` },
};

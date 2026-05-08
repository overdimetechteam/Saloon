import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const PALETTE = ['#7C3AED','#0D9488','#2563EB','#059669','#D97706','#DC2626'];

export default function UserFavourites() {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/client/favourites/')
      .then(r => setSalons(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={s.header} className="fade-up">
        <div>
          <h2 style={s.title}>My Favourites</h2>
          <p style={s.sub}>{salons.length} saved salon{salons.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/salons" style={s.browseBtn}>Browse Salons</Link>
      </div>

      {loading && (
        <div style={s.grid}>
          {[1,2,3].map(i => <div key={i} style={s.skeleton} className="shimmer" />)}
        </div>
      )}

      {!loading && salons.length === 0 && (
        <div style={s.empty} className="scale-in">
          <div style={s.emptyHeart}>♥</div>
          <h3 style={s.emptyTitle}>No favourites yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            Tap the heart on any salon page to save it here.
          </p>
          <Link to="/salons" style={s.browseBtn}>Browse Salons</Link>
        </div>
      )}

      <div style={s.grid}>
        {salons.map((salon, i) => {
          const color = PALETTE[i % PALETTE.length];
          return (
            <div key={salon.id} style={s.card} className={`lift-sm fade-up d${Math.min(i + 1, 5)}`}>
              <div style={{ ...s.cardBanner, background: `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)` }}>
                <div style={{ ...s.salonAvatar, background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)` }}>
                  {salon.name[0].toUpperCase()}
                </div>
                <div style={{ ...s.categoryDot, background: color }} />
              </div>
              <div style={s.cardBody}>
                <h3 style={s.salonName}>{salon.name}</h3>
                <div style={s.salonLoc}>
                  <span style={{ fontSize: 12 }}>◎</span>
                  {salon.address_city}{salon.address_district ? `, ${salon.address_district}` : ''}
                </div>
                {salon.contact_number && (
                  <div style={s.contactChip}>📞 {salon.contact_number}</div>
                )}
              </div>
              <Link to={`/salons/${salon.id}`} style={{ ...s.viewBtn, borderColor: color + '33', color }}>
                View Salon <span>→</span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 14 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: 0, marginBottom: 4 },
  sub: { color: 'var(--text-muted)', fontSize: 13, margin: 0 },
  browseBtn: {
    padding: '10px 22px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    color: '#fff', borderRadius: 12, fontWeight: 600, fontSize: 14,
    textDecoration: 'none', boxShadow: '0 4px 12px rgba(124,58,237,.3)',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  skeleton: { height: 240, borderRadius: 18 },
  card: {
    background: 'var(--surface)', borderRadius: 18, overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,.07)', border: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
  },
  cardBanner: { padding: '22px 22px 14px', position: 'relative' },
  salonAvatar: {
    width: 52, height: 52, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, fontWeight: 800, color: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,.15)',
  },
  categoryDot: { width: 8, height: 8, borderRadius: '50%', position: 'absolute', top: 16, right: 16 },
  cardBody: { padding: '4px 22px 16px', flex: 1 },
  salonName: { fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 6 },
  salonLoc: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 },
  contactChip: { fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 20, padding: '3px 10px', border: '1px solid var(--border)', display: 'inline-block' },
  viewBtn: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 22px', fontWeight: 600, fontSize: 14,
    borderTop: '1px solid', textDecoration: 'none',
  },
  empty: {
    textAlign: 'center', padding: '72px 40px',
    background: 'var(--surface)', borderRadius: 20,
    border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,.05)',
  },
  emptyHeart: {
    fontSize: 44, display: 'flex', width: 72, height: 72, borderRadius: '50%',
    alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
    background: 'linear-gradient(135deg, #0D9488, #7C3AED)', color: '#fff',
    boxShadow: '0 6px 20px rgba(13,148,136,.3)',
  },
  emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' },
};

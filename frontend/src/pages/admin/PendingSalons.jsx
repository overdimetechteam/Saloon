import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function PendingSalons() {
  const [salons, setSalons] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = () => api.get('/admin/salons/pending/').then(r => setSalons(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const approve = async id => {
    try {
      await api.post(`/salons/${id}/approve/`);
      load(); setMsg('Salon approved and activated.'); setTimeout(() => setMsg(''), 3000);
    } catch { setError('Failed to approve.'); }
  };
  const reject = async id => {
    try {
      await api.post(`/salons/${id}/reject/`);
      load(); setMsg('Salon rejected.'); setTimeout(() => setMsg(''), 3000);
    } catch { setError('Failed to reject.'); }
  };

  return (
    <div>
      <div style={s.pageHeader} className="fade-up">
        <div>
          <div style={s.eyebrow}>Reviews</div>
          <h2 style={s.title}>Pending Approvals</h2>
          <p style={s.sub}>Review and approve new salon registrations</p>
        </div>
        <div style={s.countBadge}>
          <div style={s.countNum}>{salons.length}</div>
          <div style={s.countLabel}>awaiting review</div>
        </div>
      </div>

      {msg   && <div style={s.alertOk}>{msg}</div>}
      {error && <div style={s.alertErr}>{error}</div>}

      {salons.length === 0 && (
        <div style={s.empty} className="scale-in">
          <div style={s.emptyOrb}>✅</div>
          <h3 style={s.emptyTitle}>All caught up!</h3>
          <p style={{ color: '#059669', fontWeight: 600, margin: '0 0 6px' }}>No pending salons.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>New registrations will appear here for review.</p>
        </div>
      )}

      <div style={s.list}>
        {salons.map(salon => (
          <div key={salon.id} style={s.card} className="fade-up">
            <div style={s.cardHead}>
              <div style={s.cardLeft}>
                <div style={s.salonIcon}>
                  <span style={s.salonInitial}>{salon.name[0].toUpperCase()}</span>
                </div>
                <div>
                  <div style={s.salonName}>{salon.name}</div>
                  <div style={s.regNum}>{salon.business_reg_number || 'No reg. number'}</div>
                </div>
              </div>
              <span style={s.pendingBadge}>Pending Review</span>
            </div>

            <div style={s.infoGrid}>
              <div style={s.infoItem}>
                <div style={s.infoLabel}>Owner</div>
                <div style={s.infoVal}>{salon.owner_email}</div>
              </div>
              <div style={s.infoItem}>
                <div style={s.infoLabel}>Contact</div>
                <div style={s.infoVal}>{salon.contact_number || '—'}</div>
              </div>
              <div style={s.infoItem}>
                <div style={s.infoLabel}>Email</div>
                <div style={s.infoVal}>{salon.email || '—'}</div>
              </div>
              <div style={s.infoItem}>
                <div style={s.infoLabel}>Address</div>
                <div style={s.infoVal}>
                  {[salon.address_street, salon.address_city, salon.address_district, salon.address_postal].filter(Boolean).join(', ')}
                </div>
              </div>
            </div>

            <div style={s.cardFoot}>
              <button style={s.approveBtn} onClick={() => approve(salon.id)}>
                ✓ Approve Salon
              </button>
              <button style={s.rejectBtn} onClick={() => reject(salon.id)}>
                ✕ Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: '#A78BFA', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' },
  sub: { color: 'var(--text-muted)', fontSize: 13, margin: 0 },
  countBadge: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    background: 'rgba(217,119,6,.1)', border: '1px solid rgba(217,119,6,.25)',
    borderRadius: 16, padding: '14px 22px',
  },
  countNum: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34, fontWeight: 700, color: '#D97706', lineHeight: 1 },
  countLabel: { fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  alertOk: { background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  alertErr: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  empty: {
    textAlign: 'center', padding: '72px 40px',
    background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(124,58,237,.06)',
  },
  emptyOrb: { fontSize: 40, marginBottom: 16, display: 'block' },
  emptyTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, color: 'var(--text)', marginBottom: 8 },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(124,58,237,.07)', overflow: 'hidden',
  },
  cardHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '22px 26px', borderBottom: '1px solid var(--border)',
  },
  cardLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  salonIcon: {
    width: 54, height: 54, borderRadius: 14, flexShrink: 0,
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #EC4899 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 18px rgba(124,58,237,.35)',
  },
  salonInitial: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 24, fontWeight: 700, color: '#fff',
  },
  salonName: { fontWeight: 800, fontSize: 17, color: 'var(--text)' },
  regNum: { fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 3 },
  pendingBadge: {
    background: '#FFFBEB', color: '#D97706',
    border: '1px solid rgba(217,119,6,.25)',
    borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '5px 14px',
  },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 0 },
  infoItem: { padding: '14px 26px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)' },
  infoLabel: { fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 },
  infoVal: { fontSize: 14, color: 'var(--text)', fontWeight: 500 },
  cardFoot: { display: 'flex', gap: 12, padding: '16px 26px', background: 'var(--surface2)' },
  approveBtn: {
    padding: '11px 28px',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer',
    fontWeight: 700, fontSize: 14, boxShadow: '0 4px 14px rgba(5,150,105,.3)',
    fontFamily: "'DM Sans', sans-serif",
  },
  rejectBtn: {
    padding: '11px 22px', background: '#FEF2F2', color: '#DC2626',
    border: '1px solid rgba(220,38,38,.25)', borderRadius: 11, cursor: 'pointer',
    fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  },
};
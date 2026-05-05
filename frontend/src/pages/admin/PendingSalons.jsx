import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { c, shadow } from '../../styles/theme';

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
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.title}>Pending Approvals</h2>
          <p style={s.sub}>Review and approve new salon registrations</p>
        </div>
        <div style={s.countBadge}>
          <span style={s.countNum}>{salons.length}</span>
          <span style={s.countLabel}>awaiting review</span>
        </div>
      </div>

      {msg   && <div style={s.success}>{msg}</div>}
      {error && <div style={s.alert}>{error}</div>}

      {salons.length === 0 && (
        <div style={s.empty}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
          <p style={{ fontWeight: 600, color: c.success, margin: 0 }}>All caught up! No pending salons.</p>
          <p style={{ color: c.textMuted, fontSize: 13, marginTop: 6 }}>New registrations will appear here for review.</p>
        </div>
      )}

      <div style={s.list}>
        {salons.map(salon => (
          <div key={salon.id} style={s.card}>
            <div style={s.cardHead}>
              <div style={s.cardLeft}>
                <div style={s.salonIcon}>{salon.name[0].toUpperCase()}</div>
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
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 700, color: c.text, margin: 0, marginBottom: 4 },
  sub: { color: c.textMuted, fontSize: 14, margin: 0 },
  countBadge: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: c.warningBg, border: `1px solid ${c.warningBorder}`, borderRadius: 12, padding: '12px 20px' },
  countNum: { fontSize: 28, fontWeight: 800, color: c.warning, lineHeight: 1 },
  countLabel: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  success: { background: c.successBg, border: `1px solid ${c.successBorder}`, color: c.success, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  alert: { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.error, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  empty: { textAlign: 'center', padding: '70px 40px', background: c.surface, borderRadius: 14, border: `1px solid ${c.border}` },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { background: c.surface, borderRadius: 16, border: `1px solid ${c.border}`, boxShadow: shadow.md, overflow: 'hidden' },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${c.border}` },
  cardLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  salonIcon: { width: 48, height: 48, borderRadius: 12, background: c.primaryLight, color: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0 },
  salonName: { fontWeight: 800, fontSize: 17, color: c.text },
  regNum: { fontSize: 12, color: c.textMuted, fontFamily: 'monospace', marginTop: 2 },
  pendingBadge: { background: c.warningBg, color: c.warning, border: `1px solid ${c.warningBorder}`, borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '4px 14px' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 0 },
  infoItem: { padding: '14px 24px', borderBottom: `1px solid ${c.border}`, borderRight: `1px solid ${c.border}` },
  infoLabel: { fontSize: 10, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 },
  infoVal: { fontSize: 14, color: c.text, fontWeight: 500 },
  cardFoot: { display: 'flex', gap: 12, padding: '16px 24px', background: c.bg },
  approveBtn: { padding: '11px 28px', background: c.success, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  rejectBtn: { padding: '11px 22px', background: c.errorBg, color: c.error, border: `1px solid ${c.errorBorder}`, borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 },
};

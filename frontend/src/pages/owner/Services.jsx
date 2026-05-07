import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';

const CAT_COLORS = { Hair: '#8B5CF6', Nails: '#0D9488', Skin: '#10B981', Makeup: '#F59E0B' };

export default function OwnerServices() {
  const { salon } = useOwner();
  const [attached, setAttached] = useState([]);
  const [all, setAll] = useState([]);
  const [toAdd, setToAdd] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/services/').then(r => setAll(r.data)).catch(() => {});
    if (salon) api.get(`/salons/${salon.id}/services/`).then(r => setAttached(r.data)).catch(() => {});
  }, [salon]);

  const attachedIds = new Set(attached.map(ss => ss.service));
  const available = all.filter(s => !attachedIds.has(s.id));

  const attach = async () => {
    if (!toAdd || !salon) return;
    setError('');
    try {
      await api.post(`/salons/${salon.id}/services/`, { service: Number(toAdd) });
      api.get(`/salons/${salon.id}/services/`).then(r => setAttached(r.data));
      setMsg('Service attached!'); setToAdd('');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error');
    }
  };

  const detach = async ssId => {
    try {
      await api.delete(`/salons/${salon.id}/services/${ssId}/`);
      setAttached(prev => prev.filter(ss => ss.id !== ssId));
      setMsg('Service detached.'); setTimeout(() => setMsg(''), 3000);
    } catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  const grouped = attached.reduce((acc, ss) => {
    const cat = ss.service_category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ss); return acc;
  }, {});

  return (
    <div>
      <div style={s.pageHeader} className="fade-up">
        <div>
          <div style={s.eyebrow}>Catalogue</div>
          <h2 style={s.title}>Services</h2>
        </div>
        <div style={s.addRow}>
          <select style={s.select} value={toAdd} onChange={e => setToAdd(e.target.value)}>
            <option value="">— Add a service —</option>
            {available.map(sv => <option key={sv.id} value={sv.id}>{sv.name} ({sv.category})</option>)}
          </select>
          <button style={{ ...s.addBtn, opacity: !toAdd ? 0.6 : 1 }} onClick={attach} disabled={!toAdd}>
            Attach Service
          </button>
        </div>
      </div>

      {error && <div style={s.alertErr}>{error}</div>}
      {msg && <div style={s.alertOk}>{msg}</div>}

      {attached.length === 0 && (
        <div style={s.empty} className="scale-in">
          <div style={s.emptyOrb}>✂</div>
          <h3 style={s.emptyTitle}>No services attached</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            Add services from the global catalogue above.
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([cat, items]) => {
        const color = CAT_COLORS[cat] || '#7C3AED';
        return (
          <div key={cat} style={s.catSection}>
            <div style={s.catHeader}>
              <span style={{ ...s.catBadge, color, background: color + '14', border: `1px solid ${color}30` }}>{cat}</span>
              <span style={s.catCount}>{items.length} service{items.length > 1 ? 's' : ''}</span>
            </div>
            <div style={s.grid}>
              {items.map(ss => (
                <div key={ss.id} style={s.card} className="fade-up">
                  <div style={{ ...s.cardAccent, background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
                  <div style={s.cardBody}>
                    <div style={s.cardTop}>
                      <div style={s.svcName}>{ss.service_name}</div>
                      <button style={s.detachBtn} onClick={() => detach(ss.id)}>Remove</button>
                    </div>
                    <div style={s.meta}>
                      <span style={s.metaItem}>⏱ {ss.effective_duration} min</span>
                      <span style={{ ...s.price, color }}>LKR {ss.effective_price}</span>
                    </div>
                    {ss.custom_price != null && (
                      <div style={s.customNote}>Custom price set</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const s = {
  pageHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 28, flexWrap: 'wrap', gap: 14,
  },
  eyebrow: {
    fontSize: 10, fontWeight: 700, color: '#A78BFA',
    letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6,
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em',
  },
  addRow: { display: 'flex', gap: 10, alignItems: 'center' },
  select: {
    padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 11,
    fontSize: 14, color: 'var(--text)', background: 'var(--input-bg)',
    fontFamily: "'DM Sans', sans-serif", outline: 'none', minWidth: 260,
  },
  addBtn: {
    padding: '10px 22px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #EC4899 100%)',
    color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer',
    fontWeight: 700, fontSize: 14, boxShadow: '0 4px 14px rgba(124,58,237,.3)',
    fontFamily: "'DM Sans', sans-serif",
  },
  alertErr: {
    background: '#FEF2F2', border: '1px solid #FCA5A5',
    color: '#DC2626', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18,
  },
  alertOk: {
    background: '#ECFDF5', border: '1px solid #6EE7B7',
    color: '#059669', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18,
  },
  empty: {
    textAlign: 'center', padding: '64px 40px',
    background: 'var(--surface)', borderRadius: 22,
    border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(124,58,237,.06)',
  },
  emptyOrb: { fontSize: 36, marginBottom: 16, display: 'block', color: 'var(--text-muted)' },
  emptyTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8,
  },

  catSection: { marginBottom: 30 },
  catHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  catBadge: { padding: '5px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700 },
  catCount: { fontSize: 12, color: 'var(--text-muted)' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 },
  card: {
    background: 'var(--surface)', borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(124,58,237,.06)', border: '1px solid var(--border)',
  },
  cardAccent: { height: 3, width: '100%' },
  cardBody: { padding: '16px 18px' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  svcName: { fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.3 },
  detachBtn: {
    padding: '4px 10px', background: '#FEF2F2', color: '#DC2626',
    border: '1px solid #FECACA', borderRadius: 7, cursor: 'pointer',
    fontSize: 11, fontWeight: 600, flexShrink: 0,
  },
  meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  metaItem: { fontSize: 12, color: 'var(--text-muted)' },
  price: { fontWeight: 700, fontSize: 16 },
  customNote: {
    marginTop: 8, fontSize: 11, color: '#7C3AED',
    background: 'rgba(124,58,237,.08)', borderRadius: 6,
    padding: '2px 8px', display: 'inline-block',
    border: '1px solid rgba(124,58,237,.2)',
  },
};

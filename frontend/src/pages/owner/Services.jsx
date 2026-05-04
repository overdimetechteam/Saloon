import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { c, shadow } from '../../styles/theme';

const CAT_COLORS = { Hair: '#8B5CF6', Nails: '#EC4899', Skin: '#10B981', Makeup: '#F59E0B' };

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
      <div style={s.pageHeader}>
        <h2 style={s.title}>Services</h2>
        <div style={s.addRow}>
          <select style={s.select} value={toAdd} onChange={e => setToAdd(e.target.value)}>
            <option value="">— Add a service —</option>
            {available.map(sv => <option key={sv.id} value={sv.id}>{sv.name} ({sv.category})</option>)}
          </select>
          <button style={s.addBtn} onClick={attach} disabled={!toAdd}>Attach Service</button>
        </div>
      </div>

      {error && <div style={s.alert}>{error}</div>}
      {msg && <div style={s.success}>{msg}</div>}

      {attached.length === 0 && (
        <div style={s.empty}><div style={{ fontSize: 40, marginBottom: 12 }}>✂️</div><p>No services attached. Add services from the global catalogue above.</p></div>
      )}

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} style={s.catSection}>
          <div style={s.catHeader}>
            <span style={{ ...s.catBadge, color: CAT_COLORS[cat] || c.primary, background: (CAT_COLORS[cat] || c.primary) + '18' }}>{cat}</span>
            <span style={s.catCount}>{items.length} service{items.length > 1 ? 's' : ''}</span>
          </div>
          <div style={s.grid}>
            {items.map(ss => (
              <div key={ss.id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={s.svcName}>{ss.service_name}</div>
                  <button style={s.detachBtn} onClick={() => detach(ss.id)}>Remove</button>
                </div>
                <div style={s.meta}>
                  <span style={s.metaItem}>⏱ {ss.effective_duration} min</span>
                  <span style={s.price}>LKR {ss.effective_price}</span>
                </div>
                {ss.custom_price != null && <div style={s.customNote}>Custom price set</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const s = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 },
  title: { fontSize: 26, fontWeight: 700, color: c.text, margin: 0 },
  addRow: { display: 'flex', gap: 10 },
  select: { padding: '9px 14px', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 14, color: c.text, minWidth: 260 },
  addBtn: { padding: '9px 20px', background: c.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  alert: { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.error, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  success: { background: c.successBg, border: `1px solid ${c.successBorder}`, color: c.success, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  empty: { textAlign: 'center', padding: '60px 40px', background: c.surface, borderRadius: 14, border: `1px solid ${c.border}`, color: c.textMuted },
  catSection: { marginBottom: 28 },
  catHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  catBadge: { padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 },
  catCount: { fontSize: 12, color: c.textMuted },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 },
  card: { background: c.surface, borderRadius: 12, padding: 18, boxShadow: shadow.sm, border: `1px solid ${c.border}` },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  svcName: { fontWeight: 700, fontSize: 15, color: c.text, lineHeight: 1.3 },
  detachBtn: { padding: '4px 10px', background: c.errorBg, color: c.error, border: `1px solid ${c.errorBorder}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500, flexShrink: 0 },
  meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  metaItem: { fontSize: 12, color: c.textMuted },
  price: { fontWeight: 700, fontSize: 16, color: c.primary },
  customNote: { marginTop: 8, fontSize: 11, color: c.info, background: c.infoBg, borderRadius: 4, padding: '2px 8px', display: 'inline-block' },
};

import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function Reports() {
  const { profile } = useAuth();
  const [salonId, setSalonId] = useState(null);
  const [tab, setTab] = useState('stock');
  const [stock, setStock] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [movements, setMovements] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    api.get('/admin/salons/').then(r => {
      const owned = r.data.find(s => s.owner === profile?.id);
      if (owned) init(owned.id);
    }).catch(() => {
      api.get('/salons/').then(r => {
        const owned = r.data.find(s => s.owner === profile?.id);
        if (owned) init(owned.id);
      }).catch(() => {});
    });
  }, []);

  const init = id => {
    setSalonId(id);
    api.get(`/salons/${id}/reports/stock/`).then(r => setStock(r.data)).catch(() => {});
    api.get(`/salons/${id}/reports/low-stock/`).then(r => setLowStock(r.data)).catch(() => {});
  };

  const loadMovements = () => {
    if (!salonId) return;
    let url = `/salons/${salonId}/reports/movements/`;
    const params = [];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    if (params.length) url += '?' + params.join('&');
    api.get(url).then(r => setMovements(r.data)).catch(() => {});
  };

  return (
    <div style={s.wrap}>
      <h2>Reports</h2>
      <div style={s.tabs}>
        {['stock', 'low-stock', 'movements'].map(t => (
          <button key={t} onClick={() => { setTab(t); if (t === 'movements' && !movements) loadMovements(); }}
            style={{ ...s.tab, ...(tab === t ? s.activeTab : {}) }}>{t}</button>
        ))}
      </div>

      {tab === 'stock' && (
        <table style={s.table}>
          <thead><tr>{['Product','Category','Stock','Unit','Reorder'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>
            {stock.map(p => (
              <tr key={p.id} style={p.current_stock <= p.reorder_level ? { background: '#fff5f5' } : {}}>
                <td style={s.td}>{p.name}</td><td style={s.td}>{p.category}</td>
                <td style={s.td}>{p.current_stock}</td><td style={s.td}>{p.unit_of_measure}</td>
                <td style={s.td}>{p.reorder_level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'low-stock' && (
        <>
          <p style={{ color: '#e74c3c' }}>{lowStock.length} product(s) below reorder level</p>
          <table style={s.table}>
            <thead><tr>{['Product','Category','Stock','Reorder'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {lowStock.map(p => (
                <tr key={p.id}>
                  <td style={s.td}>{p.name}</td><td style={s.td}>{p.category}</td>
                  <td style={{ ...s.td, color: '#e74c3c', fontWeight: 'bold' }}>{p.current_stock}</td>
                  <td style={s.td}>{p.reorder_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === 'movements' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="date" style={s.input} value={from} onChange={e => setFrom(e.target.value)} />
            <input type="date" style={s.input} value={to} onChange={e => setTo(e.target.value)} />
            <button style={s.btn} onClick={loadMovements}>Load</button>
          </div>
          {movements && (
            <>
              <h4>GRNs ({movements.grns?.length})</h4>
              {movements.grns?.map(g => <div key={g.id} style={s.card}><p><strong>{g.reference_number}</strong> — {g.supplier_name} ({new Date(g.created_at).toLocaleDateString()})</p>{g.items?.map(i => <p key={i.id} style={{ margin: 0 }}>  {i.product_name} x{i.quantity_received}</p>)}</div>)}
              <h4>Sales ({movements.sales?.length})</h4>
              {movements.sales?.map(sl => <div key={sl.id} style={s.card}><p><strong>Sale #{sl.id}</strong> — {new Date(sl.created_at).toLocaleDateString()}</p>{sl.items?.map(i => <p key={i.id} style={{ margin: 0 }}>  {i.product_name} x{i.quantity} @ LKR {i.unit_price}</p>)}</div>)}
              <h4>Adjustments ({movements.adjustments?.length})</h4>
              {movements.adjustments?.map(a => <div key={a.id} style={s.card}><p><strong>{a.product_name}</strong> {a.quantity_change > 0 ? '+' : ''}{a.quantity_change} ({a.reason}) — {new Date(a.adjusted_at).toLocaleDateString()}</p></div>)}
            </>
          )}
        </>
      )}
    </div>
  );
}

const s = {
  wrap: { maxWidth: 900, margin: '40px auto', padding: 24 },
  tabs: { display: 'flex', gap: 8, marginBottom: 16 },
  tab: { padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: '#fff' },
  activeTab: { background: '#2c3e50', color: '#fff', borderColor: '#2c3e50' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f4f4f4', padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #ddd' },
  td: { padding: '8px 12px', borderBottom: '1px solid #eee' },
  input: { padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 },
  btn: { padding: '8px 16px', background: '#2c3e50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  card: { border: '1px solid #ddd', borderRadius: 6, padding: 10, marginBottom: 8 },
};

import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';

const TABS = ['Stock Overview', 'Low Stock', 'Movements'];

function toCsv(rows, headers) {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map(r => Object.values(r).map(escape).join(','))].join('\n');
}

function downloadCsv(filename, rows, headers) {
  const blob = new Blob([toCsv(rows, headers)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function OwnerReports() {
  const { salon } = useOwner();
  const [tab, setTab] = useState(0);
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [sales, setSales] = useState([]);
  const [grns, setGrns] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!salon) return;
    api.get(`/salons/${salon.id}/products/`).then(r => setProducts(r.data)).catch(() => {});
    api.get(`/salons/${salon.id}/adjustments/`).then(r => setAdjustments(r.data)).catch(() => {});
    api.get(`/salons/${salon.id}/sales/`).then(r => setSales(r.data)).catch(() => {});
    api.get(`/salons/${salon.id}/grn/`).then(r => setGrns(r.data)).catch(() => {});
  }, [salon]);

  const lowStock = products.filter(p => p.current_stock <= p.reorder_level);

  const movements = [
    ...adjustments.map(a => ({
      id: `adj-${a.id}`, type: 'Adjustment', date: a.adjusted_at,
      product: a.product_name, change: a.quantity_change, note: a.reason,
      color: a.quantity_change > 0 ? '#059669' : '#DC2626',
    })),
    ...sales.flatMap(s => (s.items || []).map(it => ({
      id: `sale-${s.id}-${it.id}`, type: 'Sale', date: s.created_at,
      product: it.product_name, change: -it.quantity, note: `Sale #${s.id}`,
      color: '#DC2626',
    }))),
    ...grns.filter(g => g.status === 'confirmed').flatMap(g => (g.items || []).map(it => ({
      id: `grn-${g.id}-${it.id}`, type: 'GRN', date: g.created_at,
      product: it.product_name, change: it.quantity_received, note: g.supplier_name,
      color: '#059669',
    }))),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = movements.filter(m => {
    const d = new Date(m.date);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const totalValue = products.reduce((sum, p) => sum + (p.current_stock * Number(p.cost_price || 0)), 0);

  return (
    <div>
      <div style={s.pageHeader} className="fade-up">
        <div>
          <div style={s.eyebrow}>Inventory</div>
          <h2 style={s.title}>Reports</h2>
          <p style={s.sub}>Inventory analytics and stock movement history</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.exportBtn} onClick={() => {
            downloadCsv('stock-overview.csv', products.map(p => ({
              Name: p.name, Brand: p.brand || '', Category: p.category,
              'Current Stock': p.current_stock, 'Reorder Level': p.reorder_level,
              Unit: p.unit_of_measure, 'Cost Price': p.cost_price, 'Selling Price': p.selling_price,
              'Stock Value': (p.current_stock * Number(p.cost_price || 0)).toFixed(2),
            })), ['Name','Brand','Category','Current Stock','Reorder Level','Unit','Cost Price','Selling Price','Stock Value']);
          }}>↓ Export Stock</button>
          <button style={s.exportBtn} onClick={() => {
            downloadCsv('movements.csv', filtered.map(m => ({
              Date: new Date(m.date).toLocaleString(), Type: m.type, Product: m.product, Change: m.change, Note: m.note,
            })), ['Date','Type','Product','Change','Note']);
          }}>↓ Export Movements</button>
        </div>
      </div>

      <div style={s.statsRow} className="fade-up">
        {[
          { label: 'Total Products',      value: products.length,              color: '#7C3AED', bg: 'rgba(124,58,237,.08)', border: 'rgba(124,58,237,.18)' },
          { label: 'Low Stock Items',     value: lowStock.length,              color: '#DC2626', bg: 'rgba(220,38,38,.08)',  border: 'rgba(220,38,38,.18)'  },
          { label: 'Stock Value (Cost)',  value: `LKR ${totalValue.toFixed(0)}`,color: '#059669', bg: 'rgba(5,150,105,.08)', border: 'rgba(5,150,105,.18)'  },
          { label: 'Total Adjustments',  value: adjustments.length,           color: '#D97706', bg: 'rgba(217,119,6,.08)', border: 'rgba(217,119,6,.18)'  },
        ].map(stat => (
          <div key={stat.label} style={{ ...s.statCard, background: stat.bg, border: `1px solid ${stat.border}` }}>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={s.tabs}>
        {TABS.map((t, i) => (
          <button key={t} style={{ ...s.tab, ...(tab === i ? s.tabActive : {}) }} onClick={() => setTab(i)}>
            {t}
            {t === 'Low Stock' && lowStock.length > 0 && (
              <span style={s.tabBadge}>{lowStock.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>{['Product','Category','Current Stock','Reorder Level','Cost Price','Selling Price','Stock Value'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {products.map(p => {
                const isLow = p.current_stock <= p.reorder_level;
                return (
                  <tr key={p.id} style={isLow ? { background: 'rgba(220,38,38,.04)' } : {}}>
                    <td style={s.td}>
                      <div style={s.prodName}>{p.name}</div>
                      {p.brand && <div style={s.prodBrand}>{p.brand}</div>}
                    </td>
                    <td style={s.td}>{p.category}</td>
                    <td style={s.td}>
                      <span style={{ fontWeight: 700, color: isLow ? '#DC2626' : '#059669' }}>
                        {p.current_stock}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> {p.unit_of_measure}</span>
                      {isLow && <div style={s.lowTag}>LOW</div>}
                    </td>
                    <td style={s.td}>{p.reorder_level}</td>
                    <td style={s.td}>LKR {p.cost_price}</td>
                    <td style={s.td}><span style={{ fontWeight: 700, color: '#7C3AED' }}>LKR {p.selling_price}</span></td>
                    <td style={s.td}><span style={{ fontWeight: 600, color: 'var(--text)' }}>LKR {(p.current_stock * Number(p.cost_price || 0)).toFixed(2)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {products.length === 0 && <div style={s.empty}>No products in inventory.</div>}
        </div>
      )}

      {tab === 1 && (
        <div>
          {lowStock.length === 0 ? (
            <div style={s.noLow}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>✅</div>
              <p style={{ fontWeight: 700, color: '#059669', margin: 0 }}>All products are above their reorder levels.</p>
            </div>
          ) : (
            <div style={s.lowGrid}>
              {lowStock.map(p => (
                <div key={p.id} style={s.lowCard}>
                  <div style={s.lowCardTop}>
                    <div>
                      <div style={s.prodName}>{p.name}</div>
                      {p.brand && <div style={s.prodBrand}>{p.brand}</div>}
                    </div>
                    <span style={s.urgentBadge}>REORDER NOW</span>
                  </div>
                  <div style={s.lowStats}>
                    <div style={s.lowStat}>
                      <div style={{ ...s.lowStatVal, color: '#DC2626' }}>{p.current_stock}</div>
                      <div style={s.lowStatLabel}>Current</div>
                    </div>
                    <div style={s.lowArrow}>→</div>
                    <div style={s.lowStat}>
                      <div style={{ ...s.lowStatVal, color: '#D97706' }}>{p.reorder_level}</div>
                      <div style={s.lowStatLabel}>Min Level</div>
                    </div>
                    <div style={s.lowArrow}>·</div>
                    <div style={s.lowStat}>
                      <div style={{ ...s.lowStatVal, color: '#7C3AED' }}>{p.reorder_level - p.current_stock + Math.ceil(p.reorder_level * 0.5)}</div>
                      <div style={s.lowStatLabel}>Suggest Order</div>
                    </div>
                  </div>
                  <div style={s.lowUnit}>{p.unit_of_measure} · {p.category}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={s.filterBar}>
            <div style={s.filterGroup}>
              <label style={s.filterLabel}>From</label>
              <input type="date" style={s.filterInput} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div style={s.filterGroup}>
              <label style={s.filterLabel}>To</label>
              <input type="date" style={s.filterInput} value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            {(dateFrom || dateTo) && (
              <button style={s.clearBtn} onClick={() => { setDateFrom(''); setDateTo(''); }}>Clear Filter</button>
            )}
            <div style={s.filterCount}>{filtered.length} movements</div>
          </div>

          <div style={s.card}>
            <table style={s.table}>
              <thead>
                <tr>{['Date','Type','Product','Change','Note'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id}>
                    <td style={s.td}><span style={s.dateText}>{new Date(m.date).toLocaleString()}</span></td>
                    <td style={s.td}>
                      <span style={{
                        ...s.typeBadge,
                        background: m.type === 'Sale' ? 'rgba(220,38,38,.1)' : m.type === 'GRN' ? 'rgba(5,150,105,.1)' : 'rgba(37,99,235,.1)',
                        color: m.type === 'Sale' ? '#DC2626' : m.type === 'GRN' ? '#059669' : '#2563EB',
                      }}>{m.type}</span>
                    </td>
                    <td style={s.td}><span style={s.prodName}>{m.product}</span></td>
                    <td style={s.td}><span style={{ fontWeight: 800, fontSize: 15, color: m.color }}>{m.change > 0 ? '+' : ''}{m.change}</span></td>
                    <td style={s.td}><span style={s.noteText}>{m.note}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div style={s.empty}>No movements in this period.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  pageHeader: { marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: '#A78BFA', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' },
  sub: { color: 'var(--text-muted)', fontSize: 13, margin: 0 },
  exportBtn: {
    padding: '9px 18px', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--text)',
    fontFamily: "'DM Sans', sans-serif",
  },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 26 },
  statCard: { borderRadius: 16, padding: '20px 22px' },
  statLabel: { fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  tabs: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 0 },
  tab: { padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '2px solid transparent', marginBottom: -2, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" },
  tabActive: { color: '#7C3AED', borderBottomColor: '#7C3AED', fontWeight: 700 },
  tabBadge: { background: '#DC2626', color: '#fff', borderRadius: 10, fontSize: 11, padding: '1px 7px', fontWeight: 700 },
  card: { background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(124,58,237,.06)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--surface2)', borderBottom: '2px solid var(--border)' },
  td: { padding: '13px 16px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
  prodName: { fontWeight: 600, fontSize: 14, color: 'var(--text)' },
  prodBrand: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  lowTag: { fontSize: 10, fontWeight: 700, color: '#DC2626', marginTop: 3, letterSpacing: '0.05em' },
  empty: { padding: '50px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 },
  noLow: {
    textAlign: 'center', padding: '64px',
    background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
    color: 'var(--text-muted)',
  },
  lowGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  lowCard: {
    background: 'var(--surface)', borderRadius: 16, border: '2px solid rgba(220,38,38,.3)',
    padding: 22, boxShadow: '0 4px 16px rgba(220,38,38,.08)',
  },
  lowCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  urgentBadge: { background: '#DC2626', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 8, padding: '4px 10px', letterSpacing: '0.06em' },
  lowStats: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 },
  lowStat: { textAlign: 'center' },
  lowStatVal: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 700, lineHeight: 1 },
  lowStatLabel: { fontSize: 11, color: 'var(--text-muted)', marginTop: 3 },
  lowArrow: { color: 'var(--text-muted)', fontSize: 16, fontWeight: 700 },
  lowUnit: { fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 10 },
  filterBar: { display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  filterLabel: { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  filterInput: { padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text)', background: 'var(--input-bg)', fontFamily: "'DM Sans', sans-serif", outline: 'none' },
  clearBtn: { padding: '9px 14px', background: 'rgba(220,38,38,.1)', color: '#DC2626', border: '1px solid rgba(220,38,38,.25)', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" },
  filterCount: { fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto', alignSelf: 'center' },
  dateText: { fontSize: 12, color: 'var(--text-muted)' },
  typeBadge: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  noteText: { fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize' },
};
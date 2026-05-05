import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { c, shadow } from '../../styles/theme';

const TABS = ['Stock Overview', 'Low Stock', 'Movements'];

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
      color: a.quantity_change > 0 ? c.success : c.error,
    })),
    ...sales.flatMap(s => (s.items || []).map(it => ({
      id: `sale-${s.id}-${it.id}`, type: 'Sale', date: s.created_at,
      product: it.product_name, change: -it.quantity, note: `Sale #${s.id}`,
      color: c.error,
    }))),
    ...grns.filter(g => g.status === 'confirmed').flatMap(g => (g.items || []).map(it => ({
      id: `grn-${g.id}-${it.id}`, type: 'GRN', date: g.created_at,
      product: it.product_name, change: it.quantity_received, note: g.supplier_name,
      color: c.success,
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
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.title}>Reports</h2>
          <p style={s.sub}>Inventory analytics and stock movement history</p>
        </div>
      </div>

      <div style={s.statsRow}>
        {[
          { label: 'Total Products', value: products.length, color: c.primary, bg: c.primarySoft },
          { label: 'Low Stock Items', value: lowStock.length, color: c.error, bg: c.errorBg },
          { label: 'Stock Value (Cost)', value: `LKR ${totalValue.toFixed(2)}`, color: c.success, bg: c.successBg },
          { label: 'Total Adjustments', value: adjustments.length, color: c.warning, bg: c.warningBg },
        ].map(stat => (
          <div key={stat.label} style={{ ...s.statCard, background: stat.bg }}>
            <div style={{ ...s.statVal, color: stat.color }}>{stat.value}</div>
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
              <tr>{['Product', 'Category', 'Current Stock', 'Reorder Level', 'Cost Price', 'Selling Price', 'Stock Value'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {products.map(p => {
                const isLow = p.current_stock <= p.reorder_level;
                return (
                  <tr key={p.id} style={isLow ? { background: c.errorBg } : {}}>
                    <td style={s.td}>
                      <div style={s.prodName}>{p.name}</div>
                      {p.brand && <div style={s.prodBrand}>{p.brand}</div>}
                    </td>
                    <td style={s.td}>{p.category}</td>
                    <td style={s.td}>
                      <span style={{ fontWeight: 700, color: isLow ? c.error : c.success }}>
                        {p.current_stock}
                      </span>
                      <span style={{ color: c.textMuted, fontSize: 12 }}> {p.unit_of_measure}</span>
                      {isLow && <div style={s.lowTag}>LOW</div>}
                    </td>
                    <td style={s.td}>{p.reorder_level}</td>
                    <td style={s.td}>LKR {p.cost_price}</td>
                    <td style={s.td}><span style={{ fontWeight: 700, color: c.primary }}>LKR {p.selling_price}</span></td>
                    <td style={s.td}><span style={{ fontWeight: 600, color: c.text }}>LKR {(p.current_stock * Number(p.cost_price || 0)).toFixed(2)}</span></td>
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
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ fontWeight: 600, color: c.success }}>All products are above their reorder levels.</p>
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
                      <div style={{ ...s.lowStatVal, color: c.error }}>{p.current_stock}</div>
                      <div style={s.lowStatLabel}>Current</div>
                    </div>
                    <div style={s.lowArrow}>→</div>
                    <div style={s.lowStat}>
                      <div style={{ ...s.lowStatVal, color: c.warning }}>{p.reorder_level}</div>
                      <div style={s.lowStatLabel}>Min Level</div>
                    </div>
                    <div style={s.lowArrow}>·</div>
                    <div style={s.lowStat}>
                      <div style={{ ...s.lowStatVal, color: c.primary }}>{p.reorder_level - p.current_stock + Math.ceil(p.reorder_level * 0.5)}</div>
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
                <tr>{['Date', 'Type', 'Product', 'Change', 'Note'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id}>
                    <td style={s.td}><span style={s.dateText}>{new Date(m.date).toLocaleString()}</span></td>
                    <td style={s.td}><span style={{ ...s.typeBadge, background: m.type === 'Sale' ? c.errorBg : m.type === 'GRN' ? c.successBg : c.infoBg, color: m.type === 'Sale' ? c.error : m.type === 'GRN' ? c.success : c.info }}>{m.type}</span></td>
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
  pageHeader: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 700, color: c.text, margin: 0, marginBottom: 4 },
  sub: { color: c.textMuted, fontSize: 14, margin: 0 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { borderRadius: 12, padding: '18px 20px', border: `1px solid ${c.border}` },
  statVal: { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 12, color: c.textMuted, marginTop: 6, fontWeight: 500 },
  tabs: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${c.border}`, paddingBottom: 0 },
  tab: { padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: c.textMuted, borderBottom: '2px solid transparent', marginBottom: -2, display: 'flex', alignItems: 'center', gap: 6 },
  tabActive: { color: c.primary, borderBottomColor: c.primary, fontWeight: 700 },
  tabBadge: { background: c.error, color: '#fff', borderRadius: 10, fontSize: 11, padding: '1px 6px', fontWeight: 700 },
  card: { background: c.surface, borderRadius: 14, border: `1px solid ${c.border}`, boxShadow: shadow.sm, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', background: c.bg, borderBottom: `2px solid ${c.border}` },
  td: { padding: '12px 16px', borderBottom: `1px solid ${c.border}`, verticalAlign: 'middle' },
  prodName: { fontWeight: 600, fontSize: 14, color: c.text },
  prodBrand: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  lowTag: { fontSize: 10, fontWeight: 700, color: c.error, marginTop: 3, letterSpacing: '0.05em' },
  empty: { padding: '50px', textAlign: 'center', color: c.textMuted, fontSize: 14 },
  noLow: { textAlign: 'center', padding: '60px', background: c.surface, borderRadius: 14, border: `1px solid ${c.border}`, color: c.textMuted },
  lowGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  lowCard: { background: c.surface, borderRadius: 12, border: `2px solid ${c.errorBorder}`, padding: 20, boxShadow: shadow.sm },
  lowCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  urgentBadge: { background: c.error, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '3px 8px', letterSpacing: '0.04em' },
  lowStats: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  lowStat: { textAlign: 'center' },
  lowStatVal: { fontSize: 24, fontWeight: 800, lineHeight: 1 },
  lowStatLabel: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  lowArrow: { color: c.textLight, fontSize: 16, fontWeight: 700 },
  lowUnit: { fontSize: 12, color: c.textMuted, borderTop: `1px solid ${c.border}`, paddingTop: 10 },
  filterBar: { display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  filterLabel: { fontSize: 11, fontWeight: 600, color: c.textSub, textTransform: 'uppercase', letterSpacing: '0.04em' },
  filterInput: { padding: '8px 12px', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 13, color: c.text },
  clearBtn: { padding: '8px 14px', background: c.errorBg, color: c.error, border: `1px solid ${c.errorBorder}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  filterCount: { fontSize: 13, color: c.textMuted, marginLeft: 'auto', alignSelf: 'center' },
  dateText: { fontSize: 12, color: c.textMuted },
  typeBadge: { fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 },
  noteText: { fontSize: 13, color: c.textSub, textTransform: 'capitalize' },
};

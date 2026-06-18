import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState('');
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all'); // all | active | inactive | unverified

  useEffect(() => {
    api.get('/admin/customers/')
      .then(r => setCustomers(r.data))
      .catch(() => setErr('Failed to load customers.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = customers;
    if (filter === 'active')     list = list.filter(c => c.is_active);
    if (filter === 'inactive')   list = list.filter(c => !c.is_active);
    if (filter === 'unverified') list = list.filter(c => !c.email_verified);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        c.email.toLowerCase().includes(q) ||
        (c.full_name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [customers, search, filter]);

  const FILTERS = [
    { key: 'all',        label: 'All' },
    { key: 'active',     label: 'Active' },
    { key: 'inactive',   label: 'Inactive' },
    { key: 'unverified', label: 'Unverified' },
  ];

  return (
    <div>
      <div style={s.pageHeader} className="fade-up">
        <div style={s.eyebrow}>Directory</div>
        <h2 style={s.title}>Customers</h2>
        <p style={s.sub}>All registered client accounts on the platform</p>
      </div>

      {/* Search + filter bar */}
      <div style={s.toolbar} className="fade-up">
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>⌕</span>
          <input
            style={s.searchInput}
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <div style={s.filters}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              style={{ ...s.filterBtn, ...(filter === f.key ? s.filterActive : {}) }}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.key !== 'all' && (
                <span style={{ ...s.filterCount, ...(filter === f.key ? s.filterCountActive : {}) }}>
                  {f.key === 'active'     ? customers.filter(c => c.is_active).length
                  : f.key === 'inactive'  ? customers.filter(c => !c.is_active).length
                  : customers.filter(c => !c.email_verified).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {err  && <div style={s.errBox}>{err}</div>}
      {loading && <div style={s.loader}><div style={s.spin} /></div>}

      {!loading && !err && (
        <>
          <div style={s.countRow}>
            <span style={s.countText}>
              {filtered.length === customers.length
                ? `${customers.length} customer${customers.length !== 1 ? 's' : ''}`
                : `${filtered.length} of ${customers.length}`}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div style={s.empty}>No customers match your search.</div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Customer', 'Email', 'Status', 'Bookings', 'Reviews', 'Orders', 'Last Login'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr
                      key={c.id}
                      style={s.tr}
                      onClick={() => navigate(`/admin/customers/${c.id}`)}
                    >
                      <td style={{ ...s.td, minWidth: 200 }}>
                        <div style={s.customerCell}>
                          <div style={{ ...s.avatar, background: c.is_active ? 'linear-gradient(145deg,#0D9488,#14B8A8)' : 'linear-gradient(145deg,#6B7280,#9CA3AF)' }}>
                            {initials(c.full_name || c.email)}
                          </div>
                          <div>
                            <div style={s.customerName}>{c.full_name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No name</span>}</div>
                            {!c.email_verified && (
                              <div style={s.unverifiedTag}>Unverified email</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ ...s.td, color: 'var(--text-muted)', fontSize: 12 }}>{c.email}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, ...(c.is_active ? s.badgeGreen : s.badgeGray) }}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ ...s.td, textAlign: 'center', fontWeight: 700, color: c.total_bookings > 0 ? '#0D9488' : 'var(--text-muted)' }}>
                        {c.total_bookings}
                      </td>
                      <td style={{ ...s.td, textAlign: 'center', color: c.total_reviews > 0 ? '#7C3AED' : 'var(--text-muted)' }}>
                        {c.total_reviews}
                      </td>
                      <td style={{ ...s.td, textAlign: 'center', color: c.total_orders > 0 ? '#D97706' : 'var(--text-muted)' }}>
                        {c.total_orders}
                      </td>
                      <td style={{ ...s.td, fontSize: 12, color: 'var(--text-muted)' }}>
                        {fmtDate(c.last_login)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const s = {
  pageHeader: { marginBottom: 22 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' },
  sub: { color: 'var(--text-muted)', fontSize: 13, margin: 0 },

  toolbar: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220,
    background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12,
    padding: '9px 14px',
  },
  searchIcon: { fontSize: 17, color: 'var(--text-muted)', flexShrink: 0 },
  searchInput: { flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" },
  clearBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', padding: '0 2px' },
  filters: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn: { padding: '8px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", transition: 'all .15s' },
  filterActive: { background: 'rgba(13,148,136,.12)', borderColor: 'rgba(13,148,136,.4)', color: '#0D9488' },
  filterCount: { background: 'var(--border)', borderRadius: 20, padding: '1px 6px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' },
  filterCountActive: { background: 'rgba(13,148,136,.2)', color: '#0D9488' },

  countRow: { marginBottom: 10 },
  countText: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 },

  loader: { display: 'flex', justifyContent: 'center', padding: 80 },
  spin: { width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(13,148,136,.2)', borderTopColor: '#0D9488', animation: 'spinSlow .7s linear infinite' },
  errBox: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '14px 18px', fontSize: 13 },
  empty: { textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: 14, fontStyle: 'italic' },

  tableWrap: { overflowX: 'auto', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,.04)' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'var(--surface)' },
  th: { padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--surface2)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' },
  tr: { cursor: 'pointer', transition: 'background .12s' },
  td: { padding: '13px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, verticalAlign: 'middle' },

  customerCell: { display: 'flex', alignItems: 'center', gap: 11 },
  avatar: { width: 36, height: 36, borderRadius: '50%', flexShrink: 0, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 },
  customerName: { fontWeight: 600, color: 'var(--text)', fontSize: 13 },
  unverifiedTag: { fontSize: 10, color: '#D97706', fontWeight: 600, marginTop: 2 },

  badge: { display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  badgeGreen: { color: '#0D9488', background: 'rgba(13,148,136,.1)' },
  badgeGray:  { color: '#6B7280', background: 'rgba(107,114,128,.1)' },
};

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const STATUS_COLORS = { pending: '#f39c12', active: '#27ae60', inactive: '#e74c3c' };

export default function AdminSalons() {
  const [salons, setSalons] = useState([]);

  const load = () => api.get('/admin/salons/').then(r => setSalons(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const approve = async id => {
    await api.post(`/salons/${id}/approve/`);
    load();
  };

  const reject = async id => {
    await api.post(`/salons/${id}/reject/`);
    load();
  };

  return (
    <div style={s.wrap}>
      <h2>All Salons</h2>
      <Link to="/admin/salons/pending" style={s.link}>View Pending Only →</Link>
      <table style={s.table}>
        <thead><tr>{['Name','Owner','City','Status','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
        <tbody>
          {salons.map(salon => (
            <tr key={salon.id}>
              <td style={s.td}>{salon.name}</td>
              <td style={s.td}>{salon.owner_email}</td>
              <td style={s.td}>{salon.address_city}</td>
              <td style={s.td}><span style={{ ...s.badge, background: STATUS_COLORS[salon.status] || '#888' }}>{salon.status}</span></td>
              <td style={s.td}>
                {salon.status === 'pending' && <>
                  <button style={s.approveBtn} onClick={() => approve(salon.id)}>Approve</button>
                  <button style={s.rejectBtn} onClick={() => reject(salon.id)}>Reject</button>
                </>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const s = {
  wrap: { maxWidth: 900, margin: '40px auto', padding: 24 },
  link: { display: 'inline-block', marginBottom: 16, color: '#2c3e50' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f4f4f4', padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #ddd' },
  td: { padding: '8px 12px', borderBottom: '1px solid #eee' },
  badge: { color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12 },
  approveBtn: { marginRight: 6, padding: '4px 10px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  rejectBtn: { padding: '4px 10px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
};

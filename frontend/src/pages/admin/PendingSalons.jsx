import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function PendingSalons() {
  const [salons, setSalons] = useState([]);

  const load = () => api.get('/admin/salons/pending/').then(r => setSalons(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const approve = async id => { await api.post(`/salons/${id}/approve/`); load(); };
  const reject = async id => { await api.post(`/salons/${id}/reject/`); load(); };

  return (
    <div style={s.wrap}>
      <h2>Pending Salon Approvals</h2>
      {salons.length === 0 && <p>No pending salons.</p>}
      {salons.map(salon => (
        <div key={salon.id} style={s.card}>
          <h3>{salon.name}</h3>
          <p>Business Reg: {salon.business_reg_number}</p>
          <p>Owner: {salon.owner_email}</p>
          <p>{salon.address_street}, {salon.address_city}, {salon.address_district} {salon.address_postal}</p>
          <p>Contact: {salon.contact_number} | {salon.email}</p>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button style={s.approveBtn} onClick={() => approve(salon.id)}>Approve</button>
            <button style={s.rejectBtn} onClick={() => reject(salon.id)}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const s = {
  wrap: { maxWidth: 700, margin: '40px auto', padding: 24 },
  card: { border: '1px solid #ddd', borderRadius: 8, padding: 20, marginBottom: 16 },
  approveBtn: { padding: '8px 18px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  rejectBtn: { padding: '8px 18px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
};

import { useState, useEffect } from 'react';
import api from '../../api/axios';

const DISC_LABEL = { percentage: '%', fixed: 'LKR' };
const EMPTY = { title: '', description: '', discount_type: 'percentage', discount_value: '', start_date: '', end_date: '', note: '', is_active: true };

function OfferForm({ init, onSave, onCancel, loading }) {
  const [f, setF] = useState({ ...EMPTY, ...init });
  const field = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const toggle = k => setF(p => ({ ...p, [k]: !p[k] }));

  return (
    <div style={fm.card} className="scale-in">
      <div style={fm.title}>{init ? 'Edit Offer' : 'Create New Offer'}</div>
      <div style={fm.grid}>
        <label style={fm.label}>Title *
          <input style={fm.input} value={f.title} onChange={field('title')} placeholder="e.g. Summer Glow Deal" required />
        </label>
        <label style={fm.label}>Discount Type
          <select style={fm.input} value={f.discount_type} onChange={field('discount_type')}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (LKR)</option>
          </select>
        </label>
        <label style={fm.label}>Discount Value *
          <input style={fm.input} type="number" min="0" value={f.discount_value} onChange={field('discount_value')} placeholder={f.discount_type === 'percentage' ? '20' : '500'} required />
        </label>
        <label style={fm.label}>Start Date *
          <input style={fm.input} type="date" value={f.start_date} onChange={field('start_date')} required />
        </label>
        <label style={fm.label}>End Date *
          <input style={fm.input} type="date" value={f.end_date} onChange={field('end_date')} required />
        </label>
        <label style={fm.label}>Active
          <button type="button" style={{ ...fm.toggle, ...(f.is_active ? fm.toggleOn : fm.toggleOff) }} onClick={() => toggle('is_active')}>
            {f.is_active ? '● Active' : '○ Inactive'}
          </button>
        </label>
      </div>
      <label style={{ ...fm.label, marginTop: 4 }}>Description
        <textarea style={{ ...fm.input, minHeight: 64, resize: 'vertical' }} value={f.description} onChange={field('description')} placeholder="What's this offer about?" />
      </label>
      <label style={{ ...fm.label, marginTop: 4 }}>Note (e.g. "Starting from [date]")
        <input style={fm.input} value={f.note} onChange={field('note')} placeholder="Any fine print or special message" />
      </label>
      <div style={fm.btnRow}>
        <button style={fm.cancelBtn} onClick={onCancel}>Cancel</button>
        <button style={{ ...fm.saveBtn, opacity: loading ? 0.7 : 1 }} onClick={() => onSave(f)} disabled={loading}>
          {loading ? 'Saving…' : init ? 'Save Changes' : '✦ Create Offer'}
        </button>
      </div>
    </div>
  );
}

export default function OwnerOffers() {
  const [offers, setOffers]   = useState([]);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId]   = useState(null);
  const [saveLoading, setSave] = useState(false);
  const [msg, setMsg]         = useState('');
  const [err, setErr]         = useState('');

  const load = () => api.get('/owner/offers/').then(r => setOffers(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const flash = (text, isErr = false) => {
    if (isErr) { setErr(text); setTimeout(() => setErr(''), 4000); }
    else { setMsg(text); setTimeout(() => setMsg(''), 3000); }
  };

  const handleCreate = async data => {
    setSave(true);
    try {
      await api.post('/owner/offers/', data);
      load(); setCreating(false); flash('Offer created!');
    } catch (e) { flash(e.response?.data?.detail || JSON.stringify(e.response?.data) || 'Error', true); }
    finally { setSave(false); }
  };

  const handleEdit = async data => {
    setSave(true);
    try {
      await api.patch(`/owner/offers/${editId}/`, data);
      load(); setEditId(null); flash('Offer updated!');
    } catch (e) { flash(e.response?.data?.detail || 'Error', true); }
    finally { setSave(false); }
  };

  const toggleActive = async offer => {
    try {
      await api.patch(`/owner/offers/${offer.id}/`, { is_active: !offer.is_active });
      load(); flash(offer.is_active ? 'Offer deactivated.' : 'Offer activated!');
    } catch { flash('Error toggling offer.', true); }
  };

  const deleteOffer = async id => {
    if (!window.confirm('Delete this offer permanently?')) return;
    try { await api.delete(`/owner/offers/${id}/`); load(); flash('Offer deleted.'); }
    catch { flash('Error deleting offer.', true); }
  };

  const isLive = o => {
    const today = new Date().toISOString().split('T')[0];
    return o.is_active && o.start_date <= today && o.end_date >= today;
  };

  return (
    <div>
      <div style={s.pageHeader} className="fade-up">
        <div>
          <div style={s.eyebrow}>Promotions</div>
          <h2 style={s.title}>Ongoing Offers</h2>
        </div>
        {!creating && editId == null && (
          <button style={s.createBtn} onClick={() => setCreating(true)}>+ Create Offer</button>
        )}
      </div>

      {msg && <div style={s.alertOk}>{msg}</div>}
      {err && <div style={s.alertErr}>{err}</div>}

      {creating && (
        <OfferForm onSave={handleCreate} onCancel={() => setCreating(false)} loading={saveLoading} />
      )}

      {offers.length === 0 && !creating && (
        <div style={s.empty} className="scale-in">
          <div style={s.emptyOrb}>◈</div>
          <h3 style={s.emptyTitle}>No offers yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Create an offer to attract new clients.</p>
        </div>
      )}

      <div style={s.grid}>
        {offers.map(offer => {
          const live  = isLive(offer);
          const color = live ? '#0D9488' : offer.is_active ? '#D97706' : '#94A3B8';
          const bg    = live ? 'rgba(13,148,136,.08)' : offer.is_active ? 'rgba(217,119,6,.08)' : 'rgba(148,163,184,.08)';

          if (editId === offer.id) {
            return (
              <div key={offer.id} style={{ gridColumn: '1 / -1' }}>
                <OfferForm
                  init={offer}
                  onSave={handleEdit}
                  onCancel={() => setEditId(null)}
                  loading={saveLoading}
                />
              </div>
            );
          }

          return (
            <div key={offer.id} style={s.card} className="fade-up">
              <div style={{ ...s.cardAccent, background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
              <div style={s.cardBody}>
                <div style={s.cardTop}>
                  <div>
                    <div style={s.offerTitle}>{offer.title}</div>
                    <span style={{ ...s.liveTag, color, background: bg }}>
                      {live ? '● Live' : offer.is_active ? '◌ Scheduled' : '○ Inactive'}
                    </span>
                  </div>
                  <div style={s.discountBadge}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 800, color }}>
                      {offer.discount_value}{DISC_LABEL[offer.discount_type]}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>off</span>
                  </div>
                </div>

                {offer.description && (
                  <p style={s.desc}>{offer.description}</p>
                )}

                <div style={s.dates}>
                  <span style={s.dateTag}>📅 {offer.start_date}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>→</span>
                  <span style={s.dateTag}>{offer.end_date}</span>
                </div>

                {offer.note && (
                  <div style={s.note}>💬 {offer.note}</div>
                )}

                <div style={s.actions}>
                  <button style={s.editBtn}    onClick={() => setEditId(offer.id)}>Edit</button>
                  <button style={offer.is_active ? s.deactivateBtn : s.activateBtn}
                    onClick={() => toggleActive(offer)}>
                    {offer.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button style={s.deleteBtn} onClick={() => deleteOffer(offer.id)}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 14 },
  eyebrow:    { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title:      { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' },
  createBtn:  { padding: '10px 22px', background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)', color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 14px rgba(124,58,237,.3)', fontFamily: "'DM Sans', sans-serif" },
  alertOk:    { background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  alertErr:   { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  empty:      { textAlign: 'center', padding: '64px 40px', background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(124,58,237,.06)' },
  emptyOrb:   { fontSize: 36, marginBottom: 16, display: 'block', color: 'var(--text-muted)' },
  emptyTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 },
  grid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  card:       { background: 'var(--surface)', borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(124,58,237,.06)' },
  cardAccent: { height: 3 },
  cardBody:   { padding: '18px 20px' },
  cardTop:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  offerTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.01em' },
  liveTag:    { fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, display: 'inline-block' },
  discountBadge: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 },
  desc:       { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 },
  dates:      { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
  dateTag:    { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 8, padding: '3px 8px', border: '1px solid var(--border)' },
  note:       { fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 14, lineHeight: 1.5 },
  actions:    { display: 'flex', gap: 7, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', flexWrap: 'wrap' },
  editBtn:       { padding: '5px 14px', background: 'rgba(124,58,237,.08)', color: '#7C3AED', border: '1px solid rgba(124,58,237,.2)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" },
  deactivateBtn: { padding: '5px 14px', background: 'rgba(217,119,6,.08)', color: '#D97706', border: '1px solid rgba(217,119,6,.2)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" },
  activateBtn:   { padding: '5px 14px', background: 'rgba(13,148,136,.08)', color: '#0D9488', border: '1px solid rgba(13,148,136,.2)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" },
  deleteBtn:     { padding: '5px 14px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" },
};

const fm = {
  card:      { background: 'var(--surface)', borderRadius: 18, padding: '22px 24px', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(124,58,237,.08)', marginBottom: 24 },
  title:     { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.01em' },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 8 },
  label:     { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 },
  input:     { padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)', background: 'var(--input-bg)', outline: 'none', fontFamily: "'DM Sans', sans-serif" },
  toggle:    { padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", transition: 'all .15s ease' },
  toggleOn:  { background: 'rgba(13,148,136,.12)', color: '#0D9488', border: '1px solid rgba(13,148,136,.25)' },
  toggleOff: { background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)' },
  btnRow:    { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 },
  cancelBtn: { padding: '9px 20px', background: 'var(--surface2)', color: 'var(--text-sub)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontWeight: 500, fontSize: 13, fontFamily: "'DM Sans', sans-serif" },
  saveBtn:   { padding: '9px 20px', background: 'linear-gradient(135deg, #7C3AED, #0D9488)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 12px rgba(124,58,237,.3)' },
};

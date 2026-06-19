import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { useBreakpoint } from '../../hooks/useMobile';

const CAT_COLORS = { Hair: '#0D9488', Nails: '#D4AF37', Skin: '#0B7A70', Makeup: '#C96B51', Bridal: '#BE123C', Other: '#0D9488' };
const BASE_CATS  = ['Hair', 'Nails', 'Skin', 'Makeup'];
const BRIDAL_CAT = 'Bridal';

function EditModal({ ss, onSave, onClose }) {
  const [price, setPrice]           = useState(ss.custom_price ?? ss.effective_price ?? '');
  const [duration, setDuration]     = useState(ss.custom_duration ?? ss.effective_duration ?? '');
  const [startingFrom, setStartingFrom] = useState(ss.is_price_starting_from ?? false);
  const [description, setDescription]  = useState(ss.description ?? '');
  const [loading, setLoading]       = useState(false);
  const [err, setErr]               = useState('');

  const save = async () => {
    if (Number(price) < 1) { setErr('Price must be at least LKR 1.'); return; }
    if (Number(duration) < 1) { setErr('Duration must be at least 1 minute.'); return; }
    setLoading(true); setErr('');
    try {
      await onSave(ss.id, {
        custom_price: Number(price),
        custom_duration: Number(duration),
        is_price_starting_from: startingFrom,
        description,
      });
      onClose();
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to save.');
    } finally { setLoading(false); }
  };

  return (
    <div style={m.overlay}>
      <div style={m.box} className="scale-in">
        <h3 style={m.title}>Edit — {ss.service_name}</h3>
        {err && <div style={m.err}>{err}</div>}

        <label style={m.label}>Custom Price (LKR)
          <input style={m.input} type="number" min="1" value={price} onChange={e => setPrice(e.target.value)} />
        </label>

        {/* Starting From toggle */}
        <div style={m.toggleRow}>
          <div style={{ flex: 1 }}>
            <div style={m.toggleTitle}>Show as "Starting From" price</div>
            <div style={m.toggleSub}>Displays as "Starting From LKR {price || '…'}" instead of a fixed price</div>
          </div>
          <button
            type="button"
            onClick={() => setStartingFrom(v => !v)}
            style={{ ...m.toggle, background: startingFrom ? 'linear-gradient(135deg,#0D9488,#0D9488)' : 'var(--surface2)', border: startingFrom ? 'none' : '1.5px solid var(--border)' }}
            aria-pressed={startingFrom}
          >
            <span style={{ ...m.knob, transform: startingFrom ? 'translateX(20px)' : 'translateX(2px)' }} />
          </button>
        </div>

        <label style={m.label}>Custom Duration (min)
          <input style={m.input} type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} />
        </label>

        <label style={m.label}>
          Service Description
          <span style={{ float: 'right', fontWeight: 400, color: description.length > 180 ? '#DC2626' : 'var(--text-muted)', fontSize: 11 }}>
            {description.length}/200
          </span>
          <textarea
            style={{ ...m.input, resize: 'vertical', minHeight: 90, lineHeight: 1.6 }}
            placeholder="Short description — highlights only (max 200 chars)."
            maxLength={200}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </label>

        <div style={m.btnRow}>
          <button style={m.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={m.saveBtn} onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

export default function OwnerServices() {
  const { salon } = useOwner();
  const { isMobile } = useBreakpoint();
  const [attached, setAttached] = useState([]);
  const [all, setAll]           = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [toAdd, setToAdd]       = useState('');
  const [error, setError]       = useState('');
  const [msg, setMsg]           = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Hair', price: '', duration: '', description: '', is_price_starting_from: false });
  const [creating, setCreating] = useState(false);
  const [sortOrder, setSortOrder] = useState('oldest');
  // Removal confirmation state
  const [removeTarget, setRemoveTarget] = useState(null); // { ss, assignedStaff[] }
  const [removing, setRemoving] = useState(false);

  const reload = () => {
    if (!salon) return;
    api.get(`/salons/${salon.id}/services/`).then(r => setAttached(r.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/services/').then(r => setAll(r.data)).catch(() => {});
    reload();
  }, [salon]);

  useEffect(() => {
    if (salon) api.get(`/salons/${salon.id}/staff-members/`).then(r => setStaffMembers(r.data.filter(m => m.is_active))).catch(() => {});
  }, [salon]);

  const attachedIds = new Set(attached.map(ss => ss.service));
  const available   = all.filter(s => !attachedIds.has(s.id));

  const availableByCategory = available.reduce((acc, s) => {
    const cat = s.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});
  const CAT_ORDER = ['Hair', 'Nails', 'Skin', 'Makeup', 'Bridal', 'Other'];
  const sortedAvailableCats = CAT_ORDER.filter(c => availableByCategory[c]);
  const remainingCats = Object.keys(availableByCategory).filter(c => !CAT_ORDER.includes(c));
  const orderedAvailableCats = [...sortedAvailableCats, ...remainingCats];

  const flash = text => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const attach = async () => {
    if (!toAdd || !salon) return;
    setError('');
    try {
      await api.post(`/salons/${salon.id}/services/`, { service: Number(toAdd) });
      reload(); flash('Service attached!'); setToAdd('');
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error');
    }
  };

  const confirmDetach = ss => {
    const assignedStaff = staffMembers.filter(m => (m.specialty_ids || []).includes(ss.service));
    setRemoveTarget({ ss, assignedStaff });
  };

  const doDetach = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.delete(`/salons/${salon.id}/services/${removeTarget.ss.id}/`);
      setAttached(prev => prev.filter(s => s.id !== removeTarget.ss.id));
      flash('Service removed.');
      setRemoveTarget(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error');
      setRemoveTarget(null);
    } finally { setRemoving(false); }
  };

  const saveEdit = async (ssId, data) => {
    await api.patch(`/salons/${salon.id}/services/${ssId}/`, data);
    reload();
    flash('Service updated.');
  };

  const createCustom = async () => {
    if (!form.name || !form.price || !form.duration) return setError('All fields are required.');
    if (Number(form.duration) < 1) return setError('Duration must be at least 1 minute.');
    if (Number(form.price) < 1) return setError('Price must be at least LKR 1.');
    setCreating(true); setError('');
    try {
      await api.post(`/salons/${salon.id}/services/custom/`, {
        name: form.name, category: form.category,
        price: Number(form.price), duration: Number(form.duration),
        description: form.description,
        is_price_starting_from: form.is_price_starting_from,
      });
      reload();
      flash('Custom service created!');
      setForm({ name: '', category: 'Hair', price: '', duration: '', description: '', is_price_starting_from: false });
      setShowCreate(false);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create service.');
    } finally { setCreating(false); }
  };

  const grouped = attached.reduce((acc, ss) => {
    const cat = ss.service_category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ss);
    return acc;
  }, {});

  return (
    <div>
      {editTarget && (
        <EditModal
          ss={editTarget}
          onSave={saveEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      <div style={{ ...s.pageHeader, flexDirection: isMobile ? 'column' : 'row' }} className="fade-up">
        <div>
          <div style={s.eyebrow}>Catalogue</div>
          <h2 style={s.title}>Services</h2>
        </div>
        <div style={{ ...s.headerRight, flexDirection: isMobile ? 'column' : 'row', width: isMobile ? '100%' : 'auto' }}>
          <div style={{ ...s.addRow, width: isMobile ? '100%' : 'auto' }}>
            <select style={{ ...s.select, flex: isMobile ? 1 : 'none' }} value={toAdd} onChange={e => setToAdd(e.target.value)}>
              <option value="">— Attach from catalogue —</option>
              {orderedAvailableCats.map(cat => (
                <optgroup key={cat} label={cat === 'Bridal' ? 'Bridal & Party' : cat}>
                  {availableByCategory[cat].map(sv => (
                    <option key={sv.id} value={sv.id}>{sv.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button style={{ ...s.addBtn, opacity: !toAdd ? 0.6 : 1 }} onClick={attach} disabled={!toAdd}>
              Attach
            </button>
          </div>
          <select
            style={{ ...s.select, minWidth: 160 }}
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            title="Sort order"
          >
            <option value="oldest">Oldest First</option>
            <option value="newest">Newest First</option>
          </select>
          <button style={{ ...s.createBtn, width: isMobile ? '100%' : 'auto' }} onClick={() => setShowCreate(o => !o)}>
            {showCreate ? '✕ Cancel' : '+ Create Custom'}
          </button>
        </div>
      </div>

      {/* Create custom service form */}
      {showCreate && (
        <div style={s.createCard} className="scale-in">
          <div style={s.createTitle}>Create a Custom Service</div>
          <div style={s.createGrid}>
            <label style={s.fLabel}>Service Name
              <input style={s.fInput} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Signature Hair Treatment" />
            </label>
            <label style={s.fLabel}>Category
              <select style={s.fInput} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {[...BASE_CATS, ...(salon?.gender_focus !== 'male' ? [BRIDAL_CAT] : [])].map(c => (
                  <option key={c} value={c}>{c === 'Bridal' ? 'Bridal & Party' : c}</option>
                ))}
              </select>
            </label>
            <label style={s.fLabel}>Price (LKR)
              <input style={s.fInput} type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" />
            </label>
            <label style={s.fLabel}>Duration (min)
              <input style={s.fInput} type="number" min="1" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="30" />
            </label>
          </div>

          {/* Starting From toggle */}
          <div style={s.sfRow}>
            <div style={{ flex: 1 }}>
              <div style={s.sfTitle}>Show as "Starting From" price</div>
              <div style={s.sfSub}>Clients will see "Starting From LKR {form.price || '…'}" instead of a fixed price</div>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, is_price_starting_from: !f.is_price_starting_from }))}
              style={{ ...s.sfToggle, background: form.is_price_starting_from ? 'linear-gradient(135deg,#0D9488,#0D9488)' : 'var(--surface2)', border: form.is_price_starting_from ? 'none' : '1.5px solid var(--border)' }}
            >
              <span style={{ ...s.sfKnob, transform: form.is_price_starting_from ? 'translateX(20px)' : 'translateX(2px)' }} />
            </button>
          </div>

          <label style={{ ...s.fLabel, marginTop: 14 }}>
            Service Description
            <span style={{ float: 'right', fontWeight: 400, color: (form.description?.length || 0) > 180 ? '#DC2626' : 'var(--text-muted)', fontSize: 11 }}>
              {form.description?.length || 0}/200
            </span>
            <textarea
              style={{ ...s.fInput, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }}
              placeholder="Short description — highlights only (max 200 chars)."
              maxLength={200}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </label>

          <button style={{ ...s.addBtn, opacity: creating ? 0.7 : 1, marginTop: 14 }} onClick={createCustom} disabled={creating}>
            {creating ? 'Creating…' : '✦ Create Service'}
          </button>
        </div>
      )}

      {error && <div style={s.alertErr}>{error}</div>}
      {msg   && <div style={s.alertOk}>{msg}</div>}

      {attached.length === 0 && (
        <div style={s.empty} className="scale-in">
          <div style={s.emptyOrb}>✂</div>
          <h3 style={s.emptyTitle}>No services yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            Attach services from the catalogue or create your own above.
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([cat, rawItems]) => {
        const color = CAT_COLORS[cat] || '#0D9488';
        const items = [...rawItems].sort((a, b) => sortOrder === 'newest' ? b.id - a.id : a.id - b.id);
        return (
          <div key={cat} style={s.catSection}>
            <div style={s.catHeader}>
              <span style={{ ...s.catBadge, color, background: color + '14', border: `1px solid ${color}30` }}>{cat}</span>
              <span style={s.catCount}>{items.length} service{items.length > 1 ? 's' : ''}</span>
            </div>
            <div style={s.grid}>
              {items.map(ss => {
                const isCustom = !!ss.service_is_private;
                return (
                  <div key={ss.id} style={s.card} className="fade-up">
                    <div style={{ ...s.cardAccent, background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
                    <div style={s.cardBody}>
                      <div style={s.cardTop}>
                        <div>
                          <div style={s.svcName}>{ss.service_name}</div>
                          {isCustom && (
                            <span style={s.customTag}>Custom</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={s.editBtn} onClick={() => setEditTarget(ss)}>Edit</button>
                          <button style={s.detachBtn} onClick={() => confirmDetach(ss)}>Remove</button>
                        </div>
                      </div>
                      <div style={s.meta}>
                        <span style={s.metaItem}>⏱ {ss.effective_duration} min</span>
                        <span style={{ ...s.price, color }}>
                          {ss.is_price_starting_from && <span style={s.startingFromLabel}>Starting From </span>}
                          LKR {ss.effective_price}
                        </span>
                      </div>
                      {ss.description ? (
                        <div style={s.descText}>{ss.description}</div>
                      ) : null}
                      {ss.custom_price != null && (
                        <div style={s.customNote}>Custom price set</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {removeTarget && (
        <div style={s.rmOverlay} onClick={e => e.target === e.currentTarget && setRemoveTarget(null)}>
          <div style={s.rmBox} className="scale-in">
            <div style={s.rmIcon}>⚠</div>
            <h3 style={s.rmTitle}>Remove Service?</h3>
            <p style={s.rmSub}>
              You are about to remove <strong>{removeTarget.ss.service_name}</strong> from your salon.
            </p>
            {removeTarget.assignedStaff.length > 0 ? (
              <div style={s.rmWarnBlock}>
                <div style={s.rmWarnTitle}>⚠ This service is assigned to {removeTarget.assignedStaff.length} team member{removeTarget.assignedStaff.length > 1 ? 's' : ''}:</div>
                <div style={s.rmStaffList}>
                  {removeTarget.assignedStaff.map(m => (
                    <span key={m.id} style={s.rmStaffChip}>{m.full_name}</span>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  Removing this service will also unassign it from all team members above.
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                This service is not assigned to any team members.
              </div>
            )}
            <div style={s.rmActions}>
              <button style={s.rmCancelBtn} onClick={() => setRemoveTarget(null)}>Cancel</button>
              <button style={{ ...s.rmDeleteBtn, opacity: removing ? 0.7 : 1 }} onClick={doDetach} disabled={removing}>
                {removing ? 'Removing…' : removeTarget.assignedStaff.length > 0 ? 'Delete Anyway' : 'Remove Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  pageHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 28, flexWrap: 'wrap', gap: 14,
  },
  eyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title:   { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' },
  headerRight: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  addRow:  { display: 'flex', gap: 10, alignItems: 'center' },
  select:  { padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 11, fontSize: 14, color: 'var(--text)', background: 'var(--input-bg)', fontFamily: "'DM Sans', sans-serif", outline: 'none', minWidth: 220 },
  addBtn: {
    padding: '10px 22px',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer',
    fontWeight: 700, fontSize: 14, boxShadow: '0 4px 14px rgba(13,148,136,.3)',
    fontFamily: "'DM Sans', sans-serif",
  },
  createBtn: {
    padding: '10px 22px',
    background: 'var(--surface)', color: '#0D9488',
    border: '1.5px solid rgba(13,148,136,.3)', borderRadius: 11, cursor: 'pointer',
    fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  },
  createCard: {
    background: 'var(--surface)', borderRadius: 18, padding: '22px 24px',
    border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(13,148,136,.08)',
    marginBottom: 24,
  },
  createTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 18, letterSpacing: '-0.01em' },
  createGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 8 },
  fLabel:  { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  fInput:  { padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)', background: 'var(--input-bg)', outline: 'none', fontFamily: "'DM Sans', sans-serif" },
  alertErr: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  alertOk:  { background: '#F0FDFA', border: '1px solid #99F6E4', color: '#0D9488', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 18 },
  empty: { textAlign: 'center', padding: '64px 40px', background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(13,148,136,.06)' },
  emptyOrb:   { fontSize: 36, marginBottom: 16, display: 'block', color: 'var(--text-muted)' },
  emptyTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 },
  catSection: { marginBottom: 30 },
  catHeader:  { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  catBadge:   { padding: '5px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700 },
  catCount:   { fontSize: 12, color: 'var(--text-muted)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 },
  card: { background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(13,148,136,.06)', border: '1px solid var(--border)' },
  cardAccent: { height: 3, width: '100%' },
  cardBody:   { padding: '16px 18px' },
  cardTop:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  svcName:    { fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.3, marginBottom: 4 },
  customTag:  { fontSize: 10, fontWeight: 700, color: '#0D9488', background: 'rgba(13,148,136,.1)', border: '1px solid rgba(13,148,136,.25)', borderRadius: 10, padding: '2px 8px', display: 'inline-block' },
  editBtn:    { padding: '4px 10px', background: 'rgba(13,148,136,.08)', color: '#0D9488', border: '1px solid rgba(13,148,136,.2)', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600, flexShrink: 0 },
  detachBtn:  { padding: '4px 10px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600, flexShrink: 0 },
  meta:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  metaItem:   { fontSize: 12, color: 'var(--text-muted)' },
  price:      { fontWeight: 700, fontSize: 16 },
  customNote: { marginTop: 8, fontSize: 11, color: '#0D9488', background: 'rgba(13,148,136,.08)', borderRadius: 6, padding: '2px 8px', display: 'inline-block', border: '1px solid rgba(13,148,136,.2)' },
  startingFromLabel: { fontSize: 11, fontWeight: 600, opacity: 0.75 },
  descText: { marginTop: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 8, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  sfRow:    { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)', marginTop: 4, marginBottom: 4 },
  sfTitle:  { fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 },
  sfSub:    { fontSize: 11, color: 'var(--text-muted)' },
  sfToggle: { width: 44, height: 24, borderRadius: 99, cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 },
  sfKnob:   { position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.2)', transition: 'transform .2s' },

  rmOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(8,6,17,.6)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1500, padding: 20, animation: 'backdropIn .22s ease both',
  },
  rmBox: {
    background: 'var(--surface)', borderRadius: 22, padding: '36px 32px',
    maxWidth: 460, width: '100%', textAlign: 'center',
    boxShadow: '0 32px 80px rgba(0,0,0,.35)', border: '1px solid var(--border)',
  },
  rmIcon: {
    width: 56, height: 56, borderRadius: '50%', background: '#FFFBEB',
    border: '2px solid #FCD34D', color: '#D97706',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, margin: '0 auto 16px',
  },
  rmTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px',
  },
  rmSub: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 16px' },
  rmWarnBlock: {
    background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 12,
    padding: '12px 16px', textAlign: 'left', marginBottom: 20,
  },
  rmWarnTitle: { fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 8 },
  rmStaffList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  rmStaffChip: {
    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
    background: 'rgba(217,119,6,.1)', color: '#92400E', border: '1px solid #FCD34D',
  },
  rmActions: { display: 'flex', gap: 10, justifyContent: 'center', marginTop: 6 },
  rmCancelBtn: {
    padding: '10px 22px', background: 'var(--surface2)',
    border: '1.5px solid var(--border)', borderRadius: 12,
    cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)',
    fontFamily: "'DM Sans', sans-serif",
  },
  rmDeleteBtn: {
    padding: '10px 24px', background: '#DC2626', border: 'none', borderRadius: 12,
    cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#fff',
    boxShadow: '0 4px 14px rgba(220,38,38,.35)', fontFamily: "'DM Sans', sans-serif",
  },
};

const m = {
  overlay: { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  box:     { background: 'var(--surface)', borderRadius: 20, maxWidth: 420, width: '100%', padding: '26px 28px', boxShadow: '0 20px 60px rgba(0,0,0,.3)' },
  title:   { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 20 },
  err:     { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 10, padding: '9px 14px', fontSize: 13, marginBottom: 16 },
  label:   { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 },
  input:   { padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)', background: 'var(--input-bg)', outline: 'none', fontFamily: "'DM Sans', sans-serif" },
  btnRow:  { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  cancelBtn: { padding: '9px 20px', background: 'var(--surface2)', color: 'var(--text-sub)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontWeight: 500, fontSize: 13, fontFamily: "'DM Sans', sans-serif" },
  saveBtn:   { padding: '9px 20px', background: 'linear-gradient(135deg, #0D9488, #0D9488)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 12px rgba(13,148,136,.3)' },
  toggleRow:   { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16 },
  toggleTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 },
  toggleSub:   { fontSize: 11, color: 'var(--text-muted)' },
  toggle: { width: 44, height: 24, borderRadius: 99, cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 },
  knob:   { position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.2)', transition: 'transform .2s' },
};

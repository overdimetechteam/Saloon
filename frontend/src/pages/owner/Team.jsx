import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { useBreakpoint } from '../../hooks/useMobile';

const COLORS = ['#0D9488','#14B8A8','#D4AF37','#0B7A70','#D4AF37','#0D9488'];
const ALL_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' };

const ROLE_OPTIONS = [
  { value: 'stylist',      label: 'Stylist' },
  { value: 'barber',       label: 'Barber' },
  { value: 'colorist',     label: 'Colorist' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'manager',      label: 'Manager' },
  { value: 'other',        label: 'Other' },
];
const ROLE_LABEL = Object.fromEntries(ROLE_OPTIONS.map(r => [r.value, r.label]));

const emptyForm = () => ({ full_name: '', role: 'stylist', phone: '', specialties: [], working_days: [] });

export default function OwnerTeam() {
  const { salon } = useOwner();
  const { isMobile } = useBreakpoint();
  const [staff, setStaff] = useState([]);
  const [salonServices, setSalonServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null); // member pending delete

  const load = () => {
    if (!salon) return;
    setLoading(true);
    Promise.all([
      api.get(`/salons/${salon.id}/staff-members/`),
      api.get(`/salons/${salon.id}/services/`),
    ])
      .then(([staffRes, svcRes]) => {
        setStaff(staffRes.data.filter(m => m.is_active));
        setSalonServices(svcRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [salon]);

  const openEdit = member => {
    setEditing(member);
    setForm({
      full_name: member.full_name,
      role: member.role || 'other',
      phone: member.phone || '',
      specialties: member.specialty_ids || [],
      working_days: member.working_days || [],
    });
    setError(''); setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); };

  const toggleDay = day => setForm(f => ({
    ...f,
    working_days: f.working_days.includes(day)
      ? f.working_days.filter(d => d !== day)
      : [...f.working_days, day],
  }));

  const toggleSpecialty = serviceId => setForm(f => ({
    ...f,
    specialties: f.specialties.includes(serviceId)
      ? f.specialties.filter(id => id !== serviceId)
      : [...f.specialties, serviceId],
  }));

  const save = async e => {
    e.preventDefault(); setError('');
    if (!form.full_name.trim()) return setError('Name is required');
    setSaving(true);
    try {
      await api.patch(`/salons/${salon.id}/staff-members/${editing.id}/`, {
        full_name: form.full_name,
        role: form.role,
        phone: form.phone,
        working_days: form.working_days,
        specialties: form.specialties,
      });
      setMsg('Team member updated.');
      closeForm(); load();
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error saving');
    } finally { setSaving(false); }
  };

  const remove = member => setConfirmTarget(member);

  const doRemove = async () => {
    const member = confirmTarget;
    setConfirmTarget(null);
    try {
      await api.delete(`/salons/${salon.id}/staff-members/${member.id}/`);
      setMsg(`${member.full_name} removed.`); load();
    } catch { setMsg('Error removing member.'); }
  };

  const toggleStaffHV = async member => {
    const next = !member.home_visit_available;
    setStaff(prev => prev.map(m => m.id === member.id ? { ...m, home_visit_available: next } : m));
    try {
      await api.patch(`/salons/${salon.id}/staff-members/${member.id}/`, { home_visit_available: next });
    } catch {
      setStaff(prev => prev.map(m => m.id === member.id ? { ...m, home_visit_available: !next } : m));
    }
  };

  if (!salon) return <div style={{ color: 'var(--text-muted)', padding: 40 }}>Loading salon…</div>;

  return (
    <div style={s.page}>
      <div style={{ ...s.header, flexDirection: isMobile ? 'column' : 'row' }} className="fade-up">
        <div>
          <div style={s.eyebrow}>Staff</div>
          <h1 style={s.title}>Team</h1>
          <p style={s.sub}>Professionals at {salon.name} — add members via Staff Profiles</p>
        </div>
      </div>

      {msg && (
        <div style={s.toast} className="fade-in">
          {msg}
          <button style={s.toastClose} onClick={() => setMsg('')}>✕</button>
        </div>
      )}

      {showForm && (
        <div style={s.modalOverlay} onClick={e => e.target === e.currentTarget && closeForm()}>
          <div style={{ ...s.modalBox, width: isMobile ? '95vw' : 640 }} className="scale-in">
            <div style={s.modalHead}>
              <div>
                <div style={s.modalEyebrow}>Team</div>
                <h3 style={s.modalTitle}>Edit — {editing?.full_name}</h3>
              </div>
              <button style={s.modalClose} onClick={closeForm}>✕</button>
            </div>

            {error && <div style={s.alert}>{error}</div>}

            <form onSubmit={save}>
              <div style={{ ...s.formGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr' }}>
                <div style={s.field}>
                  <label style={s.label}>Full Name *</label>
                  <input style={s.input} value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="e.g. Ayesha Perera" autoFocus />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Role</label>
                  <select style={s.input} value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLE_OPTIONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Phone</label>
                  <input style={s.input} value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. 077 123 4567" />
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <label style={s.label}>Working Days</label>
                <div style={s.dayRow}>
                  {ALL_DAYS.map(day => {
                    const on = form.working_days.includes(day);
                    return (
                      <button type="button" key={day}
                        style={{ ...s.dayChip, ...(on ? s.dayChipOn : {}) }}
                        onClick={() => toggleDay(day)}>
                        {DAY_LABELS[day]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {salonServices.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <label style={s.label}>Specialties</label>
                  <div style={s.specGrid}>
                    {salonServices.map(ss => {
                      const on = form.specialties.includes(ss.service);
                      return (
                        <label key={ss.id} style={{ ...s.specItem, ...(on ? s.specItemOn : {}) }}>
                          <input type="checkbox" checked={on} onChange={() => toggleSpecialty(ss.service)} style={{ display: 'none' }} />
                          <span style={{ ...s.specCheck, ...(on ? s.specCheckOn : {}) }}>{on && '✓'}</span>
                          {ss.service_name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={s.formActions}>
                <button type="button" style={s.cancelBtn} onClick={closeForm}>Cancel</button>
                <button type="submit" style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmTarget && (
        <div style={s.modalOverlay} onClick={e => e.target === e.currentTarget && setConfirmTarget(null)}>
          <div style={s.confirmBox} className="scale-in">
            <div style={s.confirmIcon}>✕</div>
            <h3 style={s.confirmTitle}>Remove Team Member?</h3>
            <p style={s.confirmSub}>
              Are you sure you want to remove <strong>{confirmTarget.full_name}</strong> from the team? This action cannot be undone.
            </p>
            <div style={s.confirmActions}>
              <button style={s.cancelBtn} onClick={() => setConfirmTarget(null)}>Cancel</button>
              <button style={s.deletConfirmBtn} onClick={doRemove}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={s.loadingRow}>{[1,2,3].map(i => <div key={i} style={s.skeleton} className="shimmer" />)}</div>
      ) : staff.length === 0 ? (
        <div style={s.empty} className="scale-in">
          <div style={s.emptyIcon}>✦</div>
          <h3 style={s.emptyTitle}>No team members yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Add staff members in <strong>Staff Profiles</strong> — they'll appear here automatically.
          </p>
        </div>
      ) : (
        <div style={s.grid} className="fade-up">
          {staff.map((member, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <div key={member.id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={{ ...s.avatar, background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`, boxShadow: `0 4px 14px ${color}40`, overflow: 'hidden', padding: 0 }}>
                    {member.photo_url
                      ? <img src={member.photo_url} alt={member.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} />
                      : <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{member.full_name[0].toUpperCase()}</span>
                    }
                  </div>
                  <div style={s.cardMeta}>
                    <div style={s.name}>{member.full_name}</div>
                    <div style={{ ...s.roleTag, color, background: color + '14', borderColor: color + '33' }}>
                      {ROLE_LABEL[member.role] || member.role || 'Staff'}
                    </div>
                  </div>
                </div>

                {member.working_days?.length > 0 && (
                  <div style={s.daysRow}>
                    {member.working_days.map(d => (
                      <span key={d} style={s.dayBadge}>{DAY_LABELS[d]}</span>
                    ))}
                  </div>
                )}

                {member.specialty_names?.length > 0 && (
                  <div style={s.specTags}>
                    {member.specialty_names.map(name => (
                      <span key={name} style={s.specTag}>✂ {name}</span>
                    ))}
                  </div>
                )}

                {member.phone && <div style={s.phone}>📞 {member.phone}</div>}

                <div style={{ ...s.hvRow, background: member.home_visit_available ? 'rgba(13,148,136,.07)' : 'var(--surface2)', borderColor: member.home_visit_available ? 'rgba(13,148,136,.25)' : 'var(--border)' }}>
                  <div style={s.hvRowText}>
                    <span style={{ ...s.hvRowLabel, color: member.home_visit_available ? '#0D9488' : 'var(--text-muted)' }}>🏠 Home Visit</span>
                    <span style={s.hvRowSub}>{member.home_visit_available ? 'Available for home visits' : 'Not assigned to home visits'}</span>
                  </div>
                  <button
                    style={{ ...s.hvToggle, background: member.home_visit_available ? 'linear-gradient(135deg, #0D9488, #0B7A70)' : 'var(--surface)', border: member.home_visit_available ? 'none' : '1.5px solid var(--border)' }}
                    onClick={() => toggleStaffHV(member)}
                    aria-pressed={member.home_visit_available}
                  >
                    <span style={{ ...s.hvKnob, transform: member.home_visit_available ? 'translateX(20px)' : 'translateX(2px)' }} />
                  </button>
                </div>

                <div style={s.cardActions}>
                  <button style={s.editBtn} onClick={() => openEdit(member)}>Edit</button>
                  <button style={s.removeBtn} onClick={() => remove(member)}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  page: { maxWidth: 960, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  eyebrow: {
    fontSize: 10, fontWeight: 700, color: 'var(--brand-label)',
    letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6,
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em',
  },
  sub: { fontSize: 14, color: 'var(--text-muted)', margin: 0 },
  toast: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#F0FDFA', border: '1px solid #99F6E4', color: '#0D9488',
    borderRadius: 12, padding: '11px 18px', fontSize: 13, marginBottom: 22,
  },
  toastClose: { background: 'none', border: 'none', cursor: 'pointer', color: '#0D9488', fontSize: 14 },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(8,6,17,.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1200, padding: 20, backdropFilter: 'blur(6px)',
    animation: 'backdropIn .22s ease both',
  },
  modalBox: {
    background: 'var(--surface)', borderRadius: 24, padding: 32,
    maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 32px 80px rgba(0,0,0,.35), 0 8px 24px rgba(13,148,136,.15)',
    border: '1px solid var(--border)',
  },
  modalHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24,
  },
  modalEyebrow: {
    fontSize: 9, fontWeight: 700, color: 'var(--brand-label)',
    letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 5,
  },
  modalTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em',
  },
  modalClose: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', fontSize: 15, cursor: 'pointer',
    padding: '6px 10px', lineHeight: 1, borderRadius: 8,
  },
  confirmBox: {
    background: 'var(--surface)', borderRadius: 22, padding: '36px 32px',
    maxWidth: 420, width: '100%', textAlign: 'center',
    boxShadow: '0 32px 80px rgba(0,0,0,.35)',
    border: '1px solid var(--border)',
  },
  confirmIcon: {
    width: 56, height: 56, borderRadius: '50%', background: '#FEF2F2',
    border: '2px solid #FECACA', color: '#DC2626',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, fontWeight: 800, margin: '0 auto 18px',
  },
  confirmTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px',
  },
  confirmSub: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 26px' },
  confirmActions: { display: 'flex', gap: 10, justifyContent: 'center' },
  deletConfirmBtn: {
    padding: '10px 24px', background: '#DC2626', border: 'none', borderRadius: 12,
    cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#fff',
    boxShadow: '0 4px 14px rgba(220,38,38,.35)', fontFamily: "'DM Sans', sans-serif",
  },
  alert: {
    background: '#FEF2F2', border: '1px solid #FCA5A5',
    color: '#DC2626', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 18,
  },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6,
  },
  input: {
    padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 11,
    fontSize: 14, background: 'var(--input-bg)', color: 'var(--text)',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
    width: '100%', boxSizing: 'border-box',
  },
  dayRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  dayChip: {
    padding: '6px 14px', borderRadius: 20, border: '1.5px solid var(--border)',
    background: 'var(--surface)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
    color: 'var(--text-muted)', transition: 'all .15s ease',
    fontFamily: "'DM Sans', sans-serif",
  },
  dayChipOn: {
    background: 'linear-gradient(135deg, #0D9488, #0D9488)',
    color: '#fff', borderColor: 'transparent',
    boxShadow: '0 3px 10px rgba(13,148,136,.3)',
  },
  specGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  specItem: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px',
    border: '1.5px solid var(--border)', borderRadius: 10, cursor: 'pointer',
    fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', background: 'var(--surface2)',
    transition: 'all .15s ease',
  },
  specItemOn: { borderColor: '#0D9488', background: 'rgba(13,148,136,.08)', color: '#0D9488' },
  specCheck: {
    width: 18, height: 18, borderRadius: 5, border: '1.5px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 700, flexShrink: 0, color: '#fff',
  },
  specCheckOn: { background: 'linear-gradient(135deg, #0D9488, #0D9488)', borderColor: 'transparent' },
  formActions: { display: 'flex', gap: 10, paddingTop: 22 },
  cancelBtn: {
    padding: '10px 22px', background: 'var(--surface2)',
    border: '1.5px solid var(--border)', borderRadius: 12,
    cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)',
    fontFamily: "'DM Sans', sans-serif",
  },
  saveBtn: {
    padding: '10px 28px',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 50%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer',
    fontSize: 14, fontWeight: 700, boxShadow: '0 4px 14px rgba(13,148,136,.3)',
    fontFamily: "'DM Sans', sans-serif",
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 },
  card: {
    background: 'var(--surface)', borderRadius: 20, padding: 22,
    border: '1px solid var(--border)',
    boxShadow: '0 4px 16px rgba(13,148,136,.06)',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: 14 },
  avatar: {
    width: 52, height: 52, borderRadius: 16, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  cardMeta: { flex: 1, minWidth: 0 },
  name: {
    fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 5,
    letterSpacing: '-0.01em',
  },
  roleTag: {
    display: 'inline-block', fontSize: 11, fontWeight: 600,
    padding: '3px 10px', borderRadius: 20, border: '1px solid',
    textTransform: 'capitalize',
  },
  daysRow: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  dayBadge: {
    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
    background: 'rgba(13,148,136,.08)', color: '#0D9488',
    border: '1px solid rgba(13,148,136,.2)',
  },
  specTags: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  specTag: {
    fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
    background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)',
  },
  phone: { fontSize: 13, color: 'var(--text-muted)' },
  cardActions: {
    display: 'flex', gap: 8, borderTop: '1px solid var(--border)',
    paddingTop: 14, marginTop: 2,
  },
  editBtn: {
    flex: 1, padding: '8px', background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: 9,
    cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text)',
    fontFamily: "'DM Sans', sans-serif",
  },
  removeBtn: {
    padding: '8px 14px', background: '#FEF2F2', border: '1px solid #FECACA',
    borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#DC2626',
    fontFamily: "'DM Sans', sans-serif",
  },
  hvRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)',
    transition: 'background .2s ease, border-color .2s ease',
  },
  hvRowText: { flex: 1, minWidth: 0 },
  hvRowLabel: { fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 2, transition: 'color .2s ease' },
  hvRowSub: { fontSize: 11, color: 'var(--text-muted)' },
  hvToggle: {
    width: 46, height: 26, borderRadius: 13, flexShrink: 0,
    position: 'relative', cursor: 'pointer',
    transition: 'background .25s ease, border .25s ease', padding: 0,
  },
  hvKnob: {
    position: 'absolute', top: 3, width: 20, height: 20,
    borderRadius: '50%', background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,.25)',
    transition: 'transform .22s cubic-bezier(.16,1,.3,1)', display: 'block',
  },
  loadingRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 },
  skeleton: { height: 200, borderRadius: 20 },
  empty: {
    textAlign: 'center', padding: '72px 40px',
    background: 'var(--surface)', borderRadius: 22,
    border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(13,148,136,.06)',
  },
  emptyIcon: {
    fontSize: 30, marginBottom: 18,
    display: 'inline-flex', width: 72, height: 72, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A8 100%)',
    color: '#fff', boxShadow: '0 8px 24px rgba(13,148,136,.35)',
  },
  emptyTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px',
  },
};

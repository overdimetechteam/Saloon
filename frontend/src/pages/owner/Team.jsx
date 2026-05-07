import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';
import { c } from '../../styles/theme';

const COLORS = ['#7C3AED','#0D9488','#2563EB','#059669','#D97706','#DC2626'];
const ALL_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' };

const emptyForm = () => ({ full_name: '', role: '', phone: '', specialties: [], working_days: [] });

export default function OwnerTeam() {
  const { salon } = useOwner();
  const [staff, setStaff] = useState([]);
  const [salonServices, setSalonServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    if (!salon) return;
    setLoading(true);
    Promise.all([
      api.get(`/salons/${salon.id}/staff/`),
      api.get(`/salons/${salon.id}/services/`),
    ])
      .then(([staffRes, svcRes]) => { setStaff(staffRes.data); setSalonServices(svcRes.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [salon]);

  const openAdd = () => {
    setEditing(null); setForm(emptyForm()); setError(''); setShowForm(true);
  };

  const openEdit = member => {
    setEditing(member);
    setForm({
      full_name: member.full_name,
      role: member.role || '',
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
      const payload = {
        full_name: form.full_name,
        role: form.role,
        phone: form.phone,
        working_days: form.working_days,
        specialties: form.specialties,
      };
      if (editing) {
        await api.patch(`/salons/${salon.id}/staff/${editing.id}/`, payload);
        setMsg('Team member updated.');
      } else {
        await api.post(`/salons/${salon.id}/staff/`, payload);
        setMsg('Team member added.');
      }
      closeForm(); load();
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error saving');
    } finally { setSaving(false); }
  };

  const remove = async member => {
    if (!window.confirm(`Remove ${member.full_name} from the team?`)) return;
    try {
      await api.delete(`/salons/${salon.id}/staff/${member.id}/`);
      setMsg(`${member.full_name} removed.`); load();
    } catch { setMsg('Error removing member.'); }
  };

  if (!salon) return <div style={{ color: c.textMuted, padding: 40 }}>Loading salon…</div>;

  return (
    <div style={s.page}>
      <div style={s.header} className="fade-up">
        <div>
          <h1 style={s.title}>Team</h1>
          <p style={s.sub}>Manage professionals at {salon.name}</p>
        </div>
        <button style={s.addBtn} onClick={openAdd}>+ Add Member</button>
      </div>

      {msg && (
        <div style={s.toast} className="fade-in">
          {msg}
          <button style={s.toastClose} onClick={() => setMsg('')}>✕</button>
        </div>
      )}

      {showForm && (
        <div style={s.formCard} className="scale-in">
          <div style={s.formTitle}>{editing ? 'Edit Team Member' : 'Add Team Member'}</div>
          {error && <div style={s.alert}>{error}</div>}
          <form onSubmit={save}>
            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Full Name *</label>
                <input style={s.input} value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="e.g. Ayesha Perera" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Role</label>
                <input style={s.input} value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  placeholder="e.g. Hair Stylist" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Phone</label>
                <input style={s.input} value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="e.g. 077 123 4567" />
              </div>
            </div>

            {/* Working Days */}
            <div style={{ marginTop: 20 }}>
              <label style={s.label}>Working Days</label>
              <div style={s.dayRow}>
                {ALL_DAYS.map(day => {
                  const on = form.working_days.includes(day);
                  return (
                    <button type="button" key={day}
                      style={{ ...s.dayChip, ...(on ? s.dayChipOn : {}) }}
                      onClick={() => toggleDay(day)}
                    >
                      {DAY_LABELS[day]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specialties */}
            {salonServices.length > 0 && (
              <div style={{ marginTop: 16 }}>
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
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={s.loadingRow}>{[1,2,3].map(i => <div key={i} style={s.skeleton} className="shimmer" />)}</div>
      ) : staff.length === 0 ? (
        <div style={s.empty} className="scale-in">
          <div style={s.emptyIcon}>✦</div>
          <h3 style={s.emptyTitle}>No team members yet</h3>
          <p style={{ color: c.textMuted, fontSize: 14 }}>Add professionals so clients can choose them when booking.</p>
          <button style={s.emptyBtn} onClick={openAdd}>+ Add First Member</button>
        </div>
      ) : (
        <div style={s.grid} className="fade-up">
          {staff.map((member, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <div key={member.id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={{ ...s.avatar, background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)` }}>
                    {member.full_name[0].toUpperCase()}
                  </div>
                  <div style={s.cardMeta}>
                    <div style={s.name}>{member.full_name}</div>
                    <div style={{ ...s.roleTag, color, background: color + '18', borderColor: color + '33' }}>
                      {member.role || 'Stylist'}
                    </div>
                  </div>
                </div>

                {/* Working days */}
                {member.working_days?.length > 0 && (
                  <div style={s.daysRow}>
                    {member.working_days.map(d => (
                      <span key={d} style={s.dayBadge}>{DAY_LABELS[d]}</span>
                    ))}
                  </div>
                )}

                {/* Specialties */}
                {member.specialty_names?.length > 0 && (
                  <div style={s.specTags}>
                    {member.specialty_names.map(name => (
                      <span key={name} style={s.specTag}>✂ {name}</span>
                    ))}
                  </div>
                )}

                {member.phone && <div style={s.phone}>📞 {member.phone}</div>}

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
  title: { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' },
  sub: { fontSize: 14, color: 'var(--text-muted)' },
  addBtn: {
    padding: '10px 22px', background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14,
    boxShadow: '0 4px 14px rgba(124,58,237,.3)', flexShrink: 0,
  },
  toast: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669',
    borderRadius: 10, padding: '10px 16px', fontSize: 13, marginBottom: 20,
  },
  toastClose: { background: 'none', border: 'none', cursor: 'pointer', color: '#059669', fontSize: 14 },
  formCard: {
    background: 'var(--surface)', borderRadius: 18, padding: 28,
    border: '1px solid var(--border)', marginBottom: 28, boxShadow: '0 4px 20px rgba(124,58,237,.08)',
  },
  formTitle: { fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 20 },
  alert: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 },
  input: {
    padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 14, background: 'var(--input-bg)', color: 'var(--text)', fontFamily: 'inherit',
  },
  dayRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  dayChip: {
    padding: '6px 14px', borderRadius: 20, border: '1.5px solid var(--border)',
    background: 'var(--surface)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
    transition: 'all .15s ease',
  },
  dayChipOn: { background: 'linear-gradient(135deg, #7C3AED, #0D9488)', color: '#fff', borderColor: 'transparent', boxShadow: '0 3px 10px rgba(124,58,237,.3)' },
  specGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  specItem: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px',
    border: '1.5px solid var(--border)', borderRadius: 10, cursor: 'pointer',
    fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', background: 'var(--surface)',
    transition: 'all .15s ease',
  },
  specItemOn: { borderColor: '#7C3AED', background: '#F5F3FF', color: '#7C3AED' },
  specCheck: {
    width: 18, height: 18, borderRadius: 5, border: '1.5px solid #D1D5DB',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 700, flexShrink: 0, color: '#fff',
  },
  specCheckOn: { background: 'linear-gradient(135deg, #7C3AED, #0D9488)', borderColor: 'transparent' },
  formActions: { display: 'flex', gap: 10, paddingTop: 20 },
  cancelBtn: {
    padding: '10px 22px', background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)',
  },
  saveBtn: {
    padding: '10px 26px', background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)',
    color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700,
    boxShadow: '0 4px 12px rgba(124,58,237,.25)',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 18 },
  card: {
    background: 'var(--surface)', borderRadius: 18, padding: 22, border: '1px solid var(--border)',
    boxShadow: '0 3px 14px rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column', gap: 12,
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: 14 },
  avatar: {
    width: 50, height: 50, borderRadius: 14, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, fontWeight: 800, color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,.15)',
  },
  cardMeta: { flex: 1, minWidth: 0 },
  name: { fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 5 },
  roleTag: { display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, border: '1px solid' },
  daysRow: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  dayBadge: {
    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
    background: '#EDE9FE', color: '#7C3AED', border: '1px solid #DDD6FE',
  },
  specTags: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  specTag: {
    fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
    background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)',
  },
  phone: { fontSize: 13, color: 'var(--text-muted)' },
  cardActions: { display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 2 },
  editBtn: { flex: 1, padding: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  removeBtn: { padding: '8px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#DC2626' },
  loadingRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 18 },
  skeleton: { height: 200, borderRadius: 18 },
  empty: { textAlign: 'center', padding: '72px 40px', background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)' },
  emptyIcon: { fontSize: 40, marginBottom: 16, display: 'inline-flex', width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)', color: '#fff' },
  emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' },
  emptyBtn: { marginTop: 20, padding: '11px 26px', background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14 },
};

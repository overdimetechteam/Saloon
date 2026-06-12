import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const ALL_FACILITIES = [
  { key: 'parking',          label: 'Free Parking',             emoji: '🅿️' },
  { key: 'street_parking',   label: 'Street Parking Nearby',    emoji: '🚗' },
  { key: 'wifi',             label: 'Free Wi-Fi',               emoji: '📶' },
  { key: 'coffee',           label: 'Complimentary Coffee',     emoji: '☕' },
  { key: 'tea',              label: 'Complimentary Tea',        emoji: '🍵' },
  { key: 'drinks',           label: 'Refreshments Available',   emoji: '🧃' },
  { key: 'ac',               label: 'Air Conditioning',         emoji: '❄️' },
  { key: 'kids_area',        label: 'Kids Play Area',           emoji: '🧸' },
  { key: 'wheelchair',       label: 'Wheelchair Accessible',    emoji: '♿' },
  { key: 'waiting_lounge',   label: 'Comfortable Waiting Area', emoji: '🛋️' },
  { key: 'tv',               label: 'Entertainment / TV',       emoji: '📺' },
  { key: 'music',            label: 'Relaxing Music',           emoji: '🎵' },
  { key: 'restroom',         label: 'Clean Restrooms',          emoji: '🚻' },
  { key: 'prayer_room',      label: 'Prayer Room',              emoji: '🕌' },
  { key: 'card_payment',     label: 'Card Payment Accepted',    emoji: '💳' },
  { key: 'online_payment',   label: 'Online Payment Accepted',  emoji: '📱' },
  { key: 'gift_vouchers',    label: 'Gift Vouchers Available',  emoji: '🎁' },
  { key: 'loyalty_program',  label: 'Loyalty Program',          emoji: '⭐' },
  { key: 'private_rooms',    label: 'Private Treatment Rooms',  emoji: '🚪' },
  { key: 'consultation',     label: 'Free Consultation',        emoji: '💬' },
  { key: 'home_visit',       label: 'Home Visit Available',     emoji: '🏠' },
  { key: 'instagram_worthy', label: 'Instagram-Worthy Decor',   emoji: '📸' },
];

const TABS = [
  { key: 'profile', label: '👤  My Profile' },
  { key: 'salon',   label: '🏪  Salon Details' },
];

export default function OwnerSettings() {
  const { profile } = useAuth();
  const [tab, setTab] = useState('profile');

  // Profile form
  const [pForm, setPForm]   = useState({ full_name: '', phone: '' });
  const [pSaving, setPSaving] = useState(false);
  const [pMsg, setPMsg]       = useState(null);

  // Salon form
  const [sForm, setSForm]   = useState({
    name: '', contact_number: '', email: '',
    address_street: '', address_city: '', address_district: '', address_postal: '',
    home_visit_enabled: false, gender_focus: 'unisex', facilities: [],
  });
  const [sSaving, setSSaving] = useState(false);
  const [sMsg, setSMsg]       = useState(null);
  const [salonId, setSalonId] = useState(null);

  useEffect(() => {
    api.get('/profile/').then(({ data }) => {
      setPForm({ full_name: data.full_name || '', phone: data.phone || '' });
    });
    api.get('/owner/salon/').then(({ data }) => {
      setSalonId(data.id);
      setSForm({
        name:             data.name             || '',
        contact_number:   data.contact_number   || '',
        email:            data.email            || '',
        address_street:   data.address_street   || '',
        address_city:     data.address_city     || '',
        address_district: data.address_district || '',
        address_postal:   data.address_postal   || '',
        home_visit_enabled: data.home_visit_enabled ?? false,
        gender_focus:     data.gender_focus     || 'unisex',
        facilities:       Array.isArray(data.facilities) ? data.facilities : [],
      });
    }).catch(() => {});
  }, []);

  const saveProfile = async e => {
    e.preventDefault(); setPSaving(true); setPMsg(null);
    try {
      const { data } = await api.patch('/profile/', pForm);
      const stored = JSON.parse(localStorage.getItem('profile') || '{}');
      localStorage.setItem('profile', JSON.stringify({ ...stored, ...data }));
      setPMsg({ type: 'ok', text: 'Profile updated successfully.' });
    } catch (err) {
      setPMsg({ type: 'err', text: err.response?.data?.detail || 'Failed to save.' });
    } finally { setPSaving(false); }
  };

  const saveSalon = async e => {
    e.preventDefault(); setSSaving(true); setSMsg(null);
    try {
      const { data } = await api.patch('/owner/salon/', sForm);
      setSForm(f => ({ ...f, ...data }));
      setSMsg({ type: 'ok', text: 'Salon details updated successfully.' });
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.detail
        || (d && typeof d === 'object'
            ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
            : null)
        || 'Failed to save.';
      setSMsg({ type: 'err', text: msg });
    } finally { setSSaving(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Settings</h1>
        <p style={s.sub}>Manage your account and salon information</p>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button
            key={t.key}
            style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MY PROFILE ── */}
      {tab === 'profile' && (
        <div style={s.card}>
          <div style={s.avatarRow}>
            <div style={s.avatar}>
              {(pForm.full_name || profile?.full_name || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style={s.avatarName}>{pForm.full_name || profile?.full_name || '—'}</div>
              <div style={s.avatarEmail}>{profile?.email}</div>
              <div style={{ ...s.roleBadge, background: 'rgba(212,175,55,.14)', color: '#D4AF37' }}>
                Salon Owner
              </div>
            </div>
          </div>

          <div style={s.divider} />
          <h3 style={s.sectionTitle}>Personal Details</h3>

          {pMsg && (
            <div style={{ ...s.alert, ...(pMsg.type === 'ok' ? s.alertOk : s.alertErr) }}>
              {pMsg.type === 'ok' ? '✓' : '⚠'} {pMsg.text}
            </div>
          )}

          <form onSubmit={saveProfile} style={s.form}>
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Full Name</label>
                <input
                  style={s.input}
                  value={pForm.full_name}
                  onChange={e => setPForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Your name"
                  required
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Phone Number</label>
                <input
                  style={s.input}
                  value={pForm.phone}
                  onChange={e => setPForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+94 77 000 0000"
                />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Email Address</label>
              <input style={{ ...s.input, ...s.inputDisabled }} value={profile?.email || ''} disabled />
              <span style={s.hint}>Email cannot be changed. Contact support if needed.</span>
            </div>
            <div style={s.actions}>
              <button style={{ ...s.btn, opacity: pSaving ? 0.7 : 1 }} disabled={pSaving}>
                {pSaving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── SALON DETAILS ── */}
      {tab === 'salon' && (
        <div style={s.card}>
          <h3 style={s.sectionTitle}>Salon Information</h3>

          {sMsg && (
            <div style={{ ...s.alert, ...(sMsg.type === 'ok' ? s.alertOk : s.alertErr) }}>
              {sMsg.type === 'ok' ? '✓' : '⚠'} {sMsg.text}
            </div>
          )}

          <form onSubmit={saveSalon} style={s.form}>
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Salon Name</label>
                <input
                  style={s.input}
                  value={sForm.name}
                  onChange={e => setSForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your Salon Name"
                  required
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Contact Number</label>
                <input
                  style={s.input}
                  value={sForm.contact_number}
                  onChange={e => setSForm(f => ({ ...f, contact_number: e.target.value }))}
                  placeholder="+94 11 000 0000"
                />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Salon Email</label>
              <input
                style={s.input}
                type="email"
                value={sForm.email}
                onChange={e => setSForm(f => ({ ...f, email: e.target.value }))}
                placeholder="info@yoursalon.lk"
              />
            </div>

            <div style={s.sectionDivider}>Address</div>

            <div style={s.field}>
              <label style={s.label}>Street Address</label>
              <input
                style={s.input}
                value={sForm.address_street}
                onChange={e => setSForm(f => ({ ...f, address_street: e.target.value }))}
                placeholder="123 Main Street"
              />
            </div>

            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>City</label>
                <input
                  style={s.input}
                  value={sForm.address_city}
                  onChange={e => setSForm(f => ({ ...f, address_city: e.target.value }))}
                  placeholder="Colombo"
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>District</label>
                <input
                  style={s.input}
                  value={sForm.address_district}
                  onChange={e => setSForm(f => ({ ...f, address_district: e.target.value }))}
                  placeholder="Colombo"
                />
              </div>
              <div style={{ ...s.field, flex: '0 1 130px' }}>
                <label style={s.label}>Postal Code</label>
                <input
                  style={s.input}
                  value={sForm.address_postal}
                  onChange={e => setSForm(f => ({ ...f, address_postal: e.target.value }))}
                  placeholder="00100"
                />
              </div>
            </div>

            <div style={s.sectionDivider}>Facilities &amp; Amenities</div>
            <div style={{ marginBottom: 4 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.6 }}>
                Select the facilities your salon offers. Only selected ones will be shown to customers on your salon page.
              </p>
              <div style={s.facilitiesGrid}>
                {ALL_FACILITIES.map(f => {
                  const active = sForm.facilities.includes(f.key);
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setSForm(p => ({
                        ...p,
                        facilities: active
                          ? p.facilities.filter(k => k !== f.key)
                          : [...p.facilities, f.key],
                      }))}
                      style={{
                        ...s.facilityBtn,
                        ...(active ? s.facilityActive : {}),
                      }}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{f.emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, lineHeight: 1.3 }}>{f.label}</span>
                      {active && <span style={s.facilityCheck}>✓</span>}
                    </button>
                  );
                })}
              </div>
              {sForm.facilities.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#0D9488', fontWeight: 600 }}>
                  {sForm.facilities.length} facilit{sForm.facilities.length === 1 ? 'y' : 'ies'} selected
                </div>
              )}
            </div>

            <div style={s.sectionDivider}>Preferences</div>

            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Gender Focus</label>
                <select
                  style={s.input}
                  value={sForm.gender_focus}
                  onChange={e => setSForm(f => ({ ...f, gender_focus: e.target.value }))}
                >
                  <option value="unisex">Unisex</option>
                  <option value="male">Male (Barbershop)</option>
                  <option value="female">Female (Ladies Salon)</option>
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Home Visits</label>
                <div style={s.toggleRow}>
                  <button
                    type="button"
                    style={{ ...s.toggle, ...(sForm.home_visit_enabled ? s.toggleOn : s.toggleOff) }}
                    onClick={() => setSForm(f => ({ ...f, home_visit_enabled: !f.home_visit_enabled }))}
                  >
                    <span style={{ ...s.toggleKnob, transform: sForm.home_visit_enabled ? 'translateX(20px)' : 'translateX(0)' }} />
                  </button>
                  <span style={s.toggleLabel}>
                    {sForm.home_visit_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            <div style={s.actions}>
              <button style={{ ...s.btn, opacity: sSaving ? 0.7 : 1 }} disabled={sSaving}>
                {sSaving ? 'Saving…' : 'Save Salon Details'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const GOLD = '#D4AF37';

const s = {
  page: { padding: '32px 28px', maxWidth: 780, margin: '0 auto' },
  header: { marginBottom: 24 },
  title: { fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.02em' },
  sub: { fontSize: 14, color: 'var(--text-muted)', margin: 0 },
  tabs: { display: 'flex', gap: 8, marginBottom: 24 },
  tab: {
    padding: '10px 22px', border: '1.5px solid var(--border)', borderRadius: 10,
    background: 'var(--surface)', color: 'var(--text-muted)',
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
    fontFamily: "'DM Sans',sans-serif", transition: 'all .15s',
  },
  tabActive: {
    background: 'rgba(212,175,55,.12)', borderColor: `rgba(212,175,55,.4)`,
    color: GOLD,
  },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '28px 32px' },
  avatarRow: { display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 },
  avatar: {
    width: 64, height: 64, borderRadius: '50%',
    background: `linear-gradient(135deg,#92701a,${GOLD})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, fontWeight: 700, color: '#1a1200', flexShrink: 0,
  },
  avatarName: { fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 3 },
  avatarEmail: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 },
  roleBadge: { display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' },
  divider: { height: 1, background: 'var(--border)', margin: '8px 0 24px' },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: 'var(--text-sub)', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.1em' },
  sectionDivider: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 4 },
  alert: { borderRadius: 10, padding: '11px 16px', fontSize: 13, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 },
  alertOk: { background: 'rgba(13,148,136,.1)', border: '1px solid rgba(13,148,136,.25)', color: '#0D9488' },
  alertErr: { background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)', color: '#ef4444' },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  row: { display: 'flex', gap: 14, flexWrap: 'wrap' },
  field: { display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 200px' },
  label: { fontSize: 11, fontWeight: 700, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.07em' },
  input: {
    padding: '11px 13px', border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 14, background: 'var(--input-bg)', color: 'var(--text)',
    outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: "'DM Sans',sans-serif",
  },
  inputDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  hint: { fontSize: 11, color: 'var(--text-muted)' },
  toggleRow: { display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8 },
  toggle: { position: 'relative', width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'background .2s', padding: 2 },
  toggleOn:  { background: '#0D9488' },
  toggleOff: { background: 'var(--border)' },
  toggleKnob: { position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'transform .2s', display: 'block' },
  toggleLabel: { fontSize: 13, color: 'var(--text-muted)' },
  facilitiesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 8,
    marginBottom: 6,
  },
  facilityBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 5, padding: '10px 8px', border: '1.5px solid var(--border)', borderRadius: 12,
    background: 'var(--surface)', cursor: 'pointer', textAlign: 'center',
    minHeight: 72, transition: 'all .15s', position: 'relative',
    color: 'var(--text-muted)',
  },
  facilityActive: {
    border: '1.5px solid #0D9488', background: 'rgba(13,148,136,.08)', color: 'var(--text)',
  },
  facilityCheck: {
    position: 'absolute', top: 5, right: 7, fontSize: 11, fontWeight: 800,
    color: '#0D9488', lineHeight: 1,
  },
  actions: { display: 'flex', justifyContent: 'flex-end', paddingTop: 6 },
  btn: {
    padding: '12px 32px',
    background: `linear-gradient(135deg,#92701a,${GOLD})`,
    color: '#1a1200', border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
  },
};

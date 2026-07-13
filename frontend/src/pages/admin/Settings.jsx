import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function AdminSettings() {
  const [form, setForm] = useState({ payhere_merchant_id: '', payhere_merchant_secret: '', payhere_sandbox: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // Notification email state
  const [notifEmail, setNotifEmail] = useState('');
  const [notifEmailInput, setNotifEmailInput] = useState('');
  const [notifVerified, setNotifVerified] = useState(false);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');
  const [notifErr, setNotifErr] = useState('');
  const [confirm, setConfirm]   = useState(null);
  const [notifEditing, setNotifEditing] = useState(false);
  const [verifyBanner, setVerifyBanner] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    api.get('/payments/admin/settings/payhere/')
      .then(r => setForm(f => ({ ...f, payhere_merchant_id: r.data.payhere_merchant_id || '', payhere_sandbox: r.data.payhere_sandbox ?? true })))
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get('/payments/admin/settings/notification-email/')
      .then(r => {
        setNotifEmail(r.data.notification_email || '');
        setNotifEmailInput(r.data.notification_email || '');
        setNotifVerified(r.data.notification_email_verified || false);
      })
      .catch(() => {})
      .finally(() => setNotifLoading(false));

    // Detect redirect back from email verification link
    if (searchParams.get('email_verified') === '1') {
      setVerifyBanner(true);
      setNotifVerified(true);
      setSearchParams({}, { replace: true });
    }
  }, []);

  const save = async e => {
    e.preventDefault(); setErr(''); setMsg('');
    setSaving(true);
    try {
      await api.patch('/payments/admin/settings/payhere/', {
        payhere_merchant_id:     form.payhere_merchant_id.trim(),
        payhere_merchant_secret: form.payhere_merchant_secret.trim() || undefined,
        payhere_sandbox:         form.payhere_sandbox,
      });
      setMsg('PayHere settings saved successfully.');
      setForm(f => ({ ...f, payhere_merchant_secret: '' }));
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to save settings.');
    } finally { setSaving(false); }
  };

  const saveNotifEmail = async () => {
    const email = notifEmailInput.trim();
    if (!email) return;
    setNotifSaving(true); setNotifMsg(''); setNotifErr('');
    try {
      const r = await api.patch('/payments/admin/settings/notification-email/', { notification_email: email });
      setNotifEmail(r.data.notification_email);
      setNotifVerified(false);
      setNotifEditing(false);
      setNotifMsg(r.data.detail || 'Verification email sent.');
    } catch (e) {
      setNotifErr(e.response?.data?.detail || 'Failed to save email.');
    } finally { setNotifSaving(false); }
  };

  const removeNotifEmail = () => {
    setConfirm({
      title: 'Remove Notification Email?',
      message: 'You will stop receiving admin alerts when salons register or request reinstatement.',
      confirmLabel: 'Remove Email',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.delete('/payments/admin/settings/notification-email/');
          setNotifEmail(''); setNotifEmailInput(''); setNotifVerified(false);
          setNotifMsg('Notification email removed.');
        } catch { setNotifErr('Failed to remove.'); }
      },
    });
  };

  return (
    <div>
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={confirm?.onConfirm}
        onClose={() => setConfirm(null)}
      />
      <div style={s.pageHeader} className="fade-up">
        <div style={s.eyebrow}>Configuration</div>
        <h2 style={s.title}>Platform Settings</h2>
        <p style={s.sub}>Manage payment gateway credentials and platform-level configuration</p>
      </div>

      {verifyBanner && (
        <div style={{ ...s.alertOk, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
          <span>✓ Notification email verified successfully! You will now receive alerts when salons register.</span>
          <button onClick={() => setVerifyBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0D9488', fontSize: 16, padding: 0 }}>✕</button>
        </div>
      )}
      {msg && <div style={s.alertOk}>{msg}</div>}
      {err && <div style={s.alertErr}>{err}</div>}

      {/* Notification email card */}
      <div style={{ ...s.card, marginBottom: 24, maxWidth: '100%' }}>
        <div style={s.cardHead}>
          <div style={{ ...s.cardIcon, color: '#D97706', background: 'rgba(217,119,6,.1)', border: '1px solid rgba(217,119,6,.2)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 4h14v10a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M2 4l7 6 7-6" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
          </div>
          <div>
            <div style={s.cardTitle}>Admin Notification Email</div>
            <div style={s.cardSub}>Receive real-time email alerts when new salons request to register</div>
          </div>
        </div>

        {notifLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><div style={s.spin} /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {notifMsg && <div style={s.alertOk}>{notifMsg}</div>}
            {notifErr && <div style={s.alertErr}>{notifErr}</div>}

            {notifEmail && !notifEditing ? (
              <div>
                <div style={s.notifEmailRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.notifEmailAddr}>{notifEmail}</div>
                    <div style={{ marginTop: 6 }}>
                      {notifVerified ? (
                        <span style={s.verifiedBadge}>✓ Verified</span>
                      ) : (
                        <span style={s.pendingBadge}>⏳ Pending Verification</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button style={s.editBtn} onClick={() => { setNotifEditing(true); setNotifMsg(''); setNotifErr(''); }}>
                      Edit
                    </button>
                    <button style={s.removeBtn} onClick={removeNotifEmail}>
                      Remove
                    </button>
                  </div>
                </div>
                {!notifVerified && (
                  <div style={s.notifHint}>
                    A verification email was sent to <strong>{notifEmail}</strong>. Click the link in the email to activate notifications.
                    <button
                      style={{ ...s.resendLink }}
                      onClick={saveNotifEmail}
                    >
                      Resend verification
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={s.label}>
                  {notifEditing ? 'Update Email Address' : 'Email Address'}
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    style={{ ...s.input, flex: 1 }}
                    type="email"
                    placeholder="e.g. admin@yourdomain.com"
                    value={notifEmailInput}
                    onChange={e => setNotifEmailInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveNotifEmail()}
                  />
                  <button
                    style={{ ...s.saveBtn, padding: '12px 20px', minWidth: 0, opacity: notifSaving ? 0.7 : 1 }}
                    disabled={notifSaving || !notifEmailInput.trim()}
                    onClick={saveNotifEmail}
                  >
                    {notifSaving ? 'Sending…' : notifEditing ? 'Update & Verify' : 'Save & Verify'}
                  </button>
                  {notifEditing && (
                    <button style={s.cancelEditBtn} onClick={() => { setNotifEditing(false); setNotifEmailInput(notifEmail); }}>
                      Cancel
                    </button>
                  )}
                </div>
                <div style={s.hint}>A verification email will be sent to this address to confirm it before notifications are enabled.</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={s.grid}>
        {/* PayHere config */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <div style={s.cardIcon}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1.5" y="4.5" width="15" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                <line x1="1.5" y1="8" x2="16.5" y2="8" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="3.5" y="10" width="3" height="2" rx="0.5" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <div style={s.cardTitle}>PayHere Payment Gateway</div>
              <div style={s.cardSub}>Credentials used for all subscription and cosmetics payments</div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><div style={s.spin} /></div>
          ) : (
            <form onSubmit={save} style={s.form}>
              {/* Sandbox toggle */}
              <div style={s.toggleRow}>
                <div>
                  <div style={s.toggleLabel}>Sandbox Mode</div>
                  <div style={s.toggleSub}>Use PayHere sandbox for testing. Turn off in production.</div>
                </div>
                <button
                  type="button"
                  style={{ ...s.toggle, background: form.payhere_sandbox ? '#0D9488' : 'var(--border)' }}
                  onClick={() => setForm(f => ({ ...f, payhere_sandbox: !f.payhere_sandbox }))}
                >
                  <div style={{ ...s.toggleThumb, left: form.payhere_sandbox ? 22 : 2 }} />
                </button>
              </div>
              <div style={{ ...s.modeBadge, color: form.payhere_sandbox ? '#D4AF37' : '#0D9488', background: form.payhere_sandbox ? 'rgba(212,175,55,.1)' : 'rgba(13,148,136,.1)', border: `1px solid ${form.payhere_sandbox ? 'rgba(212,175,55,.25)' : 'rgba(13,148,136,.25)'}` }}>
                {form.payhere_sandbox ? '⚠ Sandbox mode — payments are simulated' : '✓ Production mode — real payments active'}
              </div>

              <div style={s.field}>
                <label style={s.label}>Merchant ID</label>
                <input
                  style={s.input}
                  value={form.payhere_merchant_id}
                  onChange={e => setForm(f => ({ ...f, payhere_merchant_id: e.target.value }))}
                  placeholder="e.g. 1220xxx"
                />
                <div style={s.hint}>Found in your PayHere merchant dashboard</div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Merchant Secret <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(leave blank to keep existing)</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...s.input, paddingRight: 44, fontFamily: showSecret ? "'DM Sans', sans-serif" : 'monospace', letterSpacing: showSecret ? 'normal' : '0.15em' }}
                    type={showSecret ? 'text' : 'password'}
                    value={form.payhere_merchant_secret}
                    onChange={e => setForm(f => ({ ...f, payhere_merchant_secret: e.target.value }))}
                    placeholder="Enter new secret to update"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowSecret(v => !v)} style={s.eyeBtn}>
                    {showSecret ? '🙈' : '👁'}
                  </button>
                </div>
                <div style={s.hint}>Secret is write-only — it is never returned after saving</div>
              </div>

              <button style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }} type="submit" disabled={saving}>
                {saving ? 'Saving…' : '✓ Save PayHere Settings'}
              </button>
            </form>
          )}
        </div>

        {/* Info panel */}
        <div style={s.infoPanel}>
          <div style={s.infoTitle}>How Payment Routing Works</div>
          <div style={s.infoBody}>
            <p>All subscription fees and cosmetics purchases are collected into the <strong>single PayHere merchant account</strong> configured here.</p>
            <p style={{ marginTop: 12 }}>Individual salons do <strong>not</strong> receive payments directly. You (the platform) collect everything centrally and are responsible for any manual payouts to salon owners for cosmetics revenue.</p>
            <p style={{ marginTop: 12 }}>Two payment types flow through this gateway:</p>
            <ul style={s.list}>
              <li><strong>Subscriptions</strong> — salon owners paying for Starter / Professional / Premium plans</li>
              <li><strong>Cosmetics</strong> — customers purchasing cosmetic products from salon stores</li>
            </ul>
            <p style={{ marginTop: 12 }}>Appointment booking payments are <strong>not</strong> processed online — customers pay the salon directly in person.</p>
          </div>

          <div style={s.infoSep} />

          <div style={s.infoTitle}>Getting Credentials</div>
          <div style={s.infoBody}>
            <ol style={s.list}>
              <li>Log into <strong>PayHere.lk</strong> merchant portal</li>
              <li>Go to <em>Settings → Domain & Credentials</em></li>
              <li>Copy the <strong>Merchant ID</strong> and generate a <strong>Merchant Secret</strong></li>
              <li>For production, add your Render domain to the allowed domains list</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  pageHeader: { marginBottom: 26 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' },
  sub: { color: 'var(--text-muted)', fontSize: 13, margin: 0 },
  alertOk:  { background: '#F0FDFA', border: '1px solid #99F6E4', color: '#0D9488', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 20 },
  alertErr: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: '11px 16px', fontSize: 13, marginBottom: 20 },

  spin: { width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(13,148,136,.2)', borderTopColor: '#0D9488', animation: 'spinSlow .7s linear infinite' },

  grid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'flex-start' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '24px 26px', boxShadow: '0 2px 14px rgba(0,0,0,.05)' },
  cardHead: { display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid var(--border)' },
  cardIcon: { width: 42, height: 42, borderRadius: 12, background: 'rgba(13,148,136,.1)', border: '1px solid rgba(13,148,136,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D9488', flexShrink: 0 },
  cardTitle: { fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 3 },
  cardSub: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 },

  form: { display: 'flex', flexDirection: 'column', gap: 20 },

  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  toggleLabel: { fontSize: 14, fontWeight: 600, color: 'var(--text)' },
  toggleSub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  toggle: { position: 'relative', width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'background .2s ease', flexShrink: 0, padding: 0 },
  toggleThumb: { position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s ease', boxShadow: '0 1px 4px rgba(0,0,0,.2)' },

  modeBadge: { fontSize: 12, fontWeight: 600, borderRadius: 8, padding: '8px 12px', lineHeight: 1.4, marginTop: -8 },

  field: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-sub)' },
  input: { padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: 11, fontSize: 14, background: 'var(--input-bg)', color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" },
  eyeBtn: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)' },
  hint: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },
  saveBtn: { padding: '13px', background: 'linear-gradient(135deg, #0D9488, #14B8A8)', color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 5px 18px rgba(13,148,136,.35)', fontFamily: "'DM Sans', sans-serif" },

  infoPanel: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '24px 26px', boxShadow: '0 2px 14px rgba(0,0,0,.05)' },
  infoTitle: { fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' },
  infoBody: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 },
  infoSep: { height: 1, background: 'var(--border)', margin: '20px 0' },
  list: { paddingLeft: 18, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 6 },

  notifEmailRow: { display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: 'var(--surface2)', borderRadius: 11, border: '1px solid var(--border)' },
  notifEmailAddr: { fontWeight: 600, fontSize: 14, color: 'var(--text)', wordBreak: 'break-all' },
  verifiedBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#0D9488', background: 'rgba(13,148,136,.1)', border: '1px solid rgba(13,148,136,.25)' },
  pendingBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#D97706', background: 'rgba(217,119,6,.1)', border: '1px solid rgba(217,119,6,.25)' },
  editBtn: { padding: '7px 16px', fontSize: 12, fontWeight: 600, border: '1.5px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  removeBtn: { padding: '7px 16px', fontSize: 12, fontWeight: 600, border: '1.5px solid rgba(220,38,38,.3)', borderRadius: 8, background: 'transparent', color: '#DC2626', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  notifHint: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  resendLink: { background: 'none', border: 'none', cursor: 'pointer', color: '#0D9488', fontSize: 12, fontWeight: 600, padding: 0, textDecoration: 'underline', fontFamily: "'DM Sans', sans-serif" },
  cancelEditBtn: { padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: 11, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif" },
};

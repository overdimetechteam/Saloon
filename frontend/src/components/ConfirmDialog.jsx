import { createPortal } from 'react-dom';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = true, loading = false, onConfirm, onClose }) {
  if (!open) return null;
  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,6,17,.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface)', borderRadius: 22, padding: '36px 32px', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,.4)', border: '1px solid var(--border)' }}
      >
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FFFBEB', border: '2px solid #FCD34D', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 18px' }}>
          ⚠
        </div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>
          {title}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 26px' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ padding: '10px 24px', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '10px 26px',
              background: danger ? '#DC2626' : 'linear-gradient(135deg,#0D9488,#14B8A8)',
              border: 'none', borderRadius: 12,
              cursor: loading ? 'wait' : 'pointer',
              fontSize: 14, fontWeight: 700, color: '#fff',
              boxShadow: danger ? '0 4px 14px rgba(220,38,38,.35)' : '0 4px 14px rgba(13,148,136,.35)',
              fontFamily: "'DM Sans', sans-serif",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

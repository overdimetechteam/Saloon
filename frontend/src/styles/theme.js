export const c = {
  primary:      '#7C3AED',
  primaryDark:  '#6D28D9',
  primaryLight: '#EDE9FE',
  primarySoft:  '#F5F2FF',

  accent:      '#EC4899',
  accentLight: '#FCE7F3',
  accentDark:  '#BE185D',

  gold:        '#BF9B65',
  goldLight:   '#F5EAD8',
  goldDark:    '#9A7845',

  sidebar:           '#080611',
  sidebarBorder:     '#1A1535',
  sidebarHover:      '#1A1535',
  sidebarActive:     '#7C3AED',
  sidebarText:       '#A78BFA',
  sidebarTextActive: '#FFFFFF',
  sidebarIcon:       '#6D28D9',

  bg:          'var(--bg)',
  bgWarm:      'var(--bg-warm)',
  surface:     'var(--surface)',
  surfaceHover:'var(--surface2)',

  text:       'var(--text)',
  textSub:    'var(--text-sub)',
  textMuted:  'var(--text-muted)',
  textLight:  'var(--text-light)',

  border:      'var(--border)',
  borderFocus: '#7C3AED',
  inputBg:     'var(--input-bg)',

  success:       '#059669',
  successBg:     '#ECFDF5',
  successBorder: '#6EE7B7',

  error:       '#DC2626',
  errorBg:     '#FEF2F2',
  errorBorder: '#FCA5A5',

  warning:       '#D97706',
  warningBg:     '#FFFBEB',
  warningBorder: '#FCD34D',

  info:       '#2563EB',
  infoBg:     '#EFF6FF',
  infoBorder: '#93C5FD',

  pending:     '#D97706',
  pendingBg:   '#FFFBEB',
  confirmed:   '#059669',
  confirmedBg: '#ECFDF5',
  rejected:    '#DC2626',
  rejectedBg:  '#FEF2F2',
  awaiting:    '#7C3AED',
  awaitingBg:  '#EDE9FE',
  cancelled:   '#6B7280',
  cancelledBg: '#F3F4F6',
  completed:   '#2563EB',
  completedBg: '#EFF6FF',
  flagged:     '#BE123C',
  flaggedBg:   '#FFF1F2',
};

export const g = {
  primary:       'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
  rose:          'linear-gradient(135deg, #E11D48 0%, #BE185D 100%)',
  sunset:        'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
  sunsetDeep:    'linear-gradient(145deg, #7C3AED 0%, #9B59E8 50%, #EC4899 100%)',
  gold:          'linear-gradient(135deg, #BF9B65 0%, #E8C48A 50%, #BF9B65 100%)',
  goldSolid:     'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
  success:       'linear-gradient(135deg, #059669 0%, #047857 100%)',
  hero:          'linear-gradient(145deg, #1A0532 0%, #2D0A5E 30%, #5B21B6 65%, #7C3AED 100%)',
  heroMesh:      'radial-gradient(ellipse at 30% 70%, rgba(236,72,153,.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(124,58,237,.2) 0%, transparent 55%)',
  sidebar:       'linear-gradient(180deg, #0E0720 0%, #080611 100%)',
  card:          'linear-gradient(145deg, #FFFFFF 0%, #FDFCFF 100%)',
  warmCard:      'linear-gradient(145deg, #FEFCFF 0%, #F8F5FF 100%)',
  statPending:   'linear-gradient(145deg, #FFFDF7 0%, #FEF3C7 100%)',
  statConfirmed: 'linear-gradient(145deg, #F0FDF9 0%, #D1FAE5 100%)',
  statError:     'linear-gradient(145deg, #FFF5F5 0%, #FEE2E2 100%)',
  statInfo:      'linear-gradient(145deg, #EFF8FF 0%, #DBEAFE 100%)',
  statPrimary:   'linear-gradient(145deg, #F5F2FF 0%, #EDE9FE 100%)',
};

export const shadow = {
  xs:       '0 1px 2px rgba(0,0,0,.04)',
  sm:       '0 2px 8px rgba(124,58,237,.06), 0 1px 3px rgba(0,0,0,.04)',
  md:       '0 6px 20px rgba(124,58,237,.08), 0 2px 8px rgba(0,0,0,.04)',
  lg:       '0 12px 32px rgba(124,58,237,.1), 0 4px 12px rgba(0,0,0,.05)',
  xl:       '0 24px 56px rgba(124,58,237,.12), 0 8px 20px rgba(0,0,0,.06)',
  glow:     '0 8px 32px rgba(124,58,237,.25), 0 2px 8px rgba(124,58,237,.15)',
  glowRose: '0 8px 32px rgba(236,72,153,.25), 0 2px 8px rgba(236,72,153,.15)',
  glowGold: '0 8px 24px rgba(191,155,101,.2)',
  card:     '0 4px 16px rgba(124,58,237,.07), 0 1px 4px rgba(0,0,0,.04)',
  inset:    'inset 0 1px 3px rgba(0,0,0,.06)',
};

export const STATUS_META = {
  pending:         { label: 'Pending',      color: '#fff',    bg: '#EC4899',  border: '#EC4899' },
  confirmed:       { label: 'Confirmed',    color: '#059669', bg: '#ECFDF5',  border: '#6EE7B7' },
  rejected:        { label: 'Rejected',     color: '#DC2626', bg: '#FEF2F2',  border: '#FCA5A5' },
  awaiting_client: { label: 'Awaiting You', color: '#7C3AED', bg: '#EDE9FE',  border: '#C4B5FD' },
  rescheduled:     { label: 'Rescheduled',  color: '#2563EB', bg: '#EFF6FF',  border: '#93C5FD' },
  cancelled:       { label: 'Cancelled',    color: '#6B7280', bg: '#F3F4F6',  border: '#D1D5DB' },
  completed:       { label: 'Completed',    color: '#059669', bg: '#D1FAE5',  border: '#6EE7B7' },
  flagged:         { label: 'Flagged',      color: '#BE123C', bg: '#FFF1F2',  border: '#FECDD3' },
};
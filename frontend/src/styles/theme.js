export const c = {
  primary:      '#7C3AED',
  primaryDark:  '#6D28D9',
  primaryLight: '#EDE9FE',
  primarySoft:  '#F5F3FF',

  accent:      '#0D9488',
  accentLight: '#CCFBF1',
  accentDark:  '#0F766E',

  gold:       '#C9A96E',
  goldBg:     '#FEF9EE',
  goldBorder: '#E8D5B0',

  sidebar:          '#0F172A',
  sidebarBorder:    '#1E293B',
  sidebarHover:     '#1E293B',
  sidebarActive:    '#7C3AED',
  sidebarText:      '#94A3B8',
  sidebarTextActive:'#FFFFFF',
  sidebarIcon:      '#6D28D9',

  /* Neutral tokens — driven by CSS variables so dark mode works globally */
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

  /* Semantic colors stay fixed */
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
  flagged:     '#0F766E',
  flaggedBg:   '#CCFBF1',
};

export const g = {
  primary:       'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
  teal:          'linear-gradient(135deg, #0D9488 0%, #0891B2 100%)',
  brand:         'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)',
  gold:          'linear-gradient(135deg, #C9A96E 0%, #A07844 100%)',
  success:       'linear-gradient(135deg, #059669 0%, #047857 100%)',
  hero:          'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #4C1D95 75%, #7C3AED 100%)',
  sidebar:       'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
  card:          'linear-gradient(145deg, #FFFFFF 0%, #FDFCFF 100%)',
  warmCard:      'linear-gradient(145deg, #FDFCFF 0%, #F5F3FF 100%)',
  statPending:   'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
  statConfirmed: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
  statError:     'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
  statInfo:      'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
};

export const shadow = {
  sm:       '0 1px 3px 0 rgba(0,0,0,.05), 0 1px 2px 0 rgba(0,0,0,.03)',
  md:       '0 4px 6px -1px rgba(0,0,0,.08), 0 2px 4px -1px rgba(0,0,0,.05)',
  lg:       '0 10px 15px -3px rgba(0,0,0,.08), 0 4px 6px -2px rgba(0,0,0,.04)',
  xl:       '0 20px 25px -5px rgba(0,0,0,.08), 0 10px 10px -5px rgba(0,0,0,.03)',
  glow:     '0 8px 30px rgba(124,58,237,.2)',
  glowTeal: '0 8px 30px rgba(13,148,136,.2)',
  card:     '0 2px 8px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04)',
};

export const STATUS_META = {
  pending:         { label: 'Pending',      color: '#D97706', bg: '#FFFBEB',  border: '#FCD34D' },
  confirmed:       { label: 'Confirmed',    color: '#059669', bg: '#ECFDF5',  border: '#6EE7B7' },
  rejected:        { label: 'Rejected',     color: '#DC2626', bg: '#FEF2F2',  border: '#FCA5A5' },
  awaiting_client: { label: 'Awaiting You', color: '#7C3AED', bg: '#EDE9FE',  border: '#C4B5FD' },
  rescheduled:     { label: 'Rescheduled',  color: '#2563EB', bg: '#EFF6FF',  border: '#93C5FD' },
  cancelled:       { label: 'Cancelled',    color: '#6B7280', bg: '#F3F4F6',  border: '#D1D5DB' },
  completed:       { label: 'Completed',    color: '#059669', bg: '#D1FAE5',  border: '#6EE7B7' },
  flagged:         { label: 'Flagged',      color: '#0F766E', bg: '#CCFBF1',  border: '#5EEAD4' },
};

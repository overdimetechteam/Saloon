export const c = {
  primary:      '#0D9488',
  primaryDark:  '#0B7A70',
  primaryLight: '#F0FDFA',
  primarySoft:  '#F5FFFE',

  accent:      '#D4AF37',
  accentLight: '#FBF3D0',
  accentDark:  '#B8932A',

  gold:        '#D4AF37',
  goldLight:   '#FBF3D0',
  goldDark:    '#B8932A',

  sidebar:           '#0D0D16',
  sidebarBorder:     'rgba(13,148,136,.1)',
  sidebarHover:      'rgba(13,148,136,.07)',
  sidebarActive:     '#0D9488',
  sidebarText:       '#5EEAD4',
  sidebarTextActive: '#FFFFFF',
  sidebarIcon:       '#0B7A70',

  bg:          'var(--bg)',
  bgWarm:      'var(--bg-warm)',
  surface:     'var(--surface)',
  surfaceHover:'var(--surface2)',

  text:       'var(--text)',
  textSub:    'var(--text-sub)',
  textMuted:  'var(--text-muted)',
  textLight:  'var(--text-light)',

  border:      'var(--border)',
  borderFocus: '#0D9488',
  inputBg:     'var(--input-bg)',

  success:       '#0D9488',
  successBg:     '#F0FDFA',
  successBorder: '#99F6E4',

  error:       '#DC2626',
  errorBg:     '#FEF2F2',
  errorBorder: '#FCA5A5',

  warning:       '#D4AF37',
  warningBg:     '#FBF3D0',
  warningBorder: '#D4AF37',

  info:       '#0D9488',
  infoBg:     '#F0FDFA',
  infoBorder: '#99F6E4',

  pending:     '#D4AF37',
  pendingBg:   '#FBF3D0',
  confirmed:   '#0D9488',
  confirmedBg: '#F0FDFA',
  rejected:    '#DC2626',
  rejectedBg:  '#FEF2F2',
  awaiting:    '#0D9488',
  awaitingBg:  '#F0FDFA',
  cancelled:   '#6B7280',
  cancelledBg: '#F3F4F6',
  completed:   '#0D9488',
  completedBg: '#F0FDFA',
  flagged:     '#BE123C',
  flaggedBg:   '#FFF1F2',
};

export const g = {
  primary:       'linear-gradient(135deg, #0D9488 0%, #0B7A70 100%)',
  shimmer:       'linear-gradient(135deg, #0D9488, #14B8A8, #0D9488)',
  tealGold:      'linear-gradient(135deg, #0D9488 0%, #D4AF37 100%)',
  gold:          'linear-gradient(135deg, #D4AF37 0%, #E8C87A 50%, #D4AF37 100%)',
  goldSolid:     'linear-gradient(135deg, #D4AF37 0%, #B8932A 100%)',
  success:       'linear-gradient(135deg, #0D9488 0%, #0B7A70 100%)',
  hero:          'linear-gradient(145deg, #0D0D16, #1A1A24, #0B3832, #0D9488)',
  heroMesh:      'radial-gradient(ellipse at 30% 70%, rgba(212,175,55,.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(13,148,136,.2) 0%, transparent 55%)',
  sidebar:       'linear-gradient(180deg, #111120 0%, #0D0D16 100%)',
  cosmeticsHero: 'linear-gradient(145deg, #1A0D09, #4A1F12, #C96B51, #D4AF37)',
  cosmetics:     'linear-gradient(135deg, #C96B51, #B8932A)',
  card:          'linear-gradient(145deg, #FFFFFF 0%, #FDFEFF 100%)',
  warmCard:      'linear-gradient(145deg, #FEFFFD 0%, #F5FFFD 100%)',
  statPending:   'linear-gradient(145deg, #FFFDF7 0%, #FEF3C7 100%)',
  statConfirmed: 'linear-gradient(145deg, #F0FDFA 0%, #CCFBF1 100%)',
  statError:     'linear-gradient(145deg, #FFF5F5 0%, #FEE2E2 100%)',
  statInfo:      'linear-gradient(145deg, #F0FDFA 0%, #CCFBF1 100%)',
  statPrimary:   'linear-gradient(145deg, #F0FDFA 0%, #CCFBF1 100%)',
};

export const shadow = {
  xs:       '0 1px 2px rgba(0,0,0,.04)',
  sm:       '0 2px 8px rgba(13,148,136,.06), 0 1px 3px rgba(0,0,0,.04)',
  md:       '0 6px 20px rgba(13,148,136,.08), 0 2px 8px rgba(0,0,0,.04)',
  lg:       '0 12px 32px rgba(13,148,136,.1), 0 4px 12px rgba(0,0,0,.05)',
  xl:       '0 24px 56px rgba(13,148,136,.12), 0 8px 20px rgba(0,0,0,.06)',
  glow:     '0 8px 32px rgba(13,148,136,.25), 0 2px 8px rgba(13,148,136,.15)',
  glowGold: '0 8px 24px rgba(212,175,55,.2)',
  card:     '0 4px 16px rgba(13,148,136,.07), 0 1px 4px rgba(0,0,0,.04)',
  inset:    'inset 0 1px 3px rgba(0,0,0,.06)',
};

export const SALON_PALETTES = {
  teal:   { label: 'Teal',   main: '#0D9488', light: '#14B8A8', dark: '#0B7A70', darkBg: '#0B3832', rgb: '13,148,136',  textLight: '#5EEAD4' },
  purple: { label: 'Purple', main: '#613ba3', light: '#7c52b8', dark: '#4a2a8a', darkBg: '#1a0d2e', rgb: '97,59,163',   textLight: '#c4a8e8' },
  olive:  { label: 'Olive',  main: '#707a2d', light: '#8a9438', dark: '#556120', darkBg: '#1a1e0a', rgb: '112,122,45',  textLight: '#c8d08a' },
};

export const STATUS_META = {
  pending:         { label: 'Pending',      color: '#92400E', bg: '#FBF3D0',  border: '#D4AF37' },
  confirmed:       { label: 'Confirmed',    color: '#0D9488', bg: '#F0FDFA',  border: '#99F6E4' },
  rejected:        { label: 'Rejected',     color: '#DC2626', bg: '#FEF2F2',  border: '#FCA5A5' },
  awaiting_client: { label: 'Awaiting You', color: '#0D9488', bg: '#F0FDFA',  border: '#99F6E4' },
  rescheduled:     { label: 'Rescheduled',  color: '#0B7A70', bg: '#CCFBF1',  border: '#5EEAD4' },
  cancelled:       { label: 'Cancelled',    color: '#6B7280', bg: '#F3F4F6',  border: '#D1D5DB' },
  completed:       { label: 'Completed',    color: '#0D9488', bg: '#CCFBF1',  border: '#99F6E4' },
  flagged:         { label: 'Flagged',      color: '#BE123C', bg: '#FFF1F2',  border: '#FECDD3' },
};

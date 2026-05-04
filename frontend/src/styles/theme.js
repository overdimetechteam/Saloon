export const c = {
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primaryLight: '#EDE9FE',
  primarySoft: '#F5F3FF',

  accent: '#EC4899',
  accentLight: '#FCE7F3',

  sidebar: '#111827',
  sidebarBorder: '#1F2937',
  sidebarHover: '#1F2937',
  sidebarActive: '#7C3AED',
  sidebarText: '#9CA3AF',
  sidebarTextActive: '#FFFFFF',
  sidebarIcon: '#6B7280',

  bg: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceHover: '#F9FAFB',

  text: '#111827',
  textSub: '#374151',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',

  border: '#E5E7EB',
  borderFocus: '#7C3AED',
  inputBg: '#F9FAFB',

  success: '#059669',
  successBg: '#ECFDF5',
  successBorder: '#6EE7B7',

  error: '#DC2626',
  errorBg: '#FEF2F2',
  errorBorder: '#FCA5A5',

  warning: '#D97706',
  warningBg: '#FFFBEB',
  warningBorder: '#FCD34D',

  info: '#2563EB',
  infoBg: '#EFF6FF',
  infoBorder: '#93C5FD',

  pending: '#D97706',
  pendingBg: '#FFFBEB',
  confirmed: '#059669',
  confirmedBg: '#ECFDF5',
  rejected: '#DC2626',
  rejectedBg: '#FEF2F2',
  awaiting: '#7C3AED',
  awaitingBg: '#EDE9FE',
  cancelled: '#6B7280',
  cancelledBg: '#F3F4F6',
  completed: '#2563EB',
  completedBg: '#EFF6FF',
  flagged: '#BE123C',
  flaggedBg: '#FFF1F2',
};

export const shadow = {
  sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
};

export const STATUS_META = {
  pending:        { label: 'Pending',         color: '#D97706', bg: '#FFFBEB' },
  confirmed:      { label: 'Confirmed',        color: '#059669', bg: '#ECFDF5' },
  rejected:       { label: 'Rejected',         color: '#DC2626', bg: '#FEF2F2' },
  awaiting_client:{ label: 'Awaiting You',     color: '#7C3AED', bg: '#EDE9FE' },
  rescheduled:    { label: 'Rescheduled',      color: '#2563EB', bg: '#EFF6FF' },
  cancelled:      { label: 'Cancelled',        color: '#6B7280', bg: '#F3F4F6' },
  completed:      { label: 'Completed',        color: '#059669', bg: '#D1FAE5' },
  flagged:        { label: 'Flagged',          color: '#BE123C', bg: '#FFF1F2' },
};

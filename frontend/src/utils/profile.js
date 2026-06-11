export const looksEncrypted = v =>
  typeof v === 'string' && v.startsWith('gAAAAA') && v.length > 30;

export const sanitizeProfile = p => {
  if (!p) return p;
  return {
    ...p,
    full_name: looksEncrypted(p.full_name) ? null : p.full_name,
    phone:     looksEncrypted(p.phone)     ? null : p.phone,
  };
};

export const safeFirstName = (full_name, email) => {
  if (!full_name || looksEncrypted(full_name)) {
    return email ? email.split('@')[0] : 'there';
  }
  return full_name.split(' ')[0];
};

export const safeInitials = (full_name, email) => {
  if (!full_name || looksEncrypted(full_name)) {
    return (email || 'U')[0].toUpperCase();
  }
  return full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
};

export const safeFullName = (full_name, email) => {
  if (!full_name || looksEncrypted(full_name)) return email || '';
  return full_name;
};

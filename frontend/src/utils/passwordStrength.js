export function checkPasswordStrength(password = '') {
  const checks = {
    length:  password.length >= 8,
    upper:   /[A-Z]/.test(password),
    lower:   /[a-z]/.test(password),
    number:  /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;

  let label = 'Too weak', color = '#DC2626';
  if (score >= 5)      { label = 'Strong'; color = '#16A34A'; }
  else if (score >= 4) { label = 'Good';   color = '#0D9488'; }
  else if (score >= 3) { label = 'Fair';   color = '#D4AF37'; }

  const valid = checks.length && checks.upper && checks.lower && checks.number;
  return { checks, score, label, color, valid };
}

export const PASSWORD_REQUIREMENT_TEXT = 'Password must be at least 8 characters and include uppercase, lowercase, and a number.';

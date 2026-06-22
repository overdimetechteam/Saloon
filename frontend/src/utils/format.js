/**
 * Convert total minutes → human-readable duration string.
 * Examples: 30 → "30min"  |  60 → "1h"  |  90 → "1h 30min"  |  150 → "2h 30min"
 */
export function formatDuration(totalMinutes) {
  if (!totalMinutes && totalMinutes !== 0) return '—';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

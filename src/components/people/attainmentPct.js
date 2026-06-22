/**
 * Safely extracts a 0-1 attainment fraction from the value returned by the backend.
 *
 * The backend may return:
 *   - an object  { actual, target, pct }  where pct is a 0-1 fraction (or null)
 *   - a plain number (0-1 fraction)        — legacy / already-normalised callers
 *   - null / undefined                     — no target set
 *
 * Returns a 0-1 fraction, or null when no fraction is available.
 */
const attainmentPct = (value) => {
  if (value == null) return null;
  if (typeof value === 'object') return value.pct ?? null;
  return value;
};

export default attainmentPct;

/**
 * Stable unique id for course / semester rows.
 *
 * Local only — these ids are React keys and never leave the device, so the
 * shortened UUID is plenty. Kept apart from `hooks.ts` so modules that must
 * stay framework-free (`validate.ts`) can use it without pulling in React.
 */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

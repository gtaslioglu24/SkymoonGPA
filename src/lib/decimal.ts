/**
 * Decimal entry that works with every phone keyboard.
 *
 * A Turkish-locale phone shows "," as the only decimal key, and a
 * `type="number"` input silently empties itself on "3,5" — so a GPA like 3.5
 * could not be typed at all. The fields are plain text inputs instead, and
 * this module is the one place that decides what counts as a number in them:
 * "," and "." are the same separator, everything else is rejected.
 */

export type DecimalSeparator = '.' | ',';

/** Digits with at most one separator — also every prefix of such a number. */
const DECIMAL_DRAFT = /^\d*[.,]?\d*$/;

/**
 * Reads what the user has typed so far.
 *
 * - `''`   — nothing numeric yet ("" or a lone separator); the field is empty.
 * - number — the value, with "," read as a decimal point ("3,5" → 3.5).
 * - `null` — not a number in progress ("3,5,", "abc", "-1", "1e9"); the
 *            keystroke should be refused rather than wipe the field.
 */
export function parseDecimalInput(raw: string): number | '' | null {
  const s = raw.replace(/\s+/g, '');
  if (!DECIMAL_DRAFT.test(s)) return null;
  if (!/\d/.test(s)) return '';
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** The separator the user chose, so the field keeps answering in kind. */
export function separatorOf(raw: string): DecimalSeparator | null {
  if (raw.includes(',')) return ',';
  if (raw.includes('.')) return '.';
  return null;
}

/** Shows a stored value with the given separator ('' stays empty). */
export function formatDecimal(value: number | '', sep: DecimalSeparator = '.'): string {
  if (value === '') return '';
  const s = String(value);
  return sep === ',' ? s.replace('.', ',') : s;
}

/**
 * One arrow-key step, rounded to the step's precision so 0.1 + 0.2 lands on
 * 0.3 instead of 0.30000000000000004.
 */
export function stepDecimal(value: number, step: number, direction: 1 | -1): number {
  const decimals = (String(step).split('.')[1] ?? '').length;
  const factor = 10 ** decimals;
  return Math.round((value + direction * step) * factor) / factor;
}

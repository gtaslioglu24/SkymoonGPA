/**
 * Versioned, validated localStorage.
 *
 * Persisted state is *untrusted input*: it may have been written by an older
 * release with a different shape, truncated by a quota error, or edited by hand.
 * Handing such a value straight to React is how a calculator bricks itself — a
 * stored object where the code expects an array throws on every single render,
 * the error boundary offers "reload", the reload re-reads the same bad value,
 * and the user has no way out that doesn't involve devtools.
 *
 * So every read goes through a parser that returns `null` for anything it does
 * not recognise, and `null` means "use the default". Bad data degrades to a
 * fresh start instead of a permanent crash.
 */

/** Bump when a stored shape changes incompatibly. Old keys are then ignored. */
export const STORAGE_VERSION = 2;

const PREFIX = `skymoon-gpa:v${STORAGE_VERSION}:`;

/** Key prefixes written by earlier releases, newest first. */
const LEGACY_PREFIXES = ['koc-gpa:'];

/** A parser turns unknown JSON into a valid `T`, or `null` to reject it. */
export type Parser<T> = (raw: unknown) => T | null;

function fullKey(name: string): string {
  return PREFIX + name;
}

/** Returned when a key holds something that isn't valid JSON at all. */
const UNREADABLE = Symbol('unreadable');

function readRaw(key: string): unknown | typeof UNREADABLE {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return undefined; // storage unavailable (private mode)
  }
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    // Truncated by a quota error, or hand-edited. Distinct from "absent" so the
    // caller can clear it instead of leaving litter behind forever.
    return UNREADABLE;
  }
}

/**
 * Read `name`, falling back to the previous release's key so an upgrade doesn't
 * silently wipe someone's transcript. Anything the parser rejects is dropped.
 */
export function readStored<T>(name: string, parse: Parser<T>): T | null {
  if (typeof window === 'undefined') return null;

  const current = readRaw(fullKey(name));
  if (current !== undefined) {
    const parsed = current === UNREADABLE ? null : parse(current);
    if (parsed !== null) return parsed;
    // Recognised key, unusable value: drop it so it can't fail again.
    removeStored(name);
    return null;
  }

  for (const legacy of LEGACY_PREFIXES) {
    const value = readRaw(legacy + name);
    if (value === undefined || value === UNREADABLE) continue;
    const parsed = parse(value);
    if (parsed !== null) {
      writeStored(name, parsed);
      return parsed;
    }
  }

  return null;
}

export function writeStored<T>(name: string, value: T): void {
  try {
    window.localStorage.setItem(fullKey(name), JSON.stringify(value));
  } catch {
    /* quota exceeded or storage disabled — the app works fine without it */
  }
}

export function removeStored(name: string): void {
  try {
    window.localStorage.removeItem(fullKey(name));
  } catch {
    /* ignore */
  }
}

/**
 * Remove every key this app has ever written, current and legacy. Backs the
 * "delete my data" control and the error screen's recovery button — which is
 * the one escape hatch from a bad-state crash loop, so it must not depend on
 * any app state to work.
 */
export function clearAppData(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('skymoon-gpa:') || LEGACY_PREFIXES.some((p) => key.startsWith(p))) {
        doomed.push(key);
      }
    }
    for (const key of doomed) window.localStorage.removeItem(key);
    window.sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

/** True when anything of the user's is currently persisted. */
export function hasStoredData(): boolean {
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith('skymoon-gpa:') && !key.endsWith(':theme') && !key.endsWith(':lang'))
        return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

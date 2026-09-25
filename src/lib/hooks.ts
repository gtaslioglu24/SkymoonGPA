import { useCallback, useEffect, useRef, useState } from 'react';
import { readStored, writeStored, type Parser } from './storage';

/**
 * Persisted state backed by localStorage.
 *
 * Every read is validated by `parse` (see `validate.ts`). A value that doesn't
 * pass is discarded and the default is used, so state written by an older build
 * — or corrupted by hand — degrades to a fresh start instead of crashing the
 * render on every load.
 */
export function useLocalStorage<T>(name: string, initial: T, parse: Parser<T>) {
  const [value, setValue] = useState<T>(() => readStored(name, parse) ?? initial);

  // Don't persist a value the user never touched: writing defaults on mount
  // manufactures "you have saved data" out of nothing. Identity comparison is
  // enough — every real edit produces a new object — and it survives React's
  // double-invoked effects in StrictMode, which a plain mount flag does not.
  // Once something has been written, keep writing, so undoing an edit back to
  // the original value still overwrites what's on disk.
  const initialValue = useRef(value);
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) {
      if (value === initialValue.current) return;
      dirty.current = true;
    }
    writeStored(name, value);
  }, [name, value]);

  return [value, setValue] as const;
}

export type Theme = 'light' | 'dark';

const THEME_KEY = 'skymoon-gpa:theme';

/**
 * The initial theme is applied before first paint by `public/theme.js`, so read
 * back what that script decided rather than recomputing it — otherwise React's
 * first render disagrees with the DOM and the page visibly flips.
 */
function detectInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(detectInitialTheme);
  const switching = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }

    // Drop the transition freeze once the new colours have actually painted.
    // One frame is not enough: the class is removed inside the same frame that
    // applies `.dark`, so the transitions are live again before the browser
    // paints and the cross-fade happens anyway. Two frames puts the removal
    // after the paint it was meant to cover.
    if (!switching.current) return;
    switching.current = false;
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => document.documentElement.classList.remove('theme-switching')),
    );
    return () => cancelAnimationFrame(id);
  }, [theme]);

  const toggle = useCallback(() => {
    // Set before the state update so the freeze is in place by the time the
    // effect above flips `.dark` — see `.theme-switching` in index.css.
    document.documentElement.classList.add('theme-switching');
    switching.current = true;
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle };
}

/** True when the user has asked the OS to minimise animation. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}


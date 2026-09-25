import { useEffect, useRef, useState } from 'react';
import { THRESHOLDS } from '../lib/grades';
import { usePrefersReducedMotion } from '../lib/hooks';
import { cx } from '../lib/cx';

/** Shared class for the large GPA figure — serif, solid ink, tabular. */
export const gpaFigureClass =
  'font-serif num text-[3.5rem] sm:text-6xl leading-[0.9] font-medium text-stone-900 dark:text-stone-50';

/**
 * Smoothly counts from the previous value to the next when `value` changes.
 *
 * The animated digits are hidden from assistive tech — a screen reader has no
 * use for forty intermediate frames. `announceLabel` instead emits the settled
 * value once, politely, which is the only thing worth hearing.
 */
export function AnimatedNumber({
  value,
  decimals = 2,
  className,
  announceLabel,
}: {
  value: number;
  decimals?: number;
  className?: string;
  announceLabel?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (reducedMotion) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }

    const from = fromRef.current;
    const to = value;
    const duration = 450;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(from + (to - from) * eased);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, reducedMotion]);

  return (
    <>
      <span aria-hidden="true" className={cx('num', className)}>
        {display.toFixed(decimals)}
      </span>
      {announceLabel && (
        <span className="sr-only" aria-live="polite">
          {announceLabel}: {value.toFixed(decimals)}
        </span>
      )}
    </>
  );
}

/**
 * A restrained 0–4 GPA scale with graduation (2.00) and honor (3.50) marks.
 * Optionally shows a hairline "ghost" tick for the starting value (delta).
 */
export function GpaBar({
  value,
  ghost,
  label,
}: {
  value: number;
  ghost?: number;
  label?: string;
}) {
  const pct = (v: number) => `${Math.min(100, Math.max(0, (v / THRESHOLDS.max) * 100))}%`;

  return (
    <div className="mt-5">
      <div
        role="img"
        aria-label={label ? `${label}: ${value.toFixed(2)} / 4.00` : undefined}
        aria-hidden={label ? undefined : true}
        className="relative h-1.5 w-full rounded-full bg-stone-200 dark:bg-white/10"
      >
        <div
          className="h-full rounded-full bg-brand-700 transition-all duration-500 dark:bg-brand-400"
          style={{ width: pct(value) }}
        />
        {[THRESHOLDS.graduation, THRESHOLDS.honor].map((tk) => (
          <span
            key={tk}
            className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-stone-400/70 dark:bg-white/30"
            style={{ left: pct(tk) }}
          />
        ))}
        {ghost !== undefined && Math.abs(ghost - value) > 0.001 && (
          <span
            className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-500 dark:bg-white/70"
            style={{ left: pct(ghost) }}
            title={ghost.toFixed(2)}
          />
        )}
      </div>
      <div
        aria-hidden="true"
        className="mt-2 flex justify-between text-[0.65rem] font-medium tracking-wide text-muted"
      >
        <span>0.0</span>
        <span>2.0</span>
        <span>3.5</span>
        <span>4.0</span>
      </div>
    </div>
  );
}

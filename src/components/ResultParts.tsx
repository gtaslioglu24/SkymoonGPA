import type { ReactNode } from 'react';
import { gpaBand } from '../lib/grades';
import { useI18n } from '../lib/i18n';
import { cx } from '../lib/cx';

export function DeltaChip({ delta }: { delta: number }) {
  const { t } = useI18n();
  const rounded = Math.round(delta * 100) / 100;
  const dir = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'same';

  const styles = {
    up: 'text-emerald-700 dark:text-emerald-400',
    down: 'text-brand-700 dark:text-brand-400',
    same: 'text-muted',
  }[dir];

  const arrow = dir === 'up' ? '↑' : dir === 'down' ? '↓' : '·';
  const sign = rounded > 0 ? '+' : '';

  return (
    <span className={cx('inline-flex items-center gap-1.5 text-sm font-medium', styles)}>
      <span aria-hidden="true" className="text-base leading-none">
        {arrow}
      </span>
      <span className="num font-semibold">
        {sign}
        {rounded.toFixed(2)}
      </span>
      <span className="text-muted">{t.result[dir]}</span>
    </span>
  );
}

export function ThresholdNote({ gpa }: { gpa: number }) {
  const { t } = useI18n();
  if (gpa <= 0) return null;

  const kind = gpaBand(gpa);

  const dot = {
    vehbiKoc: 'bg-emerald-500',
    deansHonor: 'bg-emerald-600/70',
    safe: 'bg-stone-400 dark:bg-stone-500',
    warning: 'bg-brand-600',
  }[kind];

  return (
    <div className="mt-5 flex items-center gap-2.5 border-t border-line pt-4 text-sm text-stone-600 dark:border-ink-line dark:text-stone-300">
      <span aria-hidden="true" className={cx('h-1.5 w-1.5 shrink-0 rounded-full', dot)} />
      {t.result[kind]}
    </div>
  );
}

export function StatPill({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-stone-50 px-3.5 py-3 dark:bg-white/[0.03]">
      <div className="num font-serif text-xl font-medium text-stone-900 dark:text-stone-50">
        {value}
      </div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

/** Placeholder shown instead of a number when there is nothing to compute yet. */
export function EmptyFigure({ hint }: { hint: string }) {
  return (
    <div>
      <div className="mt-1 flex items-end gap-3">
        <span
          aria-hidden="true"
          className="font-serif num text-[3.5rem] leading-[0.9] font-medium text-stone-300 sm:text-6xl dark:text-stone-600"
        >
          —
        </span>
        <span className="pb-2 font-serif text-lg text-muted">/ 4.00</span>
      </div>
      <p className="mt-3 text-sm text-muted">{hint}</p>
    </div>
  );
}

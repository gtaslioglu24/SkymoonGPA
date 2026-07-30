import type { ReactNode } from 'react';
import { THRESHOLDS } from '../lib/grades';
import { useI18n } from '../lib/i18n';
import { cx } from './ui';

export function DeltaChip({ delta }: { delta: number }) {
  const { t } = useI18n();
  const rounded = Math.round(delta * 100) / 100;
  const dir = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'same';

  const styles = {
    up: 'text-emerald-700 dark:text-emerald-400',
    down: 'text-brand-700 dark:text-brand-400',
    same: 'text-stone-500 dark:text-stone-400',
  }[dir];

  const arrow = dir === 'up' ? '↑' : dir === 'down' ? '↓' : '·';
  const sign = rounded > 0 ? '+' : '';

  return (
    <span className={cx('inline-flex items-center gap-1.5 text-sm font-medium', styles)}>
      <span className="text-base leading-none">{arrow}</span>
      <span className="num font-semibold">
        {sign}
        {rounded.toFixed(2)}
      </span>
      <span className="text-stone-400 dark:text-stone-500">{t.result[dir]}</span>
    </span>
  );
}

export function ThresholdNote({ gpa }: { gpa: number }) {
  const { t } = useI18n();
  if (gpa <= 0) return null;

  const kind =
    gpa >= THRESHOLDS.honor ? 'honor' : gpa >= THRESHOLDS.graduation ? 'safe' : 'warning';

  const dot = {
    honor: 'bg-emerald-500',
    safe: 'bg-stone-400 dark:bg-stone-500',
    warning: 'bg-brand-600',
  }[kind];

  return (
    <div className="mt-5 flex items-center gap-2.5 border-t border-line pt-4 text-sm text-stone-600 dark:border-ink-line dark:text-stone-300">
      <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', dot)} />
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
      <div className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{label}</div>
    </div>
  );
}

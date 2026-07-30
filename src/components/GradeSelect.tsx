import { GPA_GRADES, NON_GPA_GRADES } from '../lib/grades';
import { cx } from './ui';

/**
 * Native select styled to match the app. Native is intentional: it gives the
 * best mobile UX (system wheel picker) for a 12-option grade list.
 */
export function GradeSelect({
  value,
  onChange,
  includeNonGpa = false,
  className,
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  includeNonGpa?: boolean;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div className={cx('relative', className)}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none rounded-lg border border-line bg-paper-raised py-2.5 pl-3.5 pr-9 font-medium text-stone-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-line dark:bg-ink-800 dark:text-stone-50"
      >
        {GPA_GRADES.map((g) => (
          <option key={g.letter} value={g.letter}>
            {g.letter} · {(g.points as number).toFixed(1)}
          </option>
        ))}
        {includeNonGpa && (
          <optgroup label="—">
            {NON_GPA_GRADES.map((g) => (
              <option key={g.letter} value={g.letter}>
                {g.letter}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

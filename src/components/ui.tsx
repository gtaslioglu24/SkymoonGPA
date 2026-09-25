import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cx } from '../lib/cx';

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx('surface p-5 sm:p-6', className)}>{children}</div>;
}

export function SectionTitle({
  children,
  hint,
  action,
}: {
  children: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-serif text-xl font-medium text-stone-900 dark:text-stone-50">
          {children}
        </h2>
        {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  const className =
    'mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-strong';
  // Column headings in the course table label a whole column, not one field —
  // a <label> with nothing to point at would just be a lie to a screen reader.
  return htmlFor ? (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ) : (
    <span className={className}>{children}</span>
  );
}

const inputBase =
  'w-full rounded-lg border border-line bg-paper-raised px-3.5 py-2.5 text-stone-900 outline-none transition ' +
  'placeholder:text-stone-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ' +
  'dark:border-ink-line dark:bg-ink-800 dark:text-stone-50 dark:placeholder:text-stone-400';

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputBase, props.className)} />;
}

export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 'any',
  placeholder,
  className,
  ...rest
}: {
  value: number | '';
  onChange: (v: number | '') => void;
  min?: number;
  max?: number;
  step?: number | 'any';
  placeholder?: string;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'min' | 'max' | 'step'>) {
  return (
    <input
      {...rest}
      type="number"
      inputMode="decimal"
      value={value}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') return onChange('');
        const n = Number(raw);
        // `min`/`max` on a number input are advisory — typing straight past them
        // is allowed, and "1e9 credits" or a negative GPA would sail through.
        if (!Number.isFinite(n)) return;
        const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
        onChange(clamped);
      }}
      className={cx(inputBase, 'num', className)}
    />
  );
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Native select styled to match the app. Native is intentional: it gives the
 * best mobile UX (system wheel picker) and free keyboard/screen-reader support.
 */
export function SelectField({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cx('relative', className)}>
      <select
        {...rest}
        className="w-full cursor-pointer appearance-none rounded-lg border border-line bg-paper-raised py-2.5 pl-3.5 pr-9 text-sm font-medium text-stone-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-line dark:bg-ink-800 dark:text-stone-50"
      >
        {children}
      </select>
      <ChevronIcon />
    </div>
  );
}

type ButtonVariant = 'primary' | 'ghost' | 'soft';

export function Button({
  variant = 'primary',
  className,
  children,
  ...rest
}: {
  variant?: ButtonVariant;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles: Record<ButtonVariant, string> = {
    primary: 'bg-brand-700 text-white hover:bg-brand-800 active:scale-[0.99]',
    soft: 'border border-line bg-transparent text-stone-700 hover:border-brand-300 hover:text-brand-700 dark:border-ink-line dark:text-stone-200 dark:hover:border-brand-500/50 dark:hover:text-brand-300',
    ghost: 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/5',
  };
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function IconButton({
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/5 dark:hover:text-stone-200',
        className,
      )}
    >
      {children}
    </button>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cx(
        'inline-flex rounded-lg border border-line p-0.5 dark:border-ink-line',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cx(
              'rounded-md font-medium transition',
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
              active
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'text-muted hover:text-stone-900 dark:hover:text-stone-100',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}


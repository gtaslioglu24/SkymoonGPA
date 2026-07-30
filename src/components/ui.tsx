import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

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
        {hint && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-stone-400">
      {children}
    </span>
  );
}

const inputBase =
  'w-full rounded-lg border border-line bg-paper-raised px-3.5 py-2.5 text-stone-900 outline-none transition ' +
  'placeholder:text-stone-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ' +
  'dark:border-ink-line dark:bg-ink-800 dark:text-stone-50 dark:placeholder:text-stone-500';

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
        onChange(Number(raw));
      }}
      className={cx(inputBase, 'num', className)}
    />
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
        'inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-white/5 dark:hover:text-stone-200',
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
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div
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
            className={cx(
              'rounded-md font-medium transition',
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
              active
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export { cx };

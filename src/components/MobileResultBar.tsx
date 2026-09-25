import type { ReactNode } from 'react';

/**
 * Compact result readout pinned to the bottom of the viewport on small screens.
 *
 * On a phone the input column pushes the result card ~1200px down the page, so
 * the number the whole app exists to show was never on screen while typing.
 * This mirrors it in the thumb zone. It is `aria-hidden` on purpose — the real
 * card is still in the document, and a screen reader shouldn't hear it twice.
 */
export function MobileResultBar({
  label,
  value,
  trailing,
}: {
  label: string;
  value: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper-raised/95 px-4 pt-2.5 pb-safe backdrop-blur lg:hidden dark:border-ink-line dark:bg-ink-900/95"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted">
            {label}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="num font-serif text-2xl font-medium leading-tight text-stone-900 dark:text-stone-50">
              {value}
            </span>
            <span className="font-serif text-sm text-muted">/ 4.00</span>
          </div>
        </div>
        {trailing && <div className="shrink-0 text-right">{trailing}</div>}
      </div>
    </div>
  );
}

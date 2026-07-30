import { useState } from 'react';
import { GPA_GRADES } from '../lib/grades';
import { useI18n } from '../lib/i18n';
import { Card } from './ui';

export function InfoPanel() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Card className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-bold text-stone-900 dark:text-white">
          {t.info.scaleTitle}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-4 w-4 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="mt-4 animate-fade-up">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {GPA_GRADES.map((g) => (
              <div
                key={g.letter}
                className="rounded-lg bg-stone-100/70 px-3 py-2 text-center dark:bg-white/5"
              >
                <div className="text-sm font-bold text-stone-900 dark:text-white">{g.letter}</div>
                <div className="text-xs tabular-nums text-stone-500 dark:text-stone-400">
                  {(g.points as number).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 text-sm text-stone-600 dark:text-stone-300">
            <p>
              <span className="font-semibold text-stone-900 dark:text-white">
                {t.info.nonGpaTitle}:
              </span>{' '}
              {t.info.nonGpaBody}
            </p>
            <p className="rounded-lg bg-brand-50/70 px-3 py-2 text-brand-800 dark:bg-brand-500/10 dark:text-brand-100">
              {t.info.creditNote}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

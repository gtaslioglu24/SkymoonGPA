import { useState } from 'react';
import { GPA_GRADES } from '../lib/grades';
import { RULES_VERIFIED_ON, SOURCES } from '../lib/config';
import { useI18n } from '../lib/i18n';
import { Card } from './ui';

/**
 * The rules this calculator encodes, plus where they came from and when they
 * were last checked. A tool that asks students to make registration decisions
 * on its output should be able to show its working.
 */
export function InfoPanel() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);

  const verified = new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(RULES_VERIFIED_ON));

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
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-4 w-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
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
                <div className="text-xs tabular-nums text-muted">
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
            <p>
              <span className="font-semibold text-stone-900 dark:text-white">
                {t.info.repeatTitle}:
              </span>{' '}
              {t.info.repeatBody}
            </p>
            <p className="rounded-lg bg-brand-50/70 px-3 py-2 text-brand-800 dark:bg-brand-500/10 dark:text-brand-100">
              {t.info.creditNote}
            </p>
          </div>

          <div className="mt-4 border-t border-line pt-4 dark:border-ink-line">
            <p className="text-xs text-muted">
              {t.info.verifiedOn.replace('{date}', verified)}
            </p>
            <ul className="mt-2 space-y-1">
              {SOURCES.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-700 underline underline-offset-2 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
                  >
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}

import { Fragment, useMemo, useState } from 'react';
import {
  parseTranscript,
  type CreditColumn,
  type ParsedSemester,
  type TranscriptSummary,
} from '../lib/transcript';
import { useI18n } from '../lib/i18n';
import { cx } from '../lib/cx';
import { Button, IconButton, SelectField } from './ui';

export type ImportMode = 'replace' | 'append';

/**
 * Paste-a-transcript importer.
 *
 * Everything is shown before anything is imported. The parser is heuristic —
 * transcript layouts differ, and the credit column is genuinely ambiguous when
 * ECTS sits next to it — so the user confirms a preview, drops rows that came
 * out wrong, and is told plainly about lines that could not be read. Importing
 * silently would trade a tedious problem (typing 40 courses) for a dangerous
 * one (a confident GPA built on misread numbers).
 */
export function TranscriptImport({
  onImport,
  hasExistingData = false,
  onSummary,
}: {
  onImport: (semesters: ParsedSemester[], mode: ImportMode) => void;
  hasExistingData?: boolean;
  /** Called with the transcript's own totals, when it stated any. */
  onSummary?: (summary: TranscriptSummary) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [creditColumn, setCreditColumn] = useState<CreditColumn>('smaller');
  const [mode, setMode] = useState<ImportMode>(hasExistingData ? 'append' : 'replace');
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [showSkipped, setShowSkipped] = useState(false);

  const parsed = useMemo(() => parseTranscript(text, creditColumn), [text, creditColumn]);

  const kept = useMemo(
    () =>
      parsed.semesters
        .map((s, si) => ({
          ...s,
          courses: s.courses.filter((_, ci) => !removed.has(`${si}:${ci}`)),
        }))
        .filter((s) => s.courses.length > 0),
    [parsed, removed],
  );

  const keptCount = kept.reduce((n, s) => n + s.courses.length, 0);

  const reset = () => {
    setText('');
    setRemoved(new Set());
    setShowSkipped(false);
  };

  const toggleRow = (key: string) =>
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const confirm = () => {
    onImport(kept, mode);
    if (onSummary && (parsed.summary.cumulativeGpa !== undefined || parsed.summary.totalCredits !== undefined)) {
      onSummary(parsed.summary);
    }
    reset();
    setOpen(false);
  };

  if (!open) {
    return (
      <Button variant="soft" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        <ClipboardIcon />
        {t.transcript.open}
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-stone-50/60 p-4 dark:border-ink-line dark:bg-white/[0.02]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-stone-50">
            {t.transcript.title}
          </h3>
          <p className="mt-0.5 text-sm text-muted">{t.transcript.hint}</p>
        </div>
        <IconButton
          onClick={() => {
            reset();
            setOpen(false);
          }}
          aria-label={t.transcript.cancel}
        >
          <CloseIcon />
        </IconButton>
      </div>

      <label htmlFor="transcript-text" className="sr-only">
        {t.transcript.title}
      </label>
      <textarea
        id="transcript-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setRemoved(new Set());
        }}
        rows={text ? 5 : 8}
        spellCheck={false}
        placeholder={t.transcript.placeholder}
        className="w-full resize-y rounded-lg border border-line bg-paper-raised p-3 font-mono text-xs leading-relaxed text-stone-900 outline-none transition placeholder:text-stone-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-line dark:bg-ink-800 dark:text-stone-50 dark:placeholder:text-stone-400"
      />

      <p className="mt-2 text-xs leading-relaxed text-muted">
        <span aria-hidden="true">🔒 </span>
        {t.transcript.privacy}
      </p>

      {text.trim() && (
        <div className="mt-4 border-t border-line pt-4 dark:border-ink-line">
          {parsed.totalCourses === 0 ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-100">
              {t.transcript.noneFound}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                  {t.transcript.coursesFound
                    .replace('{n}', String(keptCount))
                    .replace('{s}', String(kept.length))}
                </p>

                {parsed.ambiguousCredits > 0 && (
                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <label htmlFor="credit-column" className="shrink-0 text-xs text-muted">
                      {t.transcript.creditColumnTitle}
                    </label>
                    <SelectField
                      id="credit-column"
                      className="min-w-0 flex-1 sm:w-52 sm:flex-none"
                      value={creditColumn}
                      onChange={(e) => setCreditColumn(e.target.value as CreditColumn)}
                    >
                      <option value="smaller">{t.transcript.creditSmaller}</option>
                      <option value="larger">{t.transcript.creditLarger}</option>
                    </SelectField>
                  </div>
                )}
              </div>

              {parsed.ambiguousCredits > 0 && (
                <p className="mt-2 text-xs leading-relaxed text-muted">{t.transcript.creditHint}</p>
              )}

              {/* Preview */}
              <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-line dark:border-ink-line">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">{t.transcript.preview}</caption>
                  <thead className="sticky top-0 bg-stone-100 text-xs uppercase tracking-wide text-muted-strong dark:bg-ink-800">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-semibold">
                        {t.courses.name}
                      </th>
                      <th scope="col" className="px-2 py-2 text-right font-semibold">
                        {t.courses.credits}
                      </th>
                      <th scope="col" className="px-2 py-2 font-semibold">
                        {t.courses.grade}
                      </th>
                      <th scope="col" className="px-2 py-2">
                        <span className="sr-only">{t.courses.remove}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.semesters.map((s, si) => (
                      <Fragment key={si}>
                        <tr className="bg-stone-50 dark:bg-white/[0.03]">
                          <th
                            colSpan={4}
                            scope="colgroup"
                            className="px-3 py-1.5 text-xs font-semibold text-muted-strong"
                          >
                            {s.name || t.transcript.unnamedSemester}
                          </th>
                        </tr>
                        {s.courses.map((c, ci) => {
                          const key = `${si}:${ci}`;
                          const gone = removed.has(key);
                          return (
                            <tr
                              key={key}
                              className={cx(
                                'border-t border-line dark:border-ink-line',
                                gone && 'opacity-40',
                              )}
                            >
                              <td className="px-3 py-1.5">
                                <span
                                  className={cx(
                                    'font-medium text-stone-900 dark:text-stone-50',
                                    gone && 'line-through',
                                  )}
                                >
                                  {c.code ?? c.name ?? '—'}
                                </span>
                                {c.code && c.name && (
                                  <span className="ml-2 text-xs text-muted">{c.name}</span>
                                )}
                              </td>
                              <td className="num px-2 py-1.5 text-right text-stone-900 dark:text-stone-50">
                                {c.credits}
                              </td>
                              <td className="px-2 py-1.5 font-semibold text-stone-900 dark:text-stone-50">
                                {c.grade}
                              </td>
                              <td className="px-2 py-1.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => toggleRow(key)}
                                  className="text-xs font-medium text-muted underline underline-offset-2 hover:text-stone-900 dark:hover:text-stone-100"
                                >
                                  {gone ? t.transcript.undo : t.courses.remove}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Warnings */}
              <div className="mt-3 space-y-2">
                {parsed.duplicateCodes.length > 0 && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:bg-amber-400/10 dark:text-amber-100">
                    <strong>{t.transcript.duplicateTitle}:</strong>{' '}
                    {parsed.duplicateCodes.join(', ')} — {t.transcript.duplicateHint}
                  </p>
                )}

                {parsed.skipped.length > 0 && (
                  <div className="rounded-lg bg-stone-100 px-3 py-2 dark:bg-white/5">
                    <button
                      type="button"
                      onClick={() => setShowSkipped((v) => !v)}
                      aria-expanded={showSkipped}
                      className="text-xs font-semibold text-stone-800 underline underline-offset-2 dark:text-stone-100"
                    >
                      {t.transcript.skippedTitle.replace('{n}', String(parsed.skipped.length))}
                    </button>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {t.transcript.skippedHint}
                    </p>
                    {showSkipped && (
                      <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
                        {parsed.skipped.map((line, i) => (
                          <li
                            key={i}
                            className="truncate font-mono text-[0.7rem] text-muted"
                            title={line}
                          >
                            {line}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {(parsed.summary.cumulativeGpa !== undefined ||
                  parsed.summary.totalCredits !== undefined) && (
                  <p className="rounded-lg bg-brand-50/70 px-3 py-2 text-xs leading-relaxed text-brand-900 dark:bg-brand-500/10 dark:text-brand-100">
                    {t.transcript.summaryFound
                      .replace('{gpa}', parsed.summary.cumulativeGpa?.toFixed(2) ?? '—')
                      .replace('{credits}', String(parsed.summary.totalCredits ?? '—'))}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {hasExistingData && (
                  <SelectField
                    className="w-full sm:w-56"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as ImportMode)}
                    aria-label={t.transcript.modeLabel}
                  >
                    <option value="append">{t.transcript.modeAppend}</option>
                    <option value="replace">{t.transcript.modeReplace}</option>
                  </SelectField>
                )}
                <Button onClick={confirm} disabled={keptCount === 0}>
                  {t.transcript.import.replace('{n}', String(keptCount))}
                </Button>
                <Button variant="ghost" onClick={reset}>
                  {t.transcript.clear}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ClipboardIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
    >
      <path
        d="M7.5 4H6a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 6 17h8a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 14 4h-1.5M7.5 4V3.2A1.2 1.2 0 0 1 8.7 2h2.6a1.2 1.2 0 0 1 1.2 1.2V4m-5 0h5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
    </svg>
  );
}

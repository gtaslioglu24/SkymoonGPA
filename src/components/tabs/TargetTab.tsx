import { useMemo } from 'react';
import { requiredTermGpa, exampleGradeMixes } from '../../lib/gpa';
import { useI18n } from '../../lib/i18n';
import { useLocalStorage } from '../../lib/hooks';
import {
  CurrentStanding,
  emptyStanding,
  resolveStanding,
  type StandingState,
} from '../CurrentStanding';
import { AnimatedNumber, GpaBar, gpaFigureClass } from '../GpaVisual';
import { Card, Label, NumberField, SectionTitle, cx } from '../ui';

/** ["A","B","B"] → "A + 2× B" */
function formatCombo(combo: string[]): string {
  const counts: { letter: string; n: number }[] = [];
  for (const l of combo) {
    const last = counts[counts.length - 1];
    if (last && last.letter === l) last.n++;
    else counts.push({ letter: l, n: 1 });
  }
  return counts.map((c) => (c.n > 1 ? `${c.n}× ${c.letter}` : c.letter)).join(' + ');
}

export function TargetTab() {
  const { t } = useI18n();
  const [standing, setStanding] = useLocalStorage<StandingState>(
    'koc-gpa:target:standing',
    emptyStanding,
  );
  const [plannedCredits, setPlannedCredits] = useLocalStorage<number | ''>(
    'koc-gpa:target:credits',
    15,
  );
  const [targetGpa, setTargetGpa] = useLocalStorage<number | ''>('koc-gpa:target:goal', 3);

  const resolved = resolveStanding(standing);
  const result = useMemo(
    () =>
      requiredTermGpa({
        currentGpa: resolved.gpa,
        currentCredits: resolved.credits,
        plannedCredits: plannedCredits === '' ? 0 : plannedCredits,
        targetGpa: targetGpa === '' ? 0 : targetGpa,
      }),
    [resolved.gpa, resolved.credits, plannedCredits, targetGpa],
  );

  const nCourses = Math.max(1, Math.min(8, Math.round((plannedCredits === '' ? 0 : plannedCredits) / 3)));
  const mixes =
    result.status === 'ok' && result.requiredTermGpa !== null
      ? exampleGradeMixes(result.requiredTermGpa, nCourses)
      : [];

  const statusStyles = {
    ok: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200',
    guaranteed: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200',
    impossible: 'bg-rose-50 text-rose-800 dark:bg-rose-400/10 dark:text-rose-200',
    'no-credits': 'bg-stone-100 text-stone-600 dark:bg-white/5 dark:text-stone-300',
  }[result.status];

  return (
    <div className="grid gap-5 lg:grid-cols-5 lg:items-start">
      <div className="space-y-5 lg:order-1 lg:col-span-3">
        <Card>
          <CurrentStanding value={standing} onChange={setStanding} />
        </Card>

        <Card>
          <SectionTitle hint={t.tabsDesc.target}>{t.target.title}</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>{t.target.plannedCredits}</Label>
              <NumberField
                value={plannedCredits}
                onChange={setPlannedCredits}
                min={0}
                step={1}
                placeholder="15"
              />
            </div>
            <div>
              <Label>{t.target.targetGpa}</Label>
              <NumberField
                value={targetGpa}
                onChange={setTargetGpa}
                min={0}
                max={4}
                step={0.01}
                placeholder="3.00"
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:order-2 lg:col-span-2 lg:sticky lg:top-6">
        <Card>
          {result.status === 'ok' && result.requiredTermGpa !== null ? (
            <>
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                {t.target.required}
              </div>
              <div className="mt-1 flex items-end gap-3">
                <AnimatedNumber value={result.requiredTermGpa} className={gpaFigureClass} />
                <span className="pb-2 font-serif text-lg text-stone-400">/ 4.00</span>
              </div>
              <GpaBar value={result.requiredTermGpa} />
              {mixes.length > 0 && (
                <div className="mt-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                    {t.target.examplesTitle}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {mixes.map((combo) => (
                      <span
                        key={combo.join('-')}
                        className="rounded-md border border-line px-2.5 py-1 text-sm font-medium text-stone-800 dark:border-ink-line dark:text-stone-100"
                      >
                        {formatCombo(combo)}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-stone-400 dark:text-stone-500">
                    {t.target.exampleNote}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {t.target.title}
            </div>
          )}

          <div className={cx('mt-4 rounded-xl px-4 py-3 text-sm font-medium', statusStyles)}>
            {t.target[result.status === 'no-credits' ? 'noCredits' : result.status]}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-stone-100/70 px-4 py-3 dark:bg-white/5">
            <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
              {t.target.maxReachable}
            </span>
            <span className="text-lg font-bold tabular-nums text-stone-900 dark:text-white">
              {result.maxReachableGpa.toFixed(2)}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}

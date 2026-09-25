import { useMemo } from 'react';
import { requiredTermGpa, exampleGradeMixes } from '../../lib/gpa';
import { useI18n } from '../../lib/i18n';
import { useLocalStorage } from '../../lib/hooks';
import { emptyStanding, resolveStanding, type StandingState } from '../../lib/standing';
import { parseNumberOrEmpty, parseStanding } from '../../lib/validate';
import { CurrentStanding } from '../CurrentStanding';
import { MobileResultBar } from '../MobileResultBar';
import { AnimatedNumber, GpaBar, gpaFigureClass } from '../GpaVisual';
import { EmptyFigure } from '../ResultParts';
import { cx } from '../../lib/cx';
import { Card, Label, NumberField, SectionTitle } from '../ui';

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
    'target:standing',
    emptyStanding,
    parseStanding,
  );
  const [plannedCredits, setPlannedCredits] = useLocalStorage<number | ''>(
    'target:credits',
    15,
    parseNumberOrEmpty(0, 100),
  );
  const [targetGpa, setTargetGpa] = useLocalStorage<number | ''>(
    'target:goal',
    3,
    parseNumberOrEmpty(0, 4),
  );

  const resolved = resolveStanding(standing);
  const result = useMemo(
    () =>
      requiredTermGpa({
        currentGpa: resolved.gpa,
        currentCredits: resolved.credits,
        currentQualityPoints: resolved.qualityPoints,
        plannedCredits: plannedCredits === '' ? 0 : plannedCredits,
        targetGpa: targetGpa === '' ? 0 : targetGpa,
      }),
    [resolved.gpa, resolved.credits, resolved.qualityPoints, plannedCredits, targetGpa],
  );

  const nCourses = Math.max(
    1,
    Math.min(8, Math.round((plannedCredits === '' ? 0 : plannedCredits) / 3)),
  );
  const mixes =
    result.status === 'ok' && result.requiredTermGpa !== null
      ? exampleGradeMixes(result.requiredTermGpa, nCourses)
      : [];

  const statusStyles = {
    ok: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100',
    guaranteed: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100',
    impossible: 'bg-rose-50 text-rose-900 dark:bg-rose-400/10 dark:text-rose-100',
    'no-credits': 'bg-stone-100 text-stone-700 dark:bg-white/5 dark:text-stone-200',
  }[result.status];

  const showFigure = resolved.hasStanding && result.status === 'ok' && result.requiredTermGpa !== null;

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
              <Label htmlFor="target-credits">{t.target.plannedCredits}</Label>
              <NumberField
                id="target-credits"
                value={plannedCredits}
                onChange={setPlannedCredits}
                min={0}
                max={100}
                step={1}
                placeholder="15"
              />
            </div>
            <div>
              <Label htmlFor="target-goal">{t.target.targetGpa}</Label>
              <NumberField
                id="target-goal"
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
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-strong">
            {showFigure ? t.target.required : t.target.title}
          </div>

          {!resolved.hasStanding ? (
            <EmptyFigure hint={t.result.enterStanding} />
          ) : showFigure ? (
            <>
              <div className="mt-1 flex items-end gap-3">
                <AnimatedNumber
                  value={result.requiredTermGpa as number}
                  className={gpaFigureClass}
                  announceLabel={t.target.required}
                />
                <span className="pb-2 font-serif text-lg text-muted">/ 4.00</span>
              </div>
              <GpaBar value={result.requiredTermGpa as number} label={t.target.required} />
              {mixes.length > 0 && (
                <div className="mt-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-strong">
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
                  <p className="mt-2.5 text-xs leading-relaxed text-muted">
                    {t.target.exampleNote}
                  </p>
                </div>
              )}
            </>
          ) : null}

          {resolved.hasStanding && (
            <>
              <div className={cx('mt-4 rounded-xl px-4 py-3 text-sm font-medium', statusStyles)}>
                {t.target[result.status === 'no-credits' ? 'noCredits' : result.status]}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-stone-100/70 px-4 py-3 dark:bg-white/5">
                <span className="text-sm font-medium text-muted-strong">
                  {t.target.maxReachable}
                </span>
                <span className="num text-lg font-bold text-stone-900 dark:text-white">
                  {result.maxReachableGpa.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </Card>
      </div>

      <MobileResultBar
        label={t.target.required}
        value={showFigure ? (result.requiredTermGpa as number).toFixed(2) : '—'}
        trailing={
          resolved.hasStanding && result.requiredLetter ? (
            <span className="text-xs text-muted">
              min{' '}
              <b className="text-sm text-stone-900 dark:text-stone-50">{result.requiredLetter}</b>
            </span>
          ) : null
        }
      />
    </div>
  );
}

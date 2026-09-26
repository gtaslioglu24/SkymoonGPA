import { useMemo } from 'react';
import { projectGpa, DEFAULT_REPEAT_RULE, type CourseInput, type RepeatRule } from '../../lib/gpa';
import { useI18n } from '../../lib/i18n';
import { useLocalStorage } from '../../lib/hooks';
import { emptyStanding, resolveStanding, type StandingState } from '../../lib/standing';
import { parseCourses, parseRepeatRule, parseStanding } from '../../lib/validate';
import { CurrentStanding } from '../CurrentStanding';
import { makeCourse } from '../../lib/course';
import { CourseList } from '../CourseList';
import { MobileResultBar } from '../MobileResultBar';
import { AnimatedNumber, GpaBar, gpaFigureClass } from '../GpaVisual';
import { DeltaChip, EmptyFigure, StatPill, ThresholdNote } from '../ResultParts';
import { Card, Label, SectionTitle, SelectField } from '../ui';

export function ProjectionTab() {
  const { t } = useI18n();
  const [standing, setStanding] = useLocalStorage<StandingState>(
    'proj:standing',
    emptyStanding,
    parseStanding,
  );
  const [courses, setCourses] = useLocalStorage<CourseInput[]>(
    'proj:courses',
    [makeCourse({ name: '' })],
    parseCourses,
  );
  const [repeatRule, setRepeatRule] = useLocalStorage<RepeatRule>(
    'proj:repeatRule',
    DEFAULT_REPEAT_RULE,
    parseRepeatRule,
  );

  const resolved = resolveStanding(standing);
  const result = useMemo(
    () =>
      projectGpa({
        currentGpa: resolved.gpa,
        currentCredits: resolved.credits,
        currentQualityPoints: resolved.qualityPoints,
        courses,
        repeatRule,
      }),
    [resolved.gpa, resolved.credits, resolved.qualityPoints, courses, repeatRule],
  );

  const hasRetake = courses.some((c) => c.isRetake);
  // A projection needs both halves: without a current standing, "4.00" would
  // just be this term's average wearing a cumulative label.
  const ready = resolved.hasStanding && result.hasInput;

  return (
    <div className="grid gap-5 lg:grid-cols-5 lg:items-start">
      {/* Inputs */}
      <div className="space-y-5 lg:order-1 lg:col-span-3">
        <Card>
          <CurrentStanding value={standing} onChange={setStanding} />
        </Card>

        <Card>
          <SectionTitle hint={t.tabsDesc.projection}>{t.courses.plannedTitle}</SectionTitle>
          <CourseList courses={courses} onChange={setCourses} allowRetake />

          {hasRetake && (
            <div className="mt-4 border-t border-line pt-4 dark:border-ink-line">
              <Label htmlFor="repeat-rule">{t.repeat.title}</Label>
              <SelectField
                id="repeat-rule"
                className="max-w-sm"
                value={repeatRule}
                onChange={(e) => setRepeatRule(e.target.value as RepeatRule)}
                aria-describedby="repeat-rule-hint"
              >
                <option value="highest">{t.repeat.highest}</option>
                <option value="last">{t.repeat.last}</option>
                <option value="all">{t.repeat.all}</option>
              </SelectField>
              <p id="repeat-rule-hint" className="mt-2 text-xs leading-relaxed text-muted">
                {t.repeat.hint}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Result */}
      <div className="lg:order-2 lg:col-span-2 lg:sticky lg:top-6">
        <Card className="overflow-hidden">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-strong">
            {t.result.projected}
          </div>

          {ready ? (
            <>
              <div className="mt-1 flex items-end gap-3">
                <AnimatedNumber
                  value={result.newGpa}
                  className={gpaFigureClass}
                  announceLabel={t.result.projected}
                />
                <span className="pb-2 font-serif text-lg text-muted">/ 4.00</span>
              </div>

              <div className="mt-3">
                <DeltaChip delta={result.delta} />
              </div>

              <GpaBar value={result.newGpa} ghost={result.currentGpa} label={t.result.projected} />

              <div className="mt-5 grid grid-cols-3 gap-2.5">
                <StatPill label={t.result.current} value={result.currentGpa.toFixed(2)} />
                <StatPill
                  label={t.result.termGpa}
                  value={result.termGpa === null ? '—' : result.termGpa.toFixed(2)}
                />
                <StatPill label={t.result.totalCredits} value={result.newTotalCredits} />
              </div>

              <ThresholdNote gpa={result.newGpa} termGpa={result.termGpa} />
            </>
          ) : (
            <EmptyFigure
              hint={resolved.hasStanding ? t.result.enterToSee : t.result.enterStanding}
            />
          )}
        </Card>
      </div>

      <MobileResultBar
        label={t.result.projected}
        value={ready ? result.newGpa.toFixed(2) : '—'}
        trailing={ready ? <DeltaChip delta={result.delta} /> : null}
      />
    </div>
  );
}

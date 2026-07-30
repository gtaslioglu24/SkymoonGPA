import { useMemo } from 'react';
import { projectGpa, type CourseInput } from '../../lib/gpa';
import { useI18n } from '../../lib/i18n';
import { useLocalStorage } from '../../lib/hooks';
import {
  CurrentStanding,
  emptyStanding,
  resolveStanding,
  type StandingState,
} from '../CurrentStanding';
import { CourseList, makeCourse } from '../CourseList';
import { AnimatedNumber, GpaBar, gpaFigureClass } from '../GpaVisual';
import { DeltaChip, StatPill, ThresholdNote } from '../ResultParts';
import { Card, SectionTitle } from '../ui';

export function ProjectionTab() {
  const { t } = useI18n();
  const [standing, setStanding] = useLocalStorage<StandingState>(
    'koc-gpa:proj:standing',
    emptyStanding,
  );
  const [courses, setCourses] = useLocalStorage<CourseInput[]>('koc-gpa:proj:courses', [
    makeCourse({ name: '' }),
  ]);

  const resolved = resolveStanding(standing);
  const result = useMemo(
    () =>
      projectGpa({
        currentGpa: resolved.gpa,
        currentCredits: resolved.credits,
        courses,
      }),
    [resolved.gpa, resolved.credits, courses],
  );

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
        </Card>
      </div>

      {/* Result */}
      <div className="lg:order-2 lg:col-span-2 lg:sticky lg:top-6">
        <Card className="overflow-hidden">
          <div className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {t.result.projected}
          </div>

          <div className="mt-1 flex items-end gap-3">
            <AnimatedNumber value={result.newGpa} className={gpaFigureClass} />
            <span className="pb-2 font-serif text-lg text-stone-400">/ 4.00</span>
          </div>

          <div className="mt-3">
            {result.hasInput ? (
              <DeltaChip delta={result.delta} />
            ) : (
              <span className="text-sm text-stone-400 dark:text-stone-500">
                {t.result.enterToSee}
              </span>
            )}
          </div>

          <GpaBar value={result.newGpa} ghost={result.currentGpa} />

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <StatPill label={t.result.current} value={result.currentGpa.toFixed(2)} />
            <StatPill
              label={t.result.termGpa}
              value={result.termGpa === null ? '—' : result.termGpa.toFixed(2)}
            />
            <StatPill label={t.result.totalCredits} value={result.newTotalCredits} />
          </div>

          <ThresholdNote gpa={result.newGpa} />
        </Card>
      </div>
    </div>
  );
}

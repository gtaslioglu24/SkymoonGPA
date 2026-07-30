import { useMemo } from 'react';
import { calcGpaFromCourses, calcDoubleMajor, type CourseInput, type GpaResult } from '../../lib/gpa';
import { useI18n } from '../../lib/i18n';
import { useLocalStorage } from '../../lib/hooks';
import { CourseList, makeCourse } from '../CourseList';
import { AnimatedNumber, GpaBar, gpaFigureClass } from '../GpaVisual';
import { StatPill, ThresholdNote } from '../ResultParts';
import { Card, SectionTitle, cx } from '../ui';

export function ScratchTab() {
  const { t } = useI18n();
  const [courses, setCourses] = useLocalStorage<CourseInput[]>('koc-gpa:scratch:courses', [
    makeCourse(),
    makeCourse({ grade: 'B+' }),
  ]);
  const [doubleMajor, setDoubleMajor] = useLocalStorage<boolean>('koc-gpa:scratch:double', false);

  const result = useMemo(() => calcGpaFromCourses(courses), [courses]);
  const dm = useMemo(() => calcDoubleMajor(courses), [courses]);
  const hasInput = result.gpaCredits > 0;

  return (
    <div className="grid gap-5 lg:grid-cols-5 lg:items-start">
      <div className="lg:order-1 lg:col-span-3">
        <Card>
          <SectionTitle
            hint={t.tabsDesc.scratch}
            action={
              <button
                type="button"
                onClick={() => setDoubleMajor(!doubleMajor)}
                className={cx(
                  'shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                  doubleMajor
                    ? 'border-brand-500/50 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                    : 'border-line text-stone-500 hover:text-stone-800 dark:border-ink-line dark:text-stone-400 dark:hover:text-stone-100',
                )}
                aria-pressed={doubleMajor}
              >
                {t.doubleMajor.toggle}
              </button>
            }
          >
            {t.courses.listTitle}
          </SectionTitle>
          <CourseList
            courses={courses}
            onChange={setCourses}
            includeNonGpa
            showProgram={doubleMajor}
          />
        </Card>
      </div>

      <div className="lg:order-2 lg:col-span-2 lg:sticky lg:top-6">
        <Card>
          {doubleMajor ? (
            <>
              <ProgramFigure label={t.doubleMajor.majorGpa} res={dm.major} />
              <div className="mt-5 border-t border-line pt-5 dark:border-ink-line">
                <ProgramFigure label={t.doubleMajor.doubleGpa} res={dm.double} />
              </div>
              <p className="mt-5 text-xs leading-relaxed text-stone-400 dark:text-stone-500">
                {t.doubleMajor.note}
              </p>
            </>
          ) : (
            <>
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                {t.result.computed}
              </div>
              <div className="mt-1 flex items-end gap-3">
                <AnimatedNumber value={result.gpa} className={gpaFigureClass} />
                <span className="pb-2 font-serif text-lg text-stone-400">/ 4.00</span>
              </div>
              {!hasInput && (
                <p className="mt-3 text-sm text-stone-400 dark:text-stone-500">
                  {t.result.enterToSee}
                </p>
              )}
              <GpaBar value={result.gpa} />
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <StatPill label={t.result.gpaCredits} value={result.gpaCredits} />
                <StatPill label={t.result.earnedCredits} value={result.earnedCredits} />
              </div>
              <ThresholdNote gpa={result.gpa} />
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function ProgramFigure({ label, res }: { label: string; res: GpaResult }) {
  const { t } = useI18n();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {label}
        </span>
        <span className="text-xs text-stone-400 dark:text-stone-500">
          {res.gpaCredits} {t.result.gpaCredits}
        </span>
      </div>
      <div className="mt-1 flex items-end gap-2.5">
        <AnimatedNumber
          value={res.gpa}
          className="num font-serif text-4xl font-medium leading-none text-stone-900 dark:text-stone-50"
        />
        <span className="pb-1 font-serif text-base text-stone-400">/ 4.00</span>
      </div>
      <GpaBar value={res.gpa} />
    </div>
  );
}

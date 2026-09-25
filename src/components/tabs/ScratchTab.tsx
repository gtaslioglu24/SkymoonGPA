import { useMemo } from 'react';
import { calcGpaFromCourses, calcDoubleMajor, type CourseInput, type GpaResult } from '../../lib/gpa';
import { useI18n } from '../../lib/i18n';
import { useLocalStorage } from '../../lib/hooks';
import { MAX_COURSES, parseBoolean, parseCourses } from '../../lib/validate';
import { coursesFromParsed } from '../../lib/course';
import type { ParsedSemester } from '../../lib/transcript';
import { TranscriptImport, type ImportMode } from '../TranscriptImport';
import { CourseList } from '../CourseList';
import { MobileResultBar } from '../MobileResultBar';
import { AnimatedNumber, GpaBar, gpaFigureClass } from '../GpaVisual';
import { EmptyFigure, StatPill, ThresholdNote } from '../ResultParts';
import { cx } from '../../lib/cx';
import { Card, SectionTitle } from '../ui';

export function ScratchTab() {
  const { t } = useI18n();
  // Starts empty on purpose: seeding sample courses meant a first-time visitor
  // was greeted by a confident GPA computed from grades that aren't theirs.
  const [courses, setCourses] = useLocalStorage<CourseInput[]>(
    'scratch:courses',
    [],
    parseCourses,
  );
  const [doubleMajor, setDoubleMajor] = useLocalStorage<boolean>(
    'scratch:double',
    false,
    parseBoolean,
  );

  const result = useMemo(() => calcGpaFromCourses(courses), [courses]);
  const dm = useMemo(() => calcDoubleMajor(courses), [courses]);
  const hasInput = result.gpaCredits > 0;

  const importTranscript = (parsed: ParsedSemester[], mode: ImportMode) => {
    const base = mode === 'replace' ? [] : courses;
    setCourses([...base, ...coursesFromParsed(parsed)].slice(0, MAX_COURSES));
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5 lg:items-start">
      <div className="space-y-5 lg:order-1 lg:col-span-3">
        <TranscriptImport onImport={importTranscript} hasExistingData={courses.length > 0} />

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
                    ? 'border-brand-500/50 bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200'
                    : 'border-line text-muted hover:text-stone-800 dark:border-ink-line dark:hover:text-stone-100',
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
              <p className="mt-5 text-xs leading-relaxed text-muted">{t.doubleMajor.note}</p>
            </>
          ) : (
            <>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-strong">
                {t.result.computed}
              </div>
              {hasInput ? (
                <>
                  <div className="mt-1 flex items-end gap-3">
                    <AnimatedNumber
                      value={result.gpa}
                      className={gpaFigureClass}
                      announceLabel={t.result.computed}
                    />
                    <span className="pb-2 font-serif text-lg text-muted">/ 4.00</span>
                  </div>
                  <GpaBar value={result.gpa} label={t.result.computed} />
                  <div className="mt-5 grid grid-cols-2 gap-2.5">
                    <StatPill label={t.result.gpaCredits} value={result.gpaCredits} />
                    <StatPill label={t.result.earnedCredits} value={result.earnedCredits} />
                  </div>
                  <ThresholdNote gpa={result.gpa} />
                </>
              ) : (
                <EmptyFigure hint={t.result.enterToSee} />
              )}
            </>
          )}
        </Card>
      </div>

      <MobileResultBar
        label={doubleMajor ? t.doubleMajor.majorGpa : t.result.computed}
        value={
          doubleMajor
            ? dm.major.gpaCredits > 0
              ? dm.major.gpa.toFixed(2)
              : '—'
            : hasInput
              ? result.gpa.toFixed(2)
              : '—'
        }
        trailing={
          doubleMajor && dm.double.gpaCredits > 0 ? (
            <span className="text-xs text-muted">
              {t.doubleMajor.doubleGpa}{' '}
              <b className="num text-sm text-stone-900 dark:text-stone-50">
                {dm.double.gpa.toFixed(2)}
              </b>
            </span>
          ) : null
        }
      />
    </div>
  );
}

function ProgramFigure({ label, res }: { label: string; res: GpaResult }) {
  const { t } = useI18n();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-strong">
          {label}
        </span>
        <span className="text-xs text-muted">
          {res.gpaCredits} {t.result.gpaCredits}
        </span>
      </div>
      <div className="mt-1 flex items-end gap-2.5">
        <AnimatedNumber
          value={res.gpa}
          className="num font-serif text-4xl font-medium leading-none text-stone-900 dark:text-stone-50"
          announceLabel={label}
        />
        <span className="pb-1 font-serif text-base text-muted">/ 4.00</span>
      </div>
      <GpaBar value={res.gpa} label={label} />
    </div>
  );
}

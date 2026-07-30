import { useMemo } from 'react';
import { computeSemesterSeries, type Semester } from '../../lib/semesters';
import { useI18n } from '../../lib/i18n';
import { useLocalStorage, uid } from '../../lib/hooks';
import { CourseList, makeCourse } from '../CourseList';
import { GpaTrendChart } from '../GpaTrendChart';
import { AnimatedNumber, gpaFigureClass } from '../GpaVisual';
import { StatPill, ThresholdNote } from '../ResultParts';
import { Button, Card, IconButton, SectionTitle, TextField } from '../ui';

function makeSemester(name: string, courses = [makeCourse()]): Semester {
  return { id: uid(), name, courses };
}

const defaultSemesters: Semester[] = [
  makeSemester('1. Dönem', [makeCourse({ grade: 'B' }), makeCourse({ grade: 'C+' })]),
  makeSemester('2. Dönem', [makeCourse({ grade: 'A-' }), makeCourse({ grade: 'B+' })]),
  makeSemester('3. Dönem', [makeCourse({ grade: 'A' }), makeCourse({ grade: 'A-' })]),
];

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
      <path
        d="M4 6h12M8 6V4.5A1.5 1.5 0 019.5 3h1A1.5 1.5 0 0112 4.5V6m-6 0v9a1.5 1.5 0 001.5 1.5h5A1.5 1.5 0 0014 15V6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SemestersTab() {
  const { t } = useI18n();
  const [semesters, setSemesters] = useLocalStorage<Semester[]>(
    'koc-gpa:semesters',
    defaultSemesters,
  );

  const series = useMemo(() => computeSemesterSeries(semesters), [semesters]);
  const spaById = useMemo(
    () => Object.fromEntries(series.points.map((p) => [p.id, p.spa])),
    [series],
  );

  const updateSemester = (id: string, patch: Partial<Semester>) =>
    setSemesters(semesters.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const removeSemester = (id: string) => setSemesters(semesters.filter((s) => s.id !== id));

  const addSemester = () =>
    setSemesters([...semesters, makeSemester(`${semesters.length + 1}. ${t.semesters.term}`)]);

  return (
    <div className="space-y-5">
      {/* Overview + chart */}
      <Card>
        <SectionTitle hint={t.tabsDesc.semesters}>{t.semesters.chartTitle}</SectionTitle>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {t.semesters.overall}
            </div>
            <div className="mt-1 flex items-end gap-2.5">
              <AnimatedNumber value={series.overallGpa} className={gpaFigureClass} />
              <span className="pb-2 font-serif text-lg text-stone-400">/ 4.00</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <StatPill label={t.result.gpaCredits} value={series.totalGpaCredits} />
            <StatPill label={t.result.earnedCredits} value={series.totalEarnedCredits} />
          </div>
        </div>

        <GpaTrendChart points={series.points} />

        {series.overallGpa > 0 && <ThresholdNote gpa={series.overallGpa} />}
      </Card>

      {/* Semester editors */}
      {semesters.map((s) => {
        const spa = spaById[s.id];
        return (
          <Card key={s.id}>
            <div className="mb-4 flex items-center gap-3">
              <TextField
                value={s.name}
                onChange={(e) => updateSemester(s.id, { name: e.target.value })}
                placeholder={t.semesters.namePlaceholder}
                className="max-w-xs font-serif text-base font-medium"
                aria-label={t.semesters.namePlaceholder}
              />
              <span className="ml-auto whitespace-nowrap text-sm text-stone-500 dark:text-stone-400">
                {t.semesters.spa}{' '}
                <b className="num font-semibold text-stone-900 dark:text-stone-50">
                  {spa === null || spa === undefined ? '—' : spa.toFixed(2)}
                </b>
              </span>
              <IconButton
                onClick={() => removeSemester(s.id)}
                aria-label={t.semesters.removeSemester}
              >
                <TrashIcon />
              </IconButton>
            </div>

            <CourseList
              courses={s.courses}
              onChange={(courses) => updateSemester(s.id, { courses })}
              includeNonGpa
            />
          </Card>
        );
      })}

      <Button variant="soft" onClick={addSemester} className="w-full sm:w-auto">
        + {t.semesters.addSemester}
      </Button>
    </div>
  );
}

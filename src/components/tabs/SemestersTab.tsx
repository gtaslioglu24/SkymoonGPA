import { useMemo } from 'react';
import { computeSemesterSeries, type Semester } from '../../lib/semesters';
import { useI18n } from '../../lib/i18n';
import { useLocalStorage } from '../../lib/hooks';
import { uid } from '../../lib/uid';
import { MAX_SEMESTERS, parseSemesters } from '../../lib/validate';
import { semestersFromParsed } from '../../lib/course';
import type { ParsedSemester } from '../../lib/transcript';
import { CourseList } from '../CourseList';
import { GpaTrendChart } from '../GpaTrendChart';
import { TranscriptImport, type ImportMode } from '../TranscriptImport';
import { MobileResultBar } from '../MobileResultBar';
import { AnimatedNumber, gpaFigureClass } from '../GpaVisual';
import { EmptyFigure, StatPill, ThresholdNote } from '../ResultParts';
import { Button, Card, IconButton, SectionTitle, TextField } from '../ui';

/**
 * Semesters start with no courses. Seeding a row meant an untouched Semesters
 * tab reported a confident 4.00 built from a placeholder A that wasn't anyone's
 * grade — the same falsehood the other tabs were fixed for.
 */
function makeSemester(name: string, courses: Semester['courses'] = []): Semester {
  return { id: uid(), name, courses };
}

function TrashIcon() {
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
        d="M4 6h12M8 6V4.5A1.5 1.5 0 019.5 3h1A1.5 1.5 0 0112 4.5V6m-6 0v9a1.5 1.5 0 001.5 1.5h5A1.5 1.5 0 0014 15V6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SemestersTab() {
  const { t } = useI18n();
  // One empty semester, named in the active language — the old default shipped
  // three semesters of invented grades (and Turkish names even in English).
  const [semesters, setSemesters] = useLocalStorage<Semester[]>(
    'semesters',
    [makeSemester(`1. ${t.semesters.term}`)],
    parseSemesters,
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

  const hasGrades = series.totalGpaCredits > 0;

  const importTranscript = (parsed: ParsedSemester[], mode: ImportMode) => {
    const base = mode === 'replace' ? [] : semesters;
    const imported = semestersFromParsed(
      parsed,
      (i) => `${base.length + i + 1}. ${t.semesters.term}`,
    );
    setSemesters([...base, ...imported].slice(0, MAX_SEMESTERS));
  };

  return (
    <div className="space-y-5">
      <TranscriptImport onImport={importTranscript} hasExistingData={hasGrades} />

      {/* Overview + chart */}
      <Card>
        <SectionTitle hint={t.tabsDesc.semesters}>{t.semesters.chartTitle}</SectionTitle>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-strong">
              {t.semesters.overall}
            </div>
            {hasGrades ? (
              <div className="mt-1 flex items-end gap-2.5">
                <AnimatedNumber
                  value={series.overallGpa}
                  className={gpaFigureClass}
                  announceLabel={t.semesters.overall}
                />
                <span className="pb-2 font-serif text-lg text-muted">/ 4.00</span>
              </div>
            ) : (
              <EmptyFigure hint={t.result.enterToSee} />
            )}
          </div>
          {hasGrades && (
            <div className="grid grid-cols-2 gap-2.5">
              <StatPill label={t.result.gpaCredits} value={series.totalGpaCredits} />
              <StatPill label={t.result.earnedCredits} value={series.totalEarnedCredits} />
            </div>
          )}
        </div>

        <GpaTrendChart points={series.points} />

        {series.overallGpa > 0 && <ThresholdNote gpa={series.overallGpa} />}
      </Card>

      {/* Semester editors */}
      {semesters.map((s, i) => {
        const spa = spaById[s.id];
        const name = s.name.trim() || `${i + 1}. ${t.semesters.term}`;
        return (
          <Card key={s.id}>
            <div className="mb-4 flex items-center gap-3">
              <TextField
                value={s.name}
                onChange={(e) => updateSemester(s.id, { name: e.target.value })}
                placeholder={t.semesters.namePlaceholder}
                className="max-w-xs font-serif text-base font-medium"
                aria-label={`${t.semesters.term} ${i + 1} — ${t.semesters.namePlaceholder}`}
              />
              <span className="ml-auto whitespace-nowrap text-sm text-muted">
                {t.semesters.spa}{' '}
                <b className="num font-semibold text-stone-900 dark:text-stone-50">
                  {spa === null || spa === undefined ? '—' : spa.toFixed(2)}
                </b>
              </span>
              <IconButton
                onClick={() => removeSemester(s.id)}
                aria-label={`${name} — ${t.semesters.removeSemester}`}
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

      <Button
        variant="soft"
        onClick={addSemester}
        disabled={semesters.length >= MAX_SEMESTERS}
        className="w-full sm:w-auto"
      >
        + {t.semesters.addSemester}
      </Button>

      <MobileResultBar
        label={t.semesters.overall}
        value={hasGrades ? series.overallGpa.toFixed(2) : '—'}
        trailing={
          hasGrades ? (
            <span className="text-xs text-muted">
              {series.totalGpaCredits} {t.result.gpaCredits}
            </span>
          ) : null
        }
      />
    </div>
  );
}

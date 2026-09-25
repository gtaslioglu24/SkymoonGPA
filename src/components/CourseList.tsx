import type { CourseInput } from '../lib/gpa';
import { useI18n } from '../lib/i18n';
import { cx } from '../lib/cx';
import { makeCourse } from '../lib/course';
import { MAX_CREDITS_PER_COURSE } from '../lib/validate';
import { GradeSelect } from './GradeSelect';
import { Button, IconButton, Label, NumberField, SelectField, TextField } from './ui';

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

function PlusIcon() {
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
      <path d="M10 4v12M4 10h12" strokeLinecap="round" />
    </svg>
  );
}

export function CourseList({
  courses,
  onChange,
  allowRetake = false,
  includeNonGpa = false,
  showProgram = false,
}: {
  courses: CourseInput[];
  onChange: (next: CourseInput[]) => void;
  allowRetake?: boolean;
  includeNonGpa?: boolean;
  showProgram?: boolean;
}) {
  const { t } = useI18n();

  const update = (id: string, patch: Partial<CourseInput>) =>
    onChange(courses.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const remove = (id: string) => onChange(courses.filter((c) => c.id !== id));

  const add = () => onChange([...courses, makeCourse()]);

  return (
    <div className="space-y-3">
      {courses.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 py-8 text-center dark:border-white/15">
          <p className="text-sm font-medium text-muted-strong">{t.courses.empty}</p>
          <p className="mt-1 text-xs text-muted">{t.courses.emptyCta}</p>
        </div>
      )}

      {courses.map((course, i) => {
        const label = course.name?.trim() || `${t.courses.name} ${i + 1}`;
        return (
          <div
            key={course.id}
            className="rounded-lg border border-line bg-stone-50/60 p-3 dark:border-ink-line dark:bg-white/[0.02]"
          >
            <div className="flex flex-wrap items-end gap-3 sm:flex-nowrap">
              {/* Name */}
              <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                {i === 0 && <Label>{t.courses.name}</Label>}
                <TextField
                  value={course.name ?? ''}
                  onChange={(e) => update(course.id, { name: e.target.value })}
                  placeholder={t.courses.namePlaceholder}
                  aria-label={`${t.courses.name} ${i + 1}`}
                  // An imported row carries both the code and the full title,
                  // which is wider than the field; the tooltip means checking a
                  // long one doesn't require clicking into it and scrolling.
                  title={course.name || undefined}
                />
              </div>

              {/* Credits */}
              <div className="w-24 shrink-0">
                {i === 0 && <Label>{t.courses.credits}</Label>}
                <NumberField
                  value={course.credits}
                  onChange={(v) => update(course.id, { credits: v === '' ? 0 : v })}
                  min={0}
                  max={MAX_CREDITS_PER_COURSE}
                  step={0.5}
                  aria-label={`${label} — ${t.courses.credits}`}
                />
              </div>

              {/* Grade */}
              <div className="w-28 shrink-0">
                {i === 0 && <Label>{t.courses.grade}</Label>}
                <GradeSelect
                  value={course.grade}
                  onChange={(grade) => update(course.id, { grade })}
                  includeNonGpa={includeNonGpa}
                  aria-label={`${label} — ${t.courses.grade}`}
                />
              </div>

              {/* Program (double major) */}
              {showProgram && (
                <div className="w-28 shrink-0">
                  {i === 0 && <Label>{t.doubleMajor.program}</Label>}
                  <SelectField
                    value={course.program ?? 'major'}
                    onChange={(e) =>
                      update(course.id, { program: e.target.value as CourseInput['program'] })
                    }
                    aria-label={`${label} — ${t.doubleMajor.program}`}
                  >
                    <option value="major">{t.doubleMajor.major}</option>
                    <option value="double">{t.doubleMajor.double}</option>
                    <option value="both">{t.doubleMajor.both}</option>
                  </SelectField>
                </div>
              )}

              {/* Retake toggle */}
              {allowRetake && (
                <button
                  type="button"
                  onClick={() =>
                    update(course.id, {
                      isRetake: !course.isRetake,
                      previousGrade: course.isRetake ? undefined : (course.previousGrade ?? 'F'),
                    })
                  }
                  className={cx(
                    'h-[46px] shrink-0 rounded-xl border px-3 text-xs font-semibold transition',
                    course.isRetake
                      ? 'border-amber-400/60 bg-amber-50 text-amber-800 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-200'
                      : 'border-stone-300/70 text-muted hover:border-stone-400 dark:border-white/10',
                  )}
                  aria-pressed={course.isRetake ?? false}
                  aria-label={`${label} — ${t.courses.retake}`}
                >
                  <span aria-hidden="true">↻ </span>
                  {t.courses.retakeShort}
                </button>
              )}

              {/* Remove */}
              <div className="shrink-0">
                <IconButton
                  onClick={() => remove(course.id)}
                  aria-label={`${label} — ${t.courses.remove}`}
                >
                  <TrashIcon />
                </IconButton>
              </div>
            </div>

            {/* Retake detail row */}
            {allowRetake && course.isRetake && (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-amber-50/70 px-3 py-2.5 dark:bg-amber-400/10">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                  {t.courses.previousGrade}:
                </span>
                <GradeSelect
                  value={course.previousGrade ?? 'F'}
                  onChange={(previousGrade) => update(course.id, { previousGrade })}
                  className="w-28"
                  aria-label={`${label} — ${t.courses.previousGrade}`}
                />
                <span className="text-xs text-amber-800/90 dark:text-amber-200/90">
                  {t.courses.retakeHint}
                </span>
              </div>
            )}
          </div>
        );
      })}

      <Button variant="soft" onClick={add} className="w-full sm:w-auto">
        <PlusIcon />
        {t.courses.add}
      </Button>
    </div>
  );
}

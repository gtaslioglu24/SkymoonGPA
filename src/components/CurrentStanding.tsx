import { calcGpaFromCourses, type CourseInput } from '../lib/gpa';
import { useI18n } from '../lib/i18n';
import { CourseList } from './CourseList';
import { Label, NumberField, Segmented } from './ui';

export type StandingMode = 'simple' | 'detailed';

export interface StandingState {
  mode: StandingMode;
  gpa: number | '';
  credits: number | '';
  pastCourses: CourseInput[];
}

export const emptyStanding: StandingState = {
  mode: 'simple',
  gpa: '',
  credits: '',
  pastCourses: [],
};

/** Resolve the effective current GPA and GPA-credits from either input mode. */
export function resolveStanding(s: StandingState): { gpa: number; credits: number } {
  if (s.mode === 'detailed') {
    const r = calcGpaFromCourses(s.pastCourses);
    return { gpa: r.gpa, credits: r.gpaCredits };
  }
  return { gpa: s.gpa === '' ? 0 : s.gpa, credits: s.credits === '' ? 0 : s.credits };
}

export function CurrentStanding({
  value,
  onChange,
}: {
  value: StandingState;
  onChange: (next: StandingState) => void;
}) {
  const { t } = useI18n();
  const resolved = resolveStanding(value);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-medium text-stone-900 dark:text-stone-50">
            {t.standing.title}
          </h2>
          <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
            {value.mode === 'simple' ? t.standing.simpleHint : t.standing.detailedHint}
          </p>
        </div>
        <Segmented<StandingMode>
          size="sm"
          value={value.mode}
          onChange={(mode) => onChange({ ...value, mode })}
          options={[
            { value: 'simple', label: t.standing.simple },
            { value: 'detailed', label: t.standing.detailed },
          ]}
        />
      </div>

      {value.mode === 'simple' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>{t.standing.currentGpa}</Label>
            <NumberField
              value={value.gpa}
              onChange={(gpa) => onChange({ ...value, gpa })}
              min={0}
              max={4}
              step={0.01}
              placeholder="3.24"
            />
          </div>
          <div>
            <Label>{t.standing.currentCredits}</Label>
            <NumberField
              value={value.credits}
              onChange={(credits) => onChange({ ...value, credits })}
              min={0}
              step={1}
              placeholder="60"
            />
            <p className="mt-1.5 text-xs text-stone-400 dark:text-stone-500">
              {t.standing.currentCreditsHint}
            </p>
          </div>
        </div>
      ) : (
        <div>
          <CourseList
            courses={value.pastCourses}
            onChange={(pastCourses) => onChange({ ...value, pastCourses })}
            includeNonGpa
          />
          {value.pastCourses.length > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-brand-50/70 px-4 py-3 dark:bg-brand-500/10">
              <span className="text-sm font-medium text-brand-800 dark:text-brand-100">
                {t.standing.computedFromCourses}
              </span>
              <span className="text-sm font-bold tabular-nums text-brand-800 dark:text-brand-100">
                GPA {resolved.gpa.toFixed(2)} · {resolved.credits}{' '}
                <span className="font-medium opacity-70">{t.result.gpaCredits}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

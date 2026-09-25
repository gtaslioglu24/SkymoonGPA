import { useI18n } from '../lib/i18n';
import { resolveStanding, type StandingMode, type StandingState } from '../lib/standing';
import { CourseList } from './CourseList';
import { Label, NumberField, Segmented } from './ui';

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
          <p className="mt-0.5 text-sm text-muted">
            {value.mode === 'simple' ? t.standing.simpleHint : t.standing.detailedHint}
          </p>
        </div>
        <Segmented<StandingMode>
          size="sm"
          aria-label={t.standing.title}
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
            <Label htmlFor="standing-gpa">{t.standing.currentGpa}</Label>
            <NumberField
              id="standing-gpa"
              value={value.gpa}
              onChange={(gpa) => onChange({ ...value, gpa })}
              min={0}
              max={4}
              step={0.01}
              placeholder="3.24"
            />
          </div>
          <div>
            <Label htmlFor="standing-credits">{t.standing.currentCredits}</Label>
            <NumberField
              id="standing-credits"
              value={value.credits}
              onChange={(credits) => onChange({ ...value, credits })}
              min={0}
              max={1000}
              step={1}
              placeholder="60"
              aria-describedby="standing-credits-hint"
            />
            <p id="standing-credits-hint" className="mt-1.5 text-xs text-muted">
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
                <span className="font-medium opacity-80">{t.result.gpaCredits}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

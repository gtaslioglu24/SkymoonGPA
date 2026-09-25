import { GPA_GRADES, NON_GPA_GRADES } from '../lib/grades';
import { SelectField } from './ui';

export function GradeSelect({
  value,
  onChange,
  includeNonGpa = false,
  className,
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  includeNonGpa?: boolean;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <SelectField
      className={className}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {GPA_GRADES.map((g) => (
        <option key={g.letter} value={g.letter}>
          {g.letter} · {(g.points as number).toFixed(1)}
        </option>
      ))}
      {includeNonGpa && (
        <optgroup label="—">
          {NON_GPA_GRADES.map((g) => (
            <option key={g.letter} value={g.letter}>
              {g.letter}
            </option>
          ))}
        </optgroup>
      )}
    </SelectField>
  );
}

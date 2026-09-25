import { describe, it, expect } from 'vitest';
import {
  parseBoolean,
  parseCourse,
  parseCourses,
  parseNumberOrEmpty,
  parseRepeatRule,
  parseSemesters,
  parseStanding,
} from './validate';

/**
 * These parsers are the app's front door for untrusted input. The cases that
 * matter are the hostile ones: a stored value with the wrong shape used to
 * crash every render, and the "reload" button just replayed the crash.
 */
describe('parseCourses', () => {
  it('rejects a non-array outright', () => {
    expect(parseCourses({ corrupted: true })).toBeNull();
    expect(parseCourses('nope')).toBeNull();
    expect(parseCourses(null)).toBeNull();
  });

  it('drops unusable rows but keeps the good ones', () => {
    const parsed = parseCourses([
      { id: 'a', grade: 'A', credits: 3 },
      { id: 'b', grade: 'Z', credits: 3 }, // unknown letter
      { id: 'c', grade: 'B', credits: 'three' }, // credits not a number
      { id: 'd', grade: 'B+', credits: 4 },
    ]);
    expect(parsed?.map((c) => c.id)).toEqual(['a', 'd']);
  });

  it('refuses out-of-range and non-finite credits', () => {
    expect(parseCourse({ grade: 'A', credits: -3 })).toBeNull();
    expect(parseCourse({ grade: 'A', credits: 1e9 })).toBeNull();
    expect(parseCourse({ grade: 'A', credits: Number.NaN })).toBeNull();
    expect(parseCourse({ grade: 'A', credits: Number.POSITIVE_INFINITY })).toBeNull();
  });

  it('mints an id when one is missing so React keys stay stable', () => {
    const c = parseCourse({ grade: 'A', credits: 3 });
    expect(c?.id).toBeTruthy();
  });

  it('keeps a retake only when the previous grade is a real letter', () => {
    expect(parseCourse({ grade: 'B', credits: 3, isRetake: true, previousGrade: 'C' }))
      .toMatchObject({ isRetake: true, previousGrade: 'C' });
    const bogus = parseCourse({ grade: 'B', credits: 3, isRetake: true, previousGrade: 'Q' });
    expect(bogus?.isRetake).toBe(true);
    expect(bogus?.previousGrade).toBeUndefined();
  });

  it('ignores an unknown program tag rather than trusting it', () => {
    expect(parseCourse({ grade: 'A', credits: 3, program: 'minor' })?.program).toBeUndefined();
    expect(parseCourse({ grade: 'A', credits: 3, program: 'both' })?.program).toBe('both');
  });
});

describe('parseStanding', () => {
  it('rejects a non-object', () => {
    expect(parseStanding([])).toBeNull();
    expect(parseStanding(42)).toBeNull();
  });

  it('falls back to empty for out-of-range numbers instead of failing', () => {
    const s = parseStanding({ mode: 'simple', gpa: 9, credits: -5, pastCourses: [] });
    expect(s).toEqual({ mode: 'simple', gpa: '', credits: '', pastCourses: [] });
  });

  it('rejects a standing whose course list is the wrong shape', () => {
    expect(parseStanding({ mode: 'detailed', gpa: '', credits: '', pastCourses: {} })).toBeNull();
  });

  it('treats an unknown mode as simple', () => {
    expect(parseStanding({ mode: 'wat', gpa: 3, credits: 30 })?.mode).toBe('simple');
  });
});

describe('parseSemesters', () => {
  it('rejects a non-array', () => {
    expect(parseSemesters({})).toBeNull();
  });

  it('skips malformed semesters and keeps the rest', () => {
    const parsed = parseSemesters([
      { id: 's1', name: 'Fall', courses: [{ grade: 'A', credits: 3 }] },
      'garbage',
      { id: 's2', name: 'Spring', courses: 'nope' },
      { id: 's3', name: 'Summer', courses: [] },
    ]);
    expect(parsed?.map((s) => s.id)).toEqual(['s1', 's3']);
  });
});

describe('scalar parsers', () => {
  it('accepts the empty string as a real "not filled in" value', () => {
    const p = parseNumberOrEmpty(0, 4);
    expect(p('')).toBe('');
    expect(p(3.4)).toBe(3.4);
    expect(p(4.5)).toBeNull();
    expect(p('3.4')).toBeNull();
  });

  it('does not coerce truthy values into booleans', () => {
    expect(parseBoolean(true)).toBe(true);
    expect(parseBoolean('true')).toBeNull();
    expect(parseBoolean(1)).toBeNull();
  });

  it('only accepts known repeat rules', () => {
    expect(parseRepeatRule('highest')).toBe('highest');
    expect(parseRepeatRule('all')).toBe('all');
    expect(parseRepeatRule('best')).toBeNull();
  });
});

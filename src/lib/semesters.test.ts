import { describe, it, expect } from 'vitest';
import { computeSemesterSeries, type Semester } from './semesters';
import type { CourseInput } from './gpa';

let n = 0;
const c = (grade: string, credits: number): CourseInput => ({
  id: `c${n++}`,
  grade,
  credits,
});
const sem = (name: string, courses: CourseInput[]): Semester => ({
  id: `s${n++}`,
  name,
  courses,
});

describe('computeSemesterSeries', () => {
  it('computes per-semester SPA and a running cumulative', () => {
    const r = computeSemesterSeries([
      sem('1', [c('A', 3), c('B', 3)]), // SPA 3.5
      sem('2', [c('B', 3), c('B', 3)]), // SPA 3.0, cumulative (21+18)/12 = 3.25
    ]);
    expect(r.points[0].spa).toBe(3.5);
    expect(r.points[0].cumulative).toBe(3.5);
    expect(r.points[1].spa).toBe(3.0);
    expect(r.points[1].cumulative).toBe(3.25);
    expect(r.overallGpa).toBe(3.25);
    expect(r.totalGpaCredits).toBe(12);
    expect(r.gradedSemesters).toBe(2);
  });

  it('marks semesters with no graded courses as null but keeps the running total', () => {
    const r = computeSemesterSeries([
      sem('1', [c('A', 3)]),
      sem('2', [c('S', 3)]), // S does not enter GPA
    ]);
    expect(r.points[1].spa).toBeNull();
    expect(r.points[1].cumulative).toBe(4.0); // unchanged by the S course
    expect(r.points[1].earnedCredits).toBe(6); // A + S both earn credit
    expect(r.gradedSemesters).toBe(2);
  });

  it('handles an empty list', () => {
    const r = computeSemesterSeries([]);
    expect(r.points).toEqual([]);
    expect(r.overallGpa).toBe(0);
    expect(r.gradedSemesters).toBe(0);
  });
});

import { describe, it, expect } from 'vitest';
import { resolveStanding, emptyStanding } from './standing';
import type { CourseInput } from './gpa';

const c = (grade: string, credits: number): CourseInput => ({
  id: Math.random().toString(36).slice(2),
  grade,
  credits,
});

describe('resolveStanding', () => {
  it('reports no standing until both numbers are filled in', () => {
    expect(resolveStanding(emptyStanding).hasStanding).toBe(false);
    expect(resolveStanding({ ...emptyStanding, gpa: 3 }).hasStanding).toBe(false);
    expect(resolveStanding({ ...emptyStanding, credits: 30 }).hasStanding).toBe(false);
    expect(resolveStanding({ ...emptyStanding, gpa: 3, credits: 30 }).hasStanding).toBe(true);
  });

  it('carries exact quality points out of detailed mode', () => {
    // A(4)×3 + B-(2.7)×3 = 20.1 over 6 credits = 3.35
    const r = resolveStanding({
      mode: 'detailed',
      gpa: '',
      credits: '',
      pastCourses: [c('A', 3), c('B-', 3)],
    });
    expect(r.gpa).toBe(3.35);
    expect(r.credits).toBe(6);
    expect(r.qualityPoints).toBeCloseTo(20.1, 10);
    expect(r.hasStanding).toBe(true);
  });

  it('has no standing in detailed mode until a graded course exists', () => {
    expect(
      resolveStanding({ mode: 'detailed', gpa: '', credits: '', pastCourses: [c('S', 3)] })
        .hasStanding,
    ).toBe(false);
  });
});

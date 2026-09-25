/**
 * "Where you stand today" — the cumulative figure every projection builds on.
 *
 * Two ways in: the two numbers off a transcript (simple), or the past courses
 * themselves (detailed). Detailed mode also yields the *exact* quality-point
 * total, which matters: rebuilding it as `roundedGpa × credits` reintroduces up
 * to half a hundredth per credit of error into every downstream projection.
 */

import { calcGpaFromCourses, type CourseInput } from './gpa';

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

export interface ResolvedStanding {
  /** Cumulative GPA, rounded for display. */
  gpa: number;
  /** Credits in the GPA denominator. */
  credits: number;
  /** Exact quality points behind the GPA — use this for further arithmetic. */
  qualityPoints: number;
  /** False while the user hasn't told us anything about their standing yet. */
  hasStanding: boolean;
}

export function resolveStanding(s: StandingState): ResolvedStanding {
  if (s.mode === 'detailed') {
    const r = calcGpaFromCourses(s.pastCourses);
    return {
      gpa: r.gpa,
      credits: r.gpaCredits,
      qualityPoints: r.qualityPoints,
      hasStanding: r.gpaCredits > 0,
    };
  }

  const gpa = s.gpa === '' ? 0 : s.gpa;
  const credits = s.credits === '' ? 0 : s.credits;
  return {
    gpa,
    credits,
    // Simple mode: the rounded GPA is all we know, so this is the best estimate.
    qualityPoints: gpa * credits,
    hasStanding: s.gpa !== '' && s.credits !== '' && credits > 0,
  };
}

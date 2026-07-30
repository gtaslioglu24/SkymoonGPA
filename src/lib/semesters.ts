/**
 * Multi-semester GPA modelling: per-semester SPA and the cumulative CGPA series
 * used by the trend chart. Pure and unit-tested.
 *
 * Cumulative GPA is a straight aggregation of every letter-graded course up to
 * and including a semester (no cross-semester repeat replacement — that lives in
 * the Simulation tab). This matches how a transcript's CGPA column progresses.
 */

import { calcGpaFromCourses, type CourseInput } from './gpa';

export interface Semester {
  id: string;
  name: string;
  courses: CourseInput[];
}

export interface SemesterPoint {
  id: string;
  name: string;
  /** Semester GPA (this term only), or null if it has no graded courses. */
  spa: number | null;
  /** Cumulative GPA through this semester, or null if nothing graded yet. */
  cumulative: number | null;
  /** Cumulative GPA-bearing credits through this semester. */
  gpaCredits: number;
  /** Cumulative earned credits through this semester. */
  earnedCredits: number;
}

export interface SemesterSeries {
  points: SemesterPoint[];
  overallGpa: number;
  totalGpaCredits: number;
  totalEarnedCredits: number;
  /** Number of points that carry a cumulative value (drives chart emptiness). */
  gradedSemesters: number;
}

export function computeSemesterSeries(semesters: Semester[]): SemesterSeries {
  const points: SemesterPoint[] = [];
  let acc: CourseInput[] = [];

  for (const s of semesters) {
    const spaRes = calcGpaFromCourses(s.courses);
    acc = acc.concat(s.courses);
    const cumRes = calcGpaFromCourses(acc);

    points.push({
      id: s.id,
      name: s.name,
      spa: spaRes.gpaCredits > 0 ? spaRes.gpa : null,
      cumulative: cumRes.gpaCredits > 0 ? cumRes.gpa : null,
      gpaCredits: cumRes.gpaCredits,
      earnedCredits: cumRes.earnedCredits,
    });
  }

  const overall = calcGpaFromCourses(acc);
  return {
    points,
    overallGpa: overall.gpa,
    totalGpaCredits: overall.gpaCredits,
    totalEarnedCredits: overall.earnedCredits,
    gradedSemesters: points.filter((p) => p.cumulative !== null).length,
  };
}

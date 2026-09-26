/**
 * GPA calculation engine for the Koç University scale.
 *
 * All functions are pure and framework-agnostic so they can be unit-tested and
 * reused (API, other schools, etc.). GPA is weighted by KU credit hours.
 */

import { getGrade, GPA_GRADES, THRESHOLDS } from './grades';

/** Which program(s) a course counts toward, for double-major (ÇAP) GPAs. */
export type Program = 'major' | 'double' | 'both';

/**
 * How a repeated course is folded into the cumulative GPA.
 *
 * This is a *policy* choice, not arithmetic, and it is the single assumption in
 * this app most likely to diverge from a given student's situation — at Koç the
 * replacement is not always automatic (some cases go through a petition), so the
 * rule is exposed to the user rather than hard-coded.
 *
 * - `highest` — only the best attempt counts; credits counted once.
 * - `last`    — the newest attempt replaces the old one; credits counted once.
 * - `all`     — every attempt stays in the average; credits counted each time.
 */
export type RepeatRule = 'highest' | 'last' | 'all';

/**
 * Koç's own rule, printed on the transcript: "Öğrencilerin tekrarladıkları
 * derslerde sadece son aldıkları not(lar) Genel Not Ortalaması hesaplamalarına
 * dahil edilir" — only the most recent attempt counts, in force since Fall 2003.
 *
 * This used to default to `highest`, which quietly flatters anyone who retook a
 * course and did worse: their real CGPA falls, the app's did not.
 */
export const DEFAULT_REPEAT_RULE: RepeatRule = 'last';

export interface CourseInput {
  id: string;
  name?: string;
  /** KU credit hours. */
  credits: number;
  /** Letter grade code (e.g. "A", "B+", "F", "S"). */
  grade: string;
  /** Marks this as a repeat of a course already reflected in the current GPA. */
  isRetake?: boolean;
  /** For a retake, the letter grade earned on the previous attempt. */
  previousGrade?: string;
  /** Program attribution (defaults to the primary major). */
  program?: Program;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const clampGpa = (n: number) => Math.min(THRESHOLDS.max, Math.max(0, n));

/** True when a course row can contribute quality points to the GPA. */
function affectsGpa(c: CourseInput): boolean {
  const g = getGrade(c.grade);
  return !!g && g.countsInGpa && c.credits > 0;
}

// ---------------------------------------------------------------------------
// 1. GPA from a list of courses ("from scratch" / transcript mode)
// ---------------------------------------------------------------------------

export interface GpaResult {
  /** Weighted average on the 4.00 scale, rounded for display. */
  gpa: number;
  /** Credits that entered the GPA (letter-graded A+…F). */
  gpaCredits: number;
  /** Sum of quality points (points × credits) — exact, not rounded. */
  qualityPoints: number;
  /** Credits actually earned toward the degree (excludes F, U, W). */
  earnedCredits: number;
}

export function calcGpaFromCourses(courses: CourseInput[]): GpaResult {
  let qualityPoints = 0;
  let gpaCredits = 0;
  let earnedCredits = 0;

  for (const c of courses) {
    const g = getGrade(c.grade);
    if (!g || c.credits <= 0) continue;
    if (g.countsInGpa) {
      qualityPoints += (g.points as number) * c.credits;
      gpaCredits += c.credits;
    }
    if (g.earnsCredit) {
      earnedCredits += c.credits;
    }
  }

  return {
    gpa: gpaCredits > 0 ? round2(qualityPoints / gpaCredits) : 0,
    gpaCredits,
    qualityPoints,
    earnedCredits,
  };
}

/**
 * Double-major (ÇAP) GPAs: a separate weighted average for the primary major
 * and for the double-major program, plus the combined figure. A course tagged
 * "both" counts toward both program averages. Courses with no tag default to
 * the primary major.
 */
export interface DoubleMajorResult {
  major: GpaResult;
  double: GpaResult;
  overall: GpaResult;
}

export function calcDoubleMajor(courses: CourseInput[]): DoubleMajorResult {
  const inMajor = (c: CourseInput) => (c.program ?? 'major') === 'major' || c.program === 'both';
  const inDouble = (c: CourseInput) => c.program === 'double' || c.program === 'both';
  return {
    major: calcGpaFromCourses(courses.filter(inMajor)),
    double: calcGpaFromCourses(courses.filter(inDouble)),
    overall: calcGpaFromCourses(courses),
  };
}

// ---------------------------------------------------------------------------
// 2. Projection ("what-if")
// ---------------------------------------------------------------------------

export interface ProjectionInput {
  /** Current cumulative GPA (0–4). */
  currentGpa: number;
  /** Credits already reflected in the current GPA (GPA denominator so far). */
  currentCredits: number;
  /**
   * Exact quality points behind the current GPA, when known (detailed mode).
   * Omitted, it is reconstructed as `currentGpa × currentCredits`, which carries
   * the rounding error of a two-decimal GPA into everything downstream.
   */
  currentQualityPoints?: number;
  /** Planned / hypothetical courses for the upcoming term. */
  courses: CourseInput[];
  /** How repeats are folded in (default: highest attempt counts). */
  repeatRule?: RepeatRule;
}

export interface ProjectionResult {
  currentGpa: number;
  /** Projected cumulative GPA after the planned term. */
  newGpa: number;
  /** newGpa − currentGpa (signed). */
  delta: number;
  /** Semester GPA (SPA) of the planned courses only. */
  termGpa: number | null;
  /** GPA-bearing credits added to the cumulative denominator. */
  addedGpaCredits: number;
  /** New cumulative GPA denominator. */
  newTotalCredits: number;
  /** Whether any valid GPA-bearing course was provided. */
  hasInput: boolean;
}

/**
 * Project the new cumulative GPA.
 *
 * A retake is assumed to be a repeat of a course whose credits are *already* in
 * `currentCredits`; under `highest`/`last` it therefore adjusts quality points
 * without growing the denominator.
 */
export function projectGpa(input: ProjectionInput): ProjectionResult {
  const currentGpa = clampGpa(input.currentGpa || 0);
  const currentCredits = Math.max(0, input.currentCredits || 0);
  const rule = input.repeatRule ?? DEFAULT_REPEAT_RULE;

  let quality =
    input.currentQualityPoints !== undefined && Number.isFinite(input.currentQualityPoints)
      ? input.currentQualityPoints
      : currentGpa * currentCredits;
  let totalCredits = currentCredits;

  // Semester (SPA) accumulators — every counted course at its new grade.
  let termQuality = 0;
  let termCredits = 0;
  let hasInput = false;

  for (const c of input.courses) {
    if (!affectsGpa(c)) continue;
    hasInput = true;

    const newPoints = getGrade(c.grade)!.points as number;
    termQuality += newPoints * c.credits;
    termCredits += c.credits;

    const prev = c.isRetake && c.previousGrade ? getGrade(c.previousGrade) : undefined;
    const replaces = prev && prev.countsInGpa && rule !== 'all';

    if (replaces) {
      // Repeat of a course already in the GPA: swap its contribution in place.
      // Credits stay put — they entered the denominator on the first attempt.
      const oldPoints = prev.points as number;
      const countedPoints = rule === 'highest' ? Math.max(newPoints, oldPoints) : newPoints;
      quality += (countedPoints - oldPoints) * c.credits;
    } else {
      // Brand-new course (or `all`, where every attempt stands on its own).
      quality += newPoints * c.credits;
      totalCredits += c.credits;
    }
  }

  const newGpa = totalCredits > 0 ? clampGpa(quality / totalCredits) : currentGpa;

  return {
    currentGpa: round2(currentGpa),
    newGpa: round2(newGpa),
    delta: round2(newGpa - currentGpa),
    termGpa: termCredits > 0 ? round2(termQuality / termCredits) : null,
    addedGpaCredits: totalCredits - currentCredits,
    newTotalCredits: totalCredits,
    hasInput,
  };
}

// ---------------------------------------------------------------------------
// 3. Target GPA (reverse)
// ---------------------------------------------------------------------------

export type TargetStatus = 'ok' | 'guaranteed' | 'impossible' | 'no-credits';

export interface TargetInput {
  currentGpa: number;
  currentCredits: number;
  /** Exact quality points behind the current GPA, when known. */
  currentQualityPoints?: number;
  /** Total credits planned for the upcoming term. */
  plannedCredits: number;
  /** Desired cumulative GPA after the term. */
  targetGpa: number;
}

export interface TargetResult {
  status: TargetStatus;
  /** Term (semester) GPA required to hit the target, when status === 'ok'. */
  requiredTermGpa: number | null;
  /** Best cumulative GPA reachable if every planned course is a 4.00. */
  maxReachableGpa: number;
  /** The minimum uniform letter grade that meets the requirement (e.g. "B+"). */
  requiredLetter: string | null;
}

export function requiredTermGpa(input: TargetInput): TargetResult {
  const currentGpa = clampGpa(input.currentGpa || 0);
  const currentCredits = Math.max(0, input.currentCredits || 0);
  const plannedCredits = Math.max(0, input.plannedCredits || 0);
  const targetGpa = clampGpa(input.targetGpa || 0);

  const currentQuality =
    input.currentQualityPoints !== undefined && Number.isFinite(input.currentQualityPoints)
      ? input.currentQualityPoints
      : currentGpa * currentCredits;

  const maxReachable = round2(
    (currentQuality + THRESHOLDS.max * plannedCredits) /
      Math.max(1, currentCredits + plannedCredits),
  );

  if (plannedCredits <= 0) {
    return {
      status: 'no-credits',
      requiredTermGpa: null,
      maxReachableGpa: round2(currentGpa),
      requiredLetter: null,
    };
  }

  const required =
    (targetGpa * (currentCredits + plannedCredits) - currentQuality) / plannedCredits;

  if (required <= 0) {
    return {
      status: 'guaranteed',
      requiredTermGpa: 0,
      maxReachableGpa: maxReachable,
      requiredLetter: null,
    };
  }

  if (required > THRESHOLDS.max + 1e-9) {
    return {
      status: 'impossible',
      requiredTermGpa: round2(required),
      maxReachableGpa: maxReachable,
      requiredLetter: null,
    };
  }

  return {
    status: 'ok',
    requiredTermGpa: round2(required),
    maxReachableGpa: maxReachable,
    requiredLetter: minLetterForAverage(required),
  };
}

/** Smallest uniform letter grade whose points ≥ the required average. */
export function minLetterForAverage(avg: number): string | null {
  // GPA_GRADES is ordered best → worst; walk worst → best to find the minimum.
  const ascending = [...GPA_GRADES].reverse();
  for (const g of ascending) {
    if ((g.points as number) >= avg - 1e-9) return g.letter;
  }
  return null;
}

/**
 * Example letter-grade combinations (equal-weight courses) whose mean meets the
 * required term average — because a target is an *average*, not a fixed grade in
 * every course. Returns each combo as letters sorted best → worst.
 */
export function exampleGradeMixes(
  requiredAvg: number,
  nCourses: number,
  limit = 3,
): string[][] {
  const n = Math.max(1, Math.round(nCourses));
  const uniform = minLetterForAverage(requiredAvg);
  if (!uniform) return [];

  const seen = new Set<string>();
  const out: string[][] = [];
  const orderIndex = new Map(GPA_GRADES.map((g, i) => [g.letter, i]));

  const add = (letters: string[]) => {
    const sorted = [...letters].sort(
      (a, b) => (orderIndex.get(a) ?? 99) - (orderIndex.get(b) ?? 99),
    );
    const key = sorted.join(',');
    if (seen.has(key)) return;
    seen.add(key);
    out.push(sorted);
  };

  // 1) All the same (minimum uniform grade).
  add(Array(n).fill(uniform));

  // 2) Mixes: pin k courses at A (4.0), find the min grade for the rest.
  for (let k = 1; k < n && out.length < limit + 2; k++) {
    const restAvg = (requiredAvg * n - 4.0 * k) / (n - k);
    if (restAvg <= 0) break;
    const rest = minLetterForAverage(restAvg);
    if (!rest) continue;
    add([...Array(k).fill('A'), ...Array(n - k).fill(rest)]);
  }

  return out.slice(0, limit);
}

export { round2, clampGpa };

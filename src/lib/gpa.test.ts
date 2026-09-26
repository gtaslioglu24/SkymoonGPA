import { describe, it, expect } from 'vitest';
import {
  calcGpaFromCourses,
  projectGpa,
  requiredTermGpa,
  minLetterForAverage,
  exampleGradeMixes,
  type CourseInput,
} from './gpa';

const c = (grade: string, credits: number, extra: Partial<CourseInput> = {}): CourseInput => ({
  id: Math.random().toString(36).slice(2),
  grade,
  credits,
  ...extra,
});

describe('calcGpaFromCourses', () => {
  it('computes a simple weighted average', () => {
    // A(4.0)*3 + B(3.0)*3 = 21 / 6 = 3.5
    const r = calcGpaFromCourses([c('A', 3), c('B', 3)]);
    expect(r.gpa).toBe(3.5);
    expect(r.gpaCredits).toBe(6);
  });

  it('includes F (0 points) in the average but not in earned credits', () => {
    // A(4)*3 + F(0)*3 = 12 / 6 = 2.0
    const r = calcGpaFromCourses([c('A', 3), c('F', 3)]);
    expect(r.gpa).toBe(2.0);
    expect(r.gpaCredits).toBe(6);
    expect(r.earnedCredits).toBe(3);
  });

  it('excludes S / U / P / W from the GPA', () => {
    const r = calcGpaFromCourses([c('A', 3), c('S', 3), c('W', 3), c('P', 2)]);
    expect(r.gpa).toBe(4.0); // only the A counts
    expect(r.gpaCredits).toBe(3);
    expect(r.earnedCredits).toBe(8); // A + S + P earn credit; W does not
  });

  it('weights by credit hours', () => {
    // A(4)*4 + C(2)*1 = 18 / 5 = 3.6
    const r = calcGpaFromCourses([c('A', 4), c('C', 1)]);
    expect(r.gpa).toBe(3.6);
  });
});

describe('projectGpa', () => {
  it('adds new courses to an existing cumulative GPA', () => {
    // 3.0 over 30 credits = 90 quality points. Add A(4)*3 = 12 -> 102 / 33 = 3.0909
    const r = projectGpa({
      currentGpa: 3.0,
      currentCredits: 30,
      courses: [c('A', 3)],
    });
    expect(r.newGpa).toBe(3.09);
    expect(r.delta).toBe(0.09);
    expect(r.newTotalCredits).toBe(33);
    expect(r.termGpa).toBe(4.0);
  });

  it('returns the current GPA unchanged when there is no input', () => {
    const r = projectGpa({ currentGpa: 3.24, currentCredits: 45, courses: [] });
    expect(r.newGpa).toBe(3.24);
    expect(r.delta).toBe(0);
    expect(r.hasInput).toBe(false);
  });

  it('retake with a higher grade replaces the old grade (credits counted once)', () => {
    // Start 3.0 over 30 credits (=90 qp). Retake a 3-credit C(2.0) -> B(3.0).
    // Old contribution 2.0*3=6 already in the 90. New best 3.0 -> +（3-2)*3 = +3.
    // qp 93 / 30 (credits unchanged) = 3.1
    const r = projectGpa({
      currentGpa: 3.0,
      currentCredits: 30,
      courses: [c('B', 3, { isRetake: true, previousGrade: 'C' })],
    });
    expect(r.newGpa).toBe(3.1);
    expect(r.newTotalCredits).toBe(30); // credits NOT double counted
  });

  it('lets a worse retake pull the average down, as Koç does', () => {
    // The default rule is the university's: only the most recent attempt
    // counts. 90 qp over 30 credits, B(3.0) -> C(2.0) on 3 of them:
    // 90 + (2 - 3) * 3 = 87 / 30 = 2.90. Defaulting to "highest" instead used
    // to report an unchanged 3.00 to a student whose real GPA had fallen.
    const r = projectGpa({
      currentGpa: 3.0,
      currentCredits: 30,
      courses: [c('C', 3, { isRetake: true, previousGrade: 'B' })],
    });
    expect(r.newGpa).toBe(2.9);
    expect(r.delta).toBe(-0.1);
  });

  it('keeps the better attempt when asked for the "highest" rule', () => {
    const r = projectGpa({
      currentGpa: 3.0,
      currentCredits: 30,
      courses: [c('C', 3, { isRetake: true, previousGrade: 'B' })],
      repeatRule: 'highest',
    });
    expect(r.newGpa).toBe(3.0);
    expect(r.delta).toBe(0);
  });

  it('retaking a failed course (F) removes the F contribution', () => {
    // 2.0 over 30 credits = 60 qp, and the F's 3 credits are part of that 30.
    // Retake F(0) -> B(3.0): +(3-0)*3 = +9 -> 69 / 30 = 2.3
    const r = projectGpa({
      currentGpa: 2.0,
      currentCredits: 30,
      courses: [c('B', 3, { isRetake: true, previousGrade: 'F' })],
    });
    expect(r.newGpa).toBe(2.3);
    expect(r.newTotalCredits).toBe(30);
  });

  it('uses exact quality points when given, instead of rounded GPA × credits', () => {
    // A real average of 3.335 rounds to 3.34 for display. Rebuilding the total
    // from the rounded figure would put ~0.5 quality points of error into every
    // projection built on it.
    const exact = projectGpa({
      currentGpa: 3.34,
      currentCredits: 100,
      currentQualityPoints: 333.5,
      courses: [c('A', 4)],
    });
    const rebuilt = projectGpa({
      currentGpa: 3.34,
      currentCredits: 100,
      courses: [c('A', 4)],
    });
    expect(exact.newGpa).toBe(3.36); // 349.5 / 104
    expect(rebuilt.newGpa).toBe(3.37); // 349.5 → 350.0 / 104
    expect(exact.newGpa).not.toBe(rebuilt.newGpa);
  });
});

describe('projectGpa — repeat rules', () => {
  // Same retake in all three: 3-credit C (2.0) retaken and scored B- (2.7),
  // against a 3.0 cumulative over 30 credits (90 quality points).
  const retake = () => [c('B-', 3, { isRetake: true, previousGrade: 'C' })];

  it('highest: the better attempt replaces the worse, credits counted once', () => {
    const r = projectGpa({
      currentGpa: 3.0,
      currentCredits: 30,
      courses: retake(),
      repeatRule: 'highest',
    });
    // 90 + (2.7 − 2.0)×3 = 92.1 / 30
    expect(r.newGpa).toBe(3.07);
    expect(r.newTotalCredits).toBe(30);
  });

  it('last: the newest attempt counts even when it is worse', () => {
    const r = projectGpa({
      currentGpa: 3.0,
      currentCredits: 30,
      courses: [c('D', 3, { isRetake: true, previousGrade: 'B' })],
      repeatRule: 'last',
    });
    // 90 + (1.0 − 3.0)×3 = 84 / 30 = 2.8
    expect(r.newGpa).toBe(2.8);
    expect(r.newTotalCredits).toBe(30);
  });

  it('highest: a worse retake changes nothing', () => {
    const r = projectGpa({
      currentGpa: 3.0,
      currentCredits: 30,
      courses: [c('D', 3, { isRetake: true, previousGrade: 'B' })],
      repeatRule: 'highest',
    });
    expect(r.newGpa).toBe(3.0);
    expect(r.delta).toBe(0);
  });

  it('all: both attempts stay in the average and both sets of credits count', () => {
    const r = projectGpa({
      currentGpa: 3.0,
      currentCredits: 30,
      courses: retake(),
      repeatRule: 'all',
    });
    // 90 + 2.7×3 = 98.1 / 33
    expect(r.newGpa).toBe(2.97);
    expect(r.newTotalCredits).toBe(33);
  });

  it('defaults to the highest-attempt rule when none is given', () => {
    const withRule = projectGpa({
      currentGpa: 3.0,
      currentCredits: 30,
      courses: retake(),
      repeatRule: 'highest',
    });
    const withoutRule = projectGpa({ currentGpa: 3.0, currentCredits: 30, courses: retake() });
    expect(withoutRule).toEqual(withRule);
  });

  it('still reports the term GPA at the new grade under every rule', () => {
    for (const rule of ['highest', 'last', 'all'] as const) {
      const r = projectGpa({
        currentGpa: 3.0,
        currentCredits: 30,
        courses: retake(),
        repeatRule: rule,
      });
      expect(r.termGpa).toBe(2.7);
    }
  });
});

describe('requiredTermGpa', () => {
  it('computes the term GPA needed to reach a target', () => {
    // Current 2.5 over 30, plan 15 credits, target 3.0.
    // required = (3.0*45 - 2.5*30) / 15 = (135 - 75)/15 = 4.0
    const r = requiredTermGpa({
      currentGpa: 2.5,
      currentCredits: 30,
      plannedCredits: 15,
      targetGpa: 3.0,
    });
    expect(r.status).toBe('ok');
    expect(r.requiredTermGpa).toBe(4.0);
    expect(r.requiredLetter).toBe('A');
  });

  it('flags impossible targets', () => {
    const r = requiredTermGpa({
      currentGpa: 2.0,
      currentCredits: 60,
      plannedCredits: 15,
      targetGpa: 3.8,
    });
    expect(r.status).toBe('impossible');
  });

  it('flags targets already guaranteed', () => {
    // 3.9 over 100 credits; even 6 credits of straight F keeps the CGPA above 3.0.
    const r = requiredTermGpa({
      currentGpa: 3.9,
      currentCredits: 100,
      plannedCredits: 6,
      targetGpa: 3.0,
    });
    expect(r.status).toBe('guaranteed');
  });

  it('handles the no-planned-credits case', () => {
    const r = requiredTermGpa({
      currentGpa: 3.0,
      currentCredits: 60,
      plannedCredits: 0,
      targetGpa: 3.2,
    });
    expect(r.status).toBe('no-credits');
  });
});

describe('exampleGradeMixes', () => {
  const mean = (letters: string[]) => {
    const pts: Record<string, number> = { 'A+': 4, A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7 };
    return letters.reduce((s, l) => s + pts[l], 0) / letters.length;
  };

  it('offers a uniform option and a high+low mix for a 3.5 average over 2 courses', () => {
    const mixes = exampleGradeMixes(3.5, 2);
    // every returned combo must actually reach the average
    for (const m of mixes) expect(mean(m)).toBeGreaterThanOrEqual(3.5 - 1e-9);
    // a mix containing an A paired with a lower grade should appear (e.g. A + B)
    const hasMix = mixes.some((m) => m.includes('A') && m.some((l) => l !== 'A'));
    expect(hasMix).toBe(true);
    expect(mixes.length).toBeGreaterThan(1);
  });

  it('each combo has exactly nCourses grades', () => {
    const mixes = exampleGradeMixes(3.0, 4);
    for (const m of mixes) expect(m).toHaveLength(4);
  });
});

describe('minLetterForAverage', () => {
  it('finds the minimum uniform letter grade', () => {
    expect(minLetterForAverage(3.0)).toBe('B');
    expect(minLetterForAverage(3.1)).toBe('B+'); // 3.0 < 3.1, so need B+
    expect(minLetterForAverage(4.0)).toBe('A');
    expect(minLetterForAverage(0.5)).toBe('D'); // D is 1.0, the lowest passing
  });
});

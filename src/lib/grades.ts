/**
 * Koç University grading scale.
 *
 * Source: Koç University official grading scale (Academic Council 2020/07) and
 * Registrar's grading rules. Letter grades A+ … F carry quality points and enter
 * the GPA; S / U / P / W and other administrative grades do NOT affect the GPA.
 *
 * GPA is weighted by KU *credit hours* (not ECTS).
 */

export interface GradeInfo {
  /** Letter code as shown on the transcript. */
  letter: string;
  /** Quality-point coefficient on the 4.00 scale, or null if it does not enter GPA. */
  points: number | null;
  /** Whether this grade is included in the GPA average. */
  countsInGpa: boolean;
  /** Whether the course earns credits toward the degree. */
  earnsCredit: boolean;
}

/** Grades that carry quality points and enter the GPA average (A+ … F). */
export const GPA_GRADES: GradeInfo[] = [
  { letter: 'A+', points: 4.0, countsInGpa: true, earnsCredit: true },
  { letter: 'A', points: 4.0, countsInGpa: true, earnsCredit: true },
  { letter: 'A-', points: 3.7, countsInGpa: true, earnsCredit: true },
  { letter: 'B+', points: 3.3, countsInGpa: true, earnsCredit: true },
  { letter: 'B', points: 3.0, countsInGpa: true, earnsCredit: true },
  { letter: 'B-', points: 2.7, countsInGpa: true, earnsCredit: true },
  { letter: 'C+', points: 2.3, countsInGpa: true, earnsCredit: true },
  { letter: 'C', points: 2.0, countsInGpa: true, earnsCredit: true },
  { letter: 'C-', points: 1.7, countsInGpa: true, earnsCredit: true },
  { letter: 'D+', points: 1.3, countsInGpa: true, earnsCredit: true },
  { letter: 'D', points: 1.0, countsInGpa: true, earnsCredit: true },
  { letter: 'F', points: 0.0, countsInGpa: true, earnsCredit: false },
];

/**
 * Administrative / non-GPA grades. These never affect the GPA average.
 * Offered mainly in the "from scratch" transcript mode for completeness.
 */
export const NON_GPA_GRADES: GradeInfo[] = [
  { letter: 'S', points: null, countsInGpa: false, earnsCredit: true }, // Satisfactory
  { letter: 'U', points: null, countsInGpa: false, earnsCredit: false }, // Unsatisfactory
  { letter: 'P', points: null, countsInGpa: false, earnsCredit: true }, // Pass
  { letter: 'W', points: null, countsInGpa: false, earnsCredit: false }, // Withdrawal
];

export const ALL_GRADES: GradeInfo[] = [...GPA_GRADES, ...NON_GPA_GRADES];

const GRADE_MAP: Record<string, GradeInfo> = Object.fromEntries(
  ALL_GRADES.map((g) => [g.letter, g]),
);

export function getGrade(letter: string): GradeInfo | undefined {
  return GRADE_MAP[letter];
}

/** Quality points for a letter grade, or null if it does not enter the GPA. */
export function gradePoints(letter: string): number | null {
  return GRADE_MAP[letter]?.points ?? null;
}

/** Letters that enter the GPA, ordered best → worst (for dropdowns). */
export const GPA_GRADE_LETTERS = GPA_GRADES.map((g) => g.letter);

/**
 * GPA thresholds that matter at Koç.
 *
 * The honour lists are decided at the end of each semester on the *semester*
 * average (SPA), not on the cumulative one — and the two lists do not ask the
 * same question, so they cannot share a single comparison:
 *
 *   Vehbi Koç Onur Listesi   SPA ≥ 3.75
 *   Dekan Şeref Listesi      SPA ≥ 3.25 *and* cumulative ≥ 3.25
 *
 * Source: the "Akademik Durum" note printed on the YÖK transcript, in force
 * from the Fall 2021 semester. (The English paragraph beside it on that page
 * still quotes the pre-2021 figures of 3.50 and 3.00; the Turkish text is the
 * current one.)
 */
export const THRESHOLDS = {
  /** Minimum cumulative GPA required to graduate. */
  graduation: 2.0,
  /** Dean's Honour List — semester *and* cumulative must both reach this. */
  deansHonor: 3.25,
  /** Vehbi Koç Honour List — semester average only, the higher of the two. */
  vehbiKoc: 3.75,
  /** Max attainable GPA. */
  max: 4.0,
} as const;

/** Which threshold band a result falls in. Doubles as the i18n key. */
export type GpaBand = 'vehbiKoc' | 'deansHonor' | 'safe' | 'warning';

/**
 * Classify a result against the thresholds above.
 *
 * Lives here, next to the numbers it compares against, rather than in the
 * component that renders it: it is a rule of the university, it is what the UI
 * claims about someone's record, and a rule the app states out loud is a rule
 * worth a test.
 *
 * `termGpa` is the semester average being judged. Without one there is no
 * semester to award anything for — a "from scratch" total of every course ever
 * taken is not a semester — so only the graduation line can be reported. Saying
 * nothing there is the point: an honour claimed on the wrong average is worse
 * than no claim at all.
 */
export function gpaBand({
  cumulativeGpa,
  termGpa,
}: {
  cumulativeGpa: number;
  termGpa?: number | null;
}): GpaBand {
  if (termGpa != null) {
    // Highest first: a 3.80 semester clears the Dean's bar too, and the note
    // should name the better list.
    if (termGpa >= THRESHOLDS.vehbiKoc) return 'vehbiKoc';
    if (termGpa >= THRESHOLDS.deansHonor && cumulativeGpa >= THRESHOLDS.deansHonor) {
      return 'deansHonor';
    }
  }
  return cumulativeGpa >= THRESHOLDS.graduation ? 'safe' : 'warning';
}

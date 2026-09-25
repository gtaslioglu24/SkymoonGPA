/**
 * Transcript parsing.
 *
 * Students copy their transcript out of KUSIS (or out of a PDF viewer) and
 * paste it here. There is no single format to target: column order, separators
 * and language all vary, and a PDF copy arrives as ragged whitespace. So this
 * parser is deliberately heuristic — and deliberately *loud* about it. Every
 * line it cannot interpret is returned in `skipped`, every ambiguity is
 * reported, and the UI shows the result for confirmation before anything is
 * imported. Silently guessing wrong on a transcript would be worse than not
 * parsing at all: the whole app exists to inform registration decisions.
 *
 * Pure and framework-free, like the rest of `lib/`. The pasted text never
 * leaves the device and is never persisted.
 */

import { getGrade } from './grades';

/** Which of two plausible credit columns (e.g. KU credit vs ECTS) to believe. */
export type CreditColumn = 'smaller' | 'larger';

export interface ParsedCourse {
  /** e.g. "MATH 106", when the row had a recognisable course code. */
  code?: string;
  name?: string;
  credits: number;
  grade: string;
  /** Every number on the row that could have been the credit value. */
  creditCandidates: number[];
  /** The original line, so the preview can show what a row came from. */
  raw: string;
}

export interface ParsedSemester {
  name: string;
  courses: ParsedCourse[];
}

export interface TranscriptSummary {
  /** Cumulative GPA, if the transcript stated one. */
  cumulativeGpa?: number;
  /** Total GPA-bearing credits, if stated. */
  totalCredits?: number;
}

export interface TranscriptParseResult {
  semesters: ParsedSemester[];
  /** Lines that looked like data but could not be read. Never hidden. */
  skipped: string[];
  totalCourses: number;
  /** Rows where more than one number could have been the credit value. */
  ambiguousCredits: number;
  /** Course codes seen more than once — usually retakes, worth flagging. */
  duplicateCodes: string[];
  summary: TranscriptSummary;
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

const SEASON =
  /\b(fall|autumn|spring|summer|winter|g[üu]z|bahar|yaz|k[ıi][şs])\b/i;
const YEAR = /\b(19|20)\d{2}\b/;

/** "MATH 106", "COMP200", "ENGL 100A" — 2–6 letters then a 3-digit number. */
const COURSE_CODE = /^([A-Za-zÇĞİÖŞÜçğıöşü]{2,6})[\s-]?(\d{3}[A-Za-z]?)$/;
const GLUED_CODE = /^([A-Za-zÇĞİÖŞÜçğıöşü]{2,6})(\d{3}[A-Za-z]?)$/;

/**
 * A credit-shaped number: at most two integer digits, optional decimals.
 * Deliberately narrow — it must not swallow course numbers (106) or years.
 */
const CREDIT_NUMBER = /^\d{1,2}([.,]\d{1,2})?$/;

/** Lines that are totals, column headers or page furniture rather than courses. */
const NOISE =
  /\b(gpa|cgpa|spa|ortalama|credits?\s+earned|kazan[ıi]lan|toplam|total|transcript|transkript|student|[öo][ğg]renci|page|sayfa|semester\s+summary|d[öo]nem\s+[öo]zeti|academic\s+standing|course\s*(code|title)|ders\s*(kodu|ad[ıi])|credits?|kredi|ects|grade|program|faculty|fak[üu]lte|department|b[öo]l[üu]m)\b/i;

const CUMULATIVE_GPA =
  /\b(?:cumulative\s*(?:gpa|g\.p\.a\.?)|cgpa|genel\s*ortalama|kümülatif\s*(?:gpa)?)\b[^\d]{0,20}(\d(?:[.,]\d{1,3})?)/i;
const TOTAL_CREDITS =
  /\b(?:total\s*credits?|credits?\s*earned|toplam\s*kredi|kazan[ıi]lan\s*kredi)\b[^\d]{0,20}(\d{1,3}(?:[.,]\d{1,2})?)/i;

const num = (s: string) => Number(s.replace(',', '.'));

// ---------------------------------------------------------------------------
// Line classification
// ---------------------------------------------------------------------------

/** Split on tabs / multiple spaces first, falling back to single spaces. */
function tokenize(line: string): string[] {
  return line
    .split(/[\t|]+|\s{2,}|\s/)
    .map((t) => t.trim().replace(/^[([{]+|[)\]},;:]+$/g, ''))
    .filter(Boolean);
}

/** Index of the rightmost token that is a grade we understand. */
function findGradeIndex(tokens: string[]): number {
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i].toUpperCase();
    if (getGrade(t)) return i;
  }
  return -1;
}

function isSemesterHeader(line: string, tokens: string[]): boolean {
  if (!SEASON.test(line) || !YEAR.test(line)) return false;
  // A course whose *title* contains "Spring" is still a course: headers carry
  // no grade, and they are short.
  return findGradeIndex(tokens) === -1 && tokens.length <= 8;
}

function cleanSemesterName(line: string): string {
  return line
    .replace(/[\t|]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/[-–—:]\s*$/, '')
    .trim()
    .slice(0, 60);
}

/**
 * Read one course row. Returns null when the line is not a course, which the
 * caller records in `skipped` rather than discarding.
 */
function parseCourseLine(line: string, creditColumn: CreditColumn): ParsedCourse | null {
  const tokens = tokenize(line);
  if (tokens.length < 2) return null;

  const gradeIndex = findGradeIndex(tokens);
  if (gradeIndex === -1) return null;
  const grade = tokens[gradeIndex].toUpperCase();

  // Course code, if the row starts with one ("MATH 106" or "MATH106").
  let code: string | undefined;
  let cursor = 0;
  const glued = tokens[0]?.match(GLUED_CODE);
  const split = tokens[0] && tokens[1] ? `${tokens[0]} ${tokens[1]}`.match(COURSE_CODE) : null;
  if (glued) {
    code = `${glued[1].toUpperCase()} ${glued[2].toUpperCase()}`;
    cursor = 1;
  } else if (split) {
    code = `${split[1].toUpperCase()} ${split[2].toUpperCase()}`;
    cursor = 2;
  }

  // Numbers between the code and the grade are the credit candidates. Anything
  // after the grade (quality points, ECTS totals) is ignored.
  const collect = (from: number, to: number) => {
    const out: number[] = [];
    for (let i = from; i < to; i++) {
      if (CREDIT_NUMBER.test(tokens[i])) {
        const v = num(tokens[i]);
        if (Number.isFinite(v) && v > 0 && v <= 30) out.push(v);
      }
    }
    return out;
  };

  let candidates = collect(cursor, gradeIndex);
  // Some layouts put the grade before the credit columns. Only fall back to
  // looking past the grade when nothing sensible came before it, so the usual
  // trailing quality-points column is never mistaken for credits.
  if (candidates.length === 0) candidates = collect(gradeIndex + 1, tokens.length);
  if (candidates.length === 0) return null;

  // Two numbers almost always means credit + ECTS, and ECTS is the larger of
  // the pair at Koç. Which one to believe is exposed as a setting, because
  // guessing wrong scales every single course.
  const pair = candidates.slice(0, 2);
  const credits =
    pair.length === 1
      ? pair[0]
      : creditColumn === 'smaller'
        ? Math.min(...pair)
        : Math.max(...pair);

  // The title is whatever sits between the code and the first number — or the
  // grade, when the layout puts that first. Without the `min`, a row like
  // "MATH 103  Calculus I  A-  4.00" hands back "Calculus I A-" as the title,
  // because the first number sits *after* the grade.
  const firstNumberIndex = tokens.findIndex(
    (t, i) => i >= cursor && CREDIT_NUMBER.test(t) && num(t) > 0,
  );
  const nameEnd = firstNumberIndex === -1 ? gradeIndex : Math.min(firstNumberIndex, gradeIndex);
  const nameTokens = tokens.slice(cursor, nameEnd);
  const name = nameTokens.join(' ').trim();

  return {
    code,
    name: name || undefined,
    credits,
    grade,
    creditCandidates: candidates,
    raw: line.trim(),
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function parseTranscript(
  text: string,
  creditColumn: CreditColumn = 'smaller',
): TranscriptParseResult {
  const semesters: ParsedSemester[] = [];
  const skipped: string[] = [];
  const summary: TranscriptSummary = {};
  const seenCodes = new Map<string, number>();
  let ambiguousCredits = 0;

  const push = (course: ParsedCourse) => {
    if (semesters.length === 0) semesters.push({ name: '', courses: [] });
    semesters[semesters.length - 1].courses.push(course);
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    // Totals can appear anywhere; harvest them before anything else claims the
    // line, then let the noise filter drop it.
    const gpaMatch = line.match(CUMULATIVE_GPA);
    if (gpaMatch && summary.cumulativeGpa === undefined) {
      const v = num(gpaMatch[1]);
      if (v >= 0 && v <= 4) summary.cumulativeGpa = v;
    }
    const creditsMatch = line.match(TOTAL_CREDITS);
    if (creditsMatch && summary.totalCredits === undefined) {
      const v = num(creditsMatch[1]);
      if (v > 0 && v <= 500) summary.totalCredits = v;
    }

    const tokens = tokenize(line);

    if (isSemesterHeader(line, tokens)) {
      semesters.push({ name: cleanSemesterName(line), courses: [] });
      continue;
    }

    const course = parseCourseLine(line, creditColumn);
    if (course) {
      if (course.creditCandidates.length > 1) ambiguousCredits++;
      if (course.code) seenCodes.set(course.code, (seenCodes.get(course.code) ?? 0) + 1);
      push(course);
      continue;
    }

    // Column headers, totals and page furniture aren't worth reporting.
    if (NOISE.test(line) || tokens.length < 2) continue;
    skipped.push(line.slice(0, 160));
  }

  const withCourses = semesters.filter((s) => s.courses.length > 0);

  return {
    semesters: withCourses,
    skipped,
    totalCourses: withCourses.reduce((n, s) => n + s.courses.length, 0),
    ambiguousCredits,
    duplicateCodes: [...seenCodes.entries()].filter(([, n]) => n > 1).map(([c]) => c),
    summary,
  };
}

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

/**
 * Fold the many ways a transcript can spell the same character into one.
 *
 * A PDF copy rarely hands back ASCII. The minus in "A-" arrives as an en dash,
 * a real minus sign or a non-breaking hyphen depending on the font, and the
 * column gaps arrive as non-breaking spaces. Every one of those used to make
 * the row unreadable, which showed up as courses quietly missing from an
 * otherwise successful import.
 */
function normalize(text: string): string {
  return text
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
    .replace(/[\u00a0\u2007\u202f\u2000-\u2006\u2008-\u200a]/g, ' ');
}

/** Split on tabs / multiple spaces first, falling back to single spaces. */
function tokenize(line: string): string[] {
  const raw = line
    .split(/[\t|]+|\s{2,}|\s/)
    .map((t) => t.trim().replace(/^[([{]+|[)\]},;:]+$/g, ''))
    .filter(Boolean);

  // "A-" printed with a space before the sign arrives as two tokens, and "A"
  // on its own is a different grade worth three tenths more. Merge the pair —
  // but only when the result is a grade that actually exists, so a stray sign
  // elsewhere on the row is left alone.
  const out: string[] = [];
  for (const token of raw) {
    const prev = out[out.length - 1];
    if ((token === '+' || token === '-') && prev && getGrade((prev + token).toUpperCase())) {
      out[out.length - 1] = prev + token;
    } else {
      out.push(token);
    }
  }
  return out;
}

/** A grade token, ignoring case and any trailing footnote marker ("A-*"). */
function gradeOf(token: string): ReturnType<typeof getGrade> {
  return getGrade(token.toUpperCase().replace(/[*†‡#]+$/, ''));
}

const isNumeric = (token: string) => /^\d+([.,]\d+)?$/.test(token);

/**
 * Index of the token holding this row's grade, or -1.
 *
 * Two traps, both of which used to put a wrong grade on a real course rather
 * than fail loudly:
 *
 *  - A trailing status column. "… B+  S" ends in a letter that is a valid
 *    non-GPA grade, and taking the rightmost match turned a 3.30 course into an
 *    ungraded one. So a GPA-bearing letter (A+…F) always wins over a bare
 *    administrative one; S/U/P/W are only believed when nothing else is there.
 *
 *  - A title ending in a single letter — "Programming in C", "Writing A". A
 *    bare letter is only accepted as a grade when it sits where a grade sits:
 *    at the end of the row, or straight after the numeric columns. Otherwise
 *    the row is left unparsed and reported, because inventing a C for a course
 *    that has no grade yet is far worse than admitting the line was unreadable.
 *
 * A signed grade ("A-", "B+") is unambiguous — no course title contains one —
 * so it is accepted wherever it appears.
 */
function findGradeIndex(tokens: string[]): number {
  let gpaGrade = -1;
  let adminGrade = -1;

  for (let i = tokens.length - 1; i >= 0; i--) {
    const info = gradeOf(tokens[i]);
    if (!info) continue;

    const bare = tokens[i].replace(/[*†‡#]+$/, '').length === 1;
    if (bare && i !== tokens.length - 1 && !isNumeric(tokens[i - 1] ?? '')) continue;

    if (info.countsInGpa || info.points !== null) {
      if (gpaGrade === -1) gpaGrade = i;
    } else if (adminGrade === -1) {
      adminGrade = i;
    }
  }

  return gpaGrade !== -1 ? gpaGrade : adminGrade;
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
  const grade = tokens[gradeIndex].toUpperCase().replace(/[*†‡#]+$/, '');

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

  for (const rawLine of normalize(text).split(/\r?\n/)) {
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

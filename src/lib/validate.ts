/**
 * Parsers for persisted state.
 *
 * Each returns a well-formed value or `null` ("I don't recognise this"). They
 * are deliberately conservative: a single unrecognised course row is dropped,
 * but a structurally wrong container is rejected outright so the caller falls
 * back to a clean default instead of rendering something impossible.
 */

import { getGrade } from './grades';
import type { CourseInput, Program, RepeatRule } from './gpa';
import type { Semester } from './semesters';
import type { StandingMode, StandingState } from './standing';
import { uid } from './uid';

/** Upper bounds — generous for real transcripts, tight enough to bound memory. */
export const MAX_CREDITS_PER_COURSE = 30;
export const MAX_COURSES = 400;
export const MAX_SEMESTERS = 40;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const PROGRAMS: Program[] = ['major', 'double', 'both'];
const REPEAT_RULES: RepeatRule[] = ['highest', 'last', 'all'];

/** A finite number within [min, max]; anything else is rejected. */
function num(v: unknown, min: number, max: number): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  if (v < min || v > max) return null;
  return v;
}

export function parseNumberOrEmpty(min: number, max: number): (raw: unknown) => number | '' | null {
  return (raw) => {
    if (raw === '') return '';
    return num(raw, min, max);
  };
}

export function parseBoolean(raw: unknown): boolean | null {
  return typeof raw === 'boolean' ? raw : null;
}

export function parseRepeatRule(raw: unknown): RepeatRule | null {
  return typeof raw === 'string' && (REPEAT_RULES as string[]).includes(raw)
    ? (raw as RepeatRule)
    : null;
}

export function parseCourse(raw: unknown): CourseInput | null {
  if (!isObject(raw)) return null;

  // An unknown letter means the row can't be scored — drop it rather than guess.
  if (typeof raw.grade !== 'string' || !getGrade(raw.grade)) return null;

  const credits = num(raw.credits, 0, MAX_CREDITS_PER_COURSE);
  if (credits === null) return null;

  const course: CourseInput = {
    id: typeof raw.id === 'string' && raw.id.length > 0 ? raw.id.slice(0, 64) : uid(),
    credits,
    grade: raw.grade,
  };

  if (typeof raw.name === 'string') course.name = raw.name.slice(0, 120);
  if (raw.isRetake === true) {
    course.isRetake = true;
    if (typeof raw.previousGrade === 'string' && getGrade(raw.previousGrade)) {
      course.previousGrade = raw.previousGrade;
    }
  }
  if (typeof raw.program === 'string' && (PROGRAMS as string[]).includes(raw.program)) {
    course.program = raw.program as Program;
  }

  return course;
}

export function parseCourses(raw: unknown): CourseInput[] | null {
  if (!Array.isArray(raw)) return null;
  const out: CourseInput[] = [];
  for (const item of raw.slice(0, MAX_COURSES)) {
    const course = parseCourse(item);
    if (course) out.push(course);
  }
  return out;
}

export function parseStanding(raw: unknown): StandingState | null {
  if (!isObject(raw)) return null;

  const mode: StandingMode = raw.mode === 'detailed' ? 'detailed' : 'simple';
  const gpa = raw.gpa === '' ? '' : num(raw.gpa, 0, 4);
  const credits = raw.credits === '' ? '' : num(raw.credits, 0, 1000);
  const pastCourses = parseCourses(raw.pastCourses ?? []);
  if (pastCourses === null) return null;

  return {
    mode,
    gpa: gpa === null ? '' : gpa,
    credits: credits === null ? '' : credits,
    pastCourses,
  };
}

export function parseSemesters(raw: unknown): Semester[] | null {
  if (!Array.isArray(raw)) return null;
  const out: Semester[] = [];
  for (const item of raw.slice(0, MAX_SEMESTERS)) {
    if (!isObject(item)) continue;
    const courses = parseCourses(item.courses ?? []);
    if (courses === null) continue;
    out.push({
      id: typeof item.id === 'string' && item.id.length > 0 ? item.id.slice(0, 64) : uid(),
      name: typeof item.name === 'string' ? item.name.slice(0, 60) : '',
      courses,
    });
  }
  return out;
}

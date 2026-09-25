import type { CourseInput } from './gpa';
import type { Semester } from './semesters';
import type { ParsedCourse, ParsedSemester } from './transcript';
import { uid } from './uid';

/** A fresh course row: 3 credits, letter A — both easy to change, neither zero. */
export function makeCourse(partial: Partial<CourseInput> = {}): CourseInput {
  return { id: uid(), name: '', credits: 3, grade: 'A', ...partial };
}

/**
 * Turn a parsed transcript row into a course row.
 *
 * Both the code and the title are kept. The code alone was used at first, on
 * the theory that it is what students recognise and that the field is narrow —
 * but after an import the list then reads "MATH 106, COMP 200, PHYS 101", which
 * is exactly the wall of codes you have to decode one by one to check the
 * import went right. The title is the part that makes a row recognisable, so
 * the two are joined when the transcript gave both.
 */
export function courseFromParsed(parsed: ParsedCourse): CourseInput {
  const name =
    parsed.code && parsed.name
      ? `${parsed.code} — ${parsed.name}`
      : (parsed.code ?? parsed.name ?? '');

  return makeCourse({
    // The stored field is capped at 120 characters by the validator; a long
    // title is trimmed here rather than silently dropped on the next read.
    name: name.slice(0, 120),
    credits: parsed.credits,
    grade: parsed.grade,
  });
}

/** Parsed transcript semesters → the app's semester model. */
export function semestersFromParsed(
  parsed: ParsedSemester[],
  fallbackName: (index: number) => string,
): Semester[] {
  return parsed.map((s, i) => ({
    id: uid(),
    name: s.name || fallbackName(i),
    courses: s.courses.map(courseFromParsed),
  }));
}

/** Every parsed course, flattened out of its semester grouping. */
export function coursesFromParsed(parsed: ParsedSemester[]): CourseInput[] {
  return parsed.flatMap((s) => s.courses.map(courseFromParsed));
}

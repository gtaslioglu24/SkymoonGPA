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
 * The name field is narrow and the course code is what students recognise, so
 * the code wins when there is one; the full title stays visible in the import
 * preview, which is where it is actually useful.
 */
export function courseFromParsed(parsed: ParsedCourse): CourseInput {
  return makeCourse({
    name: parsed.code ?? parsed.name ?? '',
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

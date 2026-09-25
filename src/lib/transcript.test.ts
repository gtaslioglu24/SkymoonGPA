import { describe, it, expect } from 'vitest';
import { parseTranscript } from './transcript';

/**
 * There is no one transcript format — students paste from a KUSIS table, from
 * a PDF viewer, in Turkish or English, with or without ECTS. These cases cover
 * the shapes that actually turn up; the parser is expected to read what it can
 * and *report* the rest rather than quietly inventing numbers.
 */

const tabbed = `
2023-2024 Fall
MATH 106\tCalculus II\t4.00\t6.00\tA-
COMP 200\tIntroduction to Computer Science\t3.00\t6.00\tB+
ENGL 100\tEnglish for Academic Purposes\t3.00\t5.00\tS
2023-2024 Spring
PHYS 101\tGeneral Physics I\t4.00\t6.00\tB
HIST 201\tHistory of Civilization\t3.00\t5.00\tA
Cumulative GPA: 3.24
Total Credits Earned: 17
`;

describe('parseTranscript — tab-separated (copied from a table)', () => {
  const r = parseTranscript(tabbed);

  it('splits into semesters', () => {
    expect(r.semesters).toHaveLength(2);
    expect(r.semesters[0].name).toBe('2023-2024 Fall');
    expect(r.semesters[1].name).toBe('2023-2024 Spring');
  });

  it('reads code, title, credits and grade', () => {
    expect(r.semesters[0].courses[0]).toMatchObject({
      code: 'MATH 106',
      name: 'Calculus II',
      credits: 4,
      grade: 'A-',
    });
  });

  it('prefers the KU credit over the larger ECTS column by default', () => {
    expect(r.semesters[0].courses.map((c) => c.credits)).toEqual([4, 3, 3]);
    expect(r.ambiguousCredits).toBe(5);
  });

  it('can be told to trust the larger column instead', () => {
    const ects = parseTranscript(tabbed, 'larger');
    expect(ects.semesters[0].courses.map((c) => c.credits)).toEqual([6, 6, 5]);
  });

  it('keeps non-GPA letters like S', () => {
    expect(r.semesters[0].courses[2].grade).toBe('S');
  });

  it('picks up the cumulative totals', () => {
    expect(r.summary.cumulativeGpa).toBe(3.24);
    expect(r.summary.totalCredits).toBe(17);
  });

  it('reports nothing as unreadable', () => {
    expect(r.skipped).toEqual([]);
    expect(r.totalCourses).toBe(5);
  });
});

describe('parseTranscript — ragged spacing (copied out of a PDF)', () => {
  const r = parseTranscript(`
Fall 2023
MATH106   Calculus with Complex Numbers      4    A-
PHYS101   General Physics I                  4    B
CHEM101   General Chemistry                  3    C+
`);

  it('handles a glued course code and single credit column', () => {
    expect(r.totalCourses).toBe(3);
    expect(r.semesters[0].courses[0]).toMatchObject({
      code: 'MATH 106',
      credits: 4,
      grade: 'A-',
    });
    expect(r.ambiguousCredits).toBe(0);
  });

  it('reads a season-first header', () => {
    expect(r.semesters[0].name).toBe('Fall 2023');
  });
});

describe('parseTranscript — Turkish transcript', () => {
  const r = parseTranscript(`
2023-2024 Güz Dönemi
MATH 106  Matematik II  4  6  B+
ECON 100  İktisada Giriş  3  5  A-
Genel Ortalama: 3,24
Toplam Kredi: 7
`);

  it('reads Turkish season headers and comma decimals', () => {
    expect(r.semesters[0].name).toBe('2023-2024 Güz Dönemi');
    expect(r.totalCourses).toBe(2);
    expect(r.summary.cumulativeGpa).toBe(3.24);
  });

  it('keeps Turkish characters in the title', () => {
    expect(r.semesters[0].courses[1].name).toBe('İktisada Giriş');
  });
});

describe('parseTranscript — awkward input', () => {
  it('ignores column headers and page furniture instead of reporting them', () => {
    const r = parseTranscript(`
Course Code   Course Title   Credit   ECTS   Grade
MATH 106  Calculus II  4  6  A-
Page 1 of 2
`);
    expect(r.totalCourses).toBe(1);
    expect(r.skipped).toEqual([]);
  });

  it('surfaces lines it cannot read rather than dropping them', () => {
    const r = parseTranscript(`
MATH 106  Calculus II  4  6  A-
this line is prose that means nothing here
`);
    expect(r.totalCourses).toBe(1);
    expect(r.skipped).toEqual(['this line is prose that means nothing here']);
  });

  it('is not fooled by a season word inside a course title', () => {
    const r = parseTranscript(`
ARTS 210  Spring Poetry of 1900  3  6  B
`);
    expect(r.totalCourses).toBe(1);
    expect(r.semesters[0].courses[0].grade).toBe('B');
  });

  it('ignores a trailing quality-points column', () => {
    const r = parseTranscript(`MATH 106  Calculus II  4.00  6.00  A-  14.80`);
    expect(r.semesters[0].courses[0].credits).toBe(4);
  });

  it('copes with the grade sitting before the credits', () => {
    const r = parseTranscript(`MATH 106  Calculus II  A-  4.00`);
    expect(r.semesters[0].courses[0]).toMatchObject({ credits: 4, grade: 'A-' });
  });

  it('does not leave the grade inside the course title', () => {
    // The title ends at whichever comes first, the credits or the grade.
    const r = parseTranscript(`MATH 103  Calculus I  A-  4.00`);
    expect(r.semesters[0].courses[0]).toMatchObject({
      code: 'MATH 103',
      name: 'Calculus I',
      credits: 4,
      grade: 'A-',
    });
  });

  it('flags repeated course codes', () => {
    const r = parseTranscript(`
2022-2023 Fall
MATH 106  Calculus II  4  6  F
2023-2024 Fall
MATH 106  Calculus II  4  6  B
`);
    expect(r.duplicateCodes).toEqual(['MATH 106']);
  });

  it('files courses under an unnamed semester when there is no header', () => {
    const r = parseTranscript(`MATH 106  Calculus II  4  6  A-`);
    expect(r.semesters).toHaveLength(1);
    expect(r.semesters[0].name).toBe('');
  });

  it('returns an empty result for empty or meaningless input', () => {
    for (const input of ['', '   \n\n  ', 'hello']) {
      const r = parseTranscript(input);
      expect(r.totalCourses).toBe(0);
      expect(r.semesters).toEqual([]);
    }
  });

  it('never invents a grade that is not on the Koç scale', () => {
    const r = parseTranscript(`MATH 106  Calculus II  4  6  X`);
    expect(r.totalCourses).toBe(0);
    expect(r.skipped).toHaveLength(1);
  });

  it('rejects an implausible cumulative GPA', () => {
    const r = parseTranscript(`Cumulative GPA: 87.5`);
    expect(r.summary.cumulativeGpa).toBeUndefined();
  });
});

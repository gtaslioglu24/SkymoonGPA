import { describe, it, expect } from 'vitest';
import { parseTranscript } from './transcript';
import { calcGpaFromCourses, type CourseInput } from './gpa';
import { uid } from './uid';

/**
 * The official transcript from e-Devlet ("Not Döküm Belgesi").
 *
 * Synthetic, but laid out exactly like the real thing, because every one of
 * these quirks broke the general parser: titles and grades live in separate
 * blocks and are paired by position, each data row is split over two lines, a
 * long title wraps, a term is interrupted by a page header, and the grading
 * scale at the end reads like a tidy list of courses if you let it.
 */
const YOK = `KOÇ ÜNİVERSİTESİ
(KOC UNIVERSITY)
NOT DÖKÜM BELGESİ
(TRANSCRIPT)
Genel Not Ortalaması
(Cumulative GPA)
:
3.16
Başarılan Kredi 41
:
2024-2025 Güz Dönemi
(2024-2025 Fall Term)
Dersin Statüsü
(Course Status)
Öğretim Dili
(Language) T U UK
AKTS
(ECTS)
Not
(Grade)
Puan
(Points)
*UNIV 101 ÜNİVERSİTEYE GİRİŞ
(INTRO TO UNIVERSITY)
DNO:
0 GNO:
TUK:
TAKTS:
0 1 2
(GPA)
(CGPA)
Z İng. - - 1 2 0
S G
2025-2026 Güz Dönemi
(2025-2026 Fall Term)
ACWR 101 TEMEL AKADEMİK YAZI TEKNİKLERİ
(BASIC ACADEMIC WRITING)
*COMP 100 BİLGİSAYAR BİLİMLERİNE VE
PROGRAMLAMAYA GİRİŞ
(INTRO TO COMP. SCIE&PRG.)
MATH 106 KALKÜLÜS I
(CALCULUS)
PHYS 101L GENEL FİZİK LABORUTARI I
(GENERAL PHYS I LAB)
DNO:
2.92 GNO:
TUK:
TAKTS:
2.92 14 34
(GPA)
(CGPA)
Z İng. - - 3 6 6
C G
Z İng. - - 3 6 0
F KLD KL
Z İng. - - 3 6 11.1
A- G
Z İng. - - 1 2 4
A G
2025-2026 Bahar Dönemi
(2025-2026 Spring Term)
COMP 100 BİLGİSAYAR BİLİMLERİNE VE
PROGRAMLAMAYA GİRİŞ
(INTRO TO COMP. SCIE&PRG.)
Z İng. - - 3 6 9
B TKR G
Bu belgenin doğruluğunu barkod numarası ile https://www.turkiye.gov.tr adresinden
/
1 2
KOÇ ÜNİVERSİTESİ
(KOC UNIVERSITY)
NOT DÖKÜM BELGESİ
ECON 101 MİKROEKONOMİYE GİRİŞ
(INTO TO MICROECONOMICS)
DNO:
3.1 GNO:
TUK:
TAKTS:
3.03 19 38
(GPA)
(CGPA)
Z İng. - - 3 6 12
A G
Açıklamalar (Explanations)
Ders kodunun başında * olan dersler genel not
ortalamasına dahil edilmeyen derslerdir.
Not Baremi : Notların Tanımı
4.00 A+ Kısaltmalar Not Bareminde yer alan kısaltmaları
- Pekiyi+
(Superior+)
4.00 A - Pekiyi
(Superior)
3.70 A- - Pekiyi-
(Superior-)
3.30 B+ - İyi+
3.00 B - İyi
2.70 B- - İyi-
2.30 C+ - Orta+
2.00 C - Orta
1.70 C- - Orta-
1.30 D+ - Zayıf+
1.00 D - Zayıf
0.00 F - Geçmez
`;

const r = parseTranscript(YOK);

describe('parseTranscript — YÖK / e-Devlet transcript', () => {
  it('pairs each course with the grade from the separate data block', () => {
    const fall = r.semesters.find((s) => s.name.startsWith('2025-2026 Güz'))!;
    expect(fall.courses).toMatchObject([
      { code: 'ACWR 101', name: 'TEMEL AKADEMİK YAZI TEKNİKLERİ', credits: 3, grade: 'C' },
      { code: 'MATH 106', name: 'KALKÜLÜS I', credits: 3, grade: 'A-' },
      { code: 'PHYS 101L', name: 'GENEL FİZİK LABORUTARI I', credits: 1, grade: 'A' },
    ]);
  });

  it('takes the national credit (UK), not the ECTS column beside it', () => {
    // Reading ECTS instead would double every course's weight.
    const fall = r.semesters.find((s) => s.name.startsWith('2025-2026 Güz'))!;
    expect(fall.courses.map((c) => c.credits)).toEqual([3, 3, 1]);
    expect(r.ambiguousCredits).toBe(0);
  });

  it('joins a title that wrapped onto the next line', () => {
    const spring = r.semesters.find((s) => s.name.startsWith('2025-2026 Bahar'))!;
    expect(spring.courses[0].name).toBe('BİLGİSAYAR BİLİMLERİNE VE PROGRAMLAMAYA GİRİŞ');
  });

  it('keeps a term together across a page break', () => {
    // ECON 101 sits after a repeated page header, still inside the spring term.
    const spring = r.semesters.find((s) => s.name.startsWith('2025-2026 Bahar'))!;
    expect(spring.courses.map((c) => c.code)).toEqual(['COMP 100', 'ECON 101']);
  });

  it('leaves out the courses the transcript marks with "*"', () => {
    // Including the removed retake's F would drag down an average the
    // university itself computes without it.
    const codes = r.semesters.flatMap((s) => s.courses.map((c) => c.code));
    expect(codes).not.toContain('UNIV 101');
    expect(r.excludedFromGpa).toBe(2);
    expect(codes.filter((c) => c === 'COMP 100')).toHaveLength(1);
  });

  it('does not read the grading scale at the end as courses', () => {
    // "3.70 A- - Pekiyi-" and its neighbours used to import as a D+, a C- and
    // a D the student had never taken.
    const codes = r.semesters.flatMap((s) => s.courses.map((c) => c.grade));
    expect(codes).not.toContain('D+');
    expect(codes).not.toContain('C-');
    expect(codes).not.toContain('D');
    expect(r.totalCourses).toBe(5);
  });

  it('reads the cover page totals', () => {
    expect(r.summary.cumulativeGpa).toBe(3.16);
    expect(r.summary.totalCredits).toBe(41);
  });

  it('reproduces the GPA the transcript states for the imported courses', () => {
    // The strongest check available: our own engine, fed only what the parser
    // read, must land on the university's own number for those courses.
    const courses: CourseInput[] = r.semesters
      .flatMap((s) => s.courses)
      .map((c) => ({ id: uid(), name: c.code, credits: c.credits, grade: c.grade }));
    const { gpa, gpaCredits } = calcGpaFromCourses(courses);
    // C·3 + A-·3 + A·1 + B·3 + A·3 = 6 + 11.1 + 4 + 9 + 12 = 42.1 over 13
    expect(gpaCredits).toBe(13);
    expect(gpa).toBe(3.24);
  });

  it('reports nothing as unreadable', () => {
    expect(r.skipped).toEqual([]);
  });
});

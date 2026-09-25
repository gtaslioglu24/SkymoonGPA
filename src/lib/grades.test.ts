import { describe, it, expect } from 'vitest';
import { THRESHOLDS, gpaBand } from './grades';

describe('THRESHOLDS', () => {
  it('encodes the published honour-roll cut-offs', () => {
    expect(THRESHOLDS.deansHonor).toBe(3.25);
    expect(THRESHOLDS.vehbiKoc).toBe(3.75);
    expect(THRESHOLDS.graduation).toBe(2.0);
  });
});

describe('gpaBand', () => {
  it('names the higher certificate when a GPA clears both', () => {
    // 3.75 is also above 3.25; the note must not say "Dean's" to a student who
    // has earned the Vehbi Koç certificate.
    expect(gpaBand(3.75)).toBe('vehbiKoc');
    expect(gpaBand(4)).toBe('vehbiKoc');
  });

  it('is inclusive at every boundary', () => {
    // "3.25 üstü" in the regulation means 3.25 qualifies, not 3.26.
    expect(gpaBand(3.25)).toBe('deansHonor');
    expect(gpaBand(2)).toBe('safe');
  });

  it('excludes the value just below each boundary', () => {
    expect(gpaBand(3.74)).toBe('deansHonor');
    expect(gpaBand(3.24)).toBe('safe');
    expect(gpaBand(1.99)).toBe('warning');
  });

  it('treats an empty record as below graduation', () => {
    expect(gpaBand(0)).toBe('warning');
  });
});

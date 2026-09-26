import { describe, it, expect } from 'vitest';
import { THRESHOLDS, gpaBand } from './grades';

describe('THRESHOLDS', () => {
  it('encodes the published honour-list cut-offs', () => {
    expect(THRESHOLDS.deansHonor).toBe(3.25);
    expect(THRESHOLDS.vehbiKoc).toBe(3.75);
    expect(THRESHOLDS.graduation).toBe(2.0);
  });
});

describe('gpaBand', () => {
  it('awards the Vehbi Koç list on the semester average alone', () => {
    // A strong term still counts even while the cumulative is catching up.
    expect(gpaBand({ cumulativeGpa: 2.4, termGpa: 3.8 })).toBe('vehbiKoc');
  });

  it("requires both averages for the Dean's list", () => {
    expect(gpaBand({ cumulativeGpa: 3.3, termGpa: 3.4 })).toBe('deansHonor');
    // A good term on top of a cumulative below 3.25 earns nothing.
    expect(gpaBand({ cumulativeGpa: 3.1, termGpa: 3.4 })).toBe('safe');
    // …and neither does a strong cumulative carried by a weak term.
    expect(gpaBand({ cumulativeGpa: 3.9, termGpa: 3.0 })).toBe('safe');
  });

  it('names the higher list when a term clears both', () => {
    expect(gpaBand({ cumulativeGpa: 3.9, termGpa: 3.75 })).toBe('vehbiKoc');
  });

  it('is inclusive at every boundary', () => {
    // "3.25 ve üzeri" in the regulation means 3.25 qualifies, not 3.26.
    expect(gpaBand({ cumulativeGpa: 3.25, termGpa: 3.25 })).toBe('deansHonor');
    expect(gpaBand({ cumulativeGpa: 2.0 })).toBe('safe');
  });

  it('excludes the value just below each boundary', () => {
    expect(gpaBand({ cumulativeGpa: 3.9, termGpa: 3.74 })).toBe('deansHonor');
    expect(gpaBand({ cumulativeGpa: 3.9, termGpa: 3.24 })).toBe('safe');
    expect(gpaBand({ cumulativeGpa: 3.24, termGpa: 3.24 })).toBe('safe');
    expect(gpaBand({ cumulativeGpa: 1.99 })).toBe('warning');
  });

  it('still awards the Vehbi Koç list on a low cumulative', () => {
    // Only the Dean's list reads the cumulative average. A 3.90 term earns the
    // Vehbi Koç place even at a 3.24 cumulative, which is the whole reason the
    // two lists cannot share one comparison.
    expect(gpaBand({ cumulativeGpa: 3.24, termGpa: 3.9 })).toBe('vehbiKoc');
  });

  it('claims no honour when there is no semester to judge', () => {
    // The "from scratch" tab totals every course ever taken; that is not a
    // semester, so no list can be awarded from it however high it is.
    expect(gpaBand({ cumulativeGpa: 3.9 })).toBe('safe');
    expect(gpaBand({ cumulativeGpa: 3.9, termGpa: null })).toBe('safe');
  });

  it('treats an empty record as below graduation', () => {
    expect(gpaBand({ cumulativeGpa: 0 })).toBe('warning');
  });
});

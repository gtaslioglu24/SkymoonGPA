import { describe, it, expect } from 'vitest';
import { formatDecimal, parseDecimalInput, separatorOf, stepDecimal } from './decimal';

/**
 * A Turkish phone keyboard offers "," and nothing else as the decimal key.
 * Every case here is something a real thumb produces on the way to a GPA.
 */
describe('parseDecimalInput', () => {
  it('reads a comma exactly like a point', () => {
    expect(parseDecimalInput('3,5')).toBe(3.5);
    expect(parseDecimalInput('3.5')).toBe(3.5);
    expect(parseDecimalInput('3,24')).toBe(3.24);
    expect(parseDecimalInput('0,05')).toBe(0.05);
  });

  it('accepts every prefix of a number while it is being typed', () => {
    expect(parseDecimalInput('3')).toBe(3);
    expect(parseDecimalInput('3,')).toBe(3);
    expect(parseDecimalInput('3.')).toBe(3);
    expect(parseDecimalInput(',5')).toBe(0.5);
    expect(parseDecimalInput('.5')).toBe(0.5);
    expect(parseDecimalInput('3,0')).toBe(3);
  });

  it('treats an empty field or a lone separator as empty, not zero', () => {
    expect(parseDecimalInput('')).toBe('');
    expect(parseDecimalInput(',')).toBe('');
    expect(parseDecimalInput('.')).toBe('');
    expect(parseDecimalInput('   ')).toBe('');
  });

  it('ignores stray whitespace from a paste', () => {
    expect(parseDecimalInput(' 3,5 ')).toBe(3.5);
  });

  it('refuses anything that is not a plain positive decimal', () => {
    expect(parseDecimalInput('3,5,')).toBeNull();
    expect(parseDecimalInput('3.5.1')).toBeNull();
    expect(parseDecimalInput('3,5.1')).toBeNull();
    expect(parseDecimalInput('-1')).toBeNull();
    expect(parseDecimalInput('1e9')).toBeNull();
    expect(parseDecimalInput('abc')).toBeNull();
    expect(parseDecimalInput('Infinity')).toBeNull();
  });
});

describe('separatorOf', () => {
  it('remembers which decimal key the user pressed', () => {
    expect(separatorOf('3,5')).toBe(',');
    expect(separatorOf('3.5')).toBe('.');
    expect(separatorOf('35')).toBeNull();
  });
});

describe('formatDecimal', () => {
  it('writes the value back with the chosen separator', () => {
    expect(formatDecimal(3.5)).toBe('3.5');
    expect(formatDecimal(3.5, ',')).toBe('3,5');
    expect(formatDecimal(60, ',')).toBe('60');
    expect(formatDecimal('')).toBe('');
  });

  it('round-trips through the parser', () => {
    for (const v of [0, 0.5, 3.24, 3.5, 4, 120]) {
      expect(parseDecimalInput(formatDecimal(v, ','))).toBe(v);
      expect(parseDecimalInput(formatDecimal(v, '.'))).toBe(v);
    }
  });
});

describe('stepDecimal', () => {
  it('steps without floating-point noise', () => {
    expect(stepDecimal(0.2, 0.1, 1)).toBe(0.3);
    expect(stepDecimal(3.24, 0.01, 1)).toBe(3.25);
    expect(stepDecimal(3, 0.5, -1)).toBe(2.5);
    expect(stepDecimal(15, 1, 1)).toBe(16);
  });
});

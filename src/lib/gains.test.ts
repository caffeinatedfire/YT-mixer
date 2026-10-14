import { describe, expect, it } from 'vitest';
import { deckVolume, gains } from './gains';

describe('gains', () => {
  it('is all A at 0 and all B at 1', () => {
    expect(gains(0)).toEqual({ a: 1, b: 0 });
    const end = gains(1);
    expect(end.a).toBeCloseTo(0, 10);
    expect(end.b).toBeCloseTo(1, 10);
  });

  it('is about 0.707 each in the middle', () => {
    const mid = gains(0.5);
    expect(mid.a).toBeCloseTo(Math.SQRT1_2, 6);
    expect(mid.b).toBeCloseTo(Math.SQRT1_2, 6);
  });

  it('keeps equal power everywhere', () => {
    for (let i = 0; i <= 100; i++) {
      const { a, b } = gains(i / 100);
      expect(a * a + b * b).toBeCloseTo(1, 10);
    }
  });

  it('clamps out-of-range input', () => {
    expect(gains(-1)).toEqual(gains(0));
    expect(gains(2)).toEqual(gains(1));
    expect(gains(Number.NaN)).toEqual(gains(0));
  });
});

describe('deckVolume', () => {
  it('rounds gain * trim to a 0-100 integer', () => {
    expect(deckVolume(1, 100)).toBe(100);
    expect(deckVolume(Math.SQRT1_2, 100)).toBe(71);
    expect(deckVolume(0.5, 80)).toBe(40);
    expect(deckVolume(0, 100)).toBe(0);
    expect(deckVolume(1, 150)).toBe(100);
    expect(deckVolume(1, -5)).toBe(0);
  });
});

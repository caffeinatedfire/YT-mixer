import { describe, expect, it } from 'vitest';
import { deckEnd, outgoingDeck, rampX } from './fade';

describe('rampX', () => {
  it('moves linearly from start to target over the duration', () => {
    expect(rampX(0, 1, 0, 6000)).toEqual({ x: 0, progress: 0 });
    expect(rampX(0, 1, 3000, 6000)).toEqual({ x: 0.5, progress: 0.5 });
    expect(rampX(0, 1, 6000, 6000)).toEqual({ x: 1, progress: 1 });
  });

  it('works right to left and from a mid-point start', () => {
    expect(rampX(1, 0, 1500, 6000).x).toBeCloseTo(0.75);
    expect(rampX(0.2, 1, 3000, 6000).x).toBeCloseTo(0.6);
  });

  it('clamps when the interval fired late (hidden-tab throttling)', () => {
    expect(rampX(0, 1, 9000, 6000)).toEqual({ x: 1, progress: 1 });
    expect(rampX(0, 1, -5, 6000)).toEqual({ x: 0, progress: 0 });
  });

  it('finishes immediately for a zero duration', () => {
    expect(rampX(0, 1, 0, 0)).toEqual({ x: 1, progress: 1 });
  });
});

describe('outgoingDeck / deckEnd', () => {
  it('treats the louder side as the outgoing deck', () => {
    expect(outgoingDeck(0)).toBe('A');
    expect(outgoingDeck(0.49)).toBe('A');
    expect(outgoingDeck(0.5)).toBe('B');
    expect(outgoingDeck(1)).toBe('B');
  });

  it('maps a deck to its crossfader end', () => {
    expect(deckEnd('A')).toBe(0);
    expect(deckEnd('B')).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
import { activeDeck, linkedLevels, unlinkedRamp, xFromLevel, xFromLevels } from './faders';

describe('linkedLevels', () => {
  it('follows the equal-power crossfader: A 100->0, B 0->100', () => {
    expect(linkedLevels(0)).toEqual({ A: 1, B: 0 });
    const end = linkedLevels(1);
    expect(end.A).toBeCloseTo(0, 10);
    expect(end.B).toBeCloseTo(1, 10);
    const mid = linkedLevels(0.5);
    expect(mid.A).toBeCloseTo(Math.SQRT1_2);
    expect(mid.B).toBeCloseTo(Math.SQRT1_2);
  });
});

describe('xFromLevel (dragging one vertical fader while linked)', () => {
  it('is the inverse of linkedLevels for either deck', () => {
    for (const x of [0, 0.1, 0.25, 0.5, 0.8, 1]) {
      const l = linkedLevels(x);
      expect(xFromLevel('A', l.A)).toBeCloseTo(x, 6);
      expect(xFromLevel('B', l.B)).toBeCloseTo(x, 6);
    }
  });

  it('clamps out-of-range levels', () => {
    expect(xFromLevel('A', 2)).toBe(0);
    expect(xFromLevel('A', -1)).toBe(1);
    expect(xFromLevel('B', 2)).toBe(1);
    expect(xFromLevel('B', -1)).toBe(0);
  });
});

describe('xFromLevels (re-linking)', () => {
  it('keeps the balance between the two decks', () => {
    expect(xFromLevels({ A: 1, B: 0 }, 0.3)).toBe(0);
    expect(xFromLevels({ A: 0, B: 0.4 }, 0.3)).toBe(1);
    expect(xFromLevels({ A: 0.5, B: 0.5 }, 0.3)).toBeCloseTo(0.5);
    const x = xFromLevels({ A: 0.8, B: 0.2 }, 0.3);
    const l = linkedLevels(x);
    expect(l.B / l.A).toBeCloseTo(0.25);
  });

  it('keeps the previous crossfader when both decks are silent', () => {
    expect(xFromLevels({ A: 0, B: 0 }, 0.3)).toBe(0.3);
  });
});

describe('activeDeck', () => {
  it('is the louder deck, A on a tie', () => {
    expect(activeDeck({ A: 0.9, B: 0.2 })).toBe('A');
    expect(activeDeck({ A: 0.1, B: 0.2 })).toBe('B');
    expect(activeDeck({ A: 0.5, B: 0.5 })).toBe('A');
  });
});

describe('unlinkedRamp', () => {
  const start = { A: 0.8, B: 0.3 };

  it('starts where the faders are', () => {
    expect(unlinkedRamp(start, 'A', 0)).toEqual(start);
  });

  it('ends with the outgoing deck at 0 and the incoming at full', () => {
    const end = unlinkedRamp(start, 'A', 1);
    expect(end.A).toBeCloseTo(0, 10);
    expect(end.B).toBeCloseTo(1, 10);
    const back = unlinkedRamp({ A: 0.2, B: 0.6 }, 'B', 1);
    expect(back.B).toBeCloseTo(0, 10);
    expect(back.A).toBeCloseTo(1, 10);
  });

  it('moves both decks monotonically', () => {
    let prev = start;
    for (let i = 1; i <= 20; i++) {
      const cur = unlinkedRamp(start, 'A', i / 20);
      expect(cur.A).toBeLessThanOrEqual(prev.A);
      expect(cur.B).toBeGreaterThanOrEqual(prev.B);
      prev = cur;
    }
  });

  it('clamps progress', () => {
    expect(unlinkedRamp(start, 'A', -1)).toEqual(start);
    expect(unlinkedRamp(start, 'A', 2)).toEqual(unlinkedRamp(start, 'A', 1));
  });
});

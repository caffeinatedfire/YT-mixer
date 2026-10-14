import { describe, expect, it } from 'vitest';
import { decksToResume, nudge } from './master';
import type { QueueItem } from '../state/queue';

const item = (uid: number): QueueItem => ({ uid, videoId: 'dQw4w9WgXcQ' });
const both = { A: item(1), B: item(2) };

describe('decksToResume', () => {
  it('resumes exactly the decks that were playing', () => {
    expect(decksToResume([{ deck: 'A', uid: 1 }], both, 'A')).toEqual(['A']);
    expect(decksToResume([{ deck: 'B', uid: 2 }], both, 'A')).toEqual(['B']);
    expect(decksToResume([{ deck: 'A', uid: 1 }, { deck: 'B', uid: 2 }], both, 'A')).toEqual(['A', 'B']);
  });

  it('never resumes a deck whose song changed since the pause (it is a freshly cued song)', () => {
    expect(decksToResume([{ deck: 'A', uid: 1 }, { deck: 'B', uid: 99 }], both, 'A')).toEqual(['A']);
  });

  it('with nothing remembered, plays only the deck the crossfader favours', () => {
    expect(decksToResume(null, both, 'A')).toEqual(['A']);
    expect(decksToResume([], both, 'B')).toEqual(['B']);
  });

  it('falls back to the favoured deck when every remembered song is gone', () => {
    expect(decksToResume([{ deck: 'B', uid: 99 }], both, 'A')).toEqual(['A']);
  });

  it('plays nothing when the favoured deck is empty', () => {
    expect(decksToResume(null, { A: null, B: item(2) }, 'A')).toEqual([]);
  });
});

describe('nudge', () => {
  it('moves the crossfader by 0.05 and clamps', () => {
    expect(nudge(0.5, 1)).toBeCloseTo(0.55);
    expect(nudge(0.5, -1)).toBeCloseTo(0.45);
    expect(nudge(0.98, 1)).toBe(1);
    expect(nudge(0.02, -1)).toBe(0);
  });
});

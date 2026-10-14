import { describe, expect, it } from 'vitest';
import { initialMix, mixReducer, otherDeck, type MixState } from './mix';

const playingA: MixState = { kind: 'playing', active: 'A' };

describe('otherDeck', () => {
  it('flips A and B', () => {
    expect(otherDeck('A')).toBe('B');
    expect(otherDeck('B')).toBe('A');
  });
});

describe('mixReducer', () => {
  it('starts idle and goes to playing on play', () => {
    expect(initialMix).toEqual({ kind: 'idle' });
    expect(mixReducer(initialMix, { type: 'play', deck: 'B' })).toEqual({ kind: 'playing', active: 'B' });
  });

  it('starts a transition from the active deck to the other one', () => {
    expect(mixReducer(playingA, { type: 'startTransition' })).toEqual({
      kind: 'transitioning',
      from: 'A',
      to: 'B',
      progress: 0,
    });
  });

  it('ignores startTransition when idle or already transitioning (double-trigger guard)', () => {
    expect(mixReducer(initialMix, { type: 'startTransition' })).toBe(initialMix);
    const t = mixReducer(playingA, { type: 'startTransition' });
    const t2 = mixReducer(mixReducer(t, { type: 'progress', progress: 0.4 }), { type: 'startTransition' });
    expect(t2).toEqual({ kind: 'transitioning', from: 'A', to: 'B', progress: 0.4 });
  });

  it('clamps progress and ignores it outside a transition', () => {
    const t = mixReducer(playingA, { type: 'startTransition' });
    expect(mixReducer(t, { type: 'progress', progress: 1.7 })).toMatchObject({ progress: 1 });
    expect(mixReducer(t, { type: 'progress', progress: -1 })).toMatchObject({ progress: 0 });
    expect(mixReducer(playingA, { type: 'progress', progress: 0.5 })).toBe(playingA);
  });

  it('completes to the incoming deck', () => {
    const t = mixReducer(playingA, { type: 'startTransition' });
    expect(mixReducer(t, { type: 'complete' })).toEqual({ kind: 'playing', active: 'B' });
    expect(mixReducer(playingA, { type: 'complete' })).toBe(playingA);
  });

  it('cancel keeps whichever deck is louder', () => {
    const t = mixReducer(playingA, { type: 'startTransition' });
    const early = mixReducer(t, { type: 'progress', progress: 0.3 });
    const late = mixReducer(t, { type: 'progress', progress: 0.7 });
    expect(mixReducer(early, { type: 'cancel' })).toEqual({ kind: 'playing', active: 'A' });
    expect(mixReducer(late, { type: 'cancel' })).toEqual({ kind: 'playing', active: 'B' });
  });

  it('stop returns to idle from anywhere', () => {
    const t = mixReducer(playingA, { type: 'startTransition' });
    expect(mixReducer(t, { type: 'stop' })).toEqual({ kind: 'idle' });
    expect(mixReducer(playingA, { type: 'stop' })).toEqual({ kind: 'idle' });
  });
});

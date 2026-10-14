import { describe, expect, it } from 'vitest';
import { initialSession, sessionReducer, type SessionState } from './session';

const [V1, V2, V3, V4] = ['dQw4w9WgXcQ', '9bZkp7q19f0', 'kJQP7kiw5Fk', 'JGwWNGJdvx8'];

const view = (s: SessionState) => ({
  A: s.decks.A?.videoId ?? null,
  B: s.decks.B?.videoId ?? null,
  queue: s.queue.items.map((i) => i.videoId),
});

const add = (s: SessionState, text: string) => sessionReducer(s, { type: 'add', text });

describe('sessionReducer', () => {
  it('starts with empty decks and queue', () => {
    expect(view(initialSession)).toEqual({ A: null, B: null, queue: [] });
  });

  it('cues the first item into A, the second into B, the rest wait in the queue', () => {
    const s = add(initialSession, `${V1}\n${V2}\n${V3}`);
    expect(view(s)).toEqual({ A: V1, B: V2, queue: [V3] });
  });

  it('fills B when a second song arrives later', () => {
    let s = add(initialSession, V1);
    expect(view(s)).toEqual({ A: V1, B: null, queue: [] });
    s = add(s, V2);
    expect(view(s)).toEqual({ A: V1, B: V2, queue: [] });
  });

  it('advance puts the next queue item on that deck', () => {
    let s = add(initialSession, `${V1}\n${V2}\n${V3}\n${V4}`);
    s = sessionReducer(s, { type: 'advance', deck: 'A' });
    expect(view(s)).toEqual({ A: V3, B: V2, queue: [V4] });
    s = sessionReducer(s, { type: 'advance', deck: 'B' });
    expect(view(s)).toEqual({ A: V3, B: V4, queue: [] });
  });

  it('advance on an empty queue empties the deck, and the next add refills it', () => {
    let s = add(initialSession, `${V1}\n${V2}`);
    s = sessionReducer(s, { type: 'advance', deck: 'A' });
    expect(view(s)).toEqual({ A: null, B: V2, queue: [] });
    s = add(s, V3);
    expect(view(s)).toEqual({ A: V3, B: V2, queue: [] });
  });

  it('gives a new uid when the same video comes round again (so the deck re-cues)', () => {
    let s = add(initialSession, `${V1}\n${V2}\n${V1}`);
    const firstUid = s.decks.A!.uid;
    s = sessionReducer(s, { type: 'advance', deck: 'A' });
    expect(s.decks.A!.videoId).toBe(V1);
    expect(s.decks.A!.uid).not.toBe(firstUid);
  });

  it('remove and clear touch only the queue, never the decks', () => {
    let s = add(initialSession, `${V1}\n${V2}\n${V3}\n${V4}`);
    s = sessionReducer(s, { type: 'remove', uid: s.queue.items[0].uid });
    expect(view(s)).toEqual({ A: V1, B: V2, queue: [V4] });
    s = sessionReducer(s, { type: 'clear' });
    expect(view(s)).toEqual({ A: V1, B: V2, queue: [] });
  });

  it('keeps rejected tokens from the last add', () => {
    const s = add(initialSession, `${V1}\nnope`);
    expect(s.queue.rejected).toEqual(['nope']);
  });
});

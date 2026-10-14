import { describe, expect, it } from 'vitest';
import { initialQueue, queueReducer, type QueueState } from './queue';

const A = 'dQw4w9WgXcQ';
const B = '9bZkp7q19f0';
const C = 'kJQP7kiw5Fk';

const ids = (s: QueueState) => s.items.map((i) => i.videoId);

describe('queueReducer', () => {
  it('adds a single link', () => {
    const s = queueReducer(initialQueue, { type: 'add', text: `https://youtu.be/${A}` });
    expect(ids(s)).toEqual([A]);
    expect(s.rejected).toEqual([]);
  });

  it('adds a multi-line paste in order and reports bad lines', () => {
    const text = `https://youtu.be/${A}\n\n  not a link \r\nhttps://www.youtube.com/watch?v=${B}&t=3\n${C}`;
    const s = queueReducer(initialQueue, { type: 'add', text });
    expect(ids(s)).toEqual([A, B, C]);
    expect(s.rejected).toEqual(['not a link']);
  });

  it('accepts space- or comma-separated links on one line', () => {
    const s = queueReducer(initialQueue, { type: 'add', text: `${A} ${B}, ${C}` });
    expect(ids(s)).toEqual([A, B, C]);
  });

  it('gives every item a unique uid, including duplicates', () => {
    let s = queueReducer(initialQueue, { type: 'add', text: A });
    s = queueReducer(s, { type: 'add', text: A });
    expect(ids(s)).toEqual([A, A]);
    expect(new Set(s.items.map((i) => i.uid)).size).toBe(2);
  });

  it('removes by uid', () => {
    let s = queueReducer(initialQueue, { type: 'add', text: `${A}\n${B}\n${C}` });
    s = queueReducer(s, { type: 'remove', uid: s.items[1].uid });
    expect(ids(s)).toEqual([A, C]);
  });

  it('pullNext drops the head and is a no-op when empty', () => {
    let s = queueReducer(initialQueue, { type: 'add', text: `${A}\n${B}` });
    s = queueReducer(s, { type: 'pullNext' });
    expect(ids(s)).toEqual([B]);
    s = queueReducer(s, { type: 'pullNext' });
    s = queueReducer(s, { type: 'pullNext' });
    expect(ids(s)).toEqual([]);
  });

  it('clear empties the list but keeps uids unique afterwards', () => {
    let s = queueReducer(initialQueue, { type: 'add', text: A });
    const firstUid = s.items[0].uid;
    s = queueReducer(s, { type: 'clear' });
    expect(s.items).toEqual([]);
    s = queueReducer(s, { type: 'add', text: A });
    expect(s.items[0].uid).not.toBe(firstUid);
  });

  it('does not mutate the previous state', () => {
    const s1 = queueReducer(initialQueue, { type: 'add', text: A });
    const snapshot = JSON.stringify(s1);
    queueReducer(s1, { type: 'add', text: B });
    queueReducer(s1, { type: 'pullNext' });
    expect(JSON.stringify(s1)).toBe(snapshot);
  });
});

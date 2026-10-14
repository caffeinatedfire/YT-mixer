import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, loadSession, loadSettings, saveSession, saveSettings } from './storage';
import { initialSession, sessionReducer } from '../state/session';

class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
}

class BrokenStorage {
  getItem(): string | null { throw new Error('SecurityError'); }
  setItem() { throw new Error('QuotaExceededError'); }
}

const V1 = 'dQw4w9WgXcQ';
const V2 = '9bZkp7q19f0';
const V3 = 'kJQP7kiw5Fk';

describe('session persistence', () => {
  it('round-trips decks and queue', () => {
    const store = new MemoryStorage();
    const s = sessionReducer(initialSession, { type: 'add', text: `${V1}\n${V2}\n${V3}` });
    saveSession(s, store);
    const loaded = loadSession(store);
    expect(loaded.decks).toEqual(s.decks);
    expect(loaded.queue.items).toEqual(s.queue.items);
    expect(loaded.queue.rejected).toEqual([]);
  });

  it('keeps uids unique after a reload', () => {
    const store = new MemoryStorage();
    saveSession(sessionReducer(initialSession, { type: 'add', text: `${V1}\n${V2}\n${V3}` }), store);
    const next = sessionReducer(loadSession(store), { type: 'add', text: V1 });
    const uids = [next.decks.A!.uid, next.decks.B!.uid, ...next.queue.items.map((i) => i.uid)];
    expect(new Set(uids).size).toBe(uids.length);
  });

  it('falls back to an empty session for missing, corrupt or wrong-shaped data', () => {
    const store = new MemoryStorage();
    expect(loadSession(store)).toEqual(initialSession);
    store.setItem('ytmixer.session.v1', '{not json');
    expect(loadSession(store)).toEqual(initialSession);
    store.setItem('ytmixer.session.v1', JSON.stringify({ decks: 5, queue: 'x' }));
    expect(loadSession(store)).toEqual(initialSession);
  });

  it('drops individual bad items but keeps good ones', () => {
    const store = new MemoryStorage();
    store.setItem(
      'ytmixer.session.v1',
      JSON.stringify({
        decks: { A: { uid: 1, videoId: V1 }, B: { uid: 'x', videoId: V2 } },
        queue: [{ uid: 3, videoId: 'bad' }, { uid: 4, videoId: V3 }, null],
      }),
    );
    const s = loadSession(store);
    expect(s.decks.A).toEqual({ uid: 1, videoId: V1 });
    expect(s.decks.B).toBeNull();
    expect(s.queue.items).toEqual([{ uid: 4, videoId: V3 }]);
    expect(s.queue.nextUid).toBe(5);
  });

  it('never throws when storage is blocked', () => {
    const store = new BrokenStorage();
    expect(loadSession(store)).toEqual(initialSession);
    expect(() => saveSession(initialSession, store)).not.toThrow();
    expect(loadSettings(store)).toEqual(DEFAULT_SETTINGS);
    expect(() => saveSettings(DEFAULT_SETTINGS, store)).not.toThrow();
  });

  it('never throws when storage is unavailable', () => {
    expect(loadSession(undefined)).toEqual(initialSession);
    expect(loadSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });
});

describe('settings persistence', () => {
  it('round-trips settings', () => {
    const store = new MemoryStorage();
    const settings = { trimA: 80, trimB: 65, fadeSeconds: 10, leadSeconds: 12, autopilot: true };
    saveSettings(settings, store);
    expect(loadSettings(store)).toEqual(settings);
  });

  it('replaces out-of-range or unknown values with defaults, field by field', () => {
    const store = new MemoryStorage();
    store.setItem(
      'ytmixer.settings.v1',
      JSON.stringify({ trimA: 500, trimB: 40, fadeSeconds: 7, leadSeconds: 'x', autopilot: 'yes' }),
    );
    expect(loadSettings(store)).toEqual({ ...DEFAULT_SETTINGS, trimB: 40 });
  });
});

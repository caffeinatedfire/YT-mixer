import { DEFAULT_FADE_SECONDS, DEFAULT_LEAD_SECONDS, FADE_OPTIONS_SECONDS, LEAD_OPTIONS_SECONDS } from './config';
import { isVideoId } from './youtube';
import { initialSession, type SessionState } from '../state/session';
import type { QueueItem } from '../state/queue';

/** The subset of Storage we use; lets tests pass an in-memory or throwing store. */
type KV = Pick<Storage, 'getItem' | 'setItem'>;

const SESSION_KEY = 'ytmixer.session.v1';
const SETTINGS_KEY = 'ytmixer.settings.v1';

export interface Settings {
  trimA: number;
  trimB: number;
  fadeSeconds: number;
  leadSeconds: number;
  autopilot: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  trimA: 100,
  trimB: 100,
  fadeSeconds: DEFAULT_FADE_SECONDS,
  leadSeconds: DEFAULT_LEAD_SECONDS,
  autopilot: false,
};

function defaultStore(): KV | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

// Storage can be missing, blocked (private mode, site data off) or full. Never let that break the app.
function read(key: string, store: KV | undefined): unknown {
  try {
    const raw = store?.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function write(key: string, value: unknown, store: KV | undefined) {
  try {
    store?.setItem(key, JSON.stringify(value));
  } catch {
    // Not fatal: the app just won't remember this change.
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function toItem(v: unknown): QueueItem | null {
  if (!isObject(v) || !Number.isInteger(v.uid) || typeof v.videoId !== 'string' || !isVideoId(v.videoId)) return null;
  return { uid: v.uid as number, videoId: v.videoId };
}

export function loadSession(store: KV | undefined = defaultStore()): SessionState {
  const data = read(SESSION_KEY, store);
  if (!isObject(data) || !isObject(data.decks) || !Array.isArray(data.queue)) return initialSession;

  const decks = { A: toItem(data.decks.A), B: toItem(data.decks.B) };
  const items = data.queue.map(toItem).filter((i): i is QueueItem => i !== null);
  const uids = [decks.A?.uid ?? 0, decks.B?.uid ?? 0, ...items.map((i) => i.uid)];
  return { decks, queue: { items, nextUid: Math.max(...uids) + 1, rejected: [] } };
}

export function saveSession(s: SessionState, store: KV | undefined = defaultStore()) {
  write(SESSION_KEY, { decks: s.decks, queue: s.queue.items }, store);
}

const inRange = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

export function loadSettings(store: KV | undefined = defaultStore()): Settings {
  const d = read(SETTINGS_KEY, store);
  if (!isObject(d)) return DEFAULT_SETTINGS;
  const pick = <K extends keyof Settings>(key: K, ok: (v: unknown) => boolean): Settings[K] =>
    ok(d[key]) ? (d[key] as Settings[K]) : DEFAULT_SETTINGS[key];
  return {
    trimA: pick('trimA', (v) => inRange(v, 0, 100)),
    trimB: pick('trimB', (v) => inRange(v, 0, 100)),
    fadeSeconds: pick('fadeSeconds', (v) => FADE_OPTIONS_SECONDS.includes(v as number)),
    leadSeconds: pick('leadSeconds', (v) => LEAD_OPTIONS_SECONDS.includes(v as number)),
    autopilot: pick('autopilot', (v) => typeof v === 'boolean'),
  };
}

export function saveSettings(s: Settings, store: KV | undefined = defaultStore()) {
  write(SETTINGS_KEY, s, store);
}

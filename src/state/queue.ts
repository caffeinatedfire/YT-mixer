import { parseYouTubeId } from '../lib/youtube';

export interface QueueItem {
  uid: number;
  videoId: string;
}

export interface QueueState {
  items: QueueItem[];
  nextUid: number;
  /** Tokens from the last add that were not valid links or ids. */
  rejected: string[];
}

export type QueueAction =
  | { type: 'add'; text: string }
  | { type: 'remove'; uid: number }
  | { type: 'pullNext' }
  | { type: 'clear' };

export const initialQueue: QueueState = { items: [], nextUid: 1, rejected: [] };

/** Splits a paste into candidate tokens: one per line, and also on spaces or commas within a line. */
function tokenize(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const parts = line.split(/[\s,]+/).filter(Boolean);
      // Keep a line whole when splitting it yields nothing usable, so the error shows what was pasted.
      return parts.some((p) => parseYouTubeId(p)) ? parts : [line];
    });
}

export function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case 'add': {
      const added: QueueItem[] = [];
      const rejected: string[] = [];
      let uid = state.nextUid;
      for (const token of tokenize(action.text)) {
        const videoId = parseYouTubeId(token);
        if (videoId) added.push({ uid: uid++, videoId });
        else rejected.push(token);
      }
      return { items: [...state.items, ...added], nextUid: uid, rejected };
    }
    case 'remove':
      return { ...state, items: state.items.filter((i) => i.uid !== action.uid) };
    case 'pullNext':
      return state.items.length ? { ...state, items: state.items.slice(1) } : state;
    case 'clear':
      return { ...state, items: [], rejected: [] };
  }
}

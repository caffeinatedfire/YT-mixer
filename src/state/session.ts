import type { Deck } from './mix';
import { initialQueue, queueReducer, type QueueAction, type QueueItem, type QueueState } from './queue';

/** The shared queue plus the item currently loaded on each deck. */
export interface SessionState {
  queue: QueueState;
  decks: Record<Deck, QueueItem | null>;
}

export type SessionAction =
  | QueueAction
  /** Replace the deck's item with the next queue item (or empty it). Used after a mix and on errors. */
  | { type: 'advance'; deck: Deck };

export const initialSession: SessionState = { queue: initialQueue, decks: { A: null, B: null } };

const DECKS: Deck[] = ['A', 'B'];

function takeNext(s: SessionState, deck: Deck): SessionState {
  const next = s.queue.items[0] ?? null;
  return {
    queue: next ? queueReducer(s.queue, { type: 'pullNext' }) : s.queue,
    decks: { ...s.decks, [deck]: next },
  };
}

/** Any empty deck takes the next queue item, A before B. */
function fillEmptyDecks(s: SessionState): SessionState {
  let out = s;
  for (const deck of DECKS) {
    if (!out.decks[deck] && out.queue.items.length) out = takeNext(out, deck);
  }
  return out;
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  if (action.type === 'advance') return fillEmptyDecks(takeNext(state, action.deck));
  return fillEmptyDecks({ ...state, queue: queueReducer(state.queue, action) });
}

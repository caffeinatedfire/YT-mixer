import type { Deck } from '../state/mix';
import type { QueueItem } from '../state/queue';

/** A deck that was playing when the host pressed Pause all, and the song it was playing. */
export interface RememberedDeck {
  deck: Deck;
  uid: number;
}

/**
 * Which decks Play all should start. Resumes exactly the remembered decks, but only if they still
 * hold the same song, so a cued deck is never started silently. With nothing to resume, plays
 * the deck the crossfader favours.
 */
export function decksToResume(
  remembered: RememberedDeck[] | null,
  decks: Record<Deck, QueueItem | null>,
  favoured: Deck,
): Deck[] {
  const resumable = (remembered ?? []).filter((r) => decks[r.deck]?.uid === r.uid).map((r) => r.deck);
  if (resumable.length) return resumable;
  return decks[favoured] ? [favoured] : [];
}

export const NUDGE_STEP = 0.05;

/** Crossfader position after an arrow-key nudge (direction -1 = towards A, +1 = towards B). */
export function nudge(x: number, direction: -1 | 1): number {
  return Math.min(1, Math.max(0, Math.round((x + direction * NUDGE_STEP) * 100) / 100));
}

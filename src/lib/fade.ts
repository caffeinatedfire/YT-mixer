import type { Deck } from '../state/mix';

/** Crossfader position for a fade from startX to targetX, given elapsed time. Clamped to the end. */
export function rampX(startX: number, targetX: number, elapsedMs: number, durationMs: number) {
  const progress = durationMs <= 0 ? 1 : Math.min(1, Math.max(0, elapsedMs / durationMs));
  return { x: startX + (targetX - startX) * progress, progress };
}

/** The deck the crossfader currently favours. At exactly 0.5 we call it B. */
export const outgoingDeck = (x: number): Deck => (x < 0.5 ? 'A' : 'B');

/** Crossfader position where the deck plays alone. */
export const deckEnd = (deck: Deck): number => (deck === 'A' ? 0 : 1);

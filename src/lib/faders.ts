import { gains } from './gains';
import type { Deck } from '../state/mix';

/** Per-deck fader level, 0..1. Final player volume = round(level * trim). */
export type Levels = Record<Deck, number>;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const HALF_PI = Math.PI / 2;

/** Linked mode: both levels follow the equal-power crossfader. */
export function linkedLevels(x: number): Levels {
  const g = gains(x);
  return { A: g.a, B: g.b };
}

/** Linked mode: crossfader position that gives `deck` this level (dragging one vertical fader). */
export function xFromLevel(deck: Deck, level: number): number {
  const l = clamp01(level);
  return deck === 'A' ? Math.acos(l) / HALF_PI : Math.asin(l) / HALF_PI;
}

/**
 * Re-linking: the crossfader position with the same A/B balance as the independent levels.
 * Overall loudness can change; with both decks silent the crossfader stays where it was.
 */
export function xFromLevels(levels: Levels, previousX: number): number {
  const a = clamp01(levels.A);
  const b = clamp01(levels.B);
  if (a === 0 && b === 0) return previousX;
  return Math.atan2(b, a) / HALF_PI;
}

/** The deck the mix treats as "playing": the louder one, A on a tie. */
export const activeDeck = (levels: Levels): Deck => (levels.B > levels.A ? 'B' : 'A');

/**
 * Unlinked-mode fade: the outgoing deck falls from its level to 0 and the incoming deck rises
 * from its level to full, both on equal-power curves.
 */
export function unlinkedRamp(start: Levels, from: Deck, progress: number): Levels {
  const t = clamp01(progress);
  const to: Deck = from === 'A' ? 'B' : 'A';
  return {
    [from]: start[from] * Math.cos(t * HALF_PI),
    [to]: start[to] + (1 - start[to]) * Math.sin(t * HALF_PI),
  } as Levels;
}

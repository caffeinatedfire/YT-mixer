import type { PlayerStateName } from './ytApi';

export interface AutopilotInput {
  enabled: boolean;
  mixing: boolean;
  activeState: PlayerStateName;
  /** Queue uid of the song on the active deck. */
  activeUid: number | null;
  /** uid we already auto-mixed out of, so each track triggers once. */
  triggeredUid: number | null;
  time: number;
  duration: number;
  leadSeconds: number;
  incomingHasSong: boolean;
}

export type AutopilotDecision = 'none' | 'mix' | 'hardCut';

export function autopilotDecision(i: AutopilotInput): AutopilotDecision {
  if (!i.enabled || i.mixing || i.activeUid === null || !i.incomingHasSong) return 'none';
  // Fallback: the song ran out without a mix (cancelled, blocked incoming, very short track).
  if (i.activeState === 'ended') return 'hardCut';
  if (i.activeState !== 'playing' || i.triggeredUid === i.activeUid) return 'none';
  if (i.duration <= 0) return 'none';
  return i.duration - i.time <= i.leadSeconds ? 'mix' : 'none';
}

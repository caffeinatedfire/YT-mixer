import { useEffect, useRef } from 'react';
import { autopilotDecision } from '../lib/autopilot';
import { AUTOPILOT_POLL_MS } from '../lib/config';
import { outgoingDeck } from '../lib/fade';
import { otherDeck, type Deck, type MixState } from '../state/mix';
import type { QueueItem } from '../state/queue';
import type { YouTubePlayerApi } from './useYouTubePlayer';

interface Options {
  enabled: boolean;
  leadSeconds: number;
  players: Record<Deck, YouTubePlayerApi>;
  decks: Record<Deck, QueueItem | null>;
  x: number;
  mix: MixState;
  onMix: () => void;
  onHardCut: (from: Deck) => void;
}

/** Polls the active deck and starts a mix leadSeconds before its end, once per track. */
export function useAutopilot(opts: Options) {
  const latest = useRef(opts);
  latest.current = opts;
  const triggeredUidRef = useRef<number | null>(null);

  useEffect(() => {
    if (!opts.enabled) return;
    const id = setInterval(() => {
      const { enabled, leadSeconds, players, decks, x, mix, onMix, onHardCut } = latest.current;
      const active = outgoingDeck(x);
      const incoming = otherDeck(active);
      const player = players[active];
      const decision = autopilotDecision({
        enabled,
        mixing: mix.kind === 'transitioning',
        activeState: player.state,
        activeUid: decks[active]?.uid ?? null,
        triggeredUid: triggeredUidRef.current,
        time: player.getTime(),
        duration: player.getDuration(),
        leadSeconds,
        incomingHasSong: !!decks[incoming] && players[incoming].error === null,
      });
      if (decision === 'mix') {
        triggeredUidRef.current = decks[active]!.uid;
        onMix();
      } else if (decision === 'hardCut') {
        onHardCut(active);
      }
    }, AUTOPILOT_POLL_MS);
    return () => clearInterval(id);
  }, [opts.enabled]);
}

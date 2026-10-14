import { FADE_OPTIONS_SECONDS } from '../lib/config';
import type { Deck, MixState } from '../state/mix';

interface Props {
  mix: MixState;
  incoming: Deck;
  /** Incoming deck has a song loaded and its player is ready. */
  incomingReady: boolean;
  incomingLive: boolean;
  /** When false, Mix now waits for the host to start the incoming deck and check it (no blind fades). */
  blindMixAllowed: boolean;
  fadeSeconds: number;
  onFadeSeconds: (s: number) => void;
  onStartIncoming: () => void;
  onMixNow: () => void;
}

export function MixControls({
  mix, incoming, incomingReady, incomingLive, blindMixAllowed,
  fadeSeconds, onFadeSeconds, onStartIncoming, onMixNow,
}: Props) {
  const mixing = mix.kind === 'transitioning';
  const canMix = !mixing && incomingReady && (incomingLive || blindMixAllowed);

  let status: string;
  if (mixing) status = `Mixing into ${mix.to}… ${Math.round(mix.progress * 100)}%`;
  else if (!incomingReady) status = `Deck ${incoming} needs a song to mix into.`;
  else if (incomingLive) status = `${incoming} is playing underneath. Mix when the song is on, not an ad.`;
  else if (blindMixAllowed) status = `Next up: deck ${incoming}.`;
  else status = `Start ${incoming}, check the song is on (not an ad), then mix.`;

  return (
    <div className="mix-controls">
      <p className="mix-controls__status" role="status">{status}</p>
      <label className="mix-controls__fade">
        Fade
        <select value={fadeSeconds} onChange={(e) => onFadeSeconds(Number(e.target.value))} disabled={mixing}>
          {FADE_OPTIONS_SECONDS.map((s) => (
            <option key={s} value={s}>{s}s</option>
          ))}
        </select>
      </label>
      {!blindMixAllowed && (
        <button className="btn" onClick={onStartIncoming} disabled={mixing || !incomingReady || incomingLive}>
          Start {incoming}
        </button>
      )}
      <button className="btn btn--primary" onClick={onMixNow} disabled={!canMix}>
        {mixing ? 'Mixing…' : `Mix now to ${incoming}`}
      </button>
    </div>
  );
}

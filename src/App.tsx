import { useCallback, useEffect, useReducer, useState } from 'react';
import { AddBar } from './components/AddBar';
import { Deck, ERROR_MESSAGE } from './components/Deck';
import { MixControls } from './components/MixControls';
import { Mixer } from './components/Mixer';
import { Queue } from './components/Queue';
import { Toast, type ToastMessage } from './components/Toast';
import { useDeckLoader } from './hooks/useDeckLoader';
import { useAutopilot } from './hooks/useAutopilot';
import { useTransitionEngine } from './hooks/useTransitionEngine';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { AD_SIGNAL_RELIABLE, DEFAULT_FADE_SECONDS, DEFAULT_LEAD_SECONDS } from './lib/config';
import { deckEnd, outgoingDeck } from './lib/fade';
import { deckVolume, gains } from './lib/gains';
import { initialSession, sessionReducer } from './state/session';
import { otherDeck, type Deck as DeckId } from './state/mix';

export default function App() {
  const [session, dispatch] = useReducer(sessionReducer, initialSession);
  const { queue, decks } = session;
  const playerA = useYouTubePlayer();
  const playerB = useYouTubePlayer();
  const [trim, setTrim] = useState<Record<DeckId, number>>({ A: 100, B: 100 });
  const [x, setX] = useState(0);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string) => setToast({ id: Date.now(), text }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  // A playback error skips that deck to the next queue item (cued, paused).
  const skip = (deck: DeckId) => {
    showToast(ERROR_MESSAGE);
    dispatch({ type: 'advance', deck });
  };
  useDeckLoader(playerA, decks.A, () => skip('A'));
  useDeckLoader(playerB, decks.B, () => skip('B'));

  const g = gains(x);
  const { setVolume: setVolA } = playerA;
  const { setVolume: setVolB } = playerB;

  // Apply crossfader x trim to both players whenever either changes.
  useEffect(() => {
    setVolA(deckVolume(g.a, trim.A));
    setVolB(deckVolume(g.b, trim.B));
  }, [g.a, g.b, trim.A, trim.B, setVolA, setVolB]);

  const players = { A: playerA, B: playerB };
  const [fadeSeconds, setFadeSeconds] = useState(DEFAULT_FADE_SECONDS);
  const engine = useTransitionEngine({
    players,
    x,
    setX,
    fadeMs: fadeSeconds * 1000,
    // The outgoing deck is paused; load the next queue item onto it.
    onMixed: (from) => dispatch({ type: 'advance', deck: from }),
  });
  const { mix } = engine;
  const incoming = mix.kind === 'transitioning' ? mix.to : otherDeck(outgoingDeck(x));

  const [autopilot, setAutopilot] = useState(false);
  const [leadSeconds, setLeadSeconds] = useState(DEFAULT_LEAD_SECONDS);
  useAutopilot({
    enabled: autopilot,
    leadSeconds,
    players,
    decks,
    x,
    mix,
    onMix: engine.start,
    // The active song ended without a mix: jump straight to the other deck.
    onHardCut: (from) => {
      const to = otherDeck(from);
      setX(deckEnd(to));
      players[to].play();
      dispatch({ type: 'advance', deck: from });
    },
  });

  // Dragging the crossfader mid-fade hands control back to the host.
  const onCrossfader = (v: number) => {
    if (mix.kind === 'transitioning') engine.cancel();
    setX(v);
  };

  const isLive = (s: string) => s === 'playing' || s === 'buffering';
  const anyPlaying = isLive(playerA.state) || isLive(playerB.state);

  const playPauseAll = () => {
    if (anyPlaying) {
      playerA.pause();
      playerB.pause();
    } else {
      if (decks.A) playerA.play();
      if (decks.B) playerB.play();
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    for (const p of [playerA, playerB]) (next ? p.mute : p.unMute)();
  };

  return (
    <div className="app">
      <AddBar onAdd={(text) => dispatch({ type: 'add', text })} rejected={queue.rejected} />

      {/* Decks and mixer on the left (70%), queue on the right (30%). */}
      <div className="workspace">
        <div className="workspace__main">
          <div className="decks">
            <Deck id="A" player={playerA} item={decks.A} trim={trim.A} onTrim={(v) => setTrim((t) => ({ ...t, A: v }))} gain={g.a} />
            <Deck id="B" player={playerB} item={decks.B} trim={trim.B} onTrim={(v) => setTrim((t) => ({ ...t, B: v }))} gain={g.b} />
          </div>

          <Mixer x={x} onX={onCrossfader} anyPlaying={anyPlaying} onPlayPauseAll={playPauseAll} muted={muted} onMuteAll={toggleMute}>
            <MixControls
              mix={mix}
              incoming={incoming}
              incomingReady={!!decks[incoming] && players[incoming].ready && players[incoming].error === null}
              incomingLive={isLive(players[incoming].state)}
              blindMixAllowed={AD_SIGNAL_RELIABLE}
              fadeSeconds={fadeSeconds}
              onFadeSeconds={setFadeSeconds}
              autopilot={autopilot}
              onAutopilot={setAutopilot}
              leadSeconds={leadSeconds}
              onLeadSeconds={setLeadSeconds}
              onStartIncoming={players[incoming].play}
              onMixNow={engine.start}
            />
          </Mixer>
        </div>

        <Queue
          items={queue.items}
          onRemove={(uid) => dispatch({ type: 'remove', uid })}
          onClear={() => dispatch({ type: 'clear' })}
        />
      </div>

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

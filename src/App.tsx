import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AddBar } from './components/AddBar';
import { Deck, ERROR_MESSAGE, PLAYER_LOAD_ERROR } from './components/Deck';
import { MixControls } from './components/MixControls';
import { Mixer } from './components/Mixer';
import { Queue } from './components/Queue';
import { Toast, type ToastMessage } from './components/Toast';
import { useDeckLoader } from './hooks/useDeckLoader';
import { useAutopilot } from './hooks/useAutopilot';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTransitionEngine } from './hooks/useTransitionEngine';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { AD_SIGNAL_RELIABLE } from './lib/config';
import { loadSession, loadSettings, saveSession, saveSettings } from './lib/storage';
import { deckEnd, outgoingDeck } from './lib/fade';
import { deckVolume, gains } from './lib/gains';
import { decksToResume, nudge, type RememberedDeck } from './lib/master';
import { sessionReducer } from './state/session';
import { otherDeck, type Deck as DeckId } from './state/mix';

const DECKS: DeckId[] = ['A', 'B'];

const IS_IOS =
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export default function App() {
  const [session, dispatch] = useReducer(sessionReducer, undefined, () => loadSession());
  const { queue, decks } = session;
  const [saved] = useState(loadSettings);
  const playerA = useYouTubePlayer();
  const playerB = useYouTubePlayer();
  const [trim, setTrim] = useState<Record<DeckId, number>>({ A: saved.trimA, B: saved.trimB });
  const [x, setX] = useState(0);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string) => setToast({ id: Date.now(), text }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  // A playback error skips that deck to the next queue item (cued, paused).
  // -1 means the YouTube script itself failed to load: skipping would just burn through the queue.
  const onDeckError = (deck: DeckId, code: number) => {
    if (code === -1) {
      showToast(PLAYER_LOAD_ERROR);
      return;
    }
    showToast(ERROR_MESSAGE);
    dispatch({ type: 'advance', deck });
  };
  useDeckLoader(playerA, decks.A, (code) => onDeckError('A', code));
  useDeckLoader(playerB, decks.B, (code) => onDeckError('B', code));

  useEffect(() => saveSession(session), [session]);

  const g = gains(x);
  const { setVolume: setVolA } = playerA;
  const { setVolume: setVolB } = playerB;

  // Apply crossfader x trim to both players whenever either changes.
  useEffect(() => {
    setVolA(deckVolume(g.a, trim.A));
    setVolB(deckVolume(g.b, trim.B));
  }, [g.a, g.b, trim.A, trim.B, setVolA, setVolB]);

  const players = { A: playerA, B: playerB };
  const [fadeSeconds, setFadeSeconds] = useState(saved.fadeSeconds);
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

  const [autopilot, setAutopilot] = useState(saved.autopilot);
  const [leadSeconds, setLeadSeconds] = useState(saved.leadSeconds);

  useEffect(() => {
    saveSettings({ trimA: trim.A, trimB: trim.B, fadeSeconds, leadSeconds, autopilot });
  }, [trim.A, trim.B, fadeSeconds, leadSeconds, autopilot]);
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

  // Decks that were playing at the last Pause all, so Play all resumes exactly those.
  const rememberedRef = useRef<RememberedDeck[] | null>(null);

  const playPauseAll = () => {
    if (anyPlaying) {
      rememberedRef.current = DECKS.filter((d) => isLive(players[d].state) && decks[d]).map((d) => ({
        deck: d,
        uid: decks[d]!.uid,
      }));
      // A fade can't sensibly continue while paused; leave the crossfader where it is.
      if (mix.kind === 'transitioning') engine.cancel();
      playerA.pause();
      playerB.pause();
    } else {
      for (const d of decksToResume(rememberedRef.current, decks, outgoingDeck(x))) players[d].play();
      rememberedRef.current = null;
    }
  };

  // YouTube's mute is separate from volume, so each deck keeps its crossfader x trim level.
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    for (const p of [playerA, playerB]) (next ? p.mute : p.unMute)();
  };

  useKeyboardShortcuts({
    onPlayPause: playPauseAll,
    onMute: toggleMute,
    onNudge: (dir) => {
      if (mix.kind === 'transitioning') engine.cancel();
      setX((prev) => nudge(prev, dir));
    },
  });

  return (
    <div className="app">
      <AddBar onAdd={(text) => dispatch({ type: 'add', text })} rejected={queue.rejected} />
      {IS_IOS && (
        <p className="notice">On iPhone and iPad, YouTube ignores volume changes, so the crossfader and trims won't work. Use a laptop.</p>
      )}

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

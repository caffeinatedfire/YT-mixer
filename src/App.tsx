import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AddBar } from './components/AddBar';
import { Deck, ERROR_MESSAGE, PLAYER_LOAD_ERROR } from './components/Deck';
import { Faders } from './components/Faders';
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
import { activeDeck, linkedLevels, xFromLevel, xFromLevels, type Levels } from './lib/faders';
import { deckVolume } from './lib/gains';
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

  // Linked: both fader levels follow the crossfader. Unlinked: each deck has its own level.
  const [linked, setLinked] = useState(saved.linked);
  const [unlinkedLevels, setUnlinkedLevels] = useState<Levels>(() => linkedLevels(0));
  const levels = linked ? linkedLevels(x) : unlinkedLevels;
  const active: DeckId = linked ? outgoingDeck(x) : activeDeck(unlinkedLevels);

  const { setVolume: setVolA } = playerA;
  const { setVolume: setVolB } = playerB;

  // Apply fader level x trim to both players whenever either changes.
  useEffect(() => {
    setVolA(deckVolume(levels.A, trim.A));
    setVolB(deckVolume(levels.B, trim.B));
  }, [levels.A, levels.B, trim.A, trim.B, setVolA, setVolB]);

  const players = { A: playerA, B: playerB };
  const [fadeSeconds, setFadeSeconds] = useState(saved.fadeSeconds);
  const engine = useTransitionEngine({
    players,
    active,
    linked,
    x,
    setX,
    levels: unlinkedLevels,
    setLevels: setUnlinkedLevels,
    fadeMs: fadeSeconds * 1000,
    // The outgoing deck is paused; load the next queue item onto it.
    onMixed: (from) => dispatch({ type: 'advance', deck: from }),
  });
  const { mix } = engine;
  const incoming = mix.kind === 'transitioning' ? mix.to : otherDeck(active);

  const [autopilot, setAutopilot] = useState(saved.autopilot);
  const [leadSeconds, setLeadSeconds] = useState(saved.leadSeconds);

  useEffect(() => {
    saveSettings({ trimA: trim.A, trimB: trim.B, fadeSeconds, leadSeconds, autopilot, linked });
  }, [trim.A, trim.B, fadeSeconds, leadSeconds, autopilot, linked]);
  useAutopilot({
    enabled: autopilot,
    leadSeconds,
    players,
    decks,
    active,
    mix,
    onMix: engine.start,
    // The active song ended without a mix: jump straight to the other deck.
    onHardCut: (from) => {
      const to = otherDeck(from);
      if (linked) setX(deckEnd(to));
      else setUnlinkedLevels({ [from]: 0, [to]: 1 } as Levels);
      players[to].play();
      dispatch({ type: 'advance', deck: from });
    },
  });

  // Touching any fader mid-fade hands control back to the host.
  const cancelFade = () => {
    if (mix.kind === 'transitioning') engine.cancel();
  };
  const onCrossfader = (v: number) => {
    cancelFade();
    setX(v);
  };
  const onLevel = (deck: DeckId, v: number) => {
    cancelFade();
    if (linked) setX(xFromLevel(deck, v));
    else setUnlinkedLevels((l) => ({ ...l, [deck]: v }));
  };
  // Switching modes starts from what you hear: unlinking keeps both levels, re-linking keeps the A/B balance.
  const onLinked = (next: boolean) => {
    cancelFade();
    if (next) setX(xFromLevels(unlinkedLevels, x));
    else setUnlinkedLevels(linkedLevels(x));
    setLinked(next);
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
      for (const d of decksToResume(rememberedRef.current, decks, active)) players[d].play();
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
    // The crossfader only exists while linked.
    onNudge: (dir) => {
      if (!linked) return;
      cancelFade();
      setX((prev) => nudge(prev, dir));
    },
  });

  return (
    <div className="app">
      {IS_IOS && (
        <p className="notice">On iPhone and iPad, YouTube ignores volume changes, so the crossfader and trims won't work. Use a laptop.</p>
      )}

      {/* Decks and mixer on the left (70%), add bar + queue on the right (30%). */}
      <div className="workspace">
        <div className="workspace__main">
          <div className="decks">
            <Deck id="A" player={playerA} item={decks.A} trim={trim.A} onTrim={(v) => setTrim((t) => ({ ...t, A: v }))} />
            <Deck id="B" player={playerB} item={decks.B} trim={trim.B} onTrim={(v) => setTrim((t) => ({ ...t, B: v }))} />
          </div>

          <Mixer
            faders={<Faders levels={levels} linked={linked} onLinked={onLinked} onLevel={onLevel} x={x} onX={onCrossfader} />}
          >
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

        <aside className="workspace__side">
          <AddBar onAdd={(text) => dispatch({ type: 'add', text })} rejected={queue.rejected} />
          <Queue
            items={queue.items}
            onRemove={(uid) => dispatch({ type: 'remove', uid })}
            onClear={() => dispatch({ type: 'clear' })}
          />
        </aside>
      </div>

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

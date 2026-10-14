import { useCallback, useEffect, useReducer, useState } from 'react';
import { AddBar } from './components/AddBar';
import { Deck, ERROR_MESSAGE } from './components/Deck';
import { Mixer } from './components/Mixer';
import { Queue } from './components/Queue';
import { Toast, type ToastMessage } from './components/Toast';
import { useDeckLoader } from './hooks/useDeckLoader';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { deckVolume, gains } from './lib/gains';
import { initialSession, sessionReducer } from './state/session';
import type { Deck as DeckId } from './state/mix';

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

      <div className="decks">
        <Deck id="A" player={playerA} item={decks.A} trim={trim.A} onTrim={(v) => setTrim((t) => ({ ...t, A: v }))} gain={g.a} />
        <Deck id="B" player={playerB} item={decks.B} trim={trim.B} onTrim={(v) => setTrim((t) => ({ ...t, B: v }))} gain={g.b} />
      </div>

      <Mixer x={x} onX={setX} anyPlaying={anyPlaying} onPlayPauseAll={playPauseAll} muted={muted} onMuteAll={toggleMute} />

      <Queue
        items={queue.items}
        onRemove={(uid) => dispatch({ type: 'remove', uid })}
        onClear={() => dispatch({ type: 'clear' })}
      />

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

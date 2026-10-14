import { useEffect, useReducer, useState } from 'react';
import { AddBar } from './components/AddBar';
import { Deck } from './components/Deck';
import { Mixer } from './components/Mixer';
import { Queue } from './components/Queue';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { deckVolume, gains } from './lib/gains';
import { initialQueue, queueReducer, type QueueItem } from './state/queue';
import type { Deck as DeckId } from './state/mix';

export default function App() {
  const [queue, dispatchQueue] = useReducer(queueReducer, initialQueue);
  const playerA = useYouTubePlayer();
  const playerB = useYouTubePlayer();
  const [deckItems, setDeckItems] = useState<Record<DeckId, QueueItem | null>>({ A: null, B: null });
  const [trim, setTrim] = useState<Record<DeckId, number>>({ A: 100, B: 100 });
  const [x, setX] = useState(0);
  const [muted, setMuted] = useState(false);

  const g = gains(x);
  const { setVolume: setVolA } = playerA;
  const { setVolume: setVolB } = playerB;

  // Apply crossfader x trim to both players whenever either changes.
  useEffect(() => {
    setVolA(deckVolume(g.a, trim.A));
    setVolB(deckVolume(g.b, trim.B));
  }, [g.a, g.b, trim.A, trim.B, setVolA, setVolB]);

  const players = { A: playerA, B: playerB };

  const loadInto = (item: QueueItem, deck: DeckId) => {
    setDeckItems((d) => ({ ...d, [deck]: item }));
    players[deck].cue(item.videoId);
    dispatchQueue({ type: 'remove', uid: item.uid });
  };

  const isLive = (s: string) => s === 'playing' || s === 'buffering';
  const anyPlaying = isLive(playerA.state) || isLive(playerB.state);

  const playPauseAll = () => {
    if (anyPlaying) {
      playerA.pause();
      playerB.pause();
    } else {
      if (deckItems.A) playerA.play();
      if (deckItems.B) playerB.play();
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    for (const p of [playerA, playerB]) (next ? p.mute : p.unMute)();
  };

  return (
    <div className="app">
      <AddBar onAdd={(text) => dispatchQueue({ type: 'add', text })} rejected={queue.rejected} />

      <div className="decks">
        <Deck id="A" player={playerA} item={deckItems.A} trim={trim.A} onTrim={(v) => setTrim((t) => ({ ...t, A: v }))} gain={g.a} />
        <Deck id="B" player={playerB} item={deckItems.B} trim={trim.B} onTrim={(v) => setTrim((t) => ({ ...t, B: v }))} gain={g.b} />
      </div>

      <Mixer x={x} onX={setX} anyPlaying={anyPlaying} onPlayPauseAll={playPauseAll} muted={muted} onMuteAll={toggleMute} />

      <Queue
        items={queue.items}
        onRemove={(uid) => dispatchQueue({ type: 'remove', uid })}
        onClear={() => dispatchQueue({ type: 'clear' })}
        onLoad={loadInto}
      />
    </div>
  );
}

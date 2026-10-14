import { useEffect, useState } from 'react';
import type { YouTubePlayerApi } from '../hooks/useYouTubePlayer';
import type { QueueItem } from '../state/queue';
import type { Deck as DeckId } from '../state/mix';
import { thumbnailUrl } from '../lib/youtube';
import { PauseIcon, PlayIcon } from './Icons';

interface Props {
  id: DeckId;
  player: YouTubePlayerApi;
  item: QueueItem | null;
  trim: number;
  onTrim: (v: number) => void;
  /** Crossfader gain for this deck, 0..1 */
  gain: number;
}

export const ERROR_MESSAGE = "Can't play this one: blocked or unavailable";

function formatTime(s: number) {
  if (!Number.isFinite(s) || s <= 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const STATUS: Record<string, string> = {
  playing: 'Playing',
  paused: 'Paused',
  buffering: 'Buffering',
  cued: 'Ready',
  ended: 'Ended',
  loading: 'Loading',
  unstarted: 'Ready',
};

export function Deck({ id, player, item, trim, onTrim, gain }: Props) {
  const [time, setTime] = useState({ now: 0, dur: 0 });
  const { getTime, getDuration } = player;

  // setInterval rather than rAF so the time keeps updating in hidden tabs.
  useEffect(() => {
    const tick = () => setTime({ now: getTime(), dur: getDuration() });
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [getTime, getDuration]);

  const isPlaying = player.state === 'playing' || player.state === 'buffering';
  const pct = time.dur > 0 ? Math.min(100, (time.now / time.dur) * 100) : 0;
  const level = Math.round(gain * 100);

  return (
    <section className={`deck${isPlaying ? ' deck--live' : ''}`} aria-label={`Deck ${id}`}>
      <header className="deck__head">
        <span className="deck__badge">{id}</span>
        {item && <img className="deck__thumb" src={thumbnailUrl(item.videoId)} alt="" width={64} height={36} />}
        <div className="deck__meta">
          <div className="deck__title" title={player.title}>
            {item ? player.title || 'Loading…' : 'Add a song'}
          </div>
          <div className="deck__status">
            {player.error !== null ? (
              <span className="deck__error">{ERROR_MESSAGE}</span>
            ) : item ? (
              STATUS[player.state]
            ) : (
              'Empty'
            )}
          </div>
        </div>
      </header>

      <div className="deck__video">
        <div ref={player.containerRef} className="deck__frame" />
        {!item && <div className="deck__empty">Add a song to the queue</div>}
      </div>

      <div className="deck__time">
        <span>{formatTime(time.now)}</span>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
          <div className="progress__fill" style={{ width: `${pct}%` }} />
        </div>
        <span>{formatTime(time.dur)}</span>
      </div>

      <div className="deck__controls">
        <button
          className="btn btn--icon"
          onClick={isPlaying ? player.pause : player.play}
          disabled={!item || !player.ready}
          aria-label={isPlaying ? `Pause deck ${id}` : `Play deck ${id}`}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <label className="trim">
          <span className="trim__label">Trim</span>
          <input type="range" min={0} max={100} value={trim} onChange={(e) => onTrim(Number(e.target.value))} />
          <span className="trim__value">{trim}</span>
        </label>
        <div className="level" title="Output level after crossfader">
          <div className="level__fill" style={{ width: `${level}%` }} />
        </div>
      </div>
    </section>
  );
}

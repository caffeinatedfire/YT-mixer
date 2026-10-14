import type { ReactNode } from 'react';
import { MutedIcon, PauseIcon, PlayIcon, VolumeIcon } from './Icons';

interface Props {
  x: number;
  onX: (x: number) => void;
  anyPlaying: boolean;
  onPlayPauseAll: () => void;
  muted: boolean;
  onMuteAll: () => void;
  children?: ReactNode;
}

export function Mixer({ x, onX, anyPlaying, onPlayPauseAll, muted, onMuteAll, children }: Props) {
  return (
    <section className="mixer" aria-label="Mixer">
      <div className="mixer__main">
        <div className="crossfader">
          <span className="crossfader__end">A</span>
          <input
            className="crossfader__input"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={x}
            onChange={(e) => onX(Number(e.target.value))}
            aria-label="Crossfader"
          />
          <span className="crossfader__end">B</span>
        </div>
        <div className="master">
          <button className="btn btn--primary" onClick={onPlayPauseAll}>
            {anyPlaying ? <PauseIcon /> : <PlayIcon />}
            {anyPlaying ? 'Pause all' : 'Play all'}
          </button>
          <button className={`btn${muted ? ' btn--active' : ''}`} onClick={onMuteAll} aria-pressed={muted}>
            {muted ? <MutedIcon /> : <VolumeIcon />}
            {muted ? 'Unmute' : 'Mute all'}
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}

import type { ReactNode } from 'react';
import { MutedIcon, PauseIcon, PlayIcon, VolumeIcon } from './Icons';

interface Props {
  /** Volume faders + crossfader block. */
  faders: ReactNode;
  anyPlaying: boolean;
  onPlayPauseAll: () => void;
  muted: boolean;
  onMuteAll: () => void;
  children?: ReactNode;
}

export function Mixer({ faders, anyPlaying, onPlayPauseAll, muted, onMuteAll, children }: Props) {
  return (
    <section className="mixer" aria-label="Mixer">
      <div className="mixer__main">
        {faders}
        <div className="master">
          <button className="btn btn--primary" onClick={onPlayPauseAll} title="Shortcut: Space">
            {anyPlaying ? <PauseIcon /> : <PlayIcon />}
            {anyPlaying ? 'Pause all' : 'Play all'}
          </button>
          <button className={`btn${muted ? ' btn--active' : ''}`} onClick={onMuteAll} aria-pressed={muted} title="Shortcut: M">
            {muted ? <MutedIcon /> : <VolumeIcon />}
            {muted ? 'Unmute' : 'Mute all'}
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}

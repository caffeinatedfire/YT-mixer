import type { Levels } from '../lib/faders';
import type { Deck } from '../state/mix';

interface Props {
  levels: Levels;
  linked: boolean;
  onLinked: (linked: boolean) => void;
  /** A vertical fader moved (0..1). Linked: the other deck follows via the crossfader. */
  onLevel: (deck: Deck, level: number) => void;
  x: number;
  onX: (x: number) => void;
}

function Channel({ deck, level, onLevel }: { deck: Deck; level: number; onLevel: (deck: Deck, v: number) => void }) {
  const pct = Math.round(level * 100);
  return (
    <div className="channel">
      <span className="channel__value">{pct}</span>
      <div className="channel__bar">
        <div className="channel__fill" style={{ height: `${level * 100}%` }} />
        <input
          className="channel__input"
          type="range"
          min={0}
          max={100}
          step={1}
          value={pct}
          onChange={(e) => onLevel(deck, Number(e.target.value) / 100)}
          aria-label={`Deck ${deck} volume`}
          aria-orientation="vertical"
        />
      </div>
      <span className="channel__label">{deck}</span>
    </div>
  );
}

/** Two vertical volume faders with the crossfader under them, and a link toggle between. */
export function Faders({ levels, linked, onLinked, onLevel, x, onX }: Props) {
  return (
    <div className="faders">
      <div className="faders__channels">
        <Channel deck="A" level={levels.A} onLevel={onLevel} />
        <label className="faders__link">
          <input type="checkbox" checked={linked} onChange={(e) => onLinked(e.target.checked)} />
          Link volumes
        </label>
        <Channel deck="B" level={levels.B} onLevel={onLevel} />
      </div>
      <div
        className={`crossfader${linked ? '' : ' crossfader--off'}`}
        title={linked ? 'Left/Right arrow keys nudge the crossfader' : 'Link volumes to use the crossfader'}
      >
        <span className="crossfader__end">A</span>
        <input
          className="crossfader__input"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={x}
          onChange={(e) => onX(Number(e.target.value))}
          disabled={!linked}
          aria-label="Crossfader"
        />
        <span className="crossfader__end">B</span>
      </div>
    </div>
  );
}

import type { QueueItem } from '../state/queue';
import type { Deck } from '../state/mix';
import { thumbnailUrl } from '../lib/youtube';
import { CloseIcon } from './Icons';

interface Props {
  items: QueueItem[];
  onRemove: (uid: number) => void;
  onClear: () => void;
  /** Phase 4 manual wiring; Phase 5 replaces it with automatic cueing. */
  onLoad: (item: QueueItem, deck: Deck) => void;
}

export function Queue({ items, onRemove, onClear, onLoad }: Props) {
  return (
    <section className="queue" aria-label="Up next">
      <header className="queue__head">
        <h2 className="queue__title">
          Up next <span className="queue__count">{items.length}</span>
        </h2>
        {items.length > 0 && (
          <button className="btn btn--text" onClick={onClear}>
            Clear
          </button>
        )}
      </header>
      {items.length === 0 ? (
        <p className="queue__empty">The queue is empty. Paste a YouTube link above to add a song.</p>
      ) : (
        <ol className="queue__list">
          {items.map((item, i) => (
            <li key={item.uid} className="queue__item">
              <span className="queue__pos">{i + 1}</span>
              <img className="queue__thumb" src={thumbnailUrl(item.videoId)} alt="" width={80} height={45} loading="lazy" />
              <a
                className="queue__link"
                href={`https://www.youtube.com/watch?v=${item.videoId}`}
                target="_blank"
                rel="noreferrer"
              >
                youtu.be/{item.videoId}
              </a>
              <div className="queue__actions">
                <button className="btn btn--small" onClick={() => onLoad(item, 'A')}>Load A</button>
                <button className="btn btn--small" onClick={() => onLoad(item, 'B')}>Load B</button>
                <button className="btn btn--icon btn--ghost" onClick={() => onRemove(item.uid)} aria-label="Remove from queue">
                  <CloseIcon />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

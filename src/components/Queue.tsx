import type { QueueItem } from '../state/queue';
import { thumbnailUrl } from '../lib/youtube';
import { CloseIcon } from './Icons';

interface Props {
  items: QueueItem[];
  onRemove: (uid: number) => void;
  onClear: () => void;
}

export function Queue({ items, onRemove, onClear }: Props) {
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
              <button className="btn btn--icon btn--ghost" onClick={() => onRemove(item.uid)} aria-label="Remove from queue">
                <CloseIcon />
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

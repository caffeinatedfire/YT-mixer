import { useState, type KeyboardEvent } from 'react';

interface Props {
  onAdd: (text: string) => void;
  rejected: string[];
}

export function AddBar({ onAdd, rejected }: Props) {
  const [text, setText] = useState('');

  const submit = () => {
    if (!text.trim()) return;
    onAdd(text);
    setText('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <section className="add-bar" aria-label="Add songs">
      <div className="add-bar__row">
        <textarea
          className="add-bar__input"
          rows={1}
          value={text}
          placeholder="Paste YouTube links (one or many) and press Enter"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="YouTube links"
        />
        <button className="btn btn--primary" onClick={submit} disabled={!text.trim()}>
          Add to queue
        </button>
      </div>
      {rejected.length > 0 && (
        <p className="add-bar__error" role="status">
          Not a YouTube link: {rejected.slice(0, 3).join(', ')}
          {rejected.length > 3 && ` and ${rejected.length - 3} more`}
        </p>
      )}
    </section>
  );
}

import { useEffect, useRef } from 'react';

interface Handlers {
  onPlayPause: () => void;
  onMute: () => void;
  onNudge: (direction: -1 | 1) => void;
}

const isTextEntry = (el: EventTarget | null) =>
  el instanceof HTMLTextAreaElement ||
  el instanceof HTMLSelectElement ||
  (el instanceof HTMLInputElement && el.type !== 'range') ||
  (el instanceof HTMLElement && el.isContentEditable);

/** Space = play/pause all, M = mute all, Left/Right = nudge crossfader. Ignored while typing. */
export function useKeyboardShortcuts(handlers: Handlers) {
  const latest = useRef(handlers);
  latest.current = handlers;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTextEntry(e.target)) return;
      const h = latest.current;
      if (e.code === 'Space') {
        if (e.repeat) return;
        // Also stops a focused button from being "clicked" by the same Space press.
        e.preventDefault();
        h.onPlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        if (e.repeat) return;
        h.onMute();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // A focused range input already handles its own arrows (the crossfader routes through onChange).
        if (e.target instanceof HTMLInputElement) return;
        e.preventDefault();
        h.onNudge(e.key === 'ArrowLeft' ? -1 : 1);
      }
    };
    // Buttons activate on Space keyup, so swallow that too.
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target instanceof HTMLButtonElement) e.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);
}

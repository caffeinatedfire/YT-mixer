import { useEffect, useRef } from 'react';
import type { YouTubePlayerApi } from './useYouTubePlayer';
import type { QueueItem } from '../state/queue';

/**
 * Keeps a player in step with the item assigned to its deck: cues (paused) whenever the item
 * changes, pauses when the deck empties, and calls onError once per playback error.
 */
export function useDeckLoader(player: YouTubePlayerApi, item: QueueItem | null, onError: () => void) {
  const latest = useRef({ player, item, onError });
  latest.current = { player, item, onError };

  const uid = item?.uid ?? null;
  useEffect(() => {
    const { player, item } = latest.current;
    if (item) player.cue(item.videoId);
    else player.pause();
  }, [uid]);

  useEffect(() => {
    if (player.error !== null && latest.current.item) latest.current.onError();
  }, [player.error]);
}

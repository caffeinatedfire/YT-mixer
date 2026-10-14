import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadYouTubeApi, stateName, type PlayerStateName, type YTPlayer } from '../lib/ytApi';

export interface YouTubePlayerApi {
  /** Attach to the element that should hold the iframe. React must not render children into it. */
  containerRef: (el: HTMLDivElement | null) => void;
  ready: boolean;
  cue: (videoId: string) => void;
  play: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  getTime: () => number;
  getDuration: () => number;
  state: PlayerStateName;
  title: string;
  /** Last onError code (2/5/100/101/150), cleared on the next cue. */
  error: number | null;
}

export function useYouTubePlayer(): YouTubePlayerApi {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<PlayerStateName>('unstarted');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<number | null>(null);

  // Desired values, applied when the player becomes ready.
  const volumeRef = useRef(100);
  const mutedRef = useRef(false);
  const pendingCueRef = useRef<string | null>(null);

  useEffect(() => {
    if (!container) return;
    let cancelled = false;
    // The API replaces this node with an iframe, so give it a node React does not own.
    const host = document.createElement('div');
    container.appendChild(host);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(host, {
          width: '100%',
          height: '100%',
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
          events: {
            onReady: (e) => {
              if (cancelled) return;
              e.target.setVolume(volumeRef.current);
              if (mutedRef.current) e.target.mute();
              if (pendingCueRef.current) {
                e.target.cueVideoById(pendingCueRef.current);
                pendingCueRef.current = null;
              }
              setReady(true);
            },
            onStateChange: (e) => {
              if (cancelled) return;
              setState(stateName(e.data));
              const t = e.target.getVideoData()?.title;
              if (t) setTitle(t);
            },
            onError: (e) => {
              if (cancelled) return;
              setError(e.data);
              setTitle(''); // getVideoData() can still report the previous video here

            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setError(-1);
      });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        // The iframe may already be gone; nothing left to clean up.
      }
      playerRef.current = null;
      setReady(false);
      host.remove();
      container.replaceChildren();
    };
  }, [container]);

  const withPlayer = useCallback((fn: (p: YTPlayer) => void) => {
    const p = playerRef.current;
    if (p && ready) fn(p);
  }, [ready]);

  const cue = useCallback((videoId: string) => {
    // A failed script load (-1) sticks: there is no player to cue into until a reload.
    setError((e) => (e === -1 ? e : null));
    setTitle('');
    setState('loading');
    if (playerRef.current && ready) playerRef.current.cueVideoById(videoId);
    else pendingCueRef.current = videoId;
  }, [ready]);

  const setVolume = useCallback((v: number) => {
    volumeRef.current = v;
    withPlayer((p) => p.setVolume(v));
  }, [withPlayer]);

  const mute = useCallback(() => {
    mutedRef.current = true;
    withPlayer((p) => p.mute());
  }, [withPlayer]);

  const unMute = useCallback(() => {
    mutedRef.current = false;
    withPlayer((p) => {
      p.unMute();
      // Unmuting at volume 0 makes YouTube bump the volume up; put ours back.
      p.setVolume(volumeRef.current);
    });
  }, [withPlayer]);

  const play = useCallback(() => withPlayer((p) => p.playVideo()), [withPlayer]);
  const pause = useCallback(() => withPlayer((p) => p.pauseVideo()), [withPlayer]);
  const getTime = useCallback(() => (ready ? playerRef.current?.getCurrentTime() ?? 0 : 0), [ready]);
  const getDuration = useCallback(() => (ready ? playerRef.current?.getDuration() ?? 0 : 0), [ready]);

  return useMemo(
    () => ({
      containerRef: setContainer,
      ready, cue, play, pause, setVolume, mute, unMute, getTime, getDuration, state, title, error,
    }),
    [ready, cue, play, pause, setVolume, mute, unMute, getTime, getDuration, state, title, error],
  );
}

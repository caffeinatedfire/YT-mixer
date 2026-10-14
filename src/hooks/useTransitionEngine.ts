import { useCallback, useEffect, useReducer, useRef } from 'react';
import { FADE_TICK_MS, PLAY_WAIT_TIMEOUT_MS } from '../lib/config';
import { deckEnd, outgoingDeck, rampX } from '../lib/fade';
import { initialMix, mixReducer, otherDeck, type Deck } from '../state/mix';
import type { YouTubePlayerApi } from './useYouTubePlayer';

interface Options {
  players: Record<Deck, YouTubePlayerApi>;
  x: number;
  setX: (x: number) => void;
  fadeMs: number;
  /** Called once the fade lands; the outgoing deck is already paused. */
  onMixed: (from: Deck) => void;
}

/**
 * Mix sequence: start the incoming deck, wait for PLAYING (with a timeout), ramp the crossfader
 * to the incoming deck's end, then pause the outgoing deck and hand it back via onMixed.
 */
export function useTransitionEngine(opts: Options) {
  const [mix, dispatch] = useReducer(mixReducer, initialMix);
  const latest = useRef(opts);
  latest.current = opts;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Synchronous guard: two clicks in the same frame both see the old reducer state.
  const runningRef = useRef(false);

  const stopTimer = () => {
    if (timerRef.current !== null) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const cancel = useCallback(() => {
    if (!runningRef.current) return;
    stopTimer();
    runningRef.current = false;
    dispatch({ type: 'cancel' });
  }, []);

  const start = useCallback(() => {
    if (runningRef.current) return;
    const { players, x } = latest.current;
    const from = outgoingDeck(x);
    const to = otherDeck(from);
    if (!players[to].ready) return;

    runningRef.current = true;
    dispatch({ type: 'play', deck: from });
    dispatch({ type: 'startTransition' });

    const incoming = players[to];
    if (incoming.state !== 'playing') incoming.play();

    const ramp = () => {
      const startX = latest.current.x;
      const targetX = deckEnd(to);
      const fadeMs = latest.current.fadeMs;
      const t0 = performance.now();
      timerRef.current = setInterval(() => {
        const { x: nx, progress } = rampX(startX, targetX, performance.now() - t0, fadeMs);
        latest.current.setX(nx);
        dispatch({ type: 'progress', progress });
        if (progress >= 1) {
          stopTimer();
          runningRef.current = false;
          latest.current.players[from].pause();
          dispatch({ type: 'complete' });
          latest.current.onMixed(from);
        }
      }, FADE_TICK_MS);
    };

    const waitStart = performance.now();
    timerRef.current = setInterval(() => {
      const p = latest.current.players[to];
      if (p.error !== null) {
        cancel();
      } else if (p.state === 'playing' || performance.now() - waitStart >= PLAY_WAIT_TIMEOUT_MS) {
        stopTimer();
        ramp();
      }
    }, 100);
  }, [cancel]);

  useEffect(() => stopTimer, []);

  return { mix, start, cancel };
}

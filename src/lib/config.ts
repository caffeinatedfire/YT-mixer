/**
 * Phase 0 found no reliable pre-roll ad signal (SPIKE.md Q3). While false, a mix never starts the
 * incoming deck blind: the host starts it, checks the song (not an ad) is on, then presses Mix now.
 */
export const AD_SIGNAL_RELIABLE = false;

/** How long a mix waits for the incoming deck to report PLAYING before fading anyway. */
export const PLAY_WAIT_TIMEOUT_MS = 5000;

/** Fade tick. setInterval (not rAF) so fades keep running in hidden tabs. */
export const FADE_TICK_MS = 50;

export const DEFAULT_FADE_SECONDS = 6;
export const FADE_OPTIONS_SECONDS = [3, 6, 10, 15, 20, 30];

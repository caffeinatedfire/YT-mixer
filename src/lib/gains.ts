export interface Gains {
  a: number;
  b: number;
}

const clamp01 = (x: number) => (Number.isNaN(x) ? 0 : Math.min(1, Math.max(0, x)));

/** Equal-power crossfade: x = 0 is all deck A, x = 1 is all deck B. */
export function gains(x: number): Gains {
  const t = clamp01(x);
  return { a: Math.cos((t * Math.PI) / 2), b: Math.sin((t * Math.PI) / 2) };
}

/** Final player volume (0-100) for a deck given its crossfader gain and trim (0-100). */
export function deckVolume(gain: number, trim: number): number {
  return Math.min(100, Math.max(0, Math.round(gain * trim)));
}

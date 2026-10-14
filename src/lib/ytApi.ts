// Minimal typings for the parts of the YouTube IFrame Player API we use.
export interface YTPlayer {
  cueVideoById(videoId: string): void;
  loadVideoById(videoId: string): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  getVolume(): number;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getVideoData(): { video_id: string; title: string; author: string };
  destroy(): void;
}

export interface YTPlayerEvent<T = unknown> {
  target: YTPlayer;
  data: T;
}

export interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      width?: number | string;
      height?: number | string;
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: YTPlayerEvent) => void;
        onStateChange?: (e: YTPlayerEvent<number>) => void;
        onError?: (e: YTPlayerEvent<number>) => void;
      };
    },
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace & { loaded?: number };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

export type PlayerStateName = 'unstarted' | 'ended' | 'playing' | 'paused' | 'buffering' | 'cued' | 'loading';

export function stateName(code: number): PlayerStateName {
  switch (code) {
    case PlayerState.ENDED: return 'ended';
    case PlayerState.PLAYING: return 'playing';
    case PlayerState.PAUSED: return 'paused';
    case PlayerState.BUFFERING: return 'buffering';
    case PlayerState.CUED: return 'cued';
    default: return 'unstarted';
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

/** Loads the iframe_api script once; every caller shares the same promise (safe under StrictMode). */
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error('Could not load the YouTube player'));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

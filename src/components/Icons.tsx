const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true } as const;

export const PlayIcon = () => (
  <svg {...base}><path d="M8 5.5v13l10.5-6.5z" /></svg>
);

export const PauseIcon = () => (
  <svg {...base}><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
);

export const VolumeIcon = () => (
  <svg {...base}><path d="M4 9.5v5h3.5L12 19V5L7.5 9.5zM15 8.5a5 5 0 0 1 0 7l-1.1-1.1a3.5 3.5 0 0 0 0-4.8z" /></svg>
);

export const MutedIcon = () => (
  <svg {...base}><path d="M4 9.5v5h3.5L12 19V5L7.5 9.5zM15.3 9.4l1.1-1.1 2.1 2.1 2.1-2.1 1.1 1.1-2.1 2.1 2.1 2.1-1.1 1.1-2.1-2.1-2.1 2.1-1.1-1.1 2.1-2.1z" /></svg>
);

export const CloseIcon = () => (
  <svg {...base} width={16} height={16}><path d="M6.4 5.3 12 10.9l5.6-5.6 1.1 1.1-5.6 5.6 5.6 5.6-1.1 1.1-5.6-5.6-5.6 5.6-1.1-1.1 5.6-5.6-5.6-5.6z" /></svg>
);

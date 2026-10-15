const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true } as const;

export const PlayIcon = () => (
  <svg {...base}><path d="M8 5.5v13l10.5-6.5z" /></svg>
);

export const PauseIcon = () => (
  <svg {...base}><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
);

export const CloseIcon = () => (
  <svg {...base} width={16} height={16}><path d="M6.4 5.3 12 10.9l5.6-5.6 1.1 1.1-5.6 5.6 5.6 5.6-1.1 1.1-5.6-5.6-5.6 5.6-1.1-1.1 5.6-5.6-5.6-5.6z" /></svg>
);

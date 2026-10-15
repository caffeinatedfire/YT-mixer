import type { ReactNode } from 'react';

interface Props {
  /** Volume faders + crossfader block. */
  faders: ReactNode;
  children?: ReactNode;
}

export function Mixer({ faders, children }: Props) {
  return (
    <section className="mixer" aria-label="Mixer">
      <div className="mixer__main">{faders}</div>
      {children}
    </section>
  );
}

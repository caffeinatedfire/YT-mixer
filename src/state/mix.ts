export type Deck = 'A' | 'B';

export type MixState =
  | { kind: 'idle' }
  | { kind: 'playing'; active: Deck }
  | { kind: 'transitioning'; from: Deck; to: Deck; progress: number };

export type MixAction =
  | { type: 'play'; deck: Deck }
  | { type: 'startTransition' }
  | { type: 'progress'; progress: number }
  | { type: 'complete' }
  | { type: 'cancel' }
  | { type: 'stop' };

export const initialMix: MixState = { kind: 'idle' };

export const otherDeck = (d: Deck): Deck => (d === 'A' ? 'B' : 'A');

export function mixReducer(state: MixState, action: MixAction): MixState {
  switch (action.type) {
    case 'play':
      return state.kind === 'transitioning' ? state : { kind: 'playing', active: action.deck };
    case 'startTransition':
      if (state.kind !== 'playing') return state;
      return { kind: 'transitioning', from: state.active, to: otherDeck(state.active), progress: 0 };
    case 'progress':
      if (state.kind !== 'transitioning') return state;
      return { ...state, progress: Math.min(1, Math.max(0, action.progress)) };
    case 'complete':
      return state.kind === 'transitioning' ? { kind: 'playing', active: state.to } : state;
    case 'cancel':
      if (state.kind !== 'transitioning') return state;
      return { kind: 'playing', active: state.progress >= 0.5 ? state.to : state.from };
    case 'stop':
      return initialMix;
  }
}

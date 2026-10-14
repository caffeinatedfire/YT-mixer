import { describe, expect, it } from 'vitest';
import { autopilotDecision, type AutopilotInput } from './autopilot';

const base: AutopilotInput = {
  enabled: true,
  mixing: false,
  activeState: 'playing',
  activeUid: 1,
  triggeredUid: null,
  time: 100,
  duration: 200,
  leadSeconds: 8,
  incomingHasSong: true,
};

const decide = (over: Partial<AutopilotInput>) => autopilotDecision({ ...base, ...over });

describe('autopilotDecision', () => {
  it('does nothing while the track has more than the lead time left', () => {
    expect(decide({})).toBe('none');
    expect(decide({ time: 191.9 })).toBe('none');
  });

  it('mixes once the remaining time reaches the lead time', () => {
    expect(decide({ time: 192 })).toBe('mix');
    expect(decide({ time: 199 })).toBe('mix');
  });

  it('triggers only once per track', () => {
    expect(decide({ time: 195, triggeredUid: 1 })).toBe('none');
    expect(decide({ time: 195, triggeredUid: 1, activeUid: 2 })).toBe('mix');
  });

  it('stays out of the way when off, mixing, or with nothing to mix into', () => {
    expect(decide({ time: 195, enabled: false })).toBe('none');
    expect(decide({ time: 195, mixing: true })).toBe('none');
    expect(decide({ time: 195, incomingHasSong: false })).toBe('none');
    expect(decide({ time: 195, activeUid: null })).toBe('none');
  });

  it('only mixes from a deck that is actually playing with a known duration', () => {
    expect(decide({ time: 195, activeState: 'paused' })).toBe('none');
    expect(decide({ time: 195, activeState: 'buffering' })).toBe('none');
    expect(decide({ time: 0, duration: 0 })).toBe('none');
  });

  it('hard-cuts when the active deck ends without a mix', () => {
    expect(decide({ activeState: 'ended' })).toBe('hardCut');
    expect(decide({ activeState: 'ended', triggeredUid: 1 })).toBe('hardCut');
    expect(decide({ activeState: 'ended', incomingHasSong: false })).toBe('none');
    expect(decide({ activeState: 'ended', enabled: false })).toBe('none');
    expect(decide({ activeState: 'ended', mixing: true })).toBe('none');
  });
});

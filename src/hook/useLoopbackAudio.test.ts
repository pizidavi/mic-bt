import { beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => {
  const slots = new Map<number, unknown>();
  const state = {
    slots,
    cursor: 0,
    effect: null as (() => (() => void) | null) | null,
    cleanup: null as (() => void) | null,
  };
  const reset = () => {
    slots.clear();
    state.cursor = 0;
    state.effect = null;
    state.cleanup = null;
  };
  const runEffect = () => {
    state.cleanup?.();
    const { effect } = state;
    state.effect = null;
    state.cleanup = effect?.() ?? null;
  };
  return { state, reset, runEffect };
});

vi.mock('react', () => ({
  useCallback: <T>(fn: T): T => fn,
  useEffect: (effect: () => (() => void) | null) => {
    harness.state.effect = effect;
  },
  useState: <S>(initial: S | (() => S)): [S, (update: S | ((prev: S) => S)) => void] => {
    const { slots } = harness.state;
    const slot = harness.state.cursor;
    harness.state.cursor += 1;
    if (!slots.has(slot)) {
      slots.set(slot, typeof initial === 'function' ? (initial as () => S)() : initial);
    }
    const setState = (update: S | ((prev: S) => S)) => {
      const prev = slots.get(slot) as S;
      slots.set(slot, typeof update === 'function' ? (update as (prev: S) => S)(prev) : update);
    };
    return [slots.get(slot) as S, setState];
  },
}));

const serviceMock = vi.hoisted(() => ({
  start: vi.fn<() => Promise<boolean>>(),
  stop: vi.fn<() => Promise<boolean>>(),
  setGain: vi.fn<(db: number) => Promise<number>>(),
  setMuted: vi.fn<(muted: boolean) => Promise<boolean>>(),
  onLevel: vi.fn<(listener: (levelDb: number) => void) => () => void>(),
}));
const loggerMock = vi.hoisted(() => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}));

vi.mock('../services/loopbackAudio', () => ({ loopbackAudio: serviceMock }));
vi.mock('../util/logger', () => ({ appLog: loggerMock }));

import { useLoopbackAudio } from './useLoopbackAudio';

const useLoopbackAudioState = () => {
  // eslint-disable-next-line react/immutability
  harness.state.cursor = 0;
  return useLoopbackAudio();
};

const resetMocks = () => {
  serviceMock.start.mockReset().mockResolvedValue(true);
  serviceMock.stop.mockReset().mockResolvedValue(true);
  serviceMock.setGain.mockReset().mockImplementation(db => Promise.resolve(db));
  serviceMock.setMuted.mockReset().mockResolvedValue(true);
  serviceMock.onLevel.mockReset().mockReturnValue(vi.fn());
  Object.values(loggerMock).forEach(mock => mock.mockReset());
  harness.reset();
};

const forwardLevelListener = () => {
  const forwarded = vi.fn<(levelDb: number) => void>();
  const unsubscribe = vi.fn();
  serviceMock.onLevel.mockImplementationOnce(listener => {
    forwarded.mockImplementation(listener);
    return unsubscribe;
  });
  return { forwarded, unsubscribe };
};

describe('useLoopbackAudio', () => {
  beforeEach(resetMocks);

  it('starts the loopback and turns running on', async () => {
    const initial = useLoopbackAudioState();
    expect(initial.running).toBe(false);
    await initial.start();
    const started = useLoopbackAudioState();
    expect(serviceMock.start).toHaveBeenCalledTimes(1);
    expect(started.running).toBe(true);
    expect(started.busy).toBe(false);
  });

  it('keeps running off when the native start fails', async () => {
    serviceMock.start.mockResolvedValue(false);
    await useLoopbackAudioState().start();
    const result = useLoopbackAudioState();
    expect(result.running).toBe(false);
    expect(result.busy).toBe(false);
  });

  it('ignores start while busy', async () => {
    let resolveStart: (value: boolean) => void = value => value;
    serviceMock.start.mockReturnValue(
      new Promise<boolean>(resolve => {
        resolveStart = resolve;
      }),
    );
    const first = useLoopbackAudioState().start();
    await useLoopbackAudioState().start();
    expect(serviceMock.start).toHaveBeenCalledTimes(1);
    resolveStart(true);
    await first;
    const result = useLoopbackAudioState();
    expect(result.running).toBe(true);
    expect(result.busy).toBe(false);
  });

  it('ignores stop while busy', async () => {
    let resolveStop: (value: boolean) => void = value => value;
    serviceMock.stop.mockReturnValue(
      new Promise<boolean>(resolve => {
        resolveStop = resolve;
      }),
    );
    await useLoopbackAudioState().start();
    const stopping = useLoopbackAudioState().stop();
    await useLoopbackAudioState().stop();
    expect(serviceMock.stop).toHaveBeenCalledTimes(1);
    resolveStop(true);
    await stopping;
    expect(useLoopbackAudioState().running).toBe(false);
  });

  it('stops the loopback after a start', async () => {
    await useLoopbackAudioState().start();
    await useLoopbackAudioState().stop();
    const result = useLoopbackAudioState();
    expect(serviceMock.stop).toHaveBeenCalledTimes(1);
    expect(result.running).toBe(false);
  });

  it('toggles between start and stop', async () => {
    await useLoopbackAudioState().toggle();
    expect(serviceMock.start).toHaveBeenCalledTimes(1);
    expect(serviceMock.stop).not.toHaveBeenCalled();
    await useLoopbackAudioState().toggle();
    expect(serviceMock.stop).toHaveBeenCalledTimes(1);
    expect(useLoopbackAudioState().running).toBe(false);
  });

  it('logs and keeps running off when start rejects', async () => {
    serviceMock.start.mockRejectedValue(new Error('boom'));
    await useLoopbackAudioState().start();
    const result = useLoopbackAudioState();
    expect(result.running).toBe(false);
    expect(result.busy).toBe(false);
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
  });

  it('logs and keeps running on when stop rejects', async () => {
    await useLoopbackAudioState().start();
    serviceMock.stop.mockRejectedValue(new Error('boom'));
    await useLoopbackAudioState().stop();
    const result = useLoopbackAudioState();
    expect(result.running).toBe(true);
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
  });

  it('logs the loopback lifecycle', async () => {
    await useLoopbackAudioState().start();
    await useLoopbackAudioState().stop();
    expect(loggerMock.info).toHaveBeenCalledWith('Loopback started');
    expect(loggerMock.info).toHaveBeenCalledWith('Loopback stopped');
  });
});

describe('useLoopbackAudio gain mute and level', () => {
  beforeEach(resetMocks);

  it('clamps the gain to the supported range and applies it', async () => {
    await useLoopbackAudioState().setGain(100);
    expect(serviceMock.setGain).toHaveBeenCalledWith(24);
    expect(useLoopbackAudioState().gain).toBe(24);
    await useLoopbackAudioState().setGain(-100);
    expect(serviceMock.setGain).toHaveBeenCalledWith(-6);
    expect(useLoopbackAudioState().gain).toBe(-6);
    await useLoopbackAudioState().setGain(8);
    expect(serviceMock.setGain).toHaveBeenCalledWith(8);
    expect(useLoopbackAudioState().gain).toBe(8);
  });

  it('syncs the gain with the value applied natively', async () => {
    serviceMock.setGain.mockResolvedValue(3);
    await useLoopbackAudioState().setGain(10);
    expect(useLoopbackAudioState().gain).toBe(3);
  });

  it('logs and keeps the clamped gain when setGain rejects', async () => {
    serviceMock.setGain.mockRejectedValue(new Error('boom'));
    await useLoopbackAudioState().setGain(100);
    expect(useLoopbackAudioState().gain).toBe(24);
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
  });

  it('toggles mute and applies it natively', async () => {
    useLoopbackAudioState().toggleMute();
    await Promise.resolve();
    expect(serviceMock.setMuted).toHaveBeenCalledWith(true);
    expect(useLoopbackAudioState().muted).toBe(true);
    useLoopbackAudioState().toggleMute();
    await Promise.resolve();
    expect(serviceMock.setMuted).toHaveBeenCalledWith(false);
    expect(useLoopbackAudioState().muted).toBe(false);
  });

  it('logs and keeps the muted state when setMuted rejects', async () => {
    serviceMock.setMuted.mockRejectedValue(new Error('boom'));
    useLoopbackAudioState().toggleMute();
    await Promise.resolve();
    expect(useLoopbackAudioState().muted).toBe(true);
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
  });

  it('subscribes to level events while running and maps them to a percent', async () => {
    const { forwarded } = forwardLevelListener();
    await useLoopbackAudioState().start();
    useLoopbackAudioState();
    harness.runEffect();
    forwarded(-30);
    expect(useLoopbackAudioState().level).toBe(50);
    forwarded(-120);
    expect(useLoopbackAudioState().level).toBe(0);
    forwarded(10);
    expect(useLoopbackAudioState().level).toBe(100);
  });

  it('does not subscribe to level events while not running', () => {
    harness.runEffect();
    expect(serviceMock.onLevel).not.toHaveBeenCalled();
    expect(useLoopbackAudioState().level).toBe(0);
  });

  it('unsubscribes from level events and resets the level on stop', async () => {
    const { unsubscribe } = forwardLevelListener();
    await useLoopbackAudioState().start();
    useLoopbackAudioState();
    harness.runEffect();
    await useLoopbackAudioState().stop();
    useLoopbackAudioState();
    harness.runEffect();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(useLoopbackAudioState().level).toBe(0);
  });

  it('logs gain and mute changes only when the value changes', async () => {
    await useLoopbackAudioState().setGain(8);
    await useLoopbackAudioState().setGain(8);
    useLoopbackAudioState().toggleMute();
    await Promise.resolve();
    expect(serviceMock.setGain).toHaveBeenCalledTimes(1);
    expect(loggerMock.debug).toHaveBeenCalledTimes(1);
    expect(loggerMock.debug).toHaveBeenCalledWith('Loopback gain: 8 dB');
    expect(loggerMock.info).toHaveBeenCalledWith('Loopback muted: true');
  });
});

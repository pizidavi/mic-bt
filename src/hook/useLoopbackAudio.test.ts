import { beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => {
  const slots = new Map<number, unknown>();
  const state = { slots, cursor: 0 };
  const reset = () => {
    slots.clear();
    state.cursor = 0;
  };
  return { state, reset };
});

vi.mock('react', () => ({
  useCallback: <T>(fn: T): T => fn,
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
}));
const loggerMock = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('../services/loopbackAudio', () => ({ loopbackAudio: serviceMock }));
vi.mock('../util/logger', () => ({ appLog: loggerMock }));

import { useLoopbackAudio } from './useLoopbackAudio';

const useLoopbackAudioState = () => {
  // eslint-disable-next-line react/immutability
  harness.state.cursor = 0;
  return useLoopbackAudio();
};

describe('useLoopbackAudio', () => {
  beforeEach(() => {
    serviceMock.start.mockReset().mockResolvedValue(true);
    serviceMock.stop.mockReset().mockResolvedValue(true);
    loggerMock.error.mockReset();
    harness.reset();
  });

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
});

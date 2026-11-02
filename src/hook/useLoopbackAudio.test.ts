import { beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => {
  const slots = new Map<number, unknown>();
  const effects = new Map<number, () => void>();
  const cleanups: Array<() => void> = [];
  const state = { slots, effects, cursor: 0 };
  const reset = () => {
    slots.clear();
    effects.clear();
    cleanups.splice(0).forEach(cleanup => cleanup());
    state.cursor = 0;
  };
  return { state, reset, cleanups };
});

vi.mock('react', () => ({
  useCallback: <T>(fn: T): T => fn,
  useEffect: (effect: () => void | (() => void)) => {
    const { effects } = harness.state;
    const slot = harness.state.cursor;
    harness.state.cursor += 1;
    if (effects.has(slot)) return;
    effects.set(slot, effect);
    const cleanup = effect();
    if (typeof cleanup === 'function') harness.cleanups.push(cleanup);
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

const serviceMock = vi.hoisted(() => {
  const listeners = new Set<(status: unknown) => void>();
  const remove = vi.fn();
  return {
    start: vi.fn<() => Promise<boolean>>(),
    stop: vi.fn<() => Promise<boolean>>(),
    onStateChanged: vi.fn((listener: (status: unknown) => void) => {
      listeners.add(listener);
      return {
        remove: () => {
          listeners.delete(listener);
          remove();
        },
      };
    }),
    emit: (status: unknown) => listeners.forEach(listener => listener(status)),
    remove,
    reset: () => {
      listeners.clear();
      remove.mockReset();
    },
  };
});

const storeMock = vi.hoisted(() => {
  type StoreState = {
    state: string;
    reason: string | null;
    setStatus: (status: { state: string; reason: string | null }) => void;
  };
  const state: StoreState = {
    state: 'idle',
    reason: null,
    setStatus: status => Object.assign(state, status),
  };
  return {
    state,
    set: (status: { state: string; reason: string | null }) => Object.assign(state, status),
    useLoopbackStore: (selector: (s: StoreState) => unknown) => selector(state),
  };
});
const loggerMock = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('../services/loopbackAudio', () => ({ loopbackAudio: serviceMock }));
vi.mock('../store/store', () => ({ useLoopbackStore: storeMock.useLoopbackStore }));
vi.mock('../util/logger', () => ({ appLog: loggerMock }));

import { LOOPBACK_STATE, LOOPBACK_STOP_REASON } from '../type/enum';
import { useLoopbackAudio } from './useLoopbackAudio';

const useLoopbackAudioState = () => {
  // eslint-disable-next-line react/immutability
  harness.state.cursor = 0;
  return useLoopbackAudio();
};

const resetMocks = () => {
  serviceMock.reset();
  serviceMock.start.mockReset().mockResolvedValue(true);
  serviceMock.stop.mockReset().mockResolvedValue(true);
  loggerMock.error.mockReset();
};

describe('useLoopbackAudio', () => {
  beforeEach(() => {
    harness.reset();
    resetMocks();
    storeMock.set({ state: LOOPBACK_STATE.IDLE, reason: null });
  });

  describe('status pipeline', () => {
    it('subscribes to native state changes and updates the store', () => {
      useLoopbackAudioState();

      expect(serviceMock.onStateChanged).toHaveBeenCalledTimes(1);

      serviceMock.emit({ state: LOOPBACK_STATE.RUNNING, reason: null });
      expect(storeMock.state.state).toBe(LOOPBACK_STATE.RUNNING);
    });

    it('maps a focus loss stop to the store reason', () => {
      useLoopbackAudioState();

      serviceMock.emit({ state: LOOPBACK_STATE.STOPPED, reason: LOOPBACK_STOP_REASON.FOCUS_LOSS });

      expect(storeMock.state.state).toBe(LOOPBACK_STATE.STOPPED);
      expect(storeMock.state.reason).toBe(LOOPBACK_STOP_REASON.FOCUS_LOSS);
    });

    it('exposes the running flag from the store state', () => {
      const initial = useLoopbackAudioState();
      expect(initial.running).toBe(false);
      expect(initial.stopped).toBe(false);

      storeMock.set({ state: LOOPBACK_STATE.RUNNING, reason: null });

      const running = useLoopbackAudioState();
      expect(running.running).toBe(true);
      expect(running.stopped).toBe(false);
    });

    it('exposes the stopped flag and the reason from the store state', () => {
      storeMock.set({ state: LOOPBACK_STATE.STOPPED, reason: LOOPBACK_STOP_REASON.FOCUS_LOSS });

      const stopped = useLoopbackAudioState();
      expect(stopped.running).toBe(false);
      expect(stopped.stopped).toBe(true);
      expect(stopped.reason).toBe(LOOPBACK_STOP_REASON.FOCUS_LOSS);
    });

    it('unsubscribes from native state changes on unmount', () => {
      useLoopbackAudioState();

      harness.reset();

      expect(serviceMock.remove).toHaveBeenCalledTimes(1);
      serviceMock.emit({ state: LOOPBACK_STATE.RUNNING, reason: null });
      expect(storeMock.state.state).toBe(LOOPBACK_STATE.IDLE);
    });
  });

  describe('start and stop', () => {
    it('starts the loopback and turns the state running', async () => {
      await useLoopbackAudioState().start();

      const started = useLoopbackAudioState();
      expect(serviceMock.start).toHaveBeenCalledTimes(1);
      expect(started.running).toBe(true);
      expect(started.busy).toBe(false);
    });

    it('keeps the current state when the native start fails', async () => {
      storeMock.set({ state: LOOPBACK_STATE.STOPPED, reason: LOOPBACK_STOP_REASON.FOCUS_LOSS });
      serviceMock.start.mockResolvedValue(false);

      await useLoopbackAudioState().start();

      const result = useLoopbackAudioState();
      expect(result.stopped).toBe(true);
      expect(result.reason).toBe(LOOPBACK_STOP_REASON.FOCUS_LOSS);
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
      expect(storeMock.state.state).toBe(LOOPBACK_STATE.IDLE);
      expect(storeMock.state.reason).toBeNull();
    });

    it('toggles between start and stop based on the state', async () => {
      await useLoopbackAudioState().toggle();

      expect(serviceMock.start).toHaveBeenCalledTimes(1);
      expect(serviceMock.stop).not.toHaveBeenCalled();

      await useLoopbackAudioState().toggle();

      expect(serviceMock.stop).toHaveBeenCalledTimes(1);
      expect(useLoopbackAudioState().running).toBe(false);
    });

    it('restarts after a focus loss stop with one tap', async () => {
      await useLoopbackAudioState().start();

      serviceMock.emit({ state: LOOPBACK_STATE.STOPPED, reason: LOOPBACK_STOP_REASON.FOCUS_LOSS });

      const stopped = useLoopbackAudioState();
      expect(stopped.stopped).toBe(true);
      expect(stopped.reason).toBe(LOOPBACK_STOP_REASON.FOCUS_LOSS);

      await stopped.start();

      expect(serviceMock.start).toHaveBeenCalledTimes(2);
      expect(storeMock.state.state).toBe(LOOPBACK_STATE.RUNNING);
      expect(storeMock.state.reason).toBeNull();
    });
  });

  describe('error handling', () => {
    it('logs and keeps running when stop rejects', async () => {
      await useLoopbackAudioState().start();

      serviceMock.stop.mockRejectedValue(new Error('boom'));
      await useLoopbackAudioState().stop();

      const result = useLoopbackAudioState();
      expect(result.running).toBe(true);
      expect(loggerMock.error).toHaveBeenCalledTimes(1);
    });

    it('logs and keeps the state off when start rejects', async () => {
      serviceMock.start.mockRejectedValue(new Error('boom'));

      await useLoopbackAudioState().start();

      const result = useLoopbackAudioState();
      expect(result.running).toBe(false);
      expect(result.busy).toBe(false);
      expect(loggerMock.error).toHaveBeenCalledTimes(1);
    });
  });
});

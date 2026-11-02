import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./local', () => ({
  localStorage: {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

import { LOOPBACK_STATE, LOOPBACK_STOP_REASON } from '../type/enum';
import { useLoopbackStore } from './store';

describe('useLoopbackStore', () => {
  beforeEach(() => {
    useLoopbackStore.setState({ state: LOOPBACK_STATE.IDLE, reason: null });
  });

  it('starts idle without a reason', () => {
    const { state, reason } = useLoopbackStore.getState();
    expect(state).toBe(LOOPBACK_STATE.IDLE);
    expect(reason).toBeNull();
  });

  it('transitions to running without a reason on start', () => {
    useLoopbackStore.getState().setStatus({ state: LOOPBACK_STATE.RUNNING, reason: null });

    expect(useLoopbackStore.getState().state).toBe(LOOPBACK_STATE.RUNNING);
    expect(useLoopbackStore.getState().reason).toBeNull();
  });

  it('transitions to stopped with the focus loss reason', () => {
    useLoopbackStore.getState().setStatus({ state: LOOPBACK_STATE.RUNNING, reason: null });
    useLoopbackStore.getState().setStatus({
      state: LOOPBACK_STATE.STOPPED,
      reason: LOOPBACK_STOP_REASON.FOCUS_LOSS,
    });

    expect(useLoopbackStore.getState().state).toBe(LOOPBACK_STATE.STOPPED);
    expect(useLoopbackStore.getState().reason).toBe(LOOPBACK_STOP_REASON.FOCUS_LOSS);
  });

  it('clears the reason when going back to idle', () => {
    useLoopbackStore.getState().setStatus({
      state: LOOPBACK_STATE.STOPPED,
      reason: LOOPBACK_STOP_REASON.FOCUS_LOSS,
    });
    useLoopbackStore.getState().setStatus({ state: LOOPBACK_STATE.IDLE, reason: null });

    expect(useLoopbackStore.getState().state).toBe(LOOPBACK_STATE.IDLE);
    expect(useLoopbackStore.getState().reason).toBeNull();
  });

  it('notifies subscribers on status transitions', () => {
    const listener = vi.fn();
    const unsubscribe = useLoopbackStore.subscribe(listener);

    useLoopbackStore.getState().setStatus({ state: LOOPBACK_STATE.RUNNING, reason: null });

    unsubscribe();
    useLoopbackStore.getState().setStatus({ state: LOOPBACK_STATE.IDLE, reason: null });

    expect(listener).toHaveBeenCalledTimes(1);
  });
});

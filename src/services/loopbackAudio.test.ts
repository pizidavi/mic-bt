import { beforeEach, describe, expect, it, vi } from 'vitest';

const nativeMock = vi.hoisted(() => ({
  start: vi.fn<() => Promise<boolean>>(),
  stop: vi.fn<() => Promise<boolean>>(),
  addListener: vi.fn(),
}));
const permissionsMock = vi.hoisted(() => ({ request: vi.fn() }));
const platformMock = vi.hoisted(() => ({ Platform: { OS: 'android' } }));

vi.mock('../../modules/loopback-audio/src/LoopbackAudioModule', () => ({ default: nativeMock }));
vi.mock('react-native-permissions', () => ({
  PERMISSIONS: { ANDROID: { RECORD_AUDIO: 'android.permission.RECORD_AUDIO' } },
  RESULTS: { GRANTED: 'granted' },
  request: permissionsMock.request,
}));
vi.mock('react-native', () => platformMock);

import { LOOPBACK_STATE, LOOPBACK_STOP_REASON } from '../type/enum';
import { loopbackAudio } from './loopbackAudio';

describe('loopbackAudio', () => {
  beforeEach(() => {
    nativeMock.start.mockReset().mockResolvedValue(true);
    nativeMock.stop.mockReset().mockResolvedValue(true);
    nativeMock.addListener.mockReset();
    permissionsMock.request.mockReset().mockResolvedValue('granted');
    platformMock.Platform.OS = 'android';
  });

  it('requests the mic permission and starts the native loopback', async () => {
    await expect(loopbackAudio.start()).resolves.toBe(true);
    expect(permissionsMock.request).toHaveBeenCalledWith('android.permission.RECORD_AUDIO');
    expect(nativeMock.start).toHaveBeenCalledTimes(1);
  });

  it('does not start the native loopback when the permission is denied', async () => {
    permissionsMock.request.mockResolvedValue('denied');
    await expect(loopbackAudio.start()).resolves.toBe(false);
    expect(nativeMock.start).not.toHaveBeenCalled();
  });

  it('does not start the native loopback outside android', async () => {
    platformMock.Platform.OS = 'ios';
    await expect(loopbackAudio.start()).resolves.toBe(false);
    expect(permissionsMock.request).not.toHaveBeenCalled();
    expect(nativeMock.start).not.toHaveBeenCalled();
  });

  it('stops the native loopback', async () => {
    nativeMock.stop.mockResolvedValue(true);
    await expect(loopbackAudio.stop()).resolves.toBe(true);
    expect(nativeMock.stop).toHaveBeenCalledTimes(1);
  });

  it('parses native state events and forwards them to the listener', () => {
    const listener = vi.fn();
    const emitters: Array<(event: { state: string }) => void> = [];
    nativeMock.addListener.mockImplementation((_name, emit) => {
      emitters.push(emit);
      return { remove: vi.fn() };
    });

    loopbackAudio.onStateChanged(listener);

    expect(nativeMock.addListener).toHaveBeenCalledTimes(1);
    const [emit] = emitters;

    emit({ state: 'idle' });
    expect(listener).toHaveBeenLastCalledWith({ state: LOOPBACK_STATE.IDLE, reason: null });
  });

  it('maps a focus loss stop event to the stop reason', () => {
    const listener = vi.fn();
    const emitters: Array<(event: { state: string }) => void> = [];
    nativeMock.addListener.mockImplementation((_name, emit) => {
      emitters.push(emit);
      return { remove: vi.fn() };
    });

    loopbackAudio.onStateChanged(listener);
    const [emit] = emitters;

    emit({ state: 'stopped:focus-loss' });

    expect(listener).toHaveBeenLastCalledWith({
      state: LOOPBACK_STATE.STOPPED,
      reason: LOOPBACK_STOP_REASON.FOCUS_LOSS,
    });
  });

  it('falls back to idle on unknown native state events', () => {
    const listener = vi.fn();
    const emitters: Array<(event: { state: string }) => void> = [];
    nativeMock.addListener.mockImplementation((_name, emit) => {
      emitters.push(emit);
      return { remove: vi.fn() };
    });

    loopbackAudio.onStateChanged(listener);
    const [emit] = emitters;

    emit({ state: 'unknown' });

    expect(listener).toHaveBeenLastCalledWith({ state: LOOPBACK_STATE.IDLE, reason: null });
  });

  it('unsubscribes through the native subscription', () => {
    const remove = vi.fn();
    nativeMock.addListener.mockReturnValue({ remove });

    const subscription = loopbackAudio.onStateChanged(vi.fn());

    subscription.remove();

    expect(remove).toHaveBeenCalledTimes(1);
  });
});

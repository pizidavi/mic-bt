import { beforeEach, describe, expect, it, vi } from 'vitest';

const nativeMock = vi.hoisted(() => ({
  start: vi.fn<() => Promise<boolean>>(),
  stop: vi.fn<() => Promise<boolean>>(),
  setGain: vi.fn<(value: number) => Promise<number>>(),
  setMuted: vi.fn<(muted: boolean) => Promise<boolean>>(),
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

import { loopbackAudio } from './loopbackAudio';

describe('loopbackAudio', () => {
  beforeEach(() => {
    nativeMock.start.mockReset().mockResolvedValue(true);
    nativeMock.stop.mockReset().mockResolvedValue(true);
    nativeMock.setGain.mockReset().mockImplementation((value: number) => Promise.resolve(value));
    nativeMock.setMuted.mockReset().mockResolvedValue(true);
    nativeMock.addListener.mockReset().mockReturnValue({ remove: vi.fn() });
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

  it('clamps the gain before applying it natively', async () => {
    await expect(loopbackAudio.setGain(100)).resolves.toBe(24);
    expect(nativeMock.setGain).toHaveBeenCalledWith(24);

    await expect(loopbackAudio.setGain(-50)).resolves.toBe(-6);
    expect(nativeMock.setGain).toHaveBeenCalledWith(-6);

    await expect(loopbackAudio.setGain(10)).resolves.toBe(10);
    expect(nativeMock.setGain).toHaveBeenCalledWith(10);
  });

  it('applies the mute flag natively', async () => {
    await expect(loopbackAudio.setMuted(true)).resolves.toBe(true);
    expect(nativeMock.setMuted).toHaveBeenCalledWith(true);

    await expect(loopbackAudio.setMuted(false)).resolves.toBe(true);
    expect(nativeMock.setMuted).toHaveBeenCalledWith(false);
  });

  it('forwards level events to the listener and unsubscribes', () => {
    const remove = vi.fn();
    const nativeHandler = vi.fn<(event: { levelDb: number }) => void>();
    nativeMock.addListener.mockImplementationOnce(
      (_event: string, handler: (event: { levelDb: number }) => void) => {
        nativeHandler.mockImplementation(handler);
        return { remove };
      },
    );
    const listener = vi.fn();

    const unsubscribe = loopbackAudio.onLevel(listener);
    expect(nativeMock.addListener).toHaveBeenCalledWith('onLevel', expect.any(Function));

    nativeHandler({ levelDb: -20 });
    expect(listener).toHaveBeenCalledWith(-20);

    unsubscribe();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});

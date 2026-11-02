import { useCallback, useEffect, useState } from 'react';

import { loopbackAudio } from '../services/loopbackAudio';
import { DEFAULT_GAIN_DB, clampGainDb, levelDbToPercent } from '../util/audio';
import { appLog } from '../util/logger';

const useAudioControls = (running: boolean) => {
  // State
  const [gainValue, setGainValue] = useState(DEFAULT_GAIN_DB);
  const [muted, setMuted] = useState(false);
  const [level, setLevel] = useState(0);

  // Callback
  const setGain = useCallback(async (db: number) => {
    const clamped = clampGainDb(db);
    setGainValue(clamped);
    const applied = await loopbackAudio.setGain(clamped).catch(e => {
      appLog.error('Loopback setGain failed', e);
      return clamped;
    });
    setGainValue(applied);
  }, []);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    loopbackAudio.setMuted(next).catch(e => appLog.error('Loopback setMuted failed', e));
  }, [muted]);

  // Effect
  useEffect(() => {
    if (!running) return;
    return loopbackAudio.onLevel(levelDb => setLevel(levelDbToPercent(levelDb)));
  }, [running]);

  return { gain: gainValue, muted, level: running ? level : 0, setGain, toggleMute };
};

export const useLoopbackAudio = () => {
  // State
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);

  // Hook
  const controls = useAudioControls(running);

  // Callback
  const start = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const started = await loopbackAudio.start().catch(e => {
      appLog.error('Loopback start failed', e);
      return false;
    });
    setRunning(started);
    setBusy(false);
  }, [busy]);

  const stop = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const stopped = await loopbackAudio.stop().catch(e => {
      appLog.error('Loopback stop failed', e);
      return false;
    });
    setRunning(!stopped);
    setBusy(false);
  }, [busy]);

  const toggle = useCallback(() => (running ? stop() : start()), [running, start, stop]);

  return { running, busy, start, stop, toggle, ...controls };
};

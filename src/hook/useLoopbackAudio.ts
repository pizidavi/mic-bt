import { useCallback, useState } from 'react';

import { loopbackAudio } from '../services/loopbackAudio';
import { appLog } from '../util/logger';

export const useLoopbackAudio = () => {
  // State
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);

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

  return { running, busy, start, stop, toggle };
};

import { useCallback, useEffect, useState } from 'react';

import { loopbackAudio } from '../services/loopbackAudio';
import { useLoopbackStore } from '../store/store';
import { LOOPBACK_STATE } from '../type/enum';
import { appLog } from '../util/logger';

export const useLoopbackAudio = () => {
  // Global state
  const state = useLoopbackStore(s => s.state);
  const reason = useLoopbackStore(s => s.reason);
  const setStatus = useLoopbackStore(s => s.setStatus);

  // State
  const [busy, setBusy] = useState(false);

  // Effect
  useEffect(() => {
    const subscription = loopbackAudio.onStateChanged(setStatus);
    return () => subscription.remove();
  }, [setStatus]);

  // Callback
  const start = useCallback(async () => {
    if (busy) return false;
    setBusy(true);
    const started = await loopbackAudio.start().catch(e => {
      appLog.error('Loopback start failed', e);
      return false;
    });
    if (started) setStatus({ state: LOOPBACK_STATE.RUNNING, reason: null });
    setBusy(false);
    return started;
  }, [busy, setStatus]);

  const stop = useCallback(async () => {
    if (busy) return false;
    setBusy(true);
    const stopped = await loopbackAudio.stop().catch(e => {
      appLog.error('Loopback stop failed', e);
      return false;
    });
    if (stopped) setStatus({ state: LOOPBACK_STATE.IDLE, reason: null });
    setBusy(false);
    return stopped;
  }, [busy, setStatus]);

  const toggle = useCallback(
    () => (state === LOOPBACK_STATE.RUNNING ? stop() : start()),
    [state, start, stop],
  );

  return {
    state,
    reason,
    running: state === LOOPBACK_STATE.RUNNING,
    stopped: state === LOOPBACK_STATE.STOPPED,
    busy,
    start,
    stop,
    toggle,
  };
};

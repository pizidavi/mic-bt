import { Platform } from 'react-native';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';

import LoopbackAudioModule from '../../modules/loopback-audio/src/LoopbackAudioModule';
import { LOOPBACK_STATE, LOOPBACK_STOP_REASON } from '../type/enum';

export type LoopbackStatus = {
  state: LOOPBACK_STATE;
  reason: LOOPBACK_STOP_REASON | null;
};

const STOPPED_PREFIX = `${LOOPBACK_STATE.STOPPED}:`;

const parseState = (raw: string): LoopbackStatus => {
  if (raw.startsWith(STOPPED_PREFIX)) {
    return {
      state: LOOPBACK_STATE.STOPPED,
      reason: raw.slice(STOPPED_PREFIX.length) as LOOPBACK_STOP_REASON,
    };
  }
  if (raw === LOOPBACK_STATE.RUNNING) return { state: LOOPBACK_STATE.RUNNING, reason: null };
  return { state: LOOPBACK_STATE.IDLE, reason: null };
};

const requestMicPermission = async () => {
  if (Platform.OS !== 'android') return false;
  return (await request(PERMISSIONS.ANDROID.RECORD_AUDIO)) === RESULTS.GRANTED;
};

export const loopbackAudio = {
  async start() {
    if (!(await requestMicPermission())) return false;
    return LoopbackAudioModule.start();
  },
  stop() {
    return LoopbackAudioModule.stop();
  },
  onStateChanged(listener: (status: LoopbackStatus) => void) {
    return LoopbackAudioModule.addListener('onStateChanged', event =>
      listener(parseState(event.state)),
    );
  },
};

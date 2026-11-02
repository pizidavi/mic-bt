import { Platform } from 'react-native';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';

import LoopbackAudioModule from '../../modules/loopback-audio/src/LoopbackAudioModule';
import { clampGainDb } from '../util/audio';

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
  setGain(db: number) {
    return LoopbackAudioModule.setGain(clampGainDb(db));
  },
  setMuted(muted: boolean) {
    return LoopbackAudioModule.setMuted(muted);
  },
  onLevel(listener: (levelDb: number) => void) {
    const subscription = LoopbackAudioModule.addListener('onLevel', event =>
      listener(event.levelDb),
    );
    return () => subscription.remove();
  },
};

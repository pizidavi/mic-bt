import { PermissionsAndroid, Platform } from 'react-native';

import LoopbackAudioModule from '../../modules/loopback-audio/src/LoopbackAudioModule';

const requestMicPermission = async () => {
  const recordAudio = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
  if (Platform.OS !== 'android' || !recordAudio) return false;
  const result = await PermissionsAndroid.request(recordAudio);
  return result === PermissionsAndroid.RESULTS.GRANTED;
};

export const loopbackAudio = {
  async start() {
    if (!(await requestMicPermission())) return false;
    return LoopbackAudioModule.start();
  },
  stop() {
    return LoopbackAudioModule.stop();
  },
};

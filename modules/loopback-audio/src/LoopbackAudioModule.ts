import { NativeModule, requireNativeModule } from 'expo';

declare class LoopbackAudioModule extends NativeModule<{}> {
  start(): Promise<boolean>;
  stop(): Promise<boolean>;
}

export default requireNativeModule<LoopbackAudioModule>('LoopbackAudio');

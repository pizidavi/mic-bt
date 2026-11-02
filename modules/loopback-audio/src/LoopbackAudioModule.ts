import { NativeModule, requireNativeModule } from 'expo';

type LoopbackAudioModuleEvents = {
  onStateChanged: (event: { state: string }) => void;
};

declare class LoopbackAudioModule extends NativeModule<LoopbackAudioModuleEvents> {
  start(): Promise<boolean>;
  stop(): Promise<boolean>;
}

export default requireNativeModule<LoopbackAudioModule>('LoopbackAudio');

import { NativeModule, requireNativeModule } from 'expo';

export type LoopbackAudioEvents = {
  onLevel: (event: { levelDb: number }) => void;
};

declare class LoopbackAudioModule extends NativeModule<LoopbackAudioEvents> {
  start(): Promise<boolean>;
  stop(): Promise<boolean>;
  setGain(value: number): Promise<number>;
  setMuted(muted: boolean): Promise<boolean>;
}

export default requireNativeModule<LoopbackAudioModule>('LoopbackAudio');

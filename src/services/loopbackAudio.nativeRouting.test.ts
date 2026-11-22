import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const engineSource = readFileSync(
  fileURLToPath(
    new URL(
      '../../modules/loopback-audio/android/src/main/java/expo/modules/loopbackaudio/AudioLoopbackEngine.kt',
      import.meta.url,
    ),
  ),
  'utf8',
);

const builderSection = (builder: string) =>
  engineSource.split(`${builder}.Builder()`).at(1)?.split('.setAudioFormat').at(0) ?? '';

describe('loopbackAudio native routing', () => {
  it('plays back through the media usage so A2DP speakers receive audio', () => {
    const playback = builderSection('AudioTrack');

    expect(playback).toContain('AudioAttributes.USAGE_MEDIA');
    expect(playback).not.toContain('USAGE_VOICE_COMMUNICATION');
  });

  it('captures from the plain mic source avoiding comm-mode attenuation', () => {
    const capture = builderSection('AudioRecord');

    expect(capture).toContain('AudioSource.MIC');
    expect(capture).not.toContain('AudioSource.VOICE_COMMUNICATION');
  });

  it('disables platform voice effects that would cancel the looped-back voice', () => {
    expect(engineSource).toContain('AcousticEchoCanceler.create');
    expect(engineSource).toContain('NoiseSuppressor.create');
    expect(engineSource).not.toContain('setEnabled(true)');
  });
});

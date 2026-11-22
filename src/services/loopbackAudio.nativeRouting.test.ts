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

  it('enable the echo canceler and noise suppression on', () => {
    expect(engineSource).toContain('AcousticEchoCanceler.create');
    expect(engineSource).toContain('NoiseSuppressor.create');
    const aecLine =
      engineSource.split('AcousticEchoCanceler.create').at(1)?.split('\n').at(0) ?? '';
    const nsLine = engineSource.split('NoiseSuppressor.create').at(1)?.split('\n').at(0) ?? '';
    expect(aecLine).toContain('setEnabled(true)');
    expect(nsLine).toContain('setEnabled(true)');
  });

  it('shifts the playback rate slightly to break the acoustic feedback loop', () => {
    expect(engineSource).toContain('PLAYBACK_SAMPLE_RATE = 16048');
    expect(engineSource).toContain('setSampleRate(PLAYBACK_SAMPLE_RATE)');
    expect(engineSource).toContain('getMinBufferSize(PLAYBACK_SAMPLE_RATE');
  });

  it('keeps the playback queue shallow to bound end-to-end latency', () => {
    expect(engineSource).toContain('QUEUE_CAPACITY = 4');
  });
});

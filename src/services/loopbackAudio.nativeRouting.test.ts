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

  it('keeps capturing from the voice communication source for echo cancellation', () => {
    const capture = builderSection('AudioRecord');

    expect(capture).toContain('AudioSource.VOICE_COMMUNICATION');
  });
});

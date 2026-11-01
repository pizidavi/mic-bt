# Mic-BT

Mic-BT is a mobile app that turns your phone into a wireless microphone: capture audio on the phone and stream it via Bluetooth to a paired device.

## How it works

1. Pair your phone with the receiving device over Bluetooth
2. Start capturing audio from the phone's microphone in-app
3. The audio is streamed via Bluetooth to the paired device

## Development

### Project setup

Clone the project

```bash
git clone https://github.com/pizidavi/mic-bt.git
```

Tools (Node, Java, pnpm, EAS CLI, Maestro) are managed via [mise](https://mise.jdx.dev)

```bash
mise install
```

Go to the project directory and install the dependencies

```bash
pnpm install
```

### Environment setup

A `.env` file is needed to run this application.
An example `.env.sample` file can be found inside the repository.

### Create native files

```bash
pnpm run prebuild
```

This app uses custom native code, so an [Expo Development Build](https://docs.expo.dev/develop/development-builds/introduction/) is required.

## Loopback audio module

`modules/loopback-audio/` is a local Expo module (Kotlin, [Expo Modules API](https://docs.expo.dev/modules)) that implements the core mic-to-Bluetooth loop:

- `LoopbackAudioModule` exposes `start()` / `stop()` to JS (both resolve to `boolean` success)
- `AudioLoopbackEngine` captures with `AudioSource.VOICE_COMMUNICATION` (16 kHz, mono, PCM 16-bit, 20 ms chunks, double-buffered) into a bounded queue and plays it back through `AudioTrack` (`MODE_STREAM`, `PERFORMANCE_MODE_LOW_LATENCY`) on the active media output (e.g. a paired Bluetooth speaker)
- The module ships a config plugin that adds `RECORD_AUDIO` to the Android manifest
- JS access is wrapped by `src/services/loopbackAudio.ts` (requests `RECORD_AUDIO` on first start) and the `useLoopbackAudio` hook, wired to a debug START/STOP button on the home screen

Native code changes are not hot-reloaded: re-run `pnpm run android` after touching the module.

### Run on device

1. Pair the phone with a Bluetooth speaker and make sure the speaker is the active media output
2. Build and run the dev build:

```bash
pnpm run android
```

3. Accept the microphone permission on first start, then press START: speaking into the phone should come out of the speaker within ~half a second. Press STOP to end the loop.

For Maestro E2E runs, grant the permission upfront:

```bash
adb shell pm grant app.pizidavi.micbt android.permission.RECORD_AUDIO
```

### Start application

```bash
pnpm run android   # build & run on an Android device/emulator
pnpm run dev       # start the Metro dev server
```

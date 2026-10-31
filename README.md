# Mic-BT

Mic-BT is a mobile app that turns your phone into a wireless microphone: capture audio on the phone and stream it via Bluetooth to a paired device.

## How it works (high level)

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

### Start application

```bash
pnpm run android   # build & run on an Android device/emulator
pnpm run dev       # start the Metro dev server
```

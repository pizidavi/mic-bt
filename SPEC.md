# Bluetooth Live Mic Android App

Real-time voice streaming from phone microphone to a connected Bluetooth speaker

## 1. Project Context

### 1.1 Goal

Build an Android app that turns the phone into a live microphone, broadcasting the user's voice in real time to a Bluetooth speaker connected to the same phone. The app is intended for making simple voice announcements at small private parties.

### 1.2 Use Case

- Single announcer speaks into the phone.
- The phone streams the captured audio to a Bluetooth speaker located nearby.
- One phone, one speaker (1:1).
- The phone stays physically close to the speaker (typical party setup).

### 1.3 Hard Constraints (agreed with the user)

| #   | Constraint                | Value                                         |
| --- | ------------------------- | --------------------------------------------- |
| 1   | End-to-end latency target | < 500 ms (mic → speaker)                      |
| 2   | Audio content             | Voice only (no music)                         |
| 3   | Bluetooth topology        | 1 phone → 1 speaker                           |
| 4   | Phone-to-speaker distance | Close (feedback risk is real)                 |
| 5   | Framework                 | Expo 58, Development Build                    |
| 6   | Native integration        | Custom native module via **Expo Modules API** |
| 7   | Implementation code       | Not included in this document                 |

### 1.4 Out of Scope

- iOS support.
- Multi-speaker or multi-phone configurations.
- Audio recording to disk / playback of stored files.
- Automatic Bluetooth pairing UI (handled by the OS).
- Music-grade fidelity.

---

## 2. Architecture Decisions

### 2.1 High-Level Pipeline

```
Phone (Expo Dev Build)
  AudioRecord (VOICE_COMMUNICATION, 16 kHz, mono, PCM 16-bit, 20 ms chunks)
       |   (AEC + NS + AGC auto-engaged by audio source;
       |    explicit effect attach as belt-and-braces)
       v
  Software gain (linear multiply + clamp, -6..+24 dB)
       |
       v
  AudioTrack (MODE_STREAM, PERFORMANCE_MODE_LOW_LATENCY)
       |
       v
  Android AudioManager (STREAM_MUSIC, AUDIOFOCUS_GAIN while live)
       |
       v
  Bluetooth A2DP routing (managed by OS)
       |
       v
  Bluetooth speaker
```

### 2.2 Key Decisions

| Area                  | Decision                                                                                        | Rationale                                                                                                                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build type            | Expo Development Build                                                                          | Custom native code is required; Expo Go cannot host custom native modules.                                                                                                                                                                    |
| Native bridge         | Expo Modules API (Kotlin), local module `modules/loopback-audio/`                               | Chosen over `react-native-live-audio-stream` or hand-written bridges. Cleaner lifecycle, first-class Expo integration.                                                                                                                        |
| Capture API           | `AudioRecord` with **`AudioSource.VOICE_COMMUNICATION`**, 16 kHz mono PCM 16-bit                | `VOICE_COMMUNICATION` is the only reliable way to engage platform AEC/NS/AGC across OEMs; plain `MIC` + manual effect attach is not.                                                                                                          |
| Chunk size            | 20 ms (320 samples) initial, double-buffered                                                    | Aggressive end of the 20–40 ms proposal; single constant in the engine, move to 40 ms in Phase 5 if frames drop.                                                                                                                              |
| DSP                   | AEC + NS + AGC via `VOICE_COMMUNICATION` (always-on, no UI toggle)                              | Phone sits near the speaker → feedback is the primary failure mode. Toggling effects mid-stream is unreliable anyway.                                                                                                                         |
| Gain                  | Software gain: linear multiply + clamp; slider −6…+24 dB, default 0, step 1                     | Platform AGC is already engaged via the audio source; a predictable software stage is controllable and clampable.                                                                                                                             |
| Playback API          | `AudioTrack`, `MODE_STREAM`, `PERFORMANCE_MODE_LOW_LATENCY`, small buffer                       | Lowest-latency output path available on Android for this use case.                                                                                                                                                                            |
| Bluetooth routing     | None in app code — rely on `STREAM_MUSIC` + A2DP, routed automatically by the OS                | Pairing and device selection are a system responsibility; the app just plays to the active media output.                                                                                                                                      |
| Audio output selector | Automatic (whatever the OS considers the active media output)                                   | User confirmed: no in-app device picker.                                                                                                                                                                                                      |
| Foreground service    | **`react-native-notify-kit`** owns the FGS (Notifee pattern)                                    | JS `registerForegroundService` runner + ongoing notification `asForegroundService: true`; config plugin opts into the `microphone` FGS type. No hand-written Kotlin service. Maintained Notifee fork, New Architecture, validated on RN 0.88. |
| Notification          | "Mic live" / "Streaming to \<speaker\>", ongoing, `AndroidImportance.LOW` (silent), Stop action | Silent at a party; one-tap stop from the shade is the safety hatch while backgrounded.                                                                                                                                                        |
| Audio focus           | Request `AUDIOFOCUS_GAIN` on `start()`, abandon on `stop()`                                     | The loop is the active media output and must participate in focus rules.                                                                                                                                                                      |
| Focus-loss policy     | Permanent loss → auto-stop; transient loss / duck → ignore                                      | Don't kill an announcement over a notification beep; do stop when a call takes over.                                                                                                                                                          |
| min Android version   | Expo default `minSdk`; runtime-branch the API 34+ FGS type; supported statement: Android 12+    | `FOREGROUND_SERVICE_MICROPHONE` only exists on API 34+ regardless of `minSdk`, so raising it buys nothing.                                                                                                                                    |
| Permissions           | `RECORD_AUDIO`, `POST_NOTIFICATIONS` — both requested at first START press                      | Mic is required (block START with explanation if denied); notifications best-effort (service runs without it, notification hidden).                                                                                                           |
| VU meter              | `onLevel(levelDb)` event at ~25 Hz, dBFS scaled −60…0, mono                                     | UI maps −60…0 → 0…100% of the bar. Throttled natively to avoid UI jank.                                                                                                                                                                       |

### 2.3 Interruption Handling (auto-stop cases)

All three cases funnel into a single status concept: `idle | running | stopped:<reason>`.

| Trigger                                                | Action                                                          | Recovery                                        |
| ------------------------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------- |
| BT speaker disconnects (`ACTION_AUDIO_BECOMING_NOISY`) | Auto-stop immediately (open mic + phone loudspeaker = howl)     | "Speaker disconnected" banner + one-tap restart |
| Incoming call / permanent audio-focus loss             | Auto-stop; mic is stolen by the call and BT may switch profiles | Reason banner + manual restart                  |
| Transient focus loss / duck                            | Ignore — keep streaming                                         | —                                               |

### 2.4 UI Surface (agreed)

Single screen with:

- Large START / STOP button.
- Status concept `idle | running | stopped:<reason>` with a reason banner and one-tap restart.
- Bluetooth speaker connection status indicator (initial state from `getAudioOutputInfo()`, live updates from `onAudioOutputChanged`).
- Gain slider (−6…+24 dB, default 0, step 1).
- Mute toggle.
- Simple VU meter (driven by `onLevel`).

Permission flow: on first START press, request `RECORD_AUDIO` first (blocking if denied), then `POST_NOTIFICATIONS` via `notifee.requestPermission()` (best-effort).

### 2.5 Native Module Surface (contract only — no implementation here)

The Kotlin module is expected to expose to JS:

- `start()` — begin capture + playback loop.
- `stop()` — stop loop.
- `setGain(value: number)` — software gain in dB (−6…+24, clamped).
- `setMuted(muted: boolean)` — mute mic input without stopping the loop.
- `getAudioOutputInfo()` — whether a Bluetooth A2DP device is currently the active media output (initial state for the UI indicator).
- `onAudioOutputChanged` event — emitted on audio-device change (also drives the BT-disconnect auto-stop).
- `onStateChanged` event — `idle | running | stopped:<reason>` for the UI.
- `onLevel(levelDb: number)` event — VU meter, ~25 Hz, dBFS −60…0.

The foreground service lifecycle is **not** part of the module: JS wires `notifee.registerForegroundService()` so the runner calls `start()` and stays alive while streaming, and the STOP paths call `stop()` + `notifee.stopForegroundService()`.

### 2.6 Latency Budget (realistic estimates)

| Stage                                      | Estimated latency                                             |
| ------------------------------------------ | ------------------------------------------------------------- |
| Mic capture + buffer (20 ms chunks)        | ~15–25 ms                                                     |
| AEC + NS processing                        | Device-dependent (often already included in the capture path) |
| Software gain                              | Negligible                                                    |
| AudioTrack + BT output path (deep buffer)  | ~40–100 ms                                                    |
| A2DP stack (BT transport + speaker buffer) | ~150–300 ms (dominant)                                        |
| **Total end-to-end**                       | **~300–450 ms**                                               |

Within the < 500 ms target on typical speakers, but **A2DP is the dominant and most variable term** — some speaker models exceed 500 ms on their own. See Risks.

---

## 3. Execution Plan

Six phases. Tests are part of each ticket's definition of done (see `docs/testing.md`): Vitest for JS-side logic, Maestro for E2E flows; native engine verification is manual/on-device only. Phase 1 is already complete in the repo.

| Phase                                       | Scope                                                                                                                                                                                                                                            | Output                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| 1. Project setup ✅ (done)                  | Expo 58 skeleton, `android/` prebuild, `src/` scaffold, Vitest + Maestro scaffolding. Remaining: none — permissions land with Phase 2/3                                                                                                          | Runnable Expo Dev Build skeleton         |
| 2. Native module (Kotlin, Expo Modules API) | `LoopbackAudioModule` + `AudioLoopbackEngine`: `VOICE_COMMUNICATION` capture → bounded queue → playback thread; software gain; AEC/NS/AGC; `RECORD_AUDIO` permission in manifest                                                                 | Native loopback working on device, no UI |
| 3. Foreground service via notify-kit        | Add `react-native-notify-kit`; config plugin opts into `microphone` FGS type + `POST_NOTIFICATIONS`; `registerForegroundService` runner; ongoing notification with Stop action; `FOREGROUND_SERVICE`(+`_MICROPHONE` on API 34+) manifest entries | App survives screen-off / background     |
| 4. UI (React)                               | Single screen, permission flow, status + reason banner, BT status, START/STOP, gain slider, mute, VU meter; `useLoopbackAudio` hook                                                                                                              | User-facing MVP                          |
| 5. On-device test & tune                    | `pnpm run android`; clap-test for latency; **howl test at party volume**; tune gain and chunk size against the actual speaker                                                                                                                    | Tuned, validated build                   |
| 6. Docs + tuning notes                      | README, per-speaker tuning notes, known limits                                                                                                                                                                                                   | Handover-ready package                   |

### Reference skills (canonical guides)

- Expo Modules API (Phase 2): https://github.com/expo/skills/raw/refs/heads/main/plugins/expo/skills/expo-module/SKILL.md
- Expo Router (Phase 4): https://github.com/expo/skills/raw/refs/heads/main/plugins/expo/skills/expo-router/SKILL.md
- Foreground service library: https://github.com/marcocrupi/react-native-notify-kit

---

## 4. Risks & Open Points

| Risk                                                                                                                                                                          | Impact                                                   | Mitigation                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AEC may not reference BT A2DP playback at all (device-dependent)** — platform AEC is tuned for the phone's own speaker; a ~300 ms A2DP echo tail often exceeds AEC coverage | Audible feedback / howling — **the #1 on-hardware risk** | Accept and document: explicit howl test in Phase 5; written phone-placement guidance (moderate volume, mic pointed away); no software output cap (fights party volume). Directional external mic as last resort. |
| A2DP latency varies heavily by speaker model (some exceed 500 ms)                                                                                                             | Target may be unmet on certain hardware                  | Clap-test during Phase 5; if budget breached, document affected speakers as "not recommended" and optionally expose a speaker-buffer tuning knob.                                                                |
| Android 14+ foreground microphone restrictions                                                                                                                                | App killed in background                                 | notify-kit foreground service with `microphone` type opt-in and persistent notification — in plan (Phase 3).                                                                                                     |
| Sandbox limitation: this environment cannot compile APKs or run on real hardware                                                                                              | Code cannot be validated end-to-end here                 | All code is delivered ready to build on the operator's machine via `pnpm run android`. Validation happens in Phase 5.                                                                                            |
| VU meter event rate                                                                                                                                                           | UI jank if events fired too often                        | Throttle level events to ~25 Hz from the native side.                                                                                                                                                            |
| A2DP codec quality vs HFP: HFP has **lower** latency but telephone-grade audio and call-audio (SCO) routing complications                                                     | Tempting fallback that breaks the use case               | Accept A2DP: media-speaker playback at voice quality; HFP does not fit "voice to media speaker" cleanly.                                                                                                         |

### Open Points

- ~~Exact chunk size~~ — settled: 20 ms initial; final tuning deferred to Phase 5.
- ~~AEC/NS UI toggle~~ — settled: always-on, no toggle.
- ~~Minimum supported Android version~~ — settled: Expo default `minSdk`, runtime-branch API 34+, "supported: Android 12+".

---

## 5. Next Operator To-Do

Concrete checklist to resume execution:

- [x] **Phase 1 — Setup** (done in repo)
  - [x] Expo 58 skeleton with Development Build (`expo-dev-client` configured via `app.config.ts`).
  - [x] `android/` prebuild present, `src/` scaffold, Vitest + Maestro scaffolding.
  - [ ] Permissions (`RECORD_AUDIO`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MICROPHONE`, `POST_NOTIFICATIONS`) land with Phases 2–3 — not yet in manifest.

- [ ] **Phase 2 — Native module**
  - [ ] Scaffold local module: `modules/loopback-audio/` via `create-expo-module --local` (see expo-module skill).
  - [ ] Implement `AudioLoopbackEngine`: `VOICE_COMMUNICATION` capture thread (16 kHz mono, 20 ms chunks) → bounded queue → playback thread.
  - [ ] Software gain stage (−6…+24 dB, clamp) + mute.
  - [ ] Verify: speak into the phone → voice comes out of the BT speaker.

- [ ] **Phase 3 — Foreground service via notify-kit**
  - [ ] Add `react-native-notify-kit`; use its config plugin for `microphone` FGS type + notification permission.
  - [ ] `registerForegroundService` runner calls `start()`; STOP paths call `stop()` + `stopForegroundService()`.
  - [ ] Ongoing silent notification ("Mic live" / "Streaming to \<speaker\>") with Stop action.
  - [ ] Verify: app keeps streaming when screen is off.

- [ ] **Phase 4 — UI**
  - [ ] Permission request flow at first START (mic blocking, notifications best-effort).
  - [ ] Status `idle | running | stopped:<reason>` with reason banner + one-tap restart.
  - [ ] BT status indicator (`getAudioOutputInfo` + `onAudioOutputChanged`).
  - [ ] START/STOP button, gain slider, mute toggle, VU meter (`onLevel`).
  - [ ] Wrap module access in a `useLoopbackAudio` hook.
  - [ ] Tests as part of the ticket: Vitest (hook, store, gain mapping), Maestro (permission → START → status → STOP).

- [ ] **Phase 5 — Test & tune**
  - [ ] Clap test: record total latency, confirm < 500 ms.
  - [ ] **Howl test**: speaker at party volume, phone at realistic placement.
  - [ ] Walk-test with the speaker at party volume.
  - [ ] Tune gain and chunk size against the actual speaker model.

- [ ] **Phase 6 — Wrap-up**
  - [ ] README with build + run instructions.
  - [ ] Per-speaker tuning notes + phone-placement guidance (feedback mitigation).
  - [ ] List of known limits and supported Android versions.

---

## 6. Conversation Reference

Key decisions captured during the design + technical-verification conversations, for traceability:

| Question raised                      | Resolution                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| Use case                             | Simple announcements at small private parties                                  |
| Max latency                          | < 500 ms                                                                       |
| Audio content                        | Voice only                                                                     |
| Framework                            | Expo 58, Development Build                                                     |
| Phone-to-speaker distance            | Close (feedback risk acknowledged)                                             |
| Topology                             | 1 phone → 1 speaker                                                            |
| Native integration approach          | Custom Kotlin module via Expo Modules API                                      |
| Audio source                         | `VOICE_COMMUNICATION` (auto AEC/NS/AGC; explicit attach as belt-and-braces)    |
| AEC posture vs BT playback           | Accept device-dependent behavior; document as #1 risk; howl test in Phase 5    |
| Foreground service                   | `react-native-notify-kit` owns it (Notifee pattern); no hand-written service   |
| Notification                         | "Mic live" / "Streaming to \<speaker\>", silent, ongoing, Stop action          |
| Gain + mute controls                 | Software gain −6…+24 dB (default 0); mute without stopping the loop            |
| Audio output selector                | Automatic, handled by the OS                                                   |
| BT disconnect mid-session            | Auto-stop, "Speaker disconnected", one-tap restart                             |
| Incoming call / permanent focus loss | Auto-stop, manual restart; transient duck ignored                              |
| Audio focus                          | `AUDIOFOCUS_GAIN` on start, abandon on stop                                    |
| min Android version                  | Expo default `minSdk`; runtime-branch API 34+; supported statement Android 12+ |
| AEC/NS toggle                        | Always-on, no UI toggle                                                        |
| Chunk size                           | 20 ms initial, tune in Phase 5                                                 |
| VU meter                             | `onLevel(levelDb)` ~25 Hz, dBFS −60…0                                          |
| Permission timing                    | First START press; mic blocking, notifications best-effort                     |
| Tests                                | Per-ticket DoD (Vitest + Maestro per `docs/testing.md`); native engine manual  |

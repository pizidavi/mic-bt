# AGENTS

This is a mobile app that allow to use the phone as a microphone to send the audio via Bluetooth.
Built using React Native and Expo.

## Instructions

- Always run `pnpm run typecheck` and `pnpm run lint` before finishing
- Always write unit tests and E2E tests. See `docs/testing.md`
- DO NOT write code comments, or for complex logic keep the minimum
- DO NOT edit README.md and AGENTS.md if not asked

## Key files

- `src/app/` - App screens and entry point using Expo Router
- `src/components/` - Reusable components
- `src/hook/` - Custom React hooks
- `src/locale/` - Localization files
- `src/services/` - Services to interact with the system (Bluetooth, Audio, etc)
- `src/store/store.ts` - Zustand store and types
- `src/type/enum.ts` - TypeScript enums
- `src/type/entity.ts` - TypeScript entitys
- `src/util/` - Utility functions

## Docs

- `docs/conventions.md` - To read when implementing component for structure, styling, general rules
- `docs/testing.md` - To read when implementing unit (Vitest) and E2E (Maestro) tests
- `docs/workflow.md` - To read when following the GitHub issue → PR workflow (gh-cli)

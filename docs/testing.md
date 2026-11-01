# Testing

Mandatory for new features and bug fixes. All green before PR.

## Unit tests (Vitest)

- Live next to component, same name + `.test.ts` / `.test.tsx`
- Run: `pnpm run test`

## E2E (Maestro)

- Flows in `.maestro/flows/`, one YAML per user journey, tagged (e.g. `smoke`)
- Select by test id (`- tapOn: { id: home-screen }`), never visible text (translations brittle)
- Test ids kebab-case, prefixed with screen name (e.g. `home-start-button`)
- Common components take a `testId` prop (branded `TestId` type from `src/util/test.ts`, built with `testId()` helper): forwarded to React Native's `testID`, Maestro maps to `id` on Android/iOS. Never raw `testID` props

## Guard

- Do not run E2E tests, only create them

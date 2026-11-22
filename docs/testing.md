# Testing

Mandatory for new features and bug fixes. All green before PR.

## Unit tests (Vitest)

- Live next to component, same name + `.test.ts` / `.test.tsx`
- Run: `pnpm run test`

## Component tests (React Native Testing Library)

- RNTL runs under Vitest via the `vitest-native` plugin in `vitest.config.ts` (real React Native code, no Jest); `test-renderer` is its render backend
- Live next to the component, same name + `.test.tsx`; same Vitest run as unit tests
- `await render(<Component />)`, then query via `screen` (RNTL 14 APIs are async)
- Prefer `userEvent` (press, type) over `fireEvent`
- Query by test id via the `testId()` helper (e.g. `screen.getByTestId('home-start-button')`) or by visible text; components don't set roles
- RNTL matchers (`toBeVisible`, `toBeDisabled`, `toHaveTextContent`, ...) are auto-registered, types referenced in `testing.d.ts`
- Import `@/locale` before rendering components that translate text
- Mock native modules/services with `vi.mock` as usual

## E2E (Maestro)

- Flows in `.maestro/flows/`, one YAML per user journey, tagged (e.g. `smoke`)
- Select by test id (`- tapOn: { id: home-screen }`), never visible text (translations brittle)
- Test ids kebab-case, prefixed with screen name (e.g. `home-start-button`)
- Common components take a `testId` prop (branded `TestId` type from `src/util/test.ts`, built with `testId()` helper): forwarded to React Native's `testID`, Maestro maps to `id` on Android/iOS. Never raw `testID` props

## Guard

- Do not run E2E tests, only create them

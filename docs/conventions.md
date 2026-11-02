# Conventions

## Component Structure

One component per file, default export. Function declarations for components, arrow functions for utilities.

Component structure order:

1. Hook (e.g., `useNavigation()`)
2. Global state
3. State (`useState`)
4. Reference (`useRef`)
5. API (`useQuery`)
6. Memo (`useMemo` or constants)
7. Callback (`useCallback`)
8. Imperative handle
9. Method (plain functions)
10. Effect (`useEffect`)
11. Render

Add a comment above each section with the section name.

## Styling

- **TailwindCSS via uniwind**: Use className prop on React Native components.
- **Class merging**: Use `clx()` helper from `src/util/util.ts` (wraps `twMerge`) for conditional classes.
- **Global styles**: Modify `src/global.css` for Tailwind imports.

## General

- No code comments, or minimum for complex logic.
- Always write unit tests and E2E tests for new features and bug fixes (see `testing.md`).
- Always run `pnpm run typecheck` and `pnpm run lint` before finishing.

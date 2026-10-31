# Workflow: GitHub Issues (gh-cli)

Task is given manually by user as GitHub link (e.g. `https://github.com/org/repo/issues/42`). One agent = one issue = one PR.

1. Parse issue number from link, fetch it: `gh issue view <n> --json title,body,comments`
2. `gh issue edit <n> --add-assignee @me`
3. Branch from `main`: `git checkout -b issue/<n>-short-desc`
4. Implement. Ask questions via issue comments (`gh issue comment <n>`), never block
5. Commit: conventional commits, reference issue (`feat: x (#<n>)`)
6. Run `pnpm run typecheck && pnpm run lint && pnpm test` — all green before PR
7. Push, then `gh pr create --fill --base main` with `Closes #<n>` in body
8. Do NOT merge own PR. Do NOT touch unrelated issues/files.

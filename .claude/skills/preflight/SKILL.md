---
name: preflight
description: Run every check of the HanDLEs repo (format, lint, types, tests, build, project rules) and report what blocks a commit or a PR. Use before committing, before opening a pull request, or when the user asks whether the branch is ready.
allowed-tools: Bash(npx prettier --check:*), Bash(npm run lint), Bash(npx vue-tsc --noEmit), Bash(npm test), Bash(npm run build), Bash(git status:*), Bash(git diff:*), Bash(grep:*), Read
---

# Preflight

Check that the current branch is ready to be committed or reviewed. **Report only: don't fix anything, don't commit,
don't push.** The user decides what happens next.

## 1. What changed

Run `git status --short` and `git diff --stat main...HEAD` (plus uncommitted changes) to list the files touched on this
branch. Mention untracked files: they are easy to forget in a commit.

## 2. Run the checks, in this order

Run each one even if a previous one failed, so the report is complete.

| #   | Check      | Command                  |
| --- | ---------- | ------------------------ |
| 1   | Formatting | `npx prettier --check .` |
| 2   | Lint       | `npm run lint`           |
| 3   | Types      | `npx vue-tsc --noEmit`   |
| 4   | Tests      | `npm test`               |
| 5   | Build      | `npm run build`          |

## 3. Check the project rules that tools don't fully cover

Only on the changed files:

- **No `server/` import from `src/`** (anti-cheat): `grep -rn "server/" src/` must not return any import.
- **`.js` relative imports in `server/`, `api/`, `lib/`** (Vercel runs them without a bundler; `*.test.ts` files are
  excluded, Vitest bundles them):
  - `grep -rn --exclude='*.test.ts' 'from "@/' server api lib` must return nothing;
  - `grep -rnE --exclude='*.test.ts' 'from "\.\.?/' server api lib` must only return lines ending in `.js";`.
- **English only**: no French text added in UI strings, comments or docs.
- **Tests**: a changed file in `lib/` or `src/components/` should have a matching `*.test.ts` that was updated or added.
  If not, flag it as a warning, not a blocker.
- **MIGRATION.md**: if the change contradicts one of its explanations, flag it.

## 4. Report

Answer with a short table, then the details of what failed:

```
| Check       | Result |
| ----------- | ------ |
| Formatting  | ✅ / ❌ (files) |
| Lint        | ✅ / ❌ (n errors) |
| Types       | ✅ / ❌ |
| Tests       | ✅ n passed / ❌ n failed |
| Build       | ✅ / ❌ |
| Rules       | ✅ / ⚠️ (what) |
```

End with one line: **Ready** or **Not ready**, and the exact command(s) that would fix the blockers (e.g.
`npx prettier --write lib/stats.ts`). Keep the output of passing checks out of the report.

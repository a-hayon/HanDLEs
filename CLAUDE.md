# HanDLEs

Wordle-style game: guess the mystery NBA player in 8 tries. Vue 3 + Vite front end, Hono API, deployed on Vercel.
Everything in the repo is written in **English** (UI text, code, comments, tests, docs, commit messages).

## Commands

```bash
npm run dev       # API (Hono, :3210) + front end (Vite, :5173 — falls back to :5174 if taken)
npm test          # Vitest: unit tests (lib/, server/) + component tests (src/)
npm run lint      # ESLint (Vue + TypeScript rules)
npm run build     # vue-tsc type check (templates included) + vite build
npm run format    # Prettier
```

A task is done only when `npm run lint`, `npm test` and `npm run build` all pass.

## Architecture

| Folder         | Role                                                                    | Runs in |
| -------------- | ----------------------------------------------------------------------- | ------- |
| `src/`         | Vue front end: `App.vue`, `components/`, Pinia store `stores/game.ts`   | browser |
| `server/`      | Hono API (`app.ts` = routes), mystery player (`target.ts`), player data | server  |
| `api/index.ts` | Vercel serverless entry point, wraps `server/app.ts`                    | Vercel  |
| `lib/`         | Shared pure TypeScript: comparison logic, types, teams, formatting      | both    |

API: `GET /api/players` (names only, for autocomplete) and `POST /api/guess` (returns colors/arrows, answer only at the end).

## Hard rules

- **`src/` must never import `server/`.** Player attributes and the secret stay on the server, otherwise players can
  cheat. ESLint enforces it (`no-restricted-imports`); never disable that rule.
- **Imports in `server/`, `api/` and `lib/` are relative and end with `.js`** (`./teams.js`, never `@/lib/teams`):
  Vercel runs the compiled ESM without a bundler. `src/` uses the `@/` alias (bundled by Vite).
- Never read, print or commit `.env*` files (except `.env.example`). `HANDLES_SECRET` decides the mystery player.
- Keep `lib/` free of Vue and of Node-only APIs: it is imported by both sides.
- Ask the user before committing, pushing, installing packages or calling external services.

## Vue conventions

- `<script setup lang="ts">` + Composition API only (no Options API). Props with `defineProps<{...}>()`,
  events with `defineEmits<{...}>()`.
- Multi-word component names in PascalCase (`GuessGrid.vue`, not `Grid.vue`).
- Shared game state lives in the Pinia setup store `useGameStore()`. Presentational components (`GuessInput`,
  `GuessGrid`, `EndBanner`) take props and emit events; they don't import the store.
- Use `ref` (not `reactive`), `computed` for derived values, `watch` only for side effects.
- Styling: Tailwind v4 utility classes; design tokens (`bg-ok`, `text-muted`, `bg-accent`…) are defined in
  `src/style.css` under `@theme`. Mobile first: the guess grid switches to a table at `lg:` (1024px).
- Accessibility: keep labels, `aria-*` attributes and keyboard support (see the combobox in `GuessInput.vue`).

## Tests

- Pure logic → `*.test.ts` next to the file (`lib/compareGuess.test.ts`).
- Components → Vue Test Utils + happy-dom, with `// @vitest-environment happy-dom` at the top
  (see `src/components/GuessInput.test.ts`). Test behavior (rendered text, emitted events), not internals.

## Gotchas

- The daily player changes at midnight **Paris time** (`lib/date.ts`), not UTC.
- Only the daily game is saved in `localStorage` (key `handles:daily:<date>`); random games are not persisted.
- `MIGRATION.md` is a learning guide (React → Vue). Update it when a change makes one of its explanations wrong.

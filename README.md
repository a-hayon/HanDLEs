# HanDLEs 🏀

A Wordle-style game: guess the **mystery NBA player** in 8 tries.
After each guess, the game shows what matches the player you are looking for:

| Criterion                  | Green (correct) | Yellow (close)                                                  | Arrow |
| -------------------------- | --------------- | --------------------------------------------------------------- | ----- |
| Team, conference, division | same            | —                                                               | —     |
| Position                   | same            | at least one position in common (e.g. Guard-Forward vs Forward) | —     |
| Height                     | same            | within 5 cm                                                     | ↑ / ↓ |
| Age                        | same            | within 2 years                                                  | ↑ / ↓ |
| Number                     | same            | within 3                                                        | ↑ / ↓ |

Two modes: **daily player** (the same for everyone, changes at midnight Paris time) and **random game**.

The layout adapts to the screen: a table on wide screens (≥ 1024px), one card per guess below that (tablets, phones).

## Stack

- [Vue 3](https://vuejs.org) (`<script setup>`, Composition API) + [Vite](https://vite.dev) + TypeScript
- [Pinia](https://pinia.vuejs.org) for the game state
- [Hono](https://hono.dev) for the API (Node server locally, serverless function on Vercel)
- Tailwind CSS v4
- Zod (API validation), Vitest + Vue Test Utils (tests)

> The first version was built with Next.js/React. The migration guide is in [MIGRATION.md](MIGRATION.md).

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in HANDLES_SECRET (openssl rand -hex 32)
npm run dev                   # front end on http://localhost:5173, API on :3210
```

Other commands:

```bash
npm test          # unit and component tests
npm run lint      # ESLint
npm run format    # Prettier
npm run build     # type check (vue-tsc) + front-end build into dist/
npm start         # production server (API + built front end)
```

## Architecture

```
index.html               # single page: Vue mounts into <div id="app">
src/                     # Vue front end (browser)
  main.ts                # createApp(App).use(createPinia()).mount("#app")
  App.vue                # header, footer, loads the player list
  stores/game.ts         # Pinia store: game state, saving, API calls
  components/            # GameBoard, GuessInput, GuessGrid, EndBanner, ColorLegend
server/                  # Hono API — never imported by src/ (ESLint rule)
  app.ts                 # the routes: GET /api/players, POST /api/guess
  index.ts               # runs app.ts as a Node server (dev, npm start; serves dist/ in production)
  target.ts              # picks the mystery player (HMAC + HANDLES_SECRET)
  players.ts             # player data
api/index.ts             # on Vercel: runs app.ts as a serverless function
lib/                     # shared code, no Vue dependency
  compareGuess.ts        # comparison logic (pure function, tested)
  types.ts, teams.ts, format.ts, date.ts
```

**Why keep everything on the server?** The browser never receives player attributes or the answer:
it sends a player id and only gets colors/arrows back. The mystery player is derived from a server
secret, so it can't be guessed even by reading this code. The answer is only revealed at the end of the game.

## Deployment (Vercel)

`vercel.json` declares a **Vite** project: the built front end (`dist/`) is served statically and every
`/api/*` request goes to the serverless function `api/index.ts`. The `HANDLES_SECRET` variable must be
set in the Vercel settings, for _Production_ **and** _Preview_.

Imports on the server side and in `lib/` are relative and end with `.js` (e.g. `./teams.js`):
Vercel functions run the code compiled to ESM by Node, which knows neither the `@/` alias nor extensionless imports.

## Data

`server/players.ts` holds 53 players from the **2025-26 end-of-season** rosters, entered by hand.
Moves from the 2026 offseason are not included yet.

## Ideas

- [ ] Postgres database (Neon / Supabase) + Drizzle
- [ ] Python script (`nba_api`) to sync rosters, run nightly by GitHub Actions
- [ ] Stats and win streaks
- [ ] Wordle-style result sharing

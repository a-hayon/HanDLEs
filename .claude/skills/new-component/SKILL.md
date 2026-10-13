---
name: new-component
description: Create a new Vue component in src/components with its component test, following the HanDLEs conventions (script setup + TypeScript, props/emits, Tailwind tokens, accessibility). Use when the user asks for a new component, panel, button or UI section.
argument-hint: <ComponentName> [what it should do]
---

# New Vue component

Create the component described by: **$ARGUMENTS**

## 1. Clarify before writing

- **Name**: PascalCase and **multi-word** (Vue style guide rule `vue/multi-word-component-names`, enforced by ESLint).
  If the user gave a single word (`Stats`), propose a multi-word name (`StatsPanel`) and use it.
- **Kind** — decide and state it in one sentence:
  - **Presentational** (default): receives data through `defineProps`, reports user actions through `defineEmits`,
    does **not** import a Pinia store. Like `GuessInput`, `GuessGrid`, `EndBanner`.
  - **Connected**: reads/writes shared state with `useGameStore()` (or another store). Like `GameBoard`. Only when
    the component drives the game; prefer a presentational child + a connected parent.
- If what the component should display or do is unclear, ask the user before writing code.

## 2. Write the files

Start from the templates next to this file:

- [Component.vue.tpl](Component.vue.tpl) → `src/components/<Name>.vue`
- [Component.test.ts.tpl](Component.test.ts.tpl) → `src/components/<Name>.test.ts`

Rules:

- `<script setup lang="ts">`, typed `defineProps<{...}>()` / `defineEmits<{...}>()`, `ref` + `computed`
  (`watch` only for side effects). No Options API.
- Imports: `@/lib/...` for shared code, never anything from `server/` (anti-cheat rule).
- Styling: Tailwind utilities and the project tokens from `src/style.css` (`bg-ok`, `bg-near`, `bg-no`, `text-muted`,
  `border-line`, `bg-accent`, `text-accent`…). Copy the card look from `GameBoard.vue` if it's a panel. Mobile first:
  it must work at 375px wide, use `lg:` for wide-screen variants.
- Accessibility: real `<button>` elements for actions, labels for inputs, `aria-label` when the text alone is not
  enough, keyboard support for anything clickable.
- All text in English.

The test must check **behavior** visible from outside: rendered text for given props, emitted events after a
click / key press. At least one test per prop that changes the output and one per emitted event.

## 3. Wire it (only if asked)

If the user wants it displayed, add it to its parent (`App.vue` or `GameBoard.vue`) and pass props / listen to events
there. Otherwise, say where it could go and stop.

## 4. Verify

Run `npx prettier --write` on the new files, then `npm run lint`, `npm test` and `npx vue-tsc --noEmit`. Fix what
fails. Finish with: the files created, the props/emits API of the component in a short table, and how to see it in
the app.

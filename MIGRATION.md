# From React/Next.js to Vue 3 — what changed in HanDLEs

This guide walks through the project's migration, file by file, and explains the basics of Vue 3 along the way.
To compare with the old version, read any file from the last Next.js commit, e.g.
`git show f66dc4f:components/GuessInput.tsx`.

---

## 1. Overview: where did everything go?

| Before (Next.js)                           | After (Vue + Vite)                                       | Why                                                                                       |
| ------------------------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `app/layout.tsx` (`<html>` tags, font)     | `index.html`                                             | With Vite, the HTML page is a real file; Vue mounts into `#app`.                          |
| _(handled by Next)_                        | `src/main.ts`                                            | We start the app ourselves: `createApp(App).use(createPinia()).mount("#app")`.            |
| `app/page.tsx` (server component)          | `src/App.vue` + `GET /api/players`                       | No server components in "plain" Vue: the front end asks the API for the list.             |
| `app/api/guess/route.ts`                   | `server/app.ts` (Hono)                                   | Vite only does front end; the API becomes a small standalone Hono app (see §1b).          |
| `components/GameLoader.tsx` (`ssr: false`) | _removed_                                                | No server rendering ⇒ everything runs in the browser, `localStorage` is always available. |
| `components/Game.tsx` (state + display)    | `src/stores/game.ts` (state) + `GameBoard.vue` (display) | The game state was moved into a Pinia store (see §9).                                     |
| `EndBanner` (inside `Game.tsx`)            | `src/components/EndBanner.vue`                           | In Vue, it's **one component per** `.vue` **file**.                                       |
| `Legend.tsx`, `Game.tsx`                   | `ColorLegend.vue`, `GameBoard.vue`                       | Vue style guide rule: multi-word names (avoids clashes with HTML tags).                   |
| `import "server-only"`                     | ESLint `no-restricted-imports` rule on `src/**`          | `server-only` is React-specific; here ESLint forbids `src/` from importing `server/`.     |
| `lib/*` (pure logic)                       | `lib/*` **almost unchanged**                             | TypeScript without React doesn't need migrating. Only the imports gained `.js` (see §1b). |

> 💡 **Architecture lesson**: the logic in `lib/` (comparison, types, formatting) survived unchanged
> and its tests pass as they are. Keeping business logic separate from the framework is what makes a migration easy.

### 1b. One API, two ways to run it

Next.js automatically deployed `app/api/guess/route.ts` as a **serverless function** on Vercel. Without Next, we do it ourselves:

- `server/app.ts` defines the Hono routes, without starting anything;
- `server/index.ts` listens on a port: a classic **Node server** (`npm run dev`, `npm start`);
- `api/index.ts` wraps it in `handle(app)`: a **serverless function** that Vercel runs for every `/api/*`
  request (rewritten by `vercel.json`).

On Vercel, Node runs the TypeScript compiled to ESM **without a bundler**: the `@/` alias doesn't exist and every
relative import needs its extension. Hence the `../lib/teams.js` imports in `server/` and `lib/` (TypeScript understands
that `.js` points to the `.ts` file). The front end is bundled by Vite, so `src/` keeps the `@/` alias.

---

## 2. The single-file component (`.vue`)

A `.vue` file (SFC, _Single File Component_) has up to three blocks:

```vue
<script setup lang="ts">
// The logic: imports, state, functions. Everything declared here can be used in the template.
</script>

<template>
  <!-- The HTML, using Vue's template syntax (not JSX). -->
</template>

<style scoped>
/* Optional: CSS scoped to this component. We don't need it here thanks to Tailwind. */
</style>
```

Key difference with React: **in React, a component is a function that re-runs on every render.**
In Vue, `<script setup>` **runs only once**, when the component is created. It's the
_template_ that gets re-evaluated when reactive data changes. As a result:

- no `useCallback`, no dependency arrays: a function declared in `<script setup>` is created once;
- no "rules of hooks": you can call `ref()` / `computed()` inside an `if`, a function, another file…

`ColorLegend.vue` doesn't even have a `<script>`: a purely static component is just a `<template>`.

---

## 3. Reactivity: `ref` replaces `useState`

```ts
// React (Game.tsx)
const [pending, setPending] = useState(false);
setPending(true);

// Vue (stores/game.ts)
const pending = ref(false);
pending.value = true;
```

- `ref(x)` creates a **reactive box**. In TypeScript code, you read / write its content through `.value`.
- **No `.value` in the template**: Vue unwraps refs automatically (`{{ query }}`, not `{{ query.value }}`).
- No setter: you assign directly, Vue detects the write and updates whatever depends on the value.

### Mutate instead of copying

In React you must create a new object to trigger a render:

```ts
// React
setGame((g) => ({ ...g, guesses: [...g.guesses, data.feedback], solved: data.solved }));
```

Vue wraps objects in a _Proxy_ that intercepts changes. So you can mutate directly:

```ts
// Vue
game.value.guesses.push(data.feedback);
game.value.solved = data.solved;
```

### `ref` or `reactive`?

`reactive({ ... })` also exists (a reactive object without `.value`), but you can't reassign it as a whole and it
loses reactivity when destructured. The current official recommendation: **use `ref` everywhere** — which is what we do here.

---

## 4. `computed` replaces `useMemo`

```ts
// React (GuessInput.tsx)
const suggestions = useMemo(() => { ... }, [query, options, excluded]);

// Vue (GuessInput.vue)
const suggestions = computed(() => {
  const q = normalize(query.value.trim());
  if (!q) return [];
  return props.options.filter((o) => !props.excluded.has(o.id) && normalize(o.name).includes(q)).slice(0, 6);
});
```

**No dependency array**: Vue records by itself the reactive values read during the computation
(`query`, `props.options`, `props.excluded`) and only recomputes when one of them changes. The result is
cached. A `computed` is also read with `.value` in the script (`suggestions.value.length`).

In React, `over`, `guessedIds` and `tryNumber` were recomputed on every render. In the store, they are `computed`.

---

## 5. `watch` / `onMounted` replace `useEffect`

`useEffect` did two different jobs. Vue has one tool for each.

**React to a data change → `watch`** (saving the game in `stores/game.ts`):

```ts
// React
useEffect(() => {
  localStorage.setItem(key, JSON.stringify(game));
}, [game, todayKey]);

// Vue
watch(
  game,
  (g) => {
    localStorage.setItem(storageKey(todayKey), JSON.stringify(g));
  },
  { deep: true },
);
```

`deep: true` is needed because we **mutate** `game` (`guesses.push`) instead of replacing it: without it,
`watch` only tracks the object's reference. (`watchEffect(() => …)` also exists: it automatically tracks
everything it reads, like a `computed` that performs a side effect.)

**Do something when the component appears → lifecycle hooks** (`App.vue`):

```ts
onMounted(() => store.loadPlayers());
```

The others: `onBeforeMount`, `onUpdated`, `onUnmounted` (to clean up a `setInterval`, a listener…).

---

## 6. Template syntax (the biggest visual change)

| Need               | React (JSX)                               | Vue (template)                                          |
| ------------------ | ----------------------------------------- | ------------------------------------------------------- |
| Display a value    | `{store.error}`                           | `{{ store.error }}`                                     |
| Dynamic attribute  | `disabled={pending}`                      | `:disabled="pending"` (shorthand for `v-bind:disabled`) |
| Event              | `onClick={playDaily}`                     | `@click="playDaily"` (shorthand for `v-on:click`)       |
| Condition          | `{!over && <GuessInput />}`               | `<GuessInput v-if="!over" />`                           |
| Else               | `cond ? <A/> : <B/>`                      | `<A v-if="cond" />` then `<B v-else />` / `v-else-if`   |
| Loop               | `{items.map((o, i) => <li key={o.id}>…)}` | `<li v-for="(o, i) in items" :key="o.id">…`             |
| Loop over a number | `Array.from({ length: 8 }, (_, i) => …)`  | `v-for="i in 8"` (i goes from **1** to 8)               |
| CSS class          | `className={...}`                         | `class="..."` (static) + `:class="..."` (dynamic)       |
| Inline style       | `style={{ animationDelay: "90ms" }}`      | `:style="{ animationDelay: '90ms' }"`                   |
| `for` attribute    | `htmlFor`                                 | `for` — it's real HTML                                  |

Inside a directive's quotes (`:disabled="…"`, `v-if="…"`), you write **a JavaScript expression**.

### `:class`, much handier than template strings

`class` and `:class` can live on the same tag and get merged. `:class` accepts a string, an
array, or an **object** `{ className: condition }`:

```vue
<!-- React -->
<li className={`flex ... ${i === active ? "bg-accent-soft" : ""}`}>

<!-- Vue (GuessInput.vue) -->
<li class="flex ..." :class="{ 'bg-accent-soft': i === active }">
```

### `v-if` or `v-show`?

`v-if` adds/removes the element from the DOM; `v-show` keeps it and toggles `display: none`. `v-show` is better
for something you show/hide very often. A classic interview question!

> ⚠️ Never put `v-if` and `v-for` on the same element: filter in a `computed` instead
> (that's what `suggestions` does).

---

## 7. Forms and events

### `v-model`: two-way binding

```tsx
// React: controlled input, you wire up both directions
<input value={query} onChange={(e) => setQuery(e.target.value)} />
```

```vue
<!-- Vue: v-model does both at once -->
<input v-model="query" />
```

`v-model="query"` is equivalent to `:value="query" @input="query = $event.target.value"`. We kept an
`@input="active = 0"` next to it to move the selection back to the top on every keystroke.

### Event modifiers

React's `onKeyDown`, with its `if / else if` on `e.key` and its `e.preventDefault()` calls, becomes in Vue:

```vue
<input
  v-model="query"
  @keydown.down.prevent="move(1)"
  @keydown.up.prevent="move(-1)"
  @keydown.enter.prevent="pickActive"
  @keydown.esc="query = ''"
/>
```

`.down` / `.enter` / `.esc` filter the key, `.prevent` calls `preventDefault()`. There are also
`.stop` (`stopPropagation`), `.once`, `.self`, `.ctrl`…

---

## 8. Component communication: props and emits

**Props (parent → child)**: declared with `defineProps`, using a TypeScript type.

```ts
// EndBanner.vue
const props = defineProps<{ solved: boolean; answer: PlayerSummary; tries: number }>();
```

Props are **read-only**: a child never modifies a prop, it notifies its parent.

**Emits (child → parent)**: this is the big difference with React. In React, the parent passes a
**function** as a prop (`onPick={submit}`). In Vue, the child **emits an event** and the parent listens with `@`:

```ts
// GuessInput.vue
const emit = defineEmits<{ pick: [playerId: number] }>();
emit("pick", o.id);
```

```vue
<!-- GameBoard.vue -->
<GuessInput :options="store.players" :excluded="store.guessedIds" @pick="store.submit" />
```

This is called **one-way data flow**: data goes down through props, events go up through emits.

> `defineProps` and `defineEmits` are compiler _macros_: no need to import them.

---

## 9. Pinia: the game store

### What is "the game state"?

It's the data describing where the player stands: the mode (daily player / random), the guesses
made so far, whether it's won, the revealed answer, whether a request is in flight, an error message.
In the React version, all of this lived in `useState` calls inside `Game.tsx`.

### What is Pinia?

**Pinia is Vue's official state management library**, the equivalent of
Redux / Zustand on the React side. A **store** is a **global** reactive object: any component can read it
and call its actions with `useGameStore()`, without passing data down from parent to child through props
(what's called _prop drilling_).

A store holds three things:

| Concept     | In `stores/game.ts`                                | Component equivalent   |
| ----------- | -------------------------------------------------- | ---------------------- |
| **state**   | `players`, `game`, `pending`, `error` (`ref`s)     | `useState` / `ref`     |
| **getters** | `over`, `guessedIds`, `tryNumber` (`computed`s)    | `useMemo` / `computed` |
| **actions** | `loadPlayers`, `submit`, `playDaily`, `playRandom` | functions              |

We wrote it as a **"setup store"**: exactly the same syntax as a `<script setup>`. There is also
an "options store" syntax (`state: () => ({...}), getters: {...}, actions: {...}`) that you'll see in older projects.

The benefit here: `App.vue` (footer with the player count) and `GameBoard.vue` share the same data
without passing anything to each other. Bonus: the **Vue DevTools** browser extension shows the store and its history — give it a try!

> ⚠️ Classic pitfall: `const { pending } = useGameStore()` **breaks reactivity** (it copies the value).
> Write `store.pending`, or `const { pending } = storeToRefs(useGameStore())`.

### Store or props? The choice made here

- `GameBoard.vue` uses the store: it's the "smart" component driving the game.
- `GuessInput`, `GuessGrid`, `EndBanner` do **not** know about the store: they receive props and emit
  events. They stay reusable and easy to test (see `GuessInput.test.ts`).

### What about composables?

A `useSomething()` function that uses `ref` / `computed` / `watch` and returns reactive values
is called a **composable** (the equivalent of a React custom hook). The difference with a Pinia store: each call
to a composable creates **new state**, whereas a store is **shared** (a single instance).

---

## 10. What went away with Next.js

- **`"use client"`**: without server rendering, everything is "client".
- **`GameLoader` / `dynamic(..., { ssr: false })`**: it prevented the server HTML from differing from
  the client's because of `localStorage`. That problem no longer exists.
- **The `page.tsx` server component**: replaced by the `GET /api/players` call in `onMounted`.
- **`next/font`**: the Archivo font is loaded through a Google Fonts `<link>` in `index.html`.
- **File-based routing**: the app has a single page. For several pages, you'd add **vue-router**
  (see the exercises).

`useId()` also exists in Vue (since 3.5) and works the same way.

---

## 11. Testing a Vue component

`src/components/GuessInput.test.ts` mounts the component with **Vue Test Utils** in a fake DOM (happy-dom):

```ts
const wrapper = mount(GuessInput, { props: { options, excluded: new Set() } });
await wrapper.get("input").setValue("doncic"); // types into the input
await wrapper.get("input").trigger("keydown", { key: "Enter" });
expect(wrapper.emitted("pick")).toEqual([[6]]); // checks the emitted event
```

The `await` matters: Vue batches DOM updates and applies them on the next "tick"
(which is also what `nextTick()` is for).

---

## 12. Responsive layout

`GuessGrid.vue` used to be an 8-column table with a minimum width of 780px, so small screens had to scroll sideways.
It now has two layouts, switched with Tailwind's `lg:` prefix (≥ 1024px), without any JavaScript:

- **below 1024px**: one card per guess — the player on top, then the cells on two lines
  (4 categorical criteria, then 3 numeric ones), each with its own small label;
- **from 1024px up**: the table, with a header row.

The trick is `lg:contents`: the wrappers that build the two lines on mobile get `display: contents` on large screens.
They then generate no box, and their cells become direct children of the table row's grid.

---

## 13. Common interview questions

1. **Options API vs Composition API?** The Options API (`data()`, `methods`, `computed: {}`, `mounted()`) is
   the older way to write components, still very common in Vue 2 projects and many
   codebases. The Composition API (`<script setup>`, `ref`, `computed`) groups code by feature and
   is shared through composables. This project uses the Composition API. Look at what `GuessInput` would
   look like with the Options API so you can read both.
2. **How does reactivity work?** JS Proxies: on read, Vue records who depends on the value; on write,
   it notifies those dependents (template, `computed`, `watch`).
3. **`computed` vs method?** A `computed` is cached as long as its dependencies don't change; a method
   called in the template re-runs on every render.
4. **`watch` vs `computed`?** `computed` to **derive a value**, `watch` to **trigger a side effect**
   (request, `localStorage`, logging…).
5. **Why `:key` in a `v-for`?** So Vue knows which DOM element matches which piece of data when
   the list changes (same reason as `key` in React). Don't use the index if the list can be reordered.
6. **How does a child change the parent's data?** It doesn't: it `emit`s an event
   (or you use `v-model` on a component, with `defineModel()`).
7. **`v-if` vs `v-show`?** See §6.

---

## 14. Exercises to improve this project

From easiest to most ambitious:

1. **`<Transition>`**: fade `EndBanner` in with Vue's built-in `<Transition>` component.
2. **`defineModel`**: turn `GuessInput` into a component whose parent can read the input with `v-model`.
3. **Composable**: extract `GuessInput`'s keyboard navigation into `src/composables/useListNavigation.ts`.
4. **Random game persistence**: also save the ongoing random game, so a refresh doesn't lose it.
5. **Stats**: a second Pinia store `useStatsStore` (games played, wins, current streak), saved
   in `localStorage`, updated when `game.over` turns `true` (a `watch`!).
6. **Sharing**: a button that copies a Wordle-style 🟩🟨⬜ emoji grid (`navigator.clipboard`).
7. **vue-router**: add a `/rules` page and a `/stats` page, with a `<RouterLink>` in the header.

# De React/Next.js à Vue 3 — ce qui a changé dans HanDLEs

Ce guide suit la migration du projet, fichier par fichier, et explique au passage les bases de Vue 3.
Pour comparer avec l'ancienne version : `git diff main vue -- src/components/GuessInput.vue`, ou
`git show main:components/GuessInput.tsx`.

---

## 1. Vue d'ensemble : où est passé quoi ?

| Avant (Next.js)                             | Après (Vue + Vite)                                        | Pourquoi                                                                                              |
| ------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `app/layout.tsx` (balises `<html>`, police) | `index.html`                                              | Avec Vite, la page HTML est un vrai fichier ; Vue se monte dans `#app`.                               |
| _(géré par Next)_                           | `src/main.ts`                                             | On démarre l'appli soi-même : `createApp(App).use(createPinia()).mount("#app")`.                      |
| `app/page.tsx` (composant serveur)          | `src/App.vue` + `GET /api/players`                        | Pas de composants serveur en Vue « classique » : le front demande la liste à l'API.                   |
| `app/api/guess/route.ts`                    | `server/app.ts` (Hono)                                    | Vite ne fait que du front ; l'API devient une petite appli Hono à part (voir §1 bis).                 |
| `components/GameLoader.tsx` (`ssr: false`)  | _supprimé_                                                | Pas de rendu serveur ⇒ tout s'exécute dans le navigateur, `localStorage` est toujours dispo.          |
| `components/Game.tsx` (état + affichage)    | `src/stores/game.ts` (état) + `GameBoard.vue` (affichage) | L'état de la partie est sorti dans un store Pinia (voir §8).                                          |
| `EndBanner` (dans `Game.tsx`)               | `src/components/EndBanner.vue`                            | En Vue, c'est **un composant par fichier** `.vue`.                                                    |
| `Legend.tsx`, `Game.tsx`                    | `ColorLegend.vue`, `GameBoard.vue`                        | Règle du style guide Vue : noms en plusieurs mots (évite les conflits avec les balises HTML).         |
| `import "server-only"`                      | règle ESLint `no-restricted-imports` sur `src/**`         | `server-only` est propre à React ; ici ESLint interdit à `src/` d'importer `server/`.                 |
| `lib/*` (logique pure)                      | `lib/*` **presque inchangé**                              | Du TypeScript sans React n'a pas besoin d'être migré. Seuls les imports ont pris `.js` (voir §1 bis). |

> 💡 **Leçon d'architecture** : la logique de `lib/` (comparaison, types, formatage) a survécu sans modification
> et ses tests passent tels quels. Séparer la logique métier du framework, c'est ce qui rend une migration facile.

### 1 bis. Une API, deux façons de la lancer

Next.js déployait tout seul `app/api/guess/route.ts` en **fonction serverless** sur Vercel. Sans Next, on le fait nous-mêmes :

- `server/app.ts` définit les routes Hono, sans rien démarrer ;
- `server/index.ts` l'écoute sur un port : c'est un **serveur Node** classique (`npm run dev`, `npm start`) ;
- `api/index.ts` l'enveloppe dans `handle(app)` : c'est une **fonction serverless**, exécutée par Vercel à chaque requête
  `/api/*` (redirigées par `vercel.json`).

Sur Vercel, Node exécute le TypeScript compilé en ESM, **sans bundler** : l'alias `@/` n'existe pas et chaque import
relatif doit avoir son extension. D'où les imports `../lib/teams.js` dans `server/` et `lib/` (TypeScript comprend que
`.js` désigne le fichier `.ts`). Le front, lui, est compilé par Vite, donc `src/` garde l'alias `@/`.

---

## 2. Le composant monofichier (`.vue`)

Un fichier `.vue` (SFC, _Single File Component_) a jusqu'à trois blocs :

```vue
<script setup lang="ts">
// La logique : imports, état, fonctions. Tout ce qui est déclaré ici est utilisable dans le template.
</script>

<template>
  <!-- Le HTML, avec la syntaxe de template Vue (pas du JSX). -->
</template>

<style scoped>
/* Optionnel : du CSS limité à ce composant. On ne s'en sert pas ici grâce à Tailwind. */
</style>
```

Différence clé avec React : **en React, le composant est une fonction qui se ré-exécute à chaque rendu.**
En Vue, `<script setup>` **ne s'exécute qu'une seule fois**, à la création du composant. C'est le
_template_ qui est ré-évalué quand les données réactives changent. Conséquences :

- pas de `useCallback`, pas de tableau de dépendances : une fonction déclarée dans `<script setup>` est créée une fois ;
- pas de « règles des hooks » : on peut appeler `ref()` / `computed()` dans un `if`, une fonction, un autre fichier…

`ColorLegend.vue` n'a même pas de `<script>` : un composant purement statique n'est qu'un `<template>`.

---

## 3. La réactivité : `ref` remplace `useState`

```ts
// React (Game.tsx)
const [pending, setPending] = useState(false);
setPending(true);

// Vue (stores/game.ts)
const pending = ref(false);
pending.value = true;
```

- `ref(x)` crée une **boîte réactive**. On lit / écrit son contenu via `.value` dans le code TypeScript.
- **Dans le template, pas de `.value`** : Vue « déballe » les refs automatiquement (`{{ query }}`, pas `{{ query.value }}`).
- Pas de setter : on assigne directement, Vue détecte l'écriture et met à jour ce qui dépend de la valeur.

### Muter au lieu de recopier

En React il faut créer un nouvel objet pour déclencher un rendu :

```ts
// React
setGame((g) => ({ ...g, guesses: [...g.guesses, data.feedback], solved: data.solved }));
```

Vue enveloppe les objets dans un _Proxy_ qui intercepte les modifications. On peut donc muter directement :

```ts
// Vue
game.value.guesses.push(data.feedback);
game.value.solved = data.solved;
```

### `ref` ou `reactive` ?

`reactive({ ... })` existe aussi (objet réactif sans `.value`), mais on ne peut pas le réassigner en entier et on perd
la réactivité si on le déstructure. La recommandation officielle actuelle : **utiliser `ref` partout** — c'est ce qu'on fait ici.

---

## 4. `computed` remplace `useMemo`

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

**Pas de tableau de dépendances** : Vue enregistre tout seul les valeurs réactives lues pendant le calcul
(`query`, `props.options`, `props.excluded`) et ne recalcule que si l'une d'elles change. Le résultat est
mis en cache. Un `computed` se lit aussi avec `.value` dans le script (`suggestions.value.length`).

Dans React, `over`, `guessedIds` et `tryNumber` étaient recalculés à chaque rendu. Dans le store, ce sont des `computed`.

---

## 5. `watch` / `onMounted` remplacent `useEffect`

`useEffect` faisait deux métiers différents. Vue a un outil pour chacun.

**Réagir à un changement de donnée → `watch`** (sauvegarde de la partie dans `stores/game.ts`) :

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

`deep: true` est nécessaire parce qu'on **mute** `game` (`guesses.push`) au lieu de le remplacer : sans ça,
le `watch` ne surveille que la référence de l'objet. (`watchEffect(() => …)` existe aussi : il suit
automatiquement tout ce qu'il lit, comme un `computed` qui ferait un effet de bord.)

**Faire quelque chose quand le composant apparaît → hooks de cycle de vie** (`App.vue`) :

```ts
onMounted(() => store.loadPlayers());
```

Les autres : `onBeforeMount`, `onUpdated`, `onUnmounted` (pour nettoyer un `setInterval`, un listener…).

---

## 6. La syntaxe des templates (le plus gros changement visuel)

| Besoin               | React (JSX)                               | Vue (template)                                         |
| -------------------- | ----------------------------------------- | ------------------------------------------------------ |
| Afficher une valeur  | `{store.error}`                           | `{{ store.error }}`                                    |
| Attribut dynamique   | `disabled={pending}`                      | `:disabled="pending"` (raccourci de `v-bind:disabled`) |
| Événement            | `onClick={playDaily}`                     | `@click="playDaily"` (raccourci de `v-on:click`)       |
| Condition            | `{!over && <GuessInput />}`               | `<GuessInput v-if="!over" />`                          |
| Sinon                | `cond ? <A/> : <B/>`                      | `<A v-if="cond" />` puis `<B v-else />` / `v-else-if`  |
| Boucle               | `{items.map((o, i) => <li key={o.id}>…)}` | `<li v-for="(o, i) in items" :key="o.id">…`            |
| Boucle sur un nombre | `Array.from({ length: 8 }, (_, i) => …)`  | `v-for="i in 8"` (i va de **1** à 8)                   |
| Classe CSS           | `className={...}`                         | `class="..."` (statique) + `:class="..."` (dynamique)  |
| Style inline         | `style={{ animationDelay: "90ms" }}`      | `:style="{ animationDelay: '90ms' }"`                  |
| Attribut `for`       | `htmlFor`                                 | `for` — c'est du vrai HTML                             |

Dans les guillemets d'une directive (`:disabled="…"`, `v-if="…"`), on écrit **une expression JavaScript**.

### `:class`, bien plus pratique que les template strings

`class` et `:class` peuvent coexister sur la même balise et sont fusionnés. `:class` accepte une chaîne, un
tableau, ou un **objet** `{ classe: condition }` :

```vue
<!-- React -->
<li className={`flex ... ${i === active ? "bg-accent-soft" : ""}`}>

<!-- Vue (GuessInput.vue) -->
<li class="flex ..." :class="{ 'bg-accent-soft': i === active }">
```

### `v-if` ou `v-show` ?

`v-if` ajoute/retire l'élément du DOM ; `v-show` le garde et bascule `display: none`. `v-show` vaut mieux pour
quelque chose qu'on affiche/masque très souvent. Question classique d'entretien !

> ⚠️ Ne jamais mettre `v-if` et `v-for` sur le même élément : filtrer plutôt dans un `computed`
> (c'est ce que fait `suggestions`).

---

## 7. Formulaires et événements

### `v-model` : la liaison bidirectionnelle

```tsx
// React : input contrôlé, il faut câbler les deux sens
<input value={query} onChange={(e) => setQuery(e.target.value)} />
```

```vue
<!-- Vue : v-model fait les deux d'un coup -->
<input v-model="query" />
```

`v-model="query"` équivaut à `:value="query" @input="query = $event.target.value"`. On a gardé un
`@input="active = 0"` à côté pour remettre la sélection en haut à chaque frappe.

### Les modificateurs d'événements

Le `onKeyDown` de React, avec son `if / else if` sur `e.key` et ses `e.preventDefault()`, devient en Vue :

```vue
@keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter.prevent="pickActive" @keydown.esc="query =
''" @mousedown.prevent="pick(o)"
```

`.down` / `.enter` / `.esc` filtrent la touche, `.prevent` appelle `preventDefault()`. Il existe aussi
`.stop` (`stopPropagation`), `.once`, `.self`, `.ctrl`…

---

## 8. Communication entre composants : props et emits

**Props (parent → enfant)** : on les déclare avec `defineProps`, avec un type TypeScript.

```ts
// EndBanner.vue
const props = defineProps<{ solved: boolean; answer: PlayerSummary; tries: number }>();
```

Les props sont **en lecture seule** : un enfant ne modifie jamais une prop, il prévient son parent.

**Emits (enfant → parent)** : c'est la grande différence avec React. En React, le parent passe une
**fonction** en prop (`onPick={submit}`). En Vue, l'enfant **émet un événement** et le parent l'écoute avec `@` :

```ts
// GuessInput.vue
const emit = defineEmits<{ pick: [playerId: number] }>();
emit("pick", o.id);
```

```vue
<!-- GameBoard.vue -->
<GuessInput :options="store.players" :excluded="store.guessedIds" @pick="store.submit" />
```

On appelle ça le **flux de données à sens unique** : les données descendent par les props, les événements remontent par les emits.

> `defineProps`, `defineEmits` sont des _macros_ du compilateur : pas besoin de les importer.

---

## 9. Pinia : le store de la partie

### C'est quoi, « l'état de la partie » ?

Ce sont les données qui décrivent où en est le joueur : le mode (joueur du jour / aléatoire), les essais
déjà faits, si c'est gagné, la réponse révélée, s'il y a une requête en cours, un message d'erreur.
Dans la version React, tout ça vivait dans des `useState` à l'intérieur de `Game.tsx`.

### C'est quoi, Pinia ?

**Pinia est la bibliothèque officielle de gestion d'état (_state management_) de Vue**, l'équivalent de
Redux / Zustand côté React. Un **store** est un objet réactif **global** : n'importe quel composant peut le lire
et appeler ses actions avec `useGameStore()`, sans faire passer les données de parent en enfant en props
(ce qu'on appelle le _prop drilling_).

Un store contient trois choses :

| Notion      | Dans `stores/game.ts`                              | Équivalent composant   |
| ----------- | -------------------------------------------------- | ---------------------- |
| **state**   | `players`, `game`, `pending`, `error` (des `ref`)  | `useState` / `ref`     |
| **getters** | `over`, `guessedIds`, `tryNumber` (des `computed`) | `useMemo` / `computed` |
| **actions** | `loadPlayers`, `submit`, `playDaily`, `playRandom` | fonctions              |

On l'a écrit en **« setup store »** : c'est exactement la même syntaxe qu'un `<script setup>`. Il existe aussi
une syntaxe « options store » (`state: () => ({...}), getters: {...}, actions: {...}`) qu'on voit dans les vieux projets.

Le bénéfice ici : `App.vue` (pied de page avec le nombre de joueurs) et `GameBoard.vue` partagent les mêmes données
sans rien se passer. Bonus : l'extension navigateur **Vue DevTools** affiche le store et son historique — à essayer !

> ⚠️ Piège classique : `const { pending } = useGameStore()` **casse la réactivité** (on copie la valeur).
> Il faut écrire `store.pending`, ou `const { pending } = storeToRefs(useGameStore())`.

### Store ou props ? Le choix fait ici

- `GameBoard.vue` utilise le store : c'est le composant « intelligent » qui pilote la partie.
- `GuessInput`, `GuessGrid`, `EndBanner` ne connaissent **pas** le store : ils reçoivent des props et émettent
  des événements. Ils restent réutilisables et faciles à tester (voir `GuessInput.test.ts`).

### Et les composables ?

Une fonction `useQuelqueChose()` qui utilise `ref` / `computed` / `watch` et retourne des valeurs réactives
s'appelle un **composable** (l'équivalent d'un custom hook React). La différence avec un store Pinia : chaque appel
d'un composable crée **un nouvel état**, alors qu'un store est **partagé** (une seule instance).

---

## 10. Ce qui a disparu avec Next.js

- **`"use client"`** : sans rendu serveur, tout est « client ».
- **`GameLoader` / `dynamic(..., { ssr: false })`** : il servait à éviter que le HTML du serveur ne diffère
  de celui du client à cause de `localStorage`. Le problème n'existe plus.
- **Le composant serveur `page.tsx`** : remplacé par l'appel `GET /api/players` dans `onMounted`.
- **`next/font`** : la police Archivo est chargée par un `<link>` Google Fonts dans `index.html`.
- **Le routage par fichiers** : l'appli n'a qu'une page. Pour plusieurs pages, on ajouterait **vue-router**
  (voir les exercices).

`useId()` existe aussi en Vue (depuis la 3.5) et s'utilise pareil.

---

## 11. Tester un composant Vue

`src/components/GuessInput.test.ts` monte le composant avec **Vue Test Utils** dans un faux DOM (happy-dom) :

```ts
const wrapper = mount(GuessInput, { props: { options, excluded: new Set() } });
await wrapper.get("input").setValue("doncic"); // tape dans l'input
await wrapper.get("input").trigger("keydown", { key: "Enter" });
expect(wrapper.emitted("pick")).toEqual([[6]]); // vérifie l'événement émis
```

Le `await` est important : Vue regroupe les mises à jour du DOM et les applique au « tick » suivant
(c'est aussi le rôle de `nextTick()`).

---

## 12. Questions fréquentes en entretien

1. **Options API vs Composition API ?** L'Options API (`data()`, `methods`, `computed: {}`, `mounted()`) est
   l'ancienne façon d'écrire des composants, encore très présente dans les projets Vue 2 et dans beaucoup de
   codebases. La Composition API (`<script setup>`, `ref`, `computed`) regroupe le code par fonctionnalité et
   se partage via des composables. Ce projet utilise la Composition API. Regarde à quoi ressemble `GuessInput`
   en Options API pour savoir lire les deux.
2. **Comment marche la réactivité ?** Proxies JS : à la lecture, Vue enregistre qui dépend de la valeur ; à l'écriture,
   il prévient ces dépendances (template, `computed`, `watch`).
3. **`computed` vs méthode ?** Un `computed` est mis en cache tant que ses dépendances ne changent pas, une méthode
   appelée dans le template est ré-exécutée à chaque rendu.
4. **`watch` vs `computed` ?** `computed` pour **dériver une valeur**, `watch` pour **déclencher un effet de bord**
   (requête, `localStorage`, log…).
5. **Pourquoi `:key` dans un `v-for` ?** Pour que Vue sache quel élément du DOM correspond à quelle donnée quand
   la liste change (même raison que `key` en React). Ne pas utiliser l'index si la liste peut être réordonnée.
6. **Comment un enfant modifie-t-il une donnée du parent ?** Il ne la modifie pas : il `emit` un événement
   (ou on utilise `v-model` sur un composant, avec `defineModel()`).
7. **`v-if` vs `v-show` ?** Voir §6.

---

## 13. Exercices pour progresser sur ce projet

Classés du plus simple au plus ambitieux :

1. **`<Transition>`** : faire apparaître `EndBanner` en fondu avec le composant intégré `<Transition>` de Vue.
2. **`defineModel`** : transformer `GuessInput` pour que le parent puisse lire la saisie avec `v-model`.
3. **Composable** : extraire la navigation clavier de `GuessInput` dans `src/composables/useListNavigation.ts`.
4. **Statistiques** : un second store Pinia `useStatsStore` (parties jouées, victoires, série en cours), sauvegardé
   dans `localStorage`, alimenté quand `game.over` passe à `true` (un `watch` !).
5. **Partage** : un bouton qui copie la grille d'emojis 🟩🟨⬜ façon Wordle (`navigator.clipboard`).
6. **vue-router** : ajouter une page `/regles` et une page `/stats`, avec un `<RouterLink>` dans l'en-tête.

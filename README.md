# HanDLEs 🏀

Un jeu à la Wordle : devine le **joueur NBA mystère** en 8 essais.
À chaque proposition, le jeu indique ce qui colle avec le joueur à trouver :

| Critère                      | Vert (correct) | Jaune (proche)                                             | Flèche |
| ---------------------------- | -------------- | ---------------------------------------------------------- | ------ |
| Équipe, conférence, division | identique      | —                                                          | —      |
| Poste                        | identique      | au moins un poste en commun (ex. Arrière-Ailier vs Ailier) | —      |
| Taille                       | identique      | à 5 cm près                                                | ↑ / ↓  |
| Âge                          | identique      | à 2 ans près                                               | ↑ / ↓  |
| Numéro                       | identique      | à 3 près                                                   | ↑ / ↓  |

Deux modes : **joueur du jour** (le même pour tout le monde, change à minuit heure de Paris) et **partie aléatoire**.

## Stack

- [Vue 3](https://vuejs.org) (`<script setup>`, Composition API) + [Vite](https://vite.dev) + TypeScript
- [Pinia](https://pinia.vuejs.org) pour l'état de la partie
- [Hono](https://hono.dev) pour l'API (serveur Node)
- Tailwind CSS v4
- Zod (validation de l'API), Vitest + Vue Test Utils (tests)

> La première version était en Next.js/React (branche `main`). Le guide de migration est dans [MIGRATION.md](MIGRATION.md).

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis remplis HANDLES_SECRET (openssl rand -hex 32)
npm run dev                   # front sur http://localhost:5173, API sur :3210
```

Autres commandes :

```bash
npm test          # tests unitaires
npm run lint      # ESLint
npm run format    # Prettier
npm run build     # vérif des types (vue-tsc) + build du front dans dist/
npm start         # serveur de production (API + front compilé)
```

## Architecture

```
index.html               # page unique : Vue s'y monte dans <div id="app">
src/                     # front Vue (navigateur)
  main.ts                # createApp(App).use(createPinia()).mount("#app")
  App.vue                # en-tête, pied de page, charge la liste des joueurs
  stores/game.ts         # store Pinia : état de la partie, sauvegarde, appels à l'API
  components/            # GameBoard, GuessInput, GuessGrid, EndBanner, ColorLegend
server/                  # API Hono — jamais importé par src/ (règle ESLint)
  app.ts                 # les routes : GET /api/players, POST /api/guess
  index.ts               # lance app.ts comme serveur Node (dev, npm start ; sert dist/ en production)
  target.ts              # choix du joueur mystère (HMAC + HANDLES_SECRET)
  players.ts             # données des joueurs
api/index.ts             # sur Vercel : lance app.ts comme fonction serverless
lib/                     # code partagé, sans dépendance à Vue
  compareGuess.ts        # logique de comparaison (fonction pure, testée)
  types.ts, teams.ts, format.ts, date.ts
```

**Pourquoi tout côté serveur ?** Le navigateur ne reçoit jamais les attributs des joueurs ni la réponse :
il envoie un identifiant de joueur et reçoit seulement les couleurs/flèches. Le joueur mystère est dérivé
d'un secret serveur, donc impossible à deviner même en lisant ce code. La réponse n'est révélée qu'en fin de partie.

## Déploiement (Vercel)

`vercel.json` déclare un projet **Vite** : le front compilé (`dist/`) est servi en statique et chaque
requête `/api/*` est envoyée à la fonction serverless `api/index.ts`. La variable `HANDLES_SECRET` doit être
définie dans les réglages Vercel, pour _Production_ **et** _Preview_.

Les imports côté serveur et dans `lib/` sont relatifs et finissent par `.js` (ex. `./teams.js`) :
les fonctions Vercel exécutent le code compilé en ESM par Node, qui ne connaît ni l'alias `@/` ni les imports sans extension.

## Données

`server/players.ts` contient 53 joueurs avec les effectifs de **fin de saison 2025-26**, saisis à la main.
Les mouvements de l'intersaison 2026 ne sont pas encore pris en compte.

## Pistes

- [ ] Base Postgres (Neon / Supabase) + Drizzle
- [ ] Script Python (`nba_api`) pour synchroniser les effectifs, lancé chaque nuit par GitHub Actions
- [ ] Statistiques et séries de victoires
- [ ] Partage du résultat façon Wordle

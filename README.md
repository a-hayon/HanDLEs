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

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4
- Zod (validation de l'API), Vitest (tests)

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis remplis HANDLES_SECRET (openssl rand -hex 32)
npm run dev                   # http://localhost:3000
```

Autres commandes :

```bash
npm test          # tests unitaires
npm run lint      # ESLint
npm run format    # Prettier
npm run build     # build de production
```

## Architecture

```
app/
  page.tsx               # composant serveur : envoie au navigateur la liste des noms uniquement
  api/guess/route.ts     # POST /api/guess : compare l'essai au joueur mystère, côté serveur
components/              # composants client (saisie, grille, légende)
lib/
  compareGuess.ts        # logique de comparaison (fonction pure, testée)
  target.ts              # choix du joueur mystère (server-only, HMAC + HANDLES_SECRET)
  types.ts, teams.ts, format.ts
data/
  players.ts             # données des joueurs (server-only)
```

**Pourquoi tout côté serveur ?** Le navigateur ne reçoit jamais les attributs des joueurs ni la réponse :
il envoie un identifiant de joueur et reçoit seulement les couleurs/flèches. Le joueur mystère est dérivé
d'un secret serveur, donc impossible à deviner même en lisant ce code. La réponse n'est révélée qu'en fin de partie.

## Données

`data/players.ts` contient 53 joueurs avec les effectifs de **fin de saison 2025-26**, saisis à la main.
Les mouvements de l'intersaison 2026 ne sont pas encore pris en compte.

## Pistes

- [ ] Base Postgres (Neon / Supabase) + Drizzle
- [ ] Script Python (`nba_api`) pour synchroniser les effectifs, lancé chaque nuit par GitHub Actions
- [ ] Statistiques et séries de victoires
- [ ] Partage du résultat façon Wordle

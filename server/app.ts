import { Hono } from "hono";
import { z } from "zod";
import { ageOn, compareGuess } from "../lib/compareGuess.js";
import { TEAMS } from "../lib/teams.js";
import { MAX_TRIES, type GuessResponse, type PlayerOption } from "../lib/types.js";
import { getPlayer, PLAYERS } from "./players.js";
import { getDailyTarget, getRandomTarget } from "./target.js";

/**
 * L'API, sans démarrage de serveur : elle est utilisée par server/index.ts (Node, en local)
 * et par api/index.ts (fonction serverless sur Vercel).
 */
const app = new Hono();

/** Liste pour l'autocomplétion : on n'envoie au navigateur que les noms, jamais les attributs. */
const options: PlayerOption[] = PLAYERS.map((p) => ({
  id: p.id,
  name: p.name,
  teamName: TEAMS[p.team].name,
})).sort((a, b) => a.name.localeCompare(b.name, "fr"));

app.get("/api/players", (c) => c.json(options));

const Body = z.object({
  playerId: z.number().int().positive(),
  /** Numéro de l'essai (1 à 8) : au dernier, on révèle la réponse. */
  attempt: z.number().int().min(1).max(MAX_TRIES),
  /** Absent = joueur du jour ; présent = partie aléatoire. */
  gameId: z.uuid().optional(),
});

app.post("/api/guess", async (c) => {
  const parsed = Body.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Requête invalide" }, 400);
  }
  const { playerId, attempt, gameId } = parsed.data;

  const guess = getPlayer(playerId);
  if (!guess) {
    return c.json({ error: "Joueur inconnu" }, 404);
  }

  const target = gameId ? getRandomTarget(gameId) : getDailyTarget();
  const today = new Date();
  const solved = guess.id === target.id;

  const body: GuessResponse = { feedback: compareGuess(guess, target, today), solved };
  if (solved || attempt >= MAX_TRIES) {
    body.answer = {
      name: target.name,
      teamName: TEAMS[target.team].name,
      position: target.position,
      heightCm: target.heightCm,
      age: ageOn(target.birthDate, today),
      number: target.number,
    };
  }
  return c.json(body);
});

export default app;

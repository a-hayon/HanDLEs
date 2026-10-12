import { Hono } from "hono";
import { z } from "zod";
import { ageOn, compareGuess } from "../lib/compareGuess.js";
import { TEAMS } from "../lib/teams.js";
import { MAX_TRIES, type GuessResponse, type PlayerOption } from "../lib/types.js";
import { getPlayer, PLAYERS } from "./players.js";
import { getDailyTarget, getRandomTarget } from "./target.js";

/**
 * The API, without starting a server: it is used by server/index.ts (Node, locally)
 * and by api/index.ts (serverless function on Vercel).
 */
const app = new Hono();

/** Autocomplete list: the browser only ever gets names, never player attributes. */
const options: PlayerOption[] = PLAYERS.map((p) => ({
  id: p.id,
  name: p.name,
  teamName: TEAMS[p.team].name,
})).sort((a, b) => a.name.localeCompare(b.name, "en"));

app.get("/api/players", (c) => c.json(options));

const Body = z.object({
  playerId: z.number().int().positive(),
  /** Guess number (1 to 8): the answer is revealed on the last one. */
  attempt: z.number().int().min(1).max(MAX_TRIES),
  /** Missing = daily player; present = random game. */
  gameId: z.uuid().optional(),
});

app.post("/api/guess", async (c) => {
  const parsed = Body.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Invalid request" }, 400);
  }
  const { playerId, attempt, gameId } = parsed.data;

  const guess = getPlayer(playerId);
  if (!guess) {
    return c.json({ error: "Unknown player" }, 404);
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

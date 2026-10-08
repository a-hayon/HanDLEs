import { z } from "zod";
import { getPlayer } from "@/data/players";
import { ageOn, compareGuess } from "@/lib/compareGuess";
import { getDailyTarget, getRandomTarget } from "@/lib/target";
import { TEAMS } from "@/lib/teams";
import { MAX_TRIES, type GuessResponse } from "@/lib/types";

const Body = z.object({
  playerId: z.number().int().positive(),
  /** Numéro de l'essai (1 à 8) : au dernier, on révèle la réponse. */
  attempt: z.number().int().min(1).max(MAX_TRIES),
  /** Absent = joueur du jour ; présent = partie aléatoire. */
  gameId: z.uuid().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { playerId, attempt, gameId } = parsed.data;

  const guess = getPlayer(playerId);
  if (!guess) {
    return Response.json({ error: "Joueur inconnu" }, { status: 404 });
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
  return Response.json(body);
}

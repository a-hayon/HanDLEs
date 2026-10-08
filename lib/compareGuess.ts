import { TEAMS } from "./teams";
import type { Cell, GuessFeedback, Player, Position, Verdict } from "./types";

/** Seuils pour la couleur « proche » (jaune). */
export const TOLERANCE = { heightCm: 5, age: 2, number: 3 } as const;

/** Âge en années révolues à la date `today`. */
export function ageOn(birthDate: string, today: Date): number {
  const [y, m, d] = birthDate.split("-").map(Number);
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age--;
  return age;
}

function exact<T>(guess: T, target: T): Cell<T> {
  return { value: guess, verdict: guess === target ? "correct" : "wrong" };
}

function numeric(guess: number, target: number, tolerance: number): Cell<number> {
  if (guess === target) return { value: guess, verdict: "correct" };
  return {
    value: guess,
    verdict: Math.abs(guess - target) <= tolerance ? "near" : "wrong",
    direction: target > guess ? "up" : "down",
  };
}

/** Postes identiques = correct ; au moins un poste en commun (ex. G-F vs F) = proche. */
export function comparePosition(guess: Position, target: Position): Cell<Position> {
  if (guess === target) return { value: guess, verdict: "correct" };
  const t = target.split("-");
  const shared = guess.split("-").some((p) => t.includes(p));
  const verdict: Verdict = shared ? "near" : "wrong";
  return { value: guess, verdict };
}

/** Fonction pure : compare un essai au joueur mystère. Testée dans compareGuess.test.ts. */
export function compareGuess(guess: Player, target: Player, today = new Date()): GuessFeedback {
  const g = TEAMS[guess.team];
  const t = TEAMS[target.team];
  return {
    playerId: guess.id,
    name: guess.name,
    teamName: g.name,
    team: exact(guess.team, target.team),
    conference: exact(g.conference, t.conference),
    division: exact(g.division, t.division),
    position: comparePosition(guess.position, target.position),
    height: numeric(guess.heightCm, target.heightCm, TOLERANCE.heightCm),
    age: numeric(ageOn(guess.birthDate, today), ageOn(target.birthDate, today), TOLERANCE.age),
    number: numeric(guess.number, target.number, TOLERANCE.number),
  };
}

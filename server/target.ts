import { createHmac } from "node:crypto";
import { parisDateKey } from "../lib/date.js";
import type { Player } from "../lib/types.js";
import { PLAYERS } from "./players.js";

/**
 * The mystery player is derived from a server secret (HANDLES_SECRET).
 * Even with the public source code, nobody can work out the answer.
 */
function secret(): string {
  const s = process.env.HANDLES_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("HANDLES_SECRET must be set in production.");
  }
  return "dev-secret-not-for-production";
}

function pick(seed: string, players: Player[] = PLAYERS): Player {
  const digest = createHmac("sha256", secret()).update(seed).digest();
  return players[digest.readUInt32BE(0) % players.length];
}

export function getDailyTarget(dateKey = parisDateKey()): Player {
  return pick(`daily:${dateKey}`);
}

/** Random game: the client keeps an opaque id, the server derives the player from it. */
export function getRandomTarget(gameId: string): Player {
  return pick(`random:${gameId}`);
}

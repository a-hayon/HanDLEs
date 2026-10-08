import "server-only";
import { createHmac } from "node:crypto";
import { PLAYERS } from "@/data/players";
import type { Player } from "./types";

/**
 * Le joueur mystère est dérivé d'un secret serveur (HANDLES_SECRET).
 * Même en lisant le code source public, on ne peut pas deviner la réponse.
 */
function secret(): string {
  const s = process.env.HANDLES_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("HANDLES_SECRET doit être défini en production.");
  }
  return "dev-secret-not-for-production";
}

function pick(seed: string, players: Player[] = PLAYERS): Player {
  const digest = createHmac("sha256", secret()).update(seed).digest();
  return players[digest.readUInt32BE(0) % players.length];
}

/** Date du jour à Paris au format YYYY-MM-DD : le joueur change à minuit, heure française. */
export function parisDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(now);
}

export function getDailyTarget(dateKey = parisDateKey()): Player {
  return pick(`daily:${dateKey}`);
}

/** Partie aléatoire : le client garde un identifiant opaque, le serveur en déduit le joueur. */
export function getRandomTarget(gameId: string): Player {
  return pick(`random:${gameId}`);
}

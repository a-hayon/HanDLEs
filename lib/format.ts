import type { Position } from "./types.js";

const POSITION_LABELS: Record<string, string> = { G: "Guard", F: "Forward", C: "Center" };

export function positionLabel(p: Position): string {
  return p
    .split("-")
    .map((x) => POSITION_LABELS[x])
    .join("-");
}

/** Lowercase without accents, so that "doncic" or "sengun" match. */
export function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

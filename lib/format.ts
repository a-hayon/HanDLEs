import type { Position } from "./types";

const POSITION_FR: Record<string, string> = { G: "Arrière", F: "Ailier", C: "Pivot" };

export function positionLabel(p: Position): string {
  return p
    .split("-")
    .map((x) => POSITION_FR[x])
    .join("-");
}

/** Minuscules sans accents, pour chercher « doncic » ou « sengun ». */
export function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

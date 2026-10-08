import { describe, expect, it } from "vitest";
import { ageOn, compareGuess, comparePosition } from "./compareGuess";
import type { Player } from "./types";

const base: Player = {
  id: 1,
  name: "Joueur A",
  team: "DEN",
  position: "C",
  heightCm: 211,
  birthDate: "1995-02-19",
  number: 15,
};
const today = new Date(2026, 9, 8); // 8 octobre 2026

describe("ageOn", () => {
  it("compte les années révolues", () => {
    expect(ageOn("1995-02-19", today)).toBe(31);
    expect(ageOn("2000-10-09", today)).toBe(25); // anniversaire demain
    expect(ageOn("2000-10-08", today)).toBe(26); // anniversaire aujourd'hui
  });
});

describe("comparePosition", () => {
  it("même poste = correct", () => {
    expect(comparePosition("G", "G").verdict).toBe("correct");
  });
  it("un poste en commun = proche", () => {
    expect(comparePosition("G-F", "F").verdict).toBe("near");
    expect(comparePosition("C", "F-C").verdict).toBe("near");
  });
  it("aucun poste en commun = faux", () => {
    expect(comparePosition("G", "C").verdict).toBe("wrong");
    expect(comparePosition("G-F", "C").verdict).toBe("wrong");
  });
});

describe("compareGuess", () => {
  it("le bon joueur est correct partout", () => {
    const fb = compareGuess(base, base, today);
    for (const key of ["team", "conference", "division", "position", "height", "age", "number"] as const) {
      expect(fb[key].verdict).toBe("correct");
      expect(fb[key].direction).toBeUndefined();
    }
  });

  it("même division, autre équipe", () => {
    const guess = { ...base, id: 2, team: "OKC" as const };
    const fb = compareGuess(guess, base, today);
    expect(fb.team.verdict).toBe("wrong");
    expect(fb.conference.verdict).toBe("correct");
    expect(fb.division.verdict).toBe("correct");
  });

  it("autre conférence", () => {
    const fb = compareGuess({ ...base, id: 2, team: "BOS" }, base, today);
    expect(fb.conference).toEqual({ value: "Est", verdict: "wrong" });
  });

  it("taille : proche à 5 cm, avec la bonne flèche", () => {
    expect(compareGuess({ ...base, heightCm: 206 }, base, today).height).toEqual({
      value: 206,
      verdict: "near",
      direction: "up",
    });
    expect(compareGuess({ ...base, heightCm: 224 }, base, today).height).toEqual({
      value: 224,
      verdict: "wrong",
      direction: "down",
    });
  });

  it("âge : proche à 2 ans", () => {
    const fb = compareGuess({ ...base, birthDate: "1997-01-01" }, base, today);
    expect(fb.age).toEqual({ value: 29, verdict: "near", direction: "up" });
  });

  it("numéro : proche à 3", () => {
    expect(compareGuess({ ...base, number: 12 }, base, today).number.verdict).toBe("near");
    expect(compareGuess({ ...base, number: 11 }, base, today).number.verdict).toBe("wrong");
  });
});

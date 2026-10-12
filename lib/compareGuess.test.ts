import { describe, expect, it } from "vitest";
import { ageOn, compareGuess, comparePosition } from "./compareGuess";
import type { Player } from "./types";

const base: Player = {
  id: 1,
  name: "Player A",
  team: "DEN",
  position: "C",
  heightCm: 211,
  birthDate: "1995-02-19",
  number: 15,
};
const today = new Date(2026, 9, 8); // October 8, 2026

describe("ageOn", () => {
  it("counts full years", () => {
    expect(ageOn("1995-02-19", today)).toBe(31);
    expect(ageOn("2000-10-09", today)).toBe(25); // birthday tomorrow
    expect(ageOn("2000-10-08", today)).toBe(26); // birthday today
  });
});

describe("comparePosition", () => {
  it("same position = correct", () => {
    expect(comparePosition("G", "G").verdict).toBe("correct");
  });
  it("one shared position = close", () => {
    expect(comparePosition("G-F", "F").verdict).toBe("near");
    expect(comparePosition("C", "F-C").verdict).toBe("near");
  });
  it("no shared position = wrong", () => {
    expect(comparePosition("G", "C").verdict).toBe("wrong");
    expect(comparePosition("G-F", "C").verdict).toBe("wrong");
  });
});

describe("compareGuess", () => {
  it("the right player is correct everywhere", () => {
    const fb = compareGuess(base, base, today);
    for (const key of ["team", "conference", "division", "position", "height", "age", "number"] as const) {
      expect(fb[key].verdict).toBe("correct");
      expect(fb[key].direction).toBeUndefined();
    }
  });

  it("same division, different team", () => {
    const guess = { ...base, id: 2, team: "OKC" as const };
    const fb = compareGuess(guess, base, today);
    expect(fb.team.verdict).toBe("wrong");
    expect(fb.conference.verdict).toBe("correct");
    expect(fb.division.verdict).toBe("correct");
  });

  it("different conference", () => {
    const fb = compareGuess({ ...base, id: 2, team: "BOS" }, base, today);
    expect(fb.conference).toEqual({ value: "East", verdict: "wrong" });
  });

  it("height: close within 5 cm, with the right arrow", () => {
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

  it("age: close within 2 years", () => {
    const fb = compareGuess({ ...base, birthDate: "1997-01-01" }, base, today);
    expect(fb.age).toEqual({ value: 29, verdict: "near", direction: "up" });
  });

  it("number: close within 3", () => {
    expect(compareGuess({ ...base, number: 12 }, base, today).number.verdict).toBe("near");
    expect(compareGuess({ ...base, number: 11 }, base, today).number.verdict).toBe("wrong");
  });
});

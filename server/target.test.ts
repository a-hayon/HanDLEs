import { describe, expect, it } from "vitest";
import { getDailyTarget, getRandomTarget } from "./target";

describe("mystery player", () => {
  it("the daily player is stable for a given date", () => {
    expect(getDailyTarget("2026-10-08").id).toBe(getDailyTarget("2026-10-08").id);
  });

  it("changes from one day to the next", () => {
    const ids = new Set(
      Array.from({ length: 30 }, (_, d) => getDailyTarget(`2026-11-${String(d + 1).padStart(2, "0")}`).id),
    );
    expect(ids.size).toBeGreaterThan(10);
  });

  it("a random game is stable for a given id", () => {
    const id = "6f1c2a9e-1b2c-4d3e-8f90-123456789abc";
    expect(getRandomTarget(id).id).toBe(getRandomTarget(id).id);
  });
});

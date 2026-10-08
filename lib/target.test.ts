import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { getDailyTarget, getRandomTarget, parisDateKey } = await import("./target");

describe("parisDateKey", () => {
  it("utilise le fuseau de Paris", () => {
    // 23h30 UTC le 7 octobre = 1h30 le 8 octobre à Paris
    expect(parisDateKey(new Date("2026-10-07T23:30:00Z"))).toBe("2026-10-08");
  });
});

describe("joueur mystère", () => {
  it("le joueur du jour est stable pour une même date", () => {
    expect(getDailyTarget("2026-10-08").id).toBe(getDailyTarget("2026-10-08").id);
  });

  it("varie d'un jour à l'autre", () => {
    const ids = new Set(
      Array.from({ length: 30 }, (_, d) => getDailyTarget(`2026-11-${String(d + 1).padStart(2, "0")}`).id),
    );
    expect(ids.size).toBeGreaterThan(10);
  });

  it("une partie aléatoire est stable pour un même identifiant", () => {
    const id = "6f1c2a9e-1b2c-4d3e-8f90-123456789abc";
    expect(getRandomTarget(id).id).toBe(getRandomTarget(id).id);
  });
});

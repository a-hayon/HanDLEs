import { describe, expect, it } from "vitest";
import { parisDateKey } from "./date";

describe("parisDateKey", () => {
  it("utilise le fuseau de Paris", () => {
    // 23h30 UTC le 7 octobre = 1h30 le 8 octobre à Paris
    expect(parisDateKey(new Date("2026-10-07T23:30:00Z"))).toBe("2026-10-08");
  });
});

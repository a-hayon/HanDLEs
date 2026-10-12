import { describe, expect, it } from "vitest";
import { parisDateKey } from "./date";

describe("parisDateKey", () => {
  it("uses the Paris time zone", () => {
    // 23:30 UTC on October 7 = 01:30 on October 8 in Paris
    expect(parisDateKey(new Date("2026-10-07T23:30:00Z"))).toBe("2026-10-08");
  });
});

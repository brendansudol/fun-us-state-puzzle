import { describe, expect, it } from "vitest";

import { INCLUDED_STATES } from "@/lib/constants";
import { getDailyTargetCode } from "@/lib/daily";

describe("daily target cycle", () => {
  it("does not repeat within a 48-day cycle", () => {
    const seen = new Set<string>();

    for (let day = 0; day < INCLUDED_STATES.length; day += 1) {
      const date = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10);
      const code = getDailyTargetCode(date);
      expect(seen.has(code)).toBe(false);
      seen.add(code);
    }

    expect(seen.size).toBe(INCLUDED_STATES.length);
  });
});

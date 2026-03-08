import { describe, expect, it } from "vitest";

import { createEmptyStats } from "@/lib/storage";
import { recordDailyCompletion } from "@/lib/stats";
import type { PuzzleDescriptor } from "@/lib/types";

const puzzle: PuzzleDescriptor = {
  id: "daily:2026-03-07",
  mode: "daily",
  targetCode: "GA",
  dateString: "2026-03-07",
  puzzleNumber: 66,
};

describe("daily stats", () => {
  it("is idempotent for the same puzzle", () => {
    const once = recordDailyCompletion({
      stats: createEmptyStats(),
      puzzle,
      didWin: true,
      guessCount: 3,
    });
    const twice = recordDailyCompletion({
      stats: once,
      puzzle,
      didWin: true,
      guessCount: 3,
    });

    expect(once.played).toBe(1);
    expect(twice.played).toBe(1);
    expect(twice.guessDistribution["3"]).toBe(1);
  });

  it("resets the streak on a loss", () => {
    const win = recordDailyCompletion({
      stats: createEmptyStats(),
      puzzle: {
        ...puzzle,
        id: "daily:2026-03-06",
        dateString: "2026-03-06",
      },
      didWin: true,
      guessCount: 2,
    });
    const loss = recordDailyCompletion({
      stats: win,
      puzzle,
      didWin: false,
      guessCount: 6,
    });

    expect(loss.currentDailyStreak).toBe(0);
    expect(loss.guessDistribution.X).toBe(1);
  });
});

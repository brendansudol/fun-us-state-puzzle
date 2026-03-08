import { MAX_GUESSES } from "@/lib/constants";
import { isPreviousDay } from "@/lib/date";
import type { PuzzleDescriptor, StoredStats } from "@/lib/types";

function getDistributionKey(guessCount: number, didWin: boolean): keyof StoredStats["guessDistribution"] {
  if (!didWin) {
    return "X";
  }

  return String(Math.min(Math.max(guessCount, 1), MAX_GUESSES)) as keyof StoredStats["guessDistribution"];
}

function dailyDateFromId(puzzleId: string) {
  return puzzleId.startsWith("daily:") ? puzzleId.slice("daily:".length) : null;
}

export function recordDailyCompletion({
  stats,
  puzzle,
  didWin,
  guessCount,
}: {
  stats: StoredStats;
  puzzle: PuzzleDescriptor;
  didWin: boolean;
  guessCount: number;
}): StoredStats {
  if (puzzle.mode !== "daily" || !puzzle.dateString) {
    return stats;
  }

  if (stats.completedDailyIds.includes(puzzle.id)) {
    return stats;
  }

  const next: StoredStats = {
    ...stats,
    played: stats.played + 1,
    won: stats.won + (didWin ? 1 : 0),
    guessDistribution: {
      ...stats.guessDistribution,
      [getDistributionKey(guessCount, didWin)]: stats.guessDistribution[getDistributionKey(guessCount, didWin)] + 1,
    },
    completedDailyIds: [...stats.completedDailyIds, puzzle.id],
    lastCompletedDailyId: puzzle.id,
  };

  if (didWin) {
    const previousDate = stats.lastCompletedDailyId ? dailyDateFromId(stats.lastCompletedDailyId) : null;

    next.currentDailyStreak =
      previousDate && isPreviousDay(previousDate, puzzle.dateString) && stats.currentDailyStreak > 0
        ? stats.currentDailyStreak + 1
        : 1;
    next.maxDailyStreak = Math.max(stats.maxDailyStreak, next.currentDailyStreak);
  } else {
    next.currentDailyStreak = 0;
    next.maxDailyStreak = stats.maxDailyStreak;
  }

  return next;
}

import type { ExportFamily, MatchHint, NumericHint } from "@/lib/types";

export function compareNumeric(target: number, guess: number, tolerance: number): NumericHint {
  const ratio = Math.abs(target - guess) / Math.max(target, guess);

  if (ratio <= tolerance) {
    return "equal";
  }

  return target > guess ? "higher" : "lower";
}

export function compareExportFamily(target: ExportFamily, guess: ExportFamily): MatchHint {
  return target.code === guess.code ? "match" : "miss";
}

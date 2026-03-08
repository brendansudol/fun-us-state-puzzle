import { DIRECTION_ICONS, MATCH_HINT_ICONS, NUMERIC_HINT_ICONS } from "@/lib/constants";
import type { Direction8, FeedbackRow, MatchHint, NumericHint, PuzzleDescriptor } from "@/lib/types";

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatMiles(value: number): string {
  return `${formatNumber(value)} mi`;
}

export function directionIcon(direction: Direction8): string {
  return DIRECTION_ICONS[direction];
}

export function numericHintIcon(hint: NumericHint): string {
  return NUMERIC_HINT_ICONS[hint];
}

export function matchHintIcon(hint: MatchHint): string {
  return MATCH_HINT_ICONS[hint];
}

export function formatPuzzleHeading(puzzle: PuzzleDescriptor, statusText: string): string {
  if (puzzle.mode === "daily" && puzzle.dateString) {
    return `State Puzzle ${puzzle.dateString} ${statusText}`;
  }
  if (puzzle.mode === "custom") {
    return `State Puzzle Custom ${statusText}`;
  }
  return `State Puzzle Random ${statusText}`;
}

export function formatShareRow(row: FeedbackRow, solved: boolean): string {
  if (solved) {
    return `${row.guessCode} ✅`;
  }

  return [
    row.guessCode,
    `${directionIcon(row.direction)} ${row.distanceMiles}mi`,
    numericHintIcon(row.populationHint),
    numericHintIcon(row.gdpPerCapitaHint),
    numericHintIcon(row.landAreaHint),
    matchHintIcon(row.exportHint),
  ].join(" ");
}

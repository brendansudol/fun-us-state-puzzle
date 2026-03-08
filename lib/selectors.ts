import { buildFeedbackRow } from "@/lib/puzzle";
import type { FeedbackRow, StateCode, StateRecord } from "@/lib/types";

export function indexStatesByCode(states: StateRecord[]): Record<StateCode, StateRecord> {
  return Object.fromEntries(states.map((state) => [state.code, state])) as Record<StateCode, StateRecord>;
}

export function getFeedbackRows(
  guesses: StateCode[],
  statesByCode: Record<StateCode, StateRecord>,
  targetCode: StateCode,
): FeedbackRow[] {
  return guesses.map((guessCode) => buildFeedbackRow(statesByCode[guessCode], statesByCode[targetCode]));
}

export function getLatestGuessCode(guesses: StateCode[]): StateCode | null {
  return guesses.at(-1) ?? null;
}

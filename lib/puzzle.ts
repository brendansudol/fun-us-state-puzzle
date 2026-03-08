import {
  GDP_PER_CAPITA_TOLERANCE,
  INCLUDED_STATES,
  LAND_AREA_TOLERANCE,
  MAX_GUESSES,
  POPULATION_TOLERANCE,
} from "@/lib/constants";
import { compareExportFamily, compareNumeric } from "@/lib/compare";
import { getDailyPuzzleNumber, getDailyTargetCode } from "@/lib/daily";
import { getAppDateString } from "@/lib/date";
import { bearingDegrees, bearingToDirection8, haversineMiles, roundMiles } from "@/lib/geo";
import { formatPuzzleHeading, formatShareRow } from "@/lib/format";
import type { ParsedSearchParams } from "@/lib/search-params";
import type {
  FeedbackRow,
  GameStatus,
  PuzzleDescriptor,
  RandomPuzzleSession,
  StateCode,
  StateRecord,
} from "@/lib/types";

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replaceAll(/[^a-z]/g, "");
}

export function normalizeStateInput(input: string, states: StateRecord[]): StateCode | null {
  const normalized = normalizeText(input);

  if (!normalized) {
    return null;
  }

  for (const state of states) {
    if (normalizeText(state.name) === normalized || state.code.toLowerCase() === normalized) {
      return state.code;
    }
  }

  return null;
}

export function getSuggestions(input: string, states: StateRecord[], guessedCodes: StateCode[]): StateRecord[] {
  const normalized = normalizeText(input);

  if (!normalized) {
    return [];
  }

  return states
    .filter((state) => !guessedCodes.includes(state.code))
    .filter((state) => {
      const name = state.name.toLowerCase();
      const abbr = state.code.toLowerCase();
      return name.startsWith(input.trim().toLowerCase()) || abbr === input.trim().toLowerCase() || name.includes(input.trim().toLowerCase());
    })
    .slice(0, 8);
}

export function getTargetState(states: StateRecord[], targetCode: StateCode): StateRecord {
  const target = states.find((state) => state.code === targetCode);

  if (!target) {
    throw new Error(`Unknown target state: ${targetCode}`);
  }

  return target;
}

export function buildFeedbackRow(guess: StateRecord, target: StateRecord): FeedbackRow {
  const direction = bearingToDirection8(bearingDegrees(guess.centroid, target.centroid));
  const distanceMiles = roundMiles(haversineMiles(guess.centroid, target.centroid));

  return {
    guessCode: guess.code,
    guessName: guess.name,
    direction,
    distanceMiles,
    populationHint: compareNumeric(target.population, guess.population, POPULATION_TOLERANCE),
    gdpPerCapitaHint: compareNumeric(
      target.gdpPerCapitaUsd,
      guess.gdpPerCapitaUsd,
      GDP_PER_CAPITA_TOLERANCE,
    ),
    landAreaHint: compareNumeric(target.landAreaSqMi, guess.landAreaSqMi, LAND_AREA_TOLERANCE),
    exportHint: compareExportFamily(target.topExportFamily, guess.topExportFamily),
  };
}

export function isSolved(guessCode: StateCode, targetCode: StateCode): boolean {
  return guessCode === targetCode;
}

export function getGameStatus(guesses: StateCode[], targetCode: StateCode): GameStatus {
  if (guesses.some((guess) => guess === targetCode)) {
    return "won";
  }

  if (guesses.length >= MAX_GUESSES) {
    return "lost";
  }

  return "playing";
}

function createRandomNonce() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }

  return Math.random().toString(36).slice(2, 10);
}

export function createRandomPuzzleDescriptor(targetCode: StateCode, nonce = createRandomNonce()): PuzzleDescriptor {
  return {
    id: `random:${targetCode}:${nonce}`,
    mode: "random",
    targetCode,
  };
}

export function createRandomPuzzleSession(targetCode: StateCode, nonce = createRandomNonce()): RandomPuzzleSession {
  return {
    targetCode,
    nonce,
    puzzleId: `random:${targetCode}:${nonce}`,
  };
}

export function pickRandomTargetCode(excludeCode?: StateCode): StateCode {
  const options = excludeCode ? INCLUDED_STATES.filter((code) => code !== excludeCode) : INCLUDED_STATES;
  return options[Math.floor(Math.random() * options.length)];
}

function normalizeTargetParam(targetParam: string | null, states: StateRecord[]): StateCode | null {
  if (!targetParam) {
    return null;
  }

  return normalizeStateInput(targetParam, states);
}

export function resolvePuzzleDescriptor({
  params,
  states,
  randomSession,
  now = new Date(),
}: {
  params: ParsedSearchParams;
  states: StateRecord[];
  randomSession?: RandomPuzzleSession | null;
  now?: Date;
}): PuzzleDescriptor {
  const customTarget = normalizeTargetParam(params.target, states);

  if (customTarget) {
    return {
      id: `custom:${customTarget}`,
      mode: "custom",
      targetCode: customTarget,
    };
  }

  if (params.mode === "random") {
    if (randomSession) {
      return {
        id: randomSession.puzzleId,
        mode: "random",
        targetCode: randomSession.targetCode,
      };
    }

    return createRandomPuzzleDescriptor(pickRandomTargetCode());
  }

  const dateString = params.date ?? getAppDateString(now);
  return {
    id: `daily:${dateString}`,
    mode: "daily",
    targetCode: getDailyTargetCode(dateString),
    dateString,
    puzzleNumber: getDailyPuzzleNumber(dateString),
  };
}

export function buildShareText({
  puzzle,
  guesses,
  targetCode,
  rows,
}: {
  puzzle: PuzzleDescriptor;
  guesses: StateCode[];
  targetCode: StateCode;
  rows: FeedbackRow[];
}): string {
  const statusText = guesses.includes(targetCode) ? `${guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  const lines = [formatPuzzleHeading(puzzle, statusText)];

  for (const row of rows) {
    lines.push(formatShareRow(row, row.guessCode === targetCode));
  }

  return lines.join("\n");
}

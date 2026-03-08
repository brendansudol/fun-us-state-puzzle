import type { GuessDistribution, StateCode } from "@/lib/types";

export const APP_TITLE = "State Puzzle";
export const APP_TIMEZONE = "America/New_York";
export const MAX_GUESSES = 6;
export const STORAGE_VERSION = 1;
export const DAILY_EPOCH = "2026-01-01";

export const POPULATION_TOLERANCE = 0.075;
export const GDP_PER_CAPITA_TOLERANCE = 0.05;
export const LAND_AREA_TOLERANCE = 0.075;

export const INCLUDED_STATES: StateCode[] = [
  "AL",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

export const EMPTY_GUESS_DISTRIBUTION: GuessDistribution = {
  "1": 0,
  "2": 0,
  "3": 0,
  "4": 0,
  "5": 0,
  "6": 0,
  X: 0,
};

export const STORAGE_KEYS = {
  progress: (puzzleId: string) => `state-puzzle:progress:v${STORAGE_VERSION}:${puzzleId}`,
  stats: `state-puzzle:stats:v${STORAGE_VERSION}`,
  settings: `state-puzzle:settings:v${STORAGE_VERSION}`,
};

export const DIRECTION_ICONS = {
  N: "↑",
  NE: "↗",
  E: "→",
  SE: "↘",
  S: "↓",
  SW: "↙",
  W: "←",
  NW: "↖",
} as const;

export const NUMERIC_HINT_ICONS = {
  higher: "▲",
  lower: "▼",
  equal: "≈",
} as const;

export const MATCH_HINT_ICONS = {
  match: "✓",
  miss: "✕",
} as const;

export type PuzzleMode = "daily" | "random" | "custom";

export type StateCode =
  | "AL"
  | "AZ"
  | "AR"
  | "CA"
  | "CO"
  | "CT"
  | "DE"
  | "FL"
  | "GA"
  | "ID"
  | "IL"
  | "IN"
  | "IA"
  | "KS"
  | "KY"
  | "LA"
  | "ME"
  | "MD"
  | "MA"
  | "MI"
  | "MN"
  | "MS"
  | "MO"
  | "MT"
  | "NE"
  | "NV"
  | "NH"
  | "NJ"
  | "NM"
  | "NY"
  | "NC"
  | "ND"
  | "OH"
  | "OK"
  | "OR"
  | "PA"
  | "RI"
  | "SC"
  | "SD"
  | "TN"
  | "TX"
  | "UT"
  | "VT"
  | "VA"
  | "WA"
  | "WV"
  | "WI"
  | "WY";

export type Direction8 = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
export type NumericHint = "higher" | "lower" | "equal";
export type MatchHint = "match" | "miss";
export type GameStatus = "playing" | "won" | "lost";

export interface ExportFamily {
  code: string;
  label: string;
}

export interface StateRecord {
  code: StateCode;
  name: string;
  slug: string;
  abbr: StateCode;
  region: "Northeast" | "Midwest" | "South" | "West";
  coastal: boolean;
  centroid: { lat: number; lon: number };
  landAreaSqMi: number;
  population: number;
  gdpUsd: number;
  gdpPerCapitaUsd: number;
  topExportFamily: ExportFamily;
}

export interface StatesGeneratedData {
  version: string;
  scope: string;
  states: StateRecord[];
}

export interface MapPathRecord {
  code: StateCode;
  name: string;
  path: string[];
}

export interface GeneratedMapData {
  viewBox: [number, number, number, number];
  states: MapPathRecord[];
}

export interface MetaGeneratedData {
  dataVersion: string;
  metricLabels: {
    population: string;
    gdpPerCapitaUsd: string;
    landAreaSqMi: string;
    topExportFamily: string;
  };
  sourceNotes: string[];
}

export interface FeedbackRow {
  guessCode: StateCode;
  guessName: string;
  direction: Direction8;
  distanceMiles: number;
  populationHint: NumericHint;
  gdpPerCapitaHint: NumericHint;
  landAreaHint: NumericHint;
  exportHint: MatchHint;
}

export interface PuzzleDescriptor {
  id: string;
  mode: PuzzleMode;
  targetCode: StateCode;
  dateString?: string;
  puzzleNumber?: number;
}

export interface StoredProgress {
  version: number;
  puzzleId: string;
  mode: PuzzleMode;
  targetCode?: StateCode;
  guesses: StateCode[];
  completed: boolean;
  completedAt?: string;
}

export interface GuessDistribution {
  "1": number;
  "2": number;
  "3": number;
  "4": number;
  "5": number;
  "6": number;
  X: number;
}

export interface StoredStats {
  version: number;
  played: number;
  won: number;
  currentDailyStreak: number;
  maxDailyStreak: number;
  guessDistribution: GuessDistribution;
  completedDailyIds: string[];
  lastCompletedDailyId?: string;
}

export interface RandomPuzzleSession {
  puzzleId: string;
  targetCode: StateCode;
  nonce: string;
}

export interface StoredSettings {
  version: number;
  activeRandomPuzzle?: RandomPuzzleSession;
  hasSeenHowTo?: boolean;
}

export interface ClientGameState {
  puzzle: PuzzleDescriptor;
  guesses: StateCode[];
  status: GameStatus;
  error: string | null;
  hasLoadedProgress: boolean;
}

export type GameAction =
  | {
      type: "INIT_PUZZLE";
      puzzle: PuzzleDescriptor;
    }
  | {
      type: "RESTORE_PROGRESS";
      guesses: StateCode[];
      status: GameStatus;
    }
  | {
      type: "SUBMIT_GUESS";
      guess: StateCode;
      targetCode: StateCode;
    }
  | {
      type: "SET_ERROR";
      error: string;
    }
  | {
      type: "CLEAR_ERROR";
    }
  | {
      type: "RESET_RANDOM_PUZZLE";
      puzzle: PuzzleDescriptor;
    };

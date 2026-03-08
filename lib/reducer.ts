import { MAX_GUESSES } from "@/lib/constants";
import type { ClientGameState, GameAction } from "@/lib/types";

function deriveStatus(guesses: ClientGameState["guesses"], targetCode: string) {
  if (guesses.some((guess) => guess === targetCode)) {
    return "won" as const;
  }

  if (guesses.length >= MAX_GUESSES) {
    return "lost" as const;
  }

  return "playing" as const;
}

export function createInitialGameState(puzzle: ClientGameState["puzzle"]): ClientGameState {
  return {
    puzzle,
    guesses: [],
    status: "playing",
    error: null,
    hasLoadedProgress: false,
  };
}

export function gameReducer(state: ClientGameState, action: GameAction): ClientGameState {
  switch (action.type) {
    case "INIT_PUZZLE":
      return {
        puzzle: action.puzzle,
        guesses: [],
        status: "playing",
        error: null,
        hasLoadedProgress: false,
      };
    case "RESTORE_PROGRESS":
      return {
        ...state,
        guesses: action.guesses,
        status: action.status,
        error: null,
        hasLoadedProgress: true,
      };
    case "SUBMIT_GUESS": {
      const guesses = [...state.guesses, action.guess];
      return {
        ...state,
        guesses,
        status: deriveStatus(guesses, action.targetCode),
        error: null,
      };
    }
    case "SET_ERROR":
      return {
        ...state,
        error: action.error,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "RESET_RANDOM_PUZZLE":
      return {
        puzzle: action.puzzle,
        guesses: [],
        status: "playing",
        error: null,
        hasLoadedProgress: true,
      };
    default:
      return state;
  }
}

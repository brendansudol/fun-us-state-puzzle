"use client";

import type { PuzzleDescriptor } from "@/lib/types";

interface HeaderBarProps {
  puzzle: PuzzleDescriptor;
  guessesRemaining: number;
  onOpenHowTo: () => void;
  onOpenStats: () => void;
  onStartDaily: () => void;
  onStartRandom: () => void;
}

function getPuzzleLabel(puzzle: PuzzleDescriptor) {
  if (puzzle.mode === "daily") {
    return puzzle.dateString ? `Daily puzzle • ${puzzle.dateString}` : "Daily puzzle";
  }
  if (puzzle.mode === "custom") {
    return `Custom target • ${puzzle.targetCode}`;
  }
  return "Random mode";
}

export function HeaderBar({
  puzzle,
  guessesRemaining,
  onOpenHowTo,
  onOpenStats,
  onStartDaily,
  onStartRandom,
}: HeaderBarProps) {
  return (
    <header className="appHeader">
      <div className="titleBlock">
        <div className="eyebrow">
          <span className="eyebrowDot" aria-hidden="true" />
          {getPuzzleLabel(puzzle)}
        </div>
        <h1 className="title">State Puzzle</h1>
        <p className="subtitle">
          Guess the hidden contiguous U.S. state in six tries using direction, distance, population,
          GDP per capita, land area, and export-family clues.
        </p>
      </div>

      <div className="headerActions">
        <button className="buttonGhost" type="button" onClick={onOpenHowTo}>
          How to play
        </button>
        <button className="buttonGhost" type="button" onClick={onOpenStats}>
          Stats
        </button>
        <button className="buttonGhost" type="button" onClick={onStartDaily}>
          Daily
        </button>
        <button className="button" type="button" onClick={onStartRandom}>
          Play random
        </button>
      </div>
    </header>
  );
}

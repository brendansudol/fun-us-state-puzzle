"use client";

import { formatCurrency, formatNumber } from "@/lib/format";
import type { MetaGeneratedData, PuzzleDescriptor, StateRecord } from "@/lib/types";

interface ResultModalProps {
  open: boolean;
  puzzle: PuzzleDescriptor;
  targetState: StateRecord;
  guessesCount: number;
  status: "won" | "lost";
  metaData: MetaGeneratedData;
  onClose: () => void;
  onCopy: () => void;
  onPlayRandom: () => void;
  copied: boolean;
}

export function ResultModal({
  open,
  puzzle,
  targetState,
  guessesCount,
  status,
  metaData,
  onClose,
  onCopy,
  onPlayRandom,
  copied,
}: ResultModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modalBackdrop" role="presentation">
      <section className="modalCard" role="dialog" aria-modal="true" aria-labelledby="result-modal-title">
        <header className="modalHeader">
          <div>
            <h2 id="result-modal-title" className="modalTitle">
              {status === "won" ? `Correct: ${targetState.name}` : `The state was ${targetState.name}`}
            </h2>
            <p className="modalCopy">
              {status === "won"
                ? `Solved in ${guessesCount}/6`
                : `Out of guesses after ${guessesCount}/6`}
            </p>
          </div>
          <button className="modalClose" type="button" aria-label="Close result dialog" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="modalBody">
          <div className="metricGrid">
            <div className="metricItem">
              {metaData.metricLabels.population}
              <strong>{formatNumber(targetState.population)}</strong>
            </div>
            <div className="metricItem">
              {metaData.metricLabels.gdpPerCapitaUsd}
              <strong>{formatCurrency(targetState.gdpPerCapitaUsd)}</strong>
            </div>
            <div className="metricItem">
              {metaData.metricLabels.landAreaSqMi}
              <strong>{formatNumber(targetState.landAreaSqMi)} sq mi</strong>
            </div>
            <div className="metricItem">
              {metaData.metricLabels.topExportFamily}
              <strong>{targetState.topExportFamily.label}</strong>
            </div>
          </div>

          <ul className="sourceList">
            {metaData.sourceNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>

        <footer className="modalFooter">
          <button className="button" type="button" onClick={onCopy}>
            {copied ? "Copied" : "Copy result"}
          </button>
          <button className="buttonGhost" type="button" onClick={onPlayRandom}>
            Play random
          </button>
          <button className="buttonGhost" type="button" onClick={onClose}>
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

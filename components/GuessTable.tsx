"use client";

import { GuessRow } from "@/components/GuessRow";
import type { FeedbackRow, StateCode } from "@/lib/types";

interface GuessTableProps {
  rows: FeedbackRow[];
  latestGuessCode: StateCode | null;
  targetCode: StateCode;
}

export function GuessTable({ rows, latestGuessCode, targetCode }: GuessTableProps) {
  if (rows.length === 0) {
    return (
      <section className="panelCard emptyCard">
        No guesses yet. Start with any contiguous U.S. state.
      </section>
    );
  }

  return (
    <section className="panelCard tableCard">
      <div className="sectionHeader">
        <h2 className="sectionTitle">Guess history</h2>
        <span className="sectionMeta">{rows.length} guess{rows.length === 1 ? "" : "es"}</span>
      </div>

      <table className="guessTable">
        <thead>
          <tr>
            <th scope="col">State</th>
            <th scope="col">Geo</th>
            <th scope="col">Population</th>
            <th scope="col">GDP/cap</th>
            <th scope="col">Area</th>
            <th scope="col">Export</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <GuessRow
              key={row.guessCode}
              row={row}
              isLatest={row.guessCode === latestGuessCode}
              targetCode={targetCode}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
}

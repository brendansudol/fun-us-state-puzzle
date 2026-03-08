"use client";

import { directionIcon, matchHintIcon, numericHintIcon } from "@/lib/format";
import type { FeedbackRow, StateCode } from "@/lib/types";

interface GuessRowProps {
  row: FeedbackRow;
  isLatest: boolean;
  targetCode: StateCode;
}

function NumericCell({
  label,
  hint,
}: {
  label: string;
  hint: FeedbackRow["populationHint"];
}) {
  const text =
    hint === "equal"
      ? `Target ${label} is approximately equal`
      : `Target ${label} is ${hint === "higher" ? "higher" : "lower"}`;

  return (
    <span className="hintCell">
      <span className="hintIcon" aria-hidden="true">
        {numericHintIcon(hint)}
      </span>
      <span>{hint === "equal" ? "Similar" : hint === "higher" ? "Higher" : "Lower"}</span>
      <span className="srOnly">{text}</span>
    </span>
  );
}

export function GuessRow({ row, isLatest, targetCode }: GuessRowProps) {
  const solved = row.guessCode === targetCode;

  return (
    <tr className={isLatest ? "latestRow" : undefined}>
      <td>
        <div className="guessNameCell">
          <strong>{row.guessName}</strong>
          <span className="guessCode">{row.guessCode}</span>
        </div>
      </td>
      <td>
        {solved ? (
          <span className="hintCell">
            <span className="hintIcon" aria-hidden="true">
              ✅
            </span>
            <span>Exact</span>
          </span>
        ) : (
          <span className="hintCell">
            <span className="hintIcon" aria-hidden="true">
              {directionIcon(row.direction)}
            </span>
            <span>{row.distanceMiles} mi</span>
            <span className="srOnly">
              Target is {row.direction} and {row.distanceMiles} miles away
            </span>
          </span>
        )}
      </td>
      <td>{solved ? "Solved" : <NumericCell label="population" hint={row.populationHint} />}</td>
      <td>{solved ? "Solved" : <NumericCell label="GDP per capita" hint={row.gdpPerCapitaHint} />}</td>
      <td>{solved ? "Solved" : <NumericCell label="land area" hint={row.landAreaHint} />}</td>
      <td>
        {solved ? (
          "Solved"
        ) : (
          <span className="hintCell">
            <span className="hintIcon" aria-hidden="true">
              {matchHintIcon(row.exportHint)}
            </span>
            <span>{row.exportHint === "match" ? "Match" : "Miss"}</span>
          </span>
        )}
      </td>
    </tr>
  );
}

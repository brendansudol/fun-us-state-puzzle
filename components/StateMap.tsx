"use client";

import type { FeedbackRow, GeneratedMapData, StateCode } from "@/lib/types";

interface StateMapProps {
  mapData: GeneratedMapData;
  guessedRows: FeedbackRow[];
  targetCode?: StateCode;
  revealTarget: boolean;
  latestGuessCode?: StateCode | null;
}

const DISTANCE_BUCKETS = [
  { max: 249, color: "var(--bucket-0)", label: "0-249 mi" },
  { max: 499, color: "var(--bucket-1)", label: "250-499 mi" },
  { max: 999, color: "var(--bucket-2)", label: "500-999 mi" },
  { max: 1499, color: "var(--bucket-3)", label: "1000-1499 mi" },
  { max: Number.POSITIVE_INFINITY, color: "var(--bucket-4)", label: "1500+ mi" },
];

function getDistanceColor(distance: number) {
  return DISTANCE_BUCKETS.find((bucket) => distance <= bucket.max)?.color ?? "var(--map-default)";
}

export function StateMap({ mapData, guessedRows, targetCode, revealTarget, latestGuessCode }: StateMapProps) {
  const rowByCode = Object.fromEntries(guessedRows.map((row) => [row.guessCode, row]));

  return (
    <section className="panelCard mapPanel">
      <div className="mapHeader">
        <div>
          <h2 className="sectionTitle">Distance map</h2>
          <div className="sectionMeta">Guessed states are colored by proximity to the target.</div>
        </div>
      </div>

      <div className="mapFrame">
        <svg viewBox={mapData.viewBox.join(" ")} role="img" aria-label="Map of the contiguous United States">
          {mapData.states.map((state) => {
            const guessed = rowByCode[state.code];
            const isTarget = revealTarget && state.code === targetCode;
            const fill = isTarget
              ? "var(--success)"
              : guessed
                ? getDistanceColor(guessed.distanceMiles)
                : "var(--map-default)";

            return (
              <g key={state.code}>
                <title>{state.name}</title>
                {state.path.map((segment, index) => (
                  <path
                    key={`${state.code}-${index}`}
                    d={segment}
                    fill={fill}
                    stroke={state.code === latestGuessCode ? "var(--brand-2)" : "rgba(255,255,255,0.18)"}
                    strokeWidth={state.code === latestGuessCode ? 2.5 : 1}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mapLegend" aria-hidden="true">
        {DISTANCE_BUCKETS.map((bucket) => (
          <div key={bucket.label} className="legendSwatch">
            <span style={{ background: bucket.color }} />
            <span>{bucket.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

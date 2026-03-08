import { Suspense } from "react";

import { StatePuzzleClient } from "@/components/StatePuzzleClient";
import mapData from "@/data/generated/map.generated.json";
import metaData from "@/data/generated/meta.generated.json";
import statesData from "@/data/generated/states.generated.json";
import type { GeneratedMapData, MetaGeneratedData, StatesGeneratedData } from "@/lib/types";

export default function Page() {
  const typedStatesData = statesData as StatesGeneratedData;
  const typedMapData = mapData as GeneratedMapData;
  const typedMetaData = metaData as MetaGeneratedData;

  return (
    <Suspense fallback={<div className="loadingScreen">Loading puzzle…</div>}>
      <StatePuzzleClient
        mapData={typedMapData}
        metaData={typedMetaData}
        statesData={typedStatesData}
      />
    </Suspense>
  );
}

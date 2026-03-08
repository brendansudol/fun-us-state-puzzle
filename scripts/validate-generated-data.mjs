import { readFileSync } from "node:fs";
import { join } from "node:path";

const INCLUDED_STATE_CODES = new Set([
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
]);

function readJson(pathname) {
  return JSON.parse(readFileSync(join(process.cwd(), pathname), "utf8"));
}

const statesData = readJson("data/generated/states.generated.json");
const mapData = readJson("data/generated/map.generated.json");
const metaData = readJson("data/generated/meta.generated.json");

if (statesData.scope !== "contiguous-48") {
  throw new Error(`Unexpected scope: ${statesData.scope}`);
}

if (statesData.states.length !== 48) {
  throw new Error(`Expected 48 states, found ${statesData.states.length}`);
}

const seenCodes = new Set();
for (const state of statesData.states) {
  if (!INCLUDED_STATE_CODES.has(state.code)) {
    throw new Error(`Unexpected state code: ${state.code}`);
  }
  if (seenCodes.has(state.code)) {
    throw new Error(`Duplicate state code: ${state.code}`);
  }
  if (typeof state.population !== "number" || state.population <= 0) {
    throw new Error(`Invalid population for ${state.code}`);
  }
  if (typeof state.gdpPerCapitaUsd !== "number" || state.gdpPerCapitaUsd <= 0) {
    throw new Error(`Invalid GDP per capita for ${state.code}`);
  }
  if (!Array.isArray(state.topExportFamily ? [state.topExportFamily.code] : [])) {
    throw new Error(`Missing export family for ${state.code}`);
  }
  seenCodes.add(state.code);
}

if (mapData.states.length !== 48) {
  throw new Error(`Expected 48 map shapes, found ${mapData.states.length}`);
}

for (const mapState of mapData.states) {
  if (!seenCodes.has(mapState.code)) {
    throw new Error(`Map state not found in logic data: ${mapState.code}`);
  }
  if (!Array.isArray(mapState.path) || mapState.path.length === 0) {
    throw new Error(`Missing path data for ${mapState.code}`);
  }
}

if (!Array.isArray(metaData.sourceNotes) || metaData.sourceNotes.length === 0) {
  throw new Error("Missing source notes");
}

console.log("Generated data is valid.");

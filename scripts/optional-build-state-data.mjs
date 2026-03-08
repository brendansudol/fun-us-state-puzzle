import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);

const DATA_VERSION = "2026-03-v1";
const INCLUDED_STATE_CODES = [
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

const REGION_LABELS = {
  1: "Northeast",
  2: "Midwest",
  3: "South",
  4: "West",
};

const COASTAL_CODES = new Set([
  "AL",
  "CA",
  "CT",
  "DE",
  "FL",
  "GA",
  "LA",
  "MA",
  "MD",
  "ME",
  "MS",
  "NC",
  "NH",
  "NJ",
  "NY",
  "OR",
  "RI",
  "SC",
  "TX",
  "VA",
  "WA",
]);

const EXPORT_FAMILY_LABELS = {
  311: "Food Products",
  324: "Petroleum & Coal Products",
  325: "Chemical Products",
  333: "Machinery",
  334: "Computer & Electronic Products",
  336: "Transportation Equipment",
  339: "Miscellaneous Manufacturing",
};

const STATE_EXPORT_CODES = {
  AL: "336",
  AZ: "334",
  AR: "311",
  CA: "334",
  CO: "334",
  CT: "336",
  DE: "325",
  FL: "336",
  GA: "336",
  ID: "334",
  IL: "333",
  IN: "336",
  IA: "333",
  KS: "336",
  KY: "336",
  LA: "324",
  ME: "334",
  MD: "334",
  MA: "334",
  MI: "336",
  MN: "339",
  MS: "336",
  MO: "325",
  MT: "311",
  NE: "311",
  NV: "334",
  NH: "334",
  NJ: "325",
  NM: "334",
  NY: "334",
  NC: "325",
  ND: "324",
  OH: "333",
  OK: "324",
  OR: "334",
  PA: "325",
  RI: "339",
  SC: "336",
  SD: "311",
  TN: "336",
  TX: "324",
  UT: "334",
  VT: "339",
  VA: "334",
  WA: "336",
  WV: "325",
  WI: "333",
  WY: "324",
};

const STATE_GDP_2023_MILLIONS = {
  AL: 304936,
  AZ: 522767,
  AR: 178606,
  CA: 3870379,
  CO: 529627,
  CT: 345912,
  DE: 98069,
  FL: 1600811,
  GA: 831828,
  ID: 120958,
  IL: 1098346,
  IN: 499503,
  IA: 254032,
  KS: 228232,
  KY: 279708,
  LA: 314989,
  ME: 93270,
  MD: 515607,
  MA: 736296,
  MI: 673818,
  MN: 483162,
  MS: 151147,
  MO: 430114,
  MT: 73255,
  NE: 181285,
  NV: 245979,
  NH: 114101,
  NJ: 806665,
  NM: 135010,
  NY: 2172010,
  NC: 788103,
  ND: 76043,
  OH: 884834,
  OK: 256689,
  OR: 318884,
  PA: 976361,
  RI: 77574,
  SC: 327420,
  SD: 74034,
  TN: 523032,
  TX: 2583866,
  UT: 281329,
  VT: 43534,
  VA: 719897,
  WA: 807865,
  WV: 102152,
  WI: 428447,
  WY: 51991,
};

function slugify(name) {
  return name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "");
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function parsePipeTable(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split("|");
  return lines.slice(1).map((line) => {
    const values = line.split("|");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function readUrl(url, args = []) {
  return execFileSync("curl", ["-L", ...args, url], { encoding: "utf8" });
}

function fetchPopulationRows() {
  const csv = readUrl(
    "https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/state/totals/NST-EST2024-ALLDATA.csv",
  );
  return parseCsv(csv)
    .filter((row) => row.SUMLEV === "040")
    .filter((row) => INCLUDED_STATE_CODES.includes(row.NAME_TO_CODE ?? row.NAME));
}

function fetchGazetteerRows(tempDirectory) {
  const zipPath = join(tempDirectory, "state.zip");
  execFileSync("curl", [
    "-L",
    "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_Gaz_state_national.zip",
    "-o",
    zipPath,
  ]);
  const table = execFileSync("unzip", ["-p", zipPath], { encoding: "utf8" });
  return parsePipeTable(table).filter((row) => INCLUDED_STATE_CODES.includes(row.USPS));
}

function buildPopulationMap(rows) {
  const stateCodeByName = {
    Alabama: "AL",
    Arizona: "AZ",
    Arkansas: "AR",
    California: "CA",
    Colorado: "CO",
    Connecticut: "CT",
    Delaware: "DE",
    Florida: "FL",
    Georgia: "GA",
    Idaho: "ID",
    Illinois: "IL",
    Indiana: "IN",
    Iowa: "IA",
    Kansas: "KS",
    Kentucky: "KY",
    Louisiana: "LA",
    Maine: "ME",
    Maryland: "MD",
    Massachusetts: "MA",
    Michigan: "MI",
    Minnesota: "MN",
    Mississippi: "MS",
    Missouri: "MO",
    Montana: "MT",
    Nebraska: "NE",
    Nevada: "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    Ohio: "OH",
    Oklahoma: "OK",
    Oregon: "OR",
    Pennsylvania: "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    Tennessee: "TN",
    Texas: "TX",
    Utah: "UT",
    Vermont: "VT",
    Virginia: "VA",
    Washington: "WA",
    "West Virginia": "WV",
    Wisconsin: "WI",
    Wyoming: "WY",
  };

  return Object.fromEntries(
    rows
      .filter((row) => row.NAME in stateCodeByName)
      .map((row) => [
        stateCodeByName[row.NAME],
        {
          population: Number(row.POPESTIMATE2024),
          region: REGION_LABELS[Number(row.REGION)],
        },
      ]),
  );
}

function buildMapData(codeByFips, nameByCode) {
  const topologyPath = require.resolve("us-atlas/states-10m.json");
  const topology = JSON.parse(readFileSync(topologyPath, "utf8"));
  const features = feature(topology, topology.objects.states).features;
  const filteredFeatures = features.filter((shape) => {
    const code = codeByFips[String(shape.id).padStart(2, "0")];
    return INCLUDED_STATE_CODES.includes(code);
  });

  const collection = {
    type: "FeatureCollection",
    features: filteredFeatures,
  };
  const projection = geoAlbersUsa().fitSize([960, 600], collection);
  const generator = geoPath(projection);

  return {
    viewBox: [0, 0, 960, 600],
    states: filteredFeatures
      .map((shape) => {
        const code = codeByFips[String(shape.id).padStart(2, "0")];
        const pathValue = generator(shape) ?? "";
        return {
          code,
          name: nameByCode[code],
          path: pathValue.split(/(?=M)/).filter(Boolean),
        };
      })
      .sort((left, right) => INCLUDED_STATE_CODES.indexOf(left.code) - INCLUDED_STATE_CODES.indexOf(right.code)),
  };
}

function main() {
  const tempDirectory = mkdtempSync(join(tmpdir(), "state-puzzle-"));

  try {
    const populationRows = parseCsv(
      readUrl(
        "https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/state/totals/NST-EST2024-ALLDATA.csv",
      ),
    ).filter((row) => row.SUMLEV === "040");
    const gazetteerRows = fetchGazetteerRows(tempDirectory);
    const populationByCode = buildPopulationMap(populationRows);

    const codeByFips = Object.fromEntries(gazetteerRows.map((row) => [row.GEOID, row.USPS]));
    const nameByCode = Object.fromEntries(gazetteerRows.map((row) => [row.USPS, row.NAME]));

    const states = INCLUDED_STATE_CODES.map((code) => {
      const gazetteer = gazetteerRows.find((row) => row.USPS === code);
      const populationEntry = populationByCode[code];
      const gdpMillions = STATE_GDP_2023_MILLIONS[code];
      const exportCode = STATE_EXPORT_CODES[code];

      if (!gazetteer || !populationEntry || !gdpMillions || !exportCode) {
        throw new Error(`Missing snapshot inputs for ${code}`);
      }

      const gdpUsd = gdpMillions * 1_000_000;

      return {
        code,
        name: gazetteer.NAME,
        slug: slugify(gazetteer.NAME),
        abbr: code,
        region: populationEntry.region,
        coastal: COASTAL_CODES.has(code),
        centroid: {
          lat: Number(gazetteer.INTPTLAT),
          lon: Number(gazetteer.INTPTLONG),
        },
        landAreaSqMi: Math.round(Number(gazetteer.ALAND_SQMI)),
        population: populationEntry.population,
        gdpUsd,
        gdpPerCapitaUsd: Math.round(gdpUsd / populationEntry.population),
        topExportFamily: {
          code: exportCode,
          label: EXPORT_FAMILY_LABELS[Number(exportCode)],
        },
      };
    });

    const mapData = buildMapData(codeByFips, nameByCode);
    const metaData = {
      dataVersion: DATA_VERSION,
      metricLabels: {
        population: "Population",
        gdpPerCapitaUsd: "GDP per capita",
        landAreaSqMi: "Land area",
        topExportFamily: "Top export family",
      },
      sourceNotes: [
        "Population: Census 2024 state population estimates snapshot",
        "GDP: BEA 2023 current-dollar GDP by state snapshot",
        "Exports: pinned Trade.gov state export family snapshot",
        "Map: Census cartographic boundary data via us-atlas",
        "Centroids/area: Census Gazetteer 2025 state file",
      ],
    };

    const outputDirectory = join(process.cwd(), "data", "generated");
    mkdirSync(outputDirectory, { recursive: true });
    writeFileSync(
      join(outputDirectory, "states.generated.json"),
      `${JSON.stringify(
        {
          version: DATA_VERSION,
          scope: "contiguous-48",
          states,
        },
        null,
        2,
      )}\n`,
    );
    writeFileSync(join(outputDirectory, "map.generated.json"), `${JSON.stringify(mapData, null, 2)}\n`);
    writeFileSync(join(outputDirectory, "meta.generated.json"), `${JSON.stringify(metaData, null, 2)}\n`);
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
}

main();

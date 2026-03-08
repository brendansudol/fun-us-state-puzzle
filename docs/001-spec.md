Below is a handoff-ready spec for **State Puzzle**.

Use one static-exported Next.js App Router app. Keep the route/page shell as Server Components, and render the actual game board as a single Client Component. That matches current Next.js guidance: pages and layouts are Server Components by default, interactive UI belongs in Client Components via `'use client'`, Client Component props must be serializable, Server Components can read local files during build, and static export is enabled with `output: 'export'`. Static export supports Server Components and static `GET` route handlers, but not request-dependent route handlers, cookies, Server Actions, ISR, or dynamic routes without `generateStaticParams()`. ([Next.js][1])

For data, do **not** fetch live at runtime. Commit a pinned snapshot to the repo. Good official source set: Census state population estimates, BEA GDP by state, Trade.gov state trade data, Census cartographic boundary files for simplified small-scale map shapes, and Census Gazetteer/reference files for internal-point latitude/longitude and land area fields. TradeStats Express state data covers 2009 forward and supports NAICS 2/3/4 detail; Census cartographic boundary files are designed for small-scale thematic mapping; Gazetteer/reference materials include internal-point lat/long and land-area fields. ([Census.gov][2])

---

# State Puzzle — product + implementation spec

## 1. Product summary

**State Puzzle** is a quick daily/random browser game where the player guesses a hidden U.S. state in up to **6 guesses**. After each guess, the game reveals:

- cardinal direction to the target
- distance to the target
- whether the target has higher/lower/similar population
- whether the target has higher/lower/similar GDP per capita
- whether the target has higher/lower/similar land area
- whether the guessed state shares the same top export family as the target

This should feel like a U.S.-focused mix of Tradle + Worldle, with a strong shared-screen meeting UX.

## 2. Product goals

### Primary goals

- Very fast to understand and play in a meeting.
- Fully functional with **no database** and ideally **no backend runtime**.
- Daily puzzle and random mode.
- Strong map-driven visual feedback.
- Stable clues that do not drift day to day.
- Clean enough to hand to a code agent and get a solid MVP.

### Non-goals for v1

- No auth.
- No multiplayer sync.
- No leaderboard.
- No analytics backend.
- No CMS/admin panel.
- No all-50-states mode yet.
- No anti-cheat hardening.
- No live data ingestion at runtime.

Important expectation: because this is a static/no-backend app, a determined user can reverse-engineer the answer in devtools. That is acceptable for an internal casual game.

## 3. MVP scope

### Geography scope

- **Contiguous 48 states only**
- Exclude Alaska, Hawaii, DC, and territories in v1
- Accept this as a deliberate product choice, not a missing feature

### Modes

- **Daily**: default mode
- **Random**: one-click replay mode after finishing
- **Custom/dev target** via query param for testing

### Guess count

- Max guesses: **6**

### Clue columns per guess

1. **Geo**: direction + distance
2. **Population**: target is higher / lower / approximately equal
3. **GDP per capita**: target is higher / lower / approximately equal
4. **Land area**: target is higher / lower / approximately equal
5. **Top export family**: match / no match

### Win / lose

- Win when guessed state code matches target
- Lose after 6 incorrect guesses
- On end, reveal exact state and exact figures

## 4. Recommended UX

## Main board layout

Desktop:

- left: large U.S. map
- right: title, mode/date, guess input, guess history table, small legend

Mobile:

- stacked layout
- header
- input
- table
- map below or above depending on fit

### Visual style

- dark background
- high-contrast cards
- bright, readable state fills
- large typography
- obvious icons for clue states
- no hover-only interactions

### Map behavior

- unguessed states: muted fill
- guessed states: color by distance bucket
- solved target: green fill on reveal
- latest guess: slightly thicker outline or pulse
- no click-to-guess in v1

### Guess table row format

Each row should read like:

`Illinois | ↘ 640 mi | Pop ▲ | GDP/cap ▼ | Area ▲ | Export ✕`

Where arrows mean:

- `▲` = target is higher than the guess
- `▼` = target is lower than the guess
- `≈` = close enough to count as similar
- `✓` = categorical match
- `✕` = categorical miss

### End-state modal

On win or loss:

- target state name
- guess count result
- exact metrics for the target
- Copy result
- Play Random
- Close

### Stats modal

Local-only:

- total played
- total won
- win %
- current daily streak
- max daily streak
- guess distribution 1–6 and X

## 5. Route structure

Keep routes minimal.

### Routes

- `/` → main app
- optional `/about` later, not needed for MVP

### Query params

Use query params, not dynamic routes.

- `?mode=daily`
- `?mode=random`
- `?date=YYYY-MM-DD` → override daily date for archive/testing
- `?target=TX` → custom target for dev/demo
- `?debug=1` → optional dev-only answer reveal

Reason: query params keep the app simple under static export. Do **not** build archive routes like `/puzzle/[date]` in v1. Dynamic routes add complexity under static export because they must be precomputed. ([Next.js][3])

## 6. Technical architecture

### Stack

- Next.js App Router
- TypeScript
- static export
- plain React state/reducer
- CSS Modules or plain CSS with variables
- localStorage only for persistence

### Explicit constraints

- No DB
- No API server
- No Server Actions
- No cookies
- No auth/session
- No runtime data fetching from government sites

### Next.js structure

Use:

- `app/layout.tsx`
- `app/page.tsx`
- `components/...`
- `lib/...`
- `data/generated/...`

Recommended `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
};

export default nextConfig;
```

Static export builds to an `out` folder and can be hosted on any static host. ([Next.js][3])

## 7. File structure

```text
app/
  globals.css
  layout.tsx
  page.tsx

components/
  StatePuzzleClient.tsx
  StateMap.tsx
  GuessInput.tsx
  GuessTable.tsx
  GuessRow.tsx
  HeaderBar.tsx
  ResultModal.tsx
  StatsModal.tsx
  HowToPlayModal.tsx

lib/
  config.ts
  types.ts
  constants.ts
  date.ts
  daily.ts
  geo.ts
  compare.ts
  format.ts
  puzzle.ts
  reducer.ts
  storage.ts
  stats.ts
  search-params.ts
  selectors.ts

data/
  generated/
    states.generated.json
    map.generated.json
    meta.generated.json

scripts/
  validate-generated-data.mjs
  optional-build-state-data.mjs
```

## 8. Component boundaries

### Server components

- `app/layout.tsx`
- `app/page.tsx`

`app/page.tsx` should:

- import generated JSON data
- pass plain serializable data into the client app
- not read query params on the server
- not contain gameplay state

### Client components

- `StatePuzzleClient`
- `GuessInput`
- `GuessTable`
- `StateMap`
- all modals

`StatePuzzleClient` is the main orchestrator.

## 9. Domain model

Use these types.

```ts
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

export interface MapPathRecord {
  code: StateCode;
  name: string;
  path: string[];
}

export interface GeneratedMapData {
  viewBox: [number, number, number, number];
  states: MapPathRecord[];
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
  targetCode?: StateCode; // required for random/custom
  guesses: StateCode[];
  completed: boolean;
  completedAt?: string;
}

export interface StoredStats {
  version: number;
  played: number;
  won: number;
  currentDailyStreak: number;
  maxDailyStreak: number;
  guessDistribution: Record<"1" | "2" | "3" | "4" | "5" | "6" | "X", number>;
  completedDailyIds: string[];
  lastCompletedDailyId?: string;
}
```

## 10. Generated data contract

The app should assume these files exist.

### `states.generated.json`

Contains all state logic data.

```json
{
  "version": "2026-01-v1",
  "scope": "contiguous-48",
  "states": [
    {
      "code": "CA",
      "name": "California",
      "slug": "california",
      "abbr": "CA",
      "region": "West",
      "coastal": true,
      "centroid": { "lat": 36.7015, "lon": -119.4179 },
      "landAreaSqMi": 155779,
      "population": 39355309,
      "gdpUsd": 4100000000000,
      "gdpPerCapitaUsd": 104176,
      "topExportFamily": {
        "code": "334",
        "label": "Computer & Electronic Products"
      }
    }
  ]
}
```

### `map.generated.json`

Contains SVG path data only.

```json
{
  "viewBox": [0, 0, 960, 600],
  "states": [
    {
      "code": "CA",
      "name": "California",
      "path": ["M...Z"]
    }
  ]
}
```

### `meta.generated.json`

Contains labels for reveal screens and source metadata.

```json
{
  "dataVersion": "2026-01-v1",
  "metricLabels": {
    "population": "Population",
    "gdpPerCapitaUsd": "GDP per capita",
    "landAreaSqMi": "Land area",
    "topExportFamily": "Top export family"
  },
  "sourceNotes": [
    "Population: Census state estimates snapshot",
    "GDP: BEA GDP by state snapshot",
    "Exports: TradeStats Express state snapshot",
    "Map: Census cartographic boundary data",
    "Centroids/area: Census Gazetteer/reference data"
  ]
}
```

## 11. Game rules and logic

## Included states

Hardcode the contiguous 48 in a constant.

```ts
export const INCLUDED_STATES: StateCode[] = [ ... ];
```

## Guess validation

Accept:

- full state name, case-insensitive
- USPS abbreviation, case-insensitive

Reject:

- duplicates
- unsupported states (`AK`, `HI`, `DC`)
- empty input
- unknown strings

Normalization examples:

- `ca` → `CA`
- `California` → `CA`
- `new york` → `NY`

## Distance

Use haversine distance on the state internal-point coordinates.

- input: guessed state centroid/internal point, target centroid/internal point
- output: miles
- round to nearest 10 miles for display

## Direction

Use initial bearing from guess to target, then bucket into 8 directions:

- N
- NE
- E
- SE
- S
- SW
- W
- NW

## Numeric comparisons

Compare target to guessed value.

Semantics:

- `higher` means target > guessed
- `lower` means target < guessed
- `equal` means within tolerance

Use these tolerances:

- population: `7.5%`
- GDP per capita: `5%`
- land area: `7.5%`

Implementation rule:

```ts
const ratio = Math.abs(target - guess) / Math.max(target, guess);
if (ratio <= tolerance) return "equal";
return target > guess ? "higher" : "lower";
```

## Export match

Simple exact match on `topExportFamily.code`.

- same code → `match`
- otherwise → `miss`

Do not attempt fuzzy matching in v1.

## Feedback row builder

```ts
export function buildFeedbackRow(
  guess: StateRecord,
  target: StateRecord,
): FeedbackRow;
```

Should return:

- `guessCode`
- `guessName`
- `direction`
- `distanceMiles`
- `populationHint`
- `gdpPerCapitaHint`
- `landAreaHint`
- `exportHint`

## End conditions

- If guess equals target: `status = 'won'`
- If guesses length reaches 6 without match: `status = 'lost'`

## 12. Daily puzzle generation

No DB means the daily puzzle must be deterministic.

### Requirements

- same date should resolve to same target for all users
- no repeats within a 48-day cycle
- easy to override by `?date=YYYY-MM-DD`
- fixed app timezone

### Timezone

Use:

```ts
export const APP_TIMEZONE = "America/New_York";
```

### Daily date string

Compute a canonical date string in app timezone:

```ts
function getAppDateString(inputDate = new Date()): string;
```

Return `YYYY-MM-DD`.

### Target selection algorithm

Use seeded shuffle per 48-day cycle.

```ts
const EPOCH = "2026-01-01";
const CYCLE_LENGTH = INCLUDED_STATES.length; // 48

function getDailyTargetCode(dateString: string): StateCode {
  const dayIndex = daysBetween(EPOCH, dateString);
  const cycleIndex = Math.floor(dayIndex / CYCLE_LENGTH);
  const slotIndex = mod(dayIndex, CYCLE_LENGTH);

  const seed = fnv1a32(`state-puzzle|v1|${cycleIndex}`);
  const order = seededShuffle([...INCLUDED_STATES], mulberry32(seed));

  return order[slotIndex];
}
```

### Why this approach

- no DB
- deterministic
- no repeats inside a cycle
- easy to test
- easy to explain

### Puzzle descriptor

For daily mode:

```ts
{
  id: `daily:${dateString}`,
  mode: 'daily',
  targetCode,
  dateString,
  puzzleNumber: dayIndex + 1
}
```

For random mode:

- use browser randomness
- generate `id = random:${targetCode}:${nonce}`

For custom mode:

- `id = custom:${targetCode}`

## 13. App state management

Use `useReducer`.

### Client game state

```ts
interface ClientGameState {
  puzzle: PuzzleDescriptor;
  guesses: StateCode[];
  status: "playing" | "won" | "lost";
  error: string | null;
  hasLoadedProgress: boolean;
}
```

### Reducer actions

- `INIT_PUZZLE`
- `RESTORE_PROGRESS`
- `SUBMIT_GUESS`
- `SET_ERROR`
- `CLEAR_ERROR`
- `RESET_RANDOM_PUZZLE`

Store only guesses and puzzle identity. Derive feedback rows from guesses + target each render.

## 14. localStorage strategy

Use localStorage only.

### Keys

- `state-puzzle:progress:v1:${puzzleId}`
- `state-puzzle:stats:v1`
- `state-puzzle:settings:v1` (optional)

### Stored progress

Persist:

- puzzleId
- mode
- targetCode for random/custom only
- guesses
- completed
- completedAt

Do not persist derived feedback.

### Restore behavior

On load:

1. resolve puzzle descriptor from query params/date
2. load progress for that puzzleId
3. if found and schema version matches, restore guesses
4. recompute feedback rows from guesses

### Completion behavior

Only write stats **once per puzzle**.
For daily puzzles, use `completedDailyIds` to avoid double-counting on refresh.

## 15. Stats rules

Track stats for **daily mode only** in v1.

### Stats fields

- played
- won
- currentDailyStreak
- maxDailyStreak
- guessDistribution
- completedDailyIds
- lastCompletedDailyId

### Streak behavior

- win daily puzzle today after winning previous daily puzzle yesterday → streak +1
- win after missing days → reset to 1
- lose daily puzzle → streak = 0
- replay same daily puzzle → no second stat update

If this feels too much for MVP, implement played/won/distribution first and streak second.

## 16. Map rendering spec

### Rendering approach

Use precomputed SVG path data from `map.generated.json`.
Do **not** build GIS projection logic into the browser.

### `StateMap` props

```ts
interface StateMapProps {
  mapData: GeneratedMapData;
  guessedRows: FeedbackRow[];
  targetCode?: StateCode;
  revealTarget: boolean;
}
```

### Fill rules

- default: muted slate
- guessed: color by distance bucket
- latest guess: stronger stroke
- reveal target: green
- lost reveal: also green, but keep guessed states visible

### Distance buckets

Use 5 buckets:

- `0–249`
- `250–499`
- `500–999`
- `1000–1499`
- `1500+`

Map to 5 semantic fills from near to far.

### Accessibility

Do not rely on color alone.
Every guess row still carries the actual clue text/icons.

## 17. Input/autocomplete spec

### Behavior

- single text field
- suggestions appear after 1 char
- arrow key navigation
- enter to submit
- click to select
- clear after successful guess
- keep focus in the input after submit

### Suggestion contents

- state name
- abbreviation

### Matching

- prefix match on name
- exact abbreviation match
- substring fallback allowed but not required

### Errors

Inline only:

- “Unknown state”
- “Already guessed”
- “Alaska/Hawaii are not in v1”
- “Out of guesses”

## 18. Result/share spec

### Win modal copy

- `Correct: Georgia`
- `Solved in 4/6`

### Loss modal copy

- `Out of guesses`
- `The state was Georgia`

### Exact reveal fields

- Population
- GDP per capita
- Land area
- Top export family

### Copy result

Use a compact text format.

Example:

```text
State Puzzle 2026-03-07 4/6
CA ↗ 1540mi ▲ ▲ ▼ ✕
CO → 980mi ▼ ▲ ▼ ✕
TN ↘ 380mi ▲ ≈ ▼ ✓
GA ✅
```

This does not need to be emoji-perfect in v1. Readable text is enough.

## 19. Suggested implementation details

## `app/page.tsx`

Server component:

- import generated JSON
- render `<StatePuzzleClient ... />`

Example shape:

```tsx
import statesData from "@/data/generated/states.generated.json";
import mapData from "@/data/generated/map.generated.json";
import metaData from "@/data/generated/meta.generated.json";
import { StatePuzzleClient } from "@/components/StatePuzzleClient";

export default function Page() {
  return (
    <StatePuzzleClient
      statesData={statesData}
      mapData={mapData}
      metaData={metaData}
    />
  );
}
```

## `StatePuzzleClient.tsx`

Responsibilities:

- parse query params client-side
- derive puzzle descriptor
- restore saved progress
- handle input submission
- compute target state
- derive feedback rows
- persist progress
- trigger completion stats
- render modals

## Pure logic files

Keep game logic pure and testable.

### `lib/date.ts`

- `getAppDateString`
- `daysBetween`
- `isPreviousDay`

### `lib/daily.ts`

- `getDailyTargetCode`
- `seededShuffle`
- `mulberry32`
- `fnv1a32`

### `lib/geo.ts`

- `haversineMiles`
- `bearingDegrees`
- `bearingToDirection8`
- `roundMiles`

### `lib/compare.ts`

- `compareNumeric`
- `compareExportFamily`

### `lib/puzzle.ts`

- `resolvePuzzleDescriptor`
- `getTargetState`
- `buildFeedbackRow`
- `isSolved`

### `lib/storage.ts`

- `loadProgress`
- `saveProgress`
- `clearProgress`
- `loadStats`
- `saveStats`

### `lib/stats.ts`

- `recordDailyCompletion`

## 20. Data pipeline plan

For the code agent, separate this into two layers.

### Layer A — required for MVP

Assume `generated/*.json` already exists.
Build the app against those files.

### Layer B — optional later

Add a node script to regenerate the snapshot from raw official files.

#### `optional-build-state-data.mjs` responsibilities

- read raw population file
- read raw GDP file
- read raw export file
- read raw Gazetteer/reference file
- merge by USPS code
- filter to contiguous 48
- derive GDP per capita
- normalize export labels
- validate no missing states
- emit `states.generated.json`

#### Map generation

Do this outside the browser.
Preferred options:

- one-time offline preprocess and commit `map.generated.json`
- or a separate node script if you already have GeoJSON

Do **not** require the code agent to parse Census shapefiles in the first pass.

## 21. Export family normalization

Store a friendly label in the snapshot.
Do not derive labels in the browser.

Recommended field:

- `topExportFamily.code`
- `topExportFamily.label`

Example labels:

- Computer & Electronic Products
- Transportation Equipment
- Chemical Products
- Machinery
- Petroleum & Coal Products
- Food Products
- Primary Metal Manufacturing
- Fabricated Metal Products
- Electrical Equipment
- Miscellaneous Manufacturing

Use whatever stable family mapping you pin in the snapshot.

## 22. Performance constraints

### Hard requirements

- no network calls during gameplay
- no DB
- no runtime server dependency
- map render should feel instant
- game state restore on refresh

### Soft goals

- keep initial JS modest
- keep map asset small
- avoid large animation libraries
- use CSS transitions only

## 23. Accessibility requirements

- keyboard playable
- visible focus styles
- icons always paired with text/aria labels
- do not encode meaning with color alone
- screen-reader text for clue semantics:
  - “Target population is higher than Illinois”
  - “Target shares top export family with Texas”

## 24. Testing plan

## Unit tests

Cover:

- input normalization
- distance calculations
- direction bucketing
- numeric comparison tolerance behavior
- export family match logic
- daily target determinism
- no-repeat behavior within 48-day cycle
- stats idempotency
- progress restore

## Integration tests

Cover:

- play and solve flow
- lose flow
- restore on refresh
- random mode reset
- `?date=` override
- `?target=` custom mode
- duplicate guess rejection

## Manual QA checklist

- daily puzzle is same across refreshes
- random mode gives a new board
- solve modal shows exact values
- stats update once only
- copied result is readable
- mobile layout does not break
- map colors align with guess distance

## 25. Acceptance criteria

The build is done when all of these are true:

1. App runs as a static Next.js export.
2. No DB or backend is required.
3. Root route loads the puzzle.
4. Daily puzzle is deterministic by date.
5. Random mode works.
6. User can enter state name or abbreviation.
7. Invalid and duplicate guesses are blocked.
8. Each guess produces direction, distance, 3 numeric hints, and export match.
9. Game ends on correct guess or guess 6.
10. Map visibly updates after each guess.
11. Refresh restores the current puzzle progress.
12. Daily stats are stored locally and not double-counted.
13. Result modal reveals exact state metrics.
14. All 48 contiguous states are present.
15. No runtime data fetches occur during play.

## 26. Recommended build order

### Phase 1

Scaffold app and wire static export.

- layout
- page
- placeholder data load
- basic shell

### Phase 2

Implement pure game logic.

- types
- daily target selection
- compare functions
- geo functions
- tests for logic

### Phase 3

Build board UI.

- input
- guess table
- result logic
- map with placeholder colors

### Phase 4

Add persistence.

- progress restore
- stats
- copy result

### Phase 5

Polish.

- focus states
- responsive layout
- legends
- empty states
- better reveal modal

## 27. Explicit “do not overbuild” guardrails

- Do not add a database.
- Do not add auth.
- Do not add API routes unless absolutely necessary.
- Do not fetch live government data at runtime.
- Do not implement Alaska/Hawaii.
- Do not build archive pages with dynamic routes.
- Do not parse shapefiles in-browser.
- Do not add multiplayer.
- Do not add canvas/WebGL.
- Do not hide core logic inside UI components.

## 28. Short handoff brief for Codex / Claude Code

Build a **Next.js App Router + TypeScript** game called **State Puzzle** using **static export** and **no database**. The root route should load a daily U.S. state guessing game for the contiguous 48 states only. Use pre-generated JSON files for state data and SVG map paths. Keep gameplay logic in pure functions under `lib/`. Use a client-side reducer for interactive state, localStorage for progress/stats, and no runtime API calls. Implement 6 guesses, daily and random mode, autocomplete input, map coloring by distance, guess feedback rows, and a win/lose reveal modal with exact figures. Follow the data shapes and file structure in this spec.

The next most useful thing to produce from this would be a matching `states.generated.json` schema example with 5–6 sample states plus a starter `map.generated.json` contract.

[1]: https://nextjs.org/docs/app/getting-started/server-and-client-components "https://nextjs.org/docs/app/getting-started/server-and-client-components"
[2]: https://www.census.gov/data/tables/time-series/demo/popest/2020s-state-total.html "https://www.census.gov/data/tables/time-series/demo/popest/2020s-state-total.html"
[3]: https://nextjs.org/docs/app/guides/static-exports "https://nextjs.org/docs/app/guides/static-exports"

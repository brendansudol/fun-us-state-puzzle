# State Puzzle

Static-exported Next.js game for guessing a hidden contiguous U.S. state in up to 6 tries.

The app implements the spec in [docs/001-spec.md](/Users/brendansudol/Documents/code/fun-us-state-puzzle/docs/001-spec.md): daily mode, random mode, `?target=` custom mode, local-only progress/stats, clue table, and SVG map feedback.

## Stack

- Next.js App Router
- TypeScript
- Static export via `output: "export"`
- Client-side reducer + `localStorage`
- Generated JSON snapshots under `data/generated/`

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run test
npm run generate:data
npm run validate:data
```

`npm run build` produces a fully static export in `out/`.

## Game Modes

- Daily: default mode, deterministic by `America/New_York` date
- Random: client-side fresh puzzle
- Custom: `?target=TX`

Supported query params:

- `?mode=daily`
- `?mode=random`
- `?date=YYYY-MM-DD`
- `?target=TX`
- `?debug=1`

Examples:

```text
/
/?mode=random
/?date=2026-03-07
/?target=GA
/?target=TX&debug=1
```

## Data

Pinned generated files live in `data/generated/`:

- `states.generated.json`
- `map.generated.json`
- `meta.generated.json`

Current snapshot inputs:

- Population: Census 2024 state population estimates
- Centroid/land area: Census 2025 Gazetteer state file
- Map geometry: Census cartographic data via `us-atlas`
- GDP: pinned 2023 current-dollar GDP-by-state snapshot
- Export family: pinned in-repo snapshot used for gameplay matching

Regenerate the JSON snapshot with:

```bash
npm run generate:data
npm run validate:data
```

## Structure

```text
app/           Next.js route shell and global styles
components/    Client UI
lib/           Pure gameplay logic, reducer, storage, stats
data/generated/Committed puzzle snapshot data
scripts/       Data generation and validation
tests/         Vitest coverage for pure logic
docs/          Product spec
```

## Verification

Current repo checks:

```bash
npm run validate:data
npm test
npm run build
```

"use client";

import { useEffect, useReducer, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { GuessInput } from "@/components/GuessInput";
import { GuessTable } from "@/components/GuessTable";
import { HeaderBar } from "@/components/HeaderBar";
import { HowToPlayModal } from "@/components/HowToPlayModal";
import { ResultModal } from "@/components/ResultModal";
import { StateMap } from "@/components/StateMap";
import { StatsModal } from "@/components/StatsModal";
import { DAILY_EPOCH, MAX_GUESSES } from "@/lib/constants";
import { buildShareText, createRandomPuzzleSession, getGameStatus, normalizeStateInput, pickRandomTargetCode, resolvePuzzleDescriptor } from "@/lib/puzzle";
import { createInitialGameState, gameReducer } from "@/lib/reducer";
import { parseSearchParams } from "@/lib/search-params";
import { getFeedbackRows, getLatestGuessCode, indexStatesByCode } from "@/lib/selectors";
import { loadProgress, loadSettings, loadStats, saveProgress, saveSettings, saveStats } from "@/lib/storage";
import { recordDailyCompletion } from "@/lib/stats";
import type {
  GeneratedMapData,
  MetaGeneratedData,
  StatesGeneratedData,
} from "@/lib/types";
import { getDailyTargetCode } from "@/lib/daily";

interface StatePuzzleClientProps {
  statesData: StatesGeneratedData;
  mapData: GeneratedMapData;
  metaData: MetaGeneratedData;
}

const UNSUPPORTED_INPUTS = new Set(["ak", "alaska", "hi", "hawaii", "dc", "districtofcolumbia"]);

function normalizeRawInput(value: string) {
  return value.trim().toLowerCase().replaceAll(/[^a-z]/g, "");
}

function buildUrl(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function StatePuzzleClient({ statesData, mapData, metaData }: StatePuzzleClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsedParams = parseSearchParams(searchParams);
  const states = statesData.states;
  const statesByCode = indexStatesByCode(states);
  const initialPuzzle = {
    id: `daily:${DAILY_EPOCH}`,
    mode: "daily" as const,
    targetCode: getDailyTargetCode(DAILY_EPOCH),
    dateString: DAILY_EPOCH,
    puzzleNumber: 1,
  };
  const [state, dispatch] = useReducer(gameReducer, createInitialGameState(initialPuzzle));
  const [stats, setStats] = useState(loadStats);
  const [settings, setSettings] = useState(loadSettings);
  const [resultOpen, setResultOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const nextSettings = loadSettings();
    const puzzle = resolvePuzzleDescriptor({
      params: parsedParams,
      states,
      randomSession: nextSettings.activeRandomPuzzle,
    });
    const progress = loadProgress(puzzle.id);
    const guesses = progress?.guesses ?? [];

    dispatch({ type: "INIT_PUZZLE", puzzle });
    dispatch({
      type: "RESTORE_PROGRESS",
      guesses,
      status: getGameStatus(guesses, puzzle.targetCode),
    });
    setStats(loadStats());
    setSettings(nextSettings);
    setCopied(false);
    if (!nextSettings.hasSeenHowTo) {
      setHowToOpen(true);
    }
  }, [parsedParams.date, parsedParams.debug, parsedParams.mode, parsedParams.target, states]);

  const feedbackRows = getFeedbackRows(state.guesses, statesByCode, state.puzzle.targetCode);
  const latestGuessCode = getLatestGuessCode(state.guesses);
  const targetState = statesByCode[state.puzzle.targetCode];
  const guessesRemaining = Math.max(0, MAX_GUESSES - state.guesses.length);
  const shareText = buildShareText({
    puzzle: state.puzzle,
    guesses: state.guesses,
    targetCode: state.puzzle.targetCode,
    rows: feedbackRows,
  });
  const disabledGuessing = !state.hasLoadedProgress || state.status !== "playing";

  useEffect(() => {
    if (!state.hasLoadedProgress) {
      return;
    }

    saveProgress({
      version: 1,
      puzzleId: state.puzzle.id,
      mode: state.puzzle.mode,
      targetCode: state.puzzle.mode === "daily" ? undefined : state.puzzle.targetCode,
      guesses: state.guesses,
      completed: state.status !== "playing",
      completedAt: state.status === "playing" ? undefined : new Date().toISOString(),
    });
  }, [state.guesses, state.hasLoadedProgress, state.puzzle.id, state.puzzle.mode, state.puzzle.targetCode, state.status]);

  useEffect(() => {
    if (!state.hasLoadedProgress || state.status === "playing") {
      return;
    }

    const nextStats = recordDailyCompletion({
      stats: loadStats(),
      puzzle: state.puzzle,
      didWin: state.status === "won",
      guessCount: state.guesses.length,
    });

    saveStats(nextStats);
    setStats(nextStats);
    setResultOpen(true);
  }, [state.guesses.length, state.hasLoadedProgress, state.puzzle, state.status]);

  function updateSettings(nextSettings: ReturnType<typeof loadSettings>) {
    saveSettings(nextSettings);
    setSettings(nextSettings);
  }

  function handleUnsupportedInput(rawInput: string) {
    return UNSUPPORTED_INPUTS.has(normalizeRawInput(rawInput));
  }

  function submitGuess(rawInput: string): boolean {
    if (state.status !== "playing") {
      dispatch({ type: "SET_ERROR", error: "Out of guesses" });
      return false;
    }

    const code = normalizeStateInput(rawInput, states);

    if (!code) {
      dispatch({
        type: "SET_ERROR",
        error: handleUnsupportedInput(rawInput) ? "Alaska/Hawaii are not in v1" : "Unknown state",
      });
      return false;
    }

    if (state.guesses.includes(code)) {
      dispatch({ type: "SET_ERROR", error: "Already guessed" });
      return false;
    }

    dispatch({ type: "SUBMIT_GUESS", guess: code, targetCode: state.puzzle.targetCode });
    return true;
  }

  function handleStartRandom() {
    const nextTargetCode = pickRandomTargetCode(state.puzzle.mode === "random" ? state.puzzle.targetCode : undefined);
    const nextSession = createRandomPuzzleSession(nextTargetCode);
    updateSettings({
      ...loadSettings(),
      hasSeenHowTo: settings.hasSeenHowTo,
      activeRandomPuzzle: nextSession,
    });
    dispatch({
      type: "RESET_RANDOM_PUZZLE",
      puzzle: {
        id: nextSession.puzzleId,
        mode: "random",
        targetCode: nextSession.targetCode,
      },
    });
    setResultOpen(false);
    setCopied(false);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("mode", "random");
    nextParams.delete("date");
    nextParams.delete("target");
    router.replace(buildUrl(pathname, nextParams), { scroll: false });
  }

  function handleStartDaily() {
    setResultOpen(false);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("mode", "daily");
    nextParams.delete("date");
    nextParams.delete("target");
    router.replace(buildUrl(pathname, nextParams), { scroll: false });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
  }

  function handleCloseHowTo() {
    setHowToOpen(false);
    updateSettings({
      ...loadSettings(),
      activeRandomPuzzle: settings.activeRandomPuzzle,
      hasSeenHowTo: true,
    });
  }

  return (
    <main className="appShell">
      <HeaderBar
        puzzle={state.puzzle}
        guessesRemaining={guessesRemaining}
        onOpenHowTo={() => setHowToOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        onStartDaily={handleStartDaily}
        onStartRandom={handleStartRandom}
      />

      <section className="statusStrip" aria-label="Puzzle overview">
        <div className="statCard">
          <span className="statLabel">Mode</span>
          <span className="statValue">{state.puzzle.mode}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Puzzle</span>
          <span className="statValue">
            {state.puzzle.mode === "daily" ? state.puzzle.dateString : state.puzzle.targetCode}
          </span>
        </div>
        <div className="statCard">
          <span className="statLabel">Guesses left</span>
          <span className="statValue">{guessesRemaining}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Daily streak</span>
          <span className="statValue">{stats.currentDailyStreak}</span>
        </div>
      </section>

      <div className="boardGrid">
        <StateMap
          mapData={mapData}
          guessedRows={feedbackRows}
          targetCode={state.puzzle.targetCode}
          revealTarget={state.status !== "playing"}
          latestGuessCode={latestGuessCode}
        />

        <section className="sidePanel">
          <GuessInput
            states={states}
            guessedCodes={state.guesses}
            disabled={disabledGuessing}
            error={state.error}
            onSubmitGuess={submitGuess}
          />

          {parsedParams.debug ? (
            <section className="panelCard debugCard">Debug target: {targetState.name} ({targetState.code})</section>
          ) : null}

          {state.status !== "playing" ? (
            <section className="panelCard statusCard" data-status={state.status}>
              <h2 className="statusTitle">
                {state.status === "won" ? `Solved in ${state.guesses.length}/${MAX_GUESSES}` : "Out of guesses"}
              </h2>
              <p className="statusCopy">
                {state.status === "won"
                  ? `${targetState.name} was the correct state.`
                  : `The target was ${targetState.name}.`}
              </p>
            </section>
          ) : null}

          <GuessTable rows={feedbackRows} latestGuessCode={latestGuessCode} targetCode={state.puzzle.targetCode} />

          <section className="panelCard legendCard">
            <div className="sectionHeader">
              <h2 className="sectionTitle">Clue legend</h2>
            </div>
            <ul className="legendList">
              <li>
                <strong>▲ / ▼ / ≈</strong> compare the target against your guess.
              </li>
              <li>
                <strong>✓ / ✕</strong> shows whether the export family matches exactly.
              </li>
              <li>
                <strong>Direction + miles</strong> use the state centroid/internal-point snapshot.
              </li>
            </ul>
          </section>
        </section>
      </div>

      <HowToPlayModal open={howToOpen} onClose={handleCloseHowTo} />
      <StatsModal open={statsOpen} stats={stats} onClose={() => setStatsOpen(false)} />
      <ResultModal
        open={resultOpen}
        puzzle={state.puzzle}
        targetState={targetState}
        guessesCount={state.guesses.length}
        status={state.status === "playing" ? "lost" : state.status}
        metaData={metaData}
        copied={copied}
        onClose={() => setResultOpen(false)}
        onCopy={handleCopy}
        onPlayRandom={handleStartRandom}
      />
    </main>
  );
}

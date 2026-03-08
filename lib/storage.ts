import { EMPTY_GUESS_DISTRIBUTION, STORAGE_KEYS, STORAGE_VERSION } from "@/lib/constants";
import type { StoredProgress, StoredSettings, StoredStats } from "@/lib/types";

function safeLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function safeParse<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function loadProgress(puzzleId: string): StoredProgress | null {
  const storage = safeLocalStorage();
  const progress = safeParse<StoredProgress>(storage?.getItem(STORAGE_KEYS.progress(puzzleId)) ?? null);

  return progress?.version === STORAGE_VERSION ? progress : null;
}

export function saveProgress(progress: StoredProgress) {
  const storage = safeLocalStorage();
  storage?.setItem(STORAGE_KEYS.progress(progress.puzzleId), JSON.stringify(progress));
}

export function clearProgress(puzzleId: string) {
  safeLocalStorage()?.removeItem(STORAGE_KEYS.progress(puzzleId));
}

export function createEmptyStats(): StoredStats {
  return {
    version: STORAGE_VERSION,
    played: 0,
    won: 0,
    currentDailyStreak: 0,
    maxDailyStreak: 0,
    guessDistribution: { ...EMPTY_GUESS_DISTRIBUTION },
    completedDailyIds: [],
  };
}

export function loadStats(): StoredStats {
  const storage = safeLocalStorage();
  const stats = safeParse<StoredStats>(storage?.getItem(STORAGE_KEYS.stats) ?? null);

  return stats?.version === STORAGE_VERSION ? stats : createEmptyStats();
}

export function saveStats(stats: StoredStats) {
  safeLocalStorage()?.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
}

export function loadSettings(): StoredSettings {
  const storage = safeLocalStorage();
  const settings = safeParse<StoredSettings>(storage?.getItem(STORAGE_KEYS.settings) ?? null);

  if (settings?.version === STORAGE_VERSION) {
    return settings;
  }

  return {
    version: STORAGE_VERSION,
  };
}

export function saveSettings(settings: StoredSettings) {
  safeLocalStorage()?.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

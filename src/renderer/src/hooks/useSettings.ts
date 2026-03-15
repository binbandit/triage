import { useState, useCallback } from "react";
import type { Settings } from "../types";

const STORAGE_KEY = "triage:settings";

const DEFAULT_SETTINGS: Settings = {
  requiredLabels: [],
  repo: "",
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    /* corrupt storage, reset */
  }
  return DEFAULT_SETTINGS;
}

function persistSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

type SettingsUpdater = Settings | ((prev: Settings) => Settings);

export function useSettings(): [Settings, (updater: SettingsUpdater) => void] {
  const [settings, setSettingsState] = useState<Settings>(loadSettings);

  const setSettings = useCallback((updater: SettingsUpdater) => {
    setSettingsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persistSettings(next);
      return next;
    });
  }, []);

  return [settings, setSettings];
}

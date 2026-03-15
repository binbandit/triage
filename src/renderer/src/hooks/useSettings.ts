import { useState, useCallback, useEffect } from "react";
import type { Settings } from "../types";

const STORAGE_KEY = "triage:settings";

const DEFAULT_SETTINGS: Settings = {
  repo: "",
  theme: "dark",
  viewMode: "list",
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

function applyTheme(theme: string): void {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
  } else {
    root.classList.remove("light");
  }
}

type SettingsUpdater = Settings | ((prev: Settings) => Settings);

export function useSettings(): [Settings, (updater: SettingsUpdater) => void] {
  const [settings, setSettingsState] = useState<Settings>(loadSettings);

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const setSettings = useCallback((updater: SettingsUpdater) => {
    setSettingsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persistSettings(next);
      return next;
    });
  }, []);

  return [settings, setSettings];
}

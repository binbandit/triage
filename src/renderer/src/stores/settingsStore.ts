import { create } from "zustand";
import type { Settings, Theme, ViewMode } from "../types";

const STORAGE_KEY = "triage:settings";

const DEFAULT_SETTINGS: Settings = {
  repo: "",
  theme: "dark",
  viewMode: "list",
  inlinePRView: false,
  interceptGitHubLinks: false,
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

function applyTheme(theme: string): void {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
  } else {
    root.classList.remove("light");
  }
}

interface SettingsStore extends Settings {
  setRepo: (repo: string) => void;
  setTheme: (theme: Theme) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setInlinePRView: (enabled: boolean) => void;
  setInterceptGitHubLinks: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => {
  const initial = loadSettings();
  applyTheme(initial.theme);

  const persist = () => {
    const state = get();
    const settings: Settings = {
      repo: state.repo,
      theme: state.theme,
      viewMode: state.viewMode,
      inlinePRView: state.inlinePRView,
      interceptGitHubLinks: state.interceptGitHubLinks,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  };

  return {
    ...initial,
    setRepo: (repo) => {
      set({ repo });
      persist();
    },
    setTheme: (theme) => {
      set({ theme });
      applyTheme(theme);
      persist();
    },
    setViewMode: (viewMode) => {
      set({ viewMode });
      persist();
    },
    setInlinePRView: (inlinePRView) => {
      set({ inlinePRView });
      persist();
    },
    setInterceptGitHubLinks: (interceptGitHubLinks) => {
      set({ interceptGitHubLinks });
      persist();
    },
  };
});

import { create } from "zustand";
import type { TriageConfig } from "../types";
import { parseTriageConfig } from "../lib/parseConfig";

interface ConfigStore {
  config: TriageConfig | null;
  configLoading: boolean;
  configError: string | null;

  fetchConfig: (repo: string) => Promise<void>;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: null,
  configLoading: false,
  configError: null,

  fetchConfig: async (repo) => {
    set({ configLoading: true, configError: null });
    try {
      const result = await window.api.fetchConfig({ repo });
      if (result.found && result.content) {
        set({ config: parseTriageConfig(result.content), configLoading: false });
      } else {
        set({ config: null, configLoading: false });
      }
    } catch (err) {
      set({
        configError: err instanceof Error ? err.message : "Failed to fetch config",
        config: null,
        configLoading: false,
      });
    }
  },
}));

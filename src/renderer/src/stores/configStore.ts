import { create } from "zustand";
import type { TriageConfig } from "../types";
import { parseTriageConfig } from "../lib/parseConfig";
import { parseLocalConfigForRepo } from "../lib/parseLocalConfig";

type ConfigSource = "local" | "repo" | null;

interface ConfigStore {
  config: TriageConfig | null;
  configSource: ConfigSource;
  configLoading: boolean;
  configError: string | null;

  fetchConfig: (repo: string) => Promise<void>;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: null,
  configSource: null,
  configLoading: false,
  configError: null,

  fetchConfig: async (repo) => {
    set({ configLoading: true, configError: null });

    // 1. Try local config first (~/.config/triage/triage.yaml)
    try {
      const localResult = await window.api.readLocalConfigForRepo({ repo });
      if (localResult.found && localResult.content) {
        const localConfig = parseLocalConfigForRepo(localResult.content, repo);
        if (localConfig && localConfig.groups.length > 0) {
          set({ config: localConfig, configSource: "local", configLoading: false });
          return;
        }
      }
    } catch {
      // Local config read failed, fall through to repo config
    }

    // 2. Fall back to repo .triage.yml
    try {
      const result = await window.api.fetchConfig({ repo });
      if (result.found && result.content) {
        set({
          config: parseTriageConfig(result.content),
          configSource: "repo",
          configLoading: false,
        });
      } else {
        set({ config: null, configSource: null, configLoading: false });
      }
    } catch (err) {
      set({
        configError: err instanceof Error ? err.message : "Failed to fetch config",
        config: null,
        configSource: null,
        configLoading: false,
      });
    }
  },
}));

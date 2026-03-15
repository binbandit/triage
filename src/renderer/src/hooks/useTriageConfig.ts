import { useState, useCallback } from "react";
import type { TriageConfig } from "../types";
import { parseTriageConfig } from "../lib/parseConfig";

interface UseTriageConfigReturn {
  config: TriageConfig | null;
  configLoading: boolean;
  configError: string | null;
  fetchConfig: (repo: string) => Promise<void>;
}

export function useTriageConfig(): UseTriageConfigReturn {
  const [config, setConfig] = useState<TriageConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const fetchConfig = useCallback(async (repo: string) => {
    setConfigLoading(true);
    setConfigError(null);
    try {
      const result = await window.api.fetchConfig({ repo });
      if (result.found && result.content) {
        setConfig(parseTriageConfig(result.content));
      } else {
        setConfig(null);
      }
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : "Failed to fetch config");
      setConfig(null);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  return { config, configLoading, configError, fetchConfig };
}

import { useState, useCallback } from "react";
import type { PullRequest } from "../types";

interface UsePRsReturn {
  prs: PullRequest[];
  loading: boolean;
  error: string | null;
  fetchPRs: (repo?: string) => Promise<void>;
}

export function usePRs(): UsePRsReturn {
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPRs = useCallback(async (repo?: string) => {
    setLoading(true);
    setError(null);
    try {
      const options: { state: string; limit: number; repo?: string } = {
        state: "open",
        limit: 1000,
      };
      if (repo) {
        options.repo = repo;
      }
      const result = await window.api.listPRs(options);
      setPrs(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch pull requests");
      setPrs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { prs, loading, error, fetchPRs };
}

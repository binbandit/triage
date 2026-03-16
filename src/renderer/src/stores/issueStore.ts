import { create } from "zustand";
import type { Issue } from "../types";

interface IssueStore {
  issues: Issue[];
  loading: boolean;
  error: string | null;

  fetchIssues: (repo: string) => Promise<void>;
}

export const useIssueStore = create<IssueStore>((set) => ({
  issues: [],
  loading: false,
  error: null,

  fetchIssues: async (repo) => {
    if (!repo) return;
    set({ loading: true, error: null });
    try {
      const result = await window.api.listIssues({ repo, state: "all", limit: 200 });
      set({ issues: Array.isArray(result) ? result : [], loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch issues",
        issues: [],
        loading: false,
      });
    }
  },
}));

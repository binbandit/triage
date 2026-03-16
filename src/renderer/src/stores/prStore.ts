import { create } from "zustand";
import type { PullRequest } from "../types";

interface PRStore {
  prs: PullRequest[];
  loading: boolean;
  error: string | null;
  search: string;
  closedFetchedRepo: string;

  setSearch: (search: string) => void;
  fetchPRs: (repo: string) => Promise<void>;
  fetchClosedPRs: (repo: string) => Promise<void>;
  refresh: (repo: string) => Promise<void>;
  /** Optimistically update a PR's state in the local store */
  updatePRState: (number: number, state: string, mergedAt?: string) => void;
}

export const usePRStore = create<PRStore>((set, get) => ({
  prs: [],
  loading: false,
  error: null,
  search: "",
  closedFetchedRepo: "",

  setSearch: (search) => set({ search }),

  fetchPRs: async (repo) => {
    if (!repo) return;
    set({ loading: true, error: null, closedFetchedRepo: "" });
    try {
      const result = await window.api.listPRs({ state: "open", limit: 1000, repo });
      set({ prs: Array.isArray(result) ? result : [], loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch pull requests",
        prs: [],
        loading: false,
      });
    }
  },

  fetchClosedPRs: async (repo) => {
    if (!repo) return;
    if (get().closedFetchedRepo === repo) return;
    set({ closedFetchedRepo: repo });
    try {
      const result = await window.api.listPRs({ state: "closed", limit: 100, repo });
      if (Array.isArray(result)) {
        set((state) => {
          const existing = new Set(state.prs.map((p) => p.number));
          const newPRs = result.filter((p: PullRequest) => !existing.has(p.number));
          return { prs: [...state.prs, ...newPRs] };
        });
      }
    } catch {
      // Non-critical
    }
  },

  refresh: async (repo) => {
    const store = get();
    set({ closedFetchedRepo: "" });
    await store.fetchPRs(repo);
  },

  updatePRState: (number, state, mergedAt) => {
    set((prev) => ({
      prs: prev.prs.map((pr) =>
        pr.number === number ? { ...pr, state, ...(mergedAt ? { mergedAt } : {}) } : pr,
      ),
    }));
  },
}));

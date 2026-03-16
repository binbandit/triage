import { create } from "zustand";
import type { PullRequest } from "../types";

interface PRStore {
  prs: PullRequest[];
  loading: boolean;
  loadingClosed: boolean;
  error: string | null;
  search: string;
  closedFetchedRepo: string;

  setSearch: (search: string) => void;
  fetchPRs: (repo: string) => Promise<void>;
  fetchClosedPRs: (repo: string) => Promise<void>;
  refresh: (repo: string) => Promise<void>;
  updatePRState: (number: number, state: string, mergedAt?: string) => void;
}

export const usePRStore = create<PRStore>((set, get) => ({
  prs: [],
  loading: false,
  loadingClosed: false,
  error: null,
  search: "",
  closedFetchedRepo: "",

  setSearch: (search) => set({ search }),

  fetchPRs: async (repo) => {
    if (!repo) return;
    set({ loading: true, error: null });
    try {
      const result = await window.api.listPRs({ state: "open", limit: 1000, repo });
      const openPRs = Array.isArray(result) ? result : [];

      set((state) => {
        // Keep existing closed/merged PRs, replace open ones
        const openNumbers = new Set(openPRs.map((p: PullRequest) => p.number));
        const keptClosed = state.prs.filter(
          (pr) =>
            (pr.state === "CLOSED" || pr.state === "MERGED" || pr.mergedAt) &&
            !openNumbers.has(pr.number),
        );
        // Deduplicate: use a Set to ensure no PR appears twice
        const seen = new Set<number>();
        const merged: PullRequest[] = [];
        for (const pr of [...openPRs, ...keptClosed]) {
          if (!seen.has(pr.number)) {
            seen.add(pr.number);
            merged.push(pr);
          }
        }
        return { prs: merged, loading: false };
      });
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
    set({ closedFetchedRepo: repo, loadingClosed: true });
    try {
      const result = await window.api.listPRs({ state: "closed", limit: 100, repo });
      if (Array.isArray(result)) {
        set((state) => {
          const seen = new Set(state.prs.map((p) => p.number));
          const newPRs = result.filter((p: PullRequest) => {
            if (seen.has(p.number)) return false;
            seen.add(p.number);
            return true;
          });
          return { prs: [...state.prs, ...newPRs], loadingClosed: false };
        });
      } else {
        set({ loadingClosed: false });
      }
    } catch {
      set({ loadingClosed: false });
    }
  },

  refresh: async (repo) => {
    set({ closedFetchedRepo: "" });
    await get().fetchPRs(repo);
  },

  updatePRState: (number, state, mergedAt) => {
    set((prev) => ({
      prs: prev.prs.map((pr) =>
        pr.number === number ? { ...pr, state, ...(mergedAt ? { mergedAt } : {}) } : pr,
      ),
    }));
  },
}));

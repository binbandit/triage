import { create } from "zustand";
import type { PullRequestDetail } from "../types";
import type { DiffFile } from "../lib/parseDiff";
import { parseDiff } from "../lib/parseDiff";

type DetailTab = "conversation" | "commits" | "changes";

interface PRDetailStore {
  /** The PR number currently being viewed, or null if list view */
  activePR: number | null;
  detail: PullRequestDetail | null;
  diff: DiffFile[];
  rawDiff: string;
  loading: boolean;
  error: string | null;
  tab: DetailTab;
  actionLoading: boolean;
  actionError: string | null;

  openPR: (repo: string, number: number) => Promise<void>;
  closePR: () => void;
  setTab: (tab: DetailTab) => void;
  refresh: (repo: string) => Promise<void>;
  clearActionError: () => void;

  /** PR mutations */
  addComment: (repo: string, body: string) => Promise<boolean>;
  editTitle: (repo: string, title: string) => Promise<boolean>;
  editBody: (repo: string, body: string) => Promise<boolean>;
  addLabels: (repo: string, labels: string[]) => Promise<boolean>;
  removeLabels: (repo: string, labels: string[]) => Promise<boolean>;
  submitReview: (
    repo: string,
    event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT",
    body?: string,
  ) => Promise<boolean>;
}

export const usePRDetailStore = create<PRDetailStore>((set, get) => ({
  activePR: null,
  detail: null,
  diff: [],
  rawDiff: "",
  loading: false,
  error: null,
  tab: "conversation",
  actionLoading: false,
  actionError: null,

  openPR: async (repo, number) => {
    set({
      activePR: number,
      loading: true,
      error: null,
      detail: null,
      diff: [],
      rawDiff: "",
      tab: "conversation",
    });
    try {
      const [detail, rawDiff] = await Promise.all([
        window.api.getPR({ repo, number }),
        window.api.getPRDiff({ repo, number }).catch(() => ""),
      ]);
      const diff = typeof rawDiff === "string" && rawDiff ? parseDiff(rawDiff) : [];
      set({ detail, diff, rawDiff: typeof rawDiff === "string" ? rawDiff : "", loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load PR",
        loading: false,
      });
    }
  },

  closePR: () => {
    set({ activePR: null, detail: null, diff: [], rawDiff: "", error: null, tab: "conversation" });
  },

  setTab: (tab) => set({ tab }),

  refresh: async (repo) => {
    const { activePR } = get();
    if (!activePR) return;
    try {
      const [detail, rawDiff] = await Promise.all([
        window.api.getPR({ repo, number: activePR }),
        window.api.getPRDiff({ repo, number: activePR }).catch(() => ""),
      ]);
      const diff = typeof rawDiff === "string" && rawDiff ? parseDiff(rawDiff) : [];
      set({ detail, diff, rawDiff: typeof rawDiff === "string" ? rawDiff : "" });
    } catch {
      // Silent refresh failure
    }
  },

  clearActionError: () => set({ actionError: null }),

  addComment: async (repo, body) => {
    const { activePR } = get();
    if (!activePR) return false;
    set({ actionLoading: true, actionError: null });
    try {
      await window.api.commentPR({ repo, number: activePR, body });
      await get().refresh(repo);
      set({ actionLoading: false });
      return true;
    } catch (err) {
      set({
        actionError: err instanceof Error ? err.message : "Failed to add comment",
        actionLoading: false,
      });
      return false;
    }
  },

  editTitle: async (repo, title) => {
    const { activePR } = get();
    if (!activePR) return false;
    set({ actionLoading: true, actionError: null });
    try {
      await window.api.editPR({ repo, number: activePR, title });
      set((s) => ({
        detail: s.detail ? { ...s.detail, title } : null,
        actionLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        actionError: err instanceof Error ? err.message : "Failed to edit title",
        actionLoading: false,
      });
      return false;
    }
  },

  editBody: async (repo, body) => {
    const { activePR } = get();
    if (!activePR) return false;
    set({ actionLoading: true, actionError: null });
    try {
      await window.api.editPR({ repo, number: activePR, body });
      set((s) => ({
        detail: s.detail ? { ...s.detail, body } : null,
        actionLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        actionError: err instanceof Error ? err.message : "Failed to edit body",
        actionLoading: false,
      });
      return false;
    }
  },

  addLabels: async (repo, labels) => {
    const { activePR } = get();
    if (!activePR) return false;
    set({ actionLoading: true, actionError: null });
    try {
      await window.api.editPR({ repo, number: activePR, addLabels: labels });
      await get().refresh(repo);
      set({ actionLoading: false });
      return true;
    } catch (err) {
      set({
        actionError: err instanceof Error ? err.message : "Failed to add labels",
        actionLoading: false,
      });
      return false;
    }
  },

  removeLabels: async (repo, labels) => {
    const { activePR } = get();
    if (!activePR) return false;
    set({ actionLoading: true, actionError: null });
    try {
      await window.api.editPR({ repo, number: activePR, removeLabels: labels });
      await get().refresh(repo);
      set({ actionLoading: false });
      return true;
    } catch (err) {
      set({
        actionError: err instanceof Error ? err.message : "Failed to remove labels",
        actionLoading: false,
      });
      return false;
    }
  },

  submitReview: async (repo, event, body) => {
    const { activePR } = get();
    if (!activePR) return false;
    set({ actionLoading: true, actionError: null });
    try {
      await window.api.submitReview({ repo, number: activePR, event, body });
      await get().refresh(repo);
      set({ actionLoading: false });
      return true;
    } catch (err) {
      set({
        actionError: err instanceof Error ? err.message : "Failed to submit review",
        actionLoading: false,
      });
      return false;
    }
  },
}));

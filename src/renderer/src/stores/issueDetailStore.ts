import { create } from "zustand";
import type { Issue } from "../types";

interface IssueDetailStore {
  activeIssue: number | null;
  detail: Issue | null;
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  actionError: string | null;

  openIssue: (repo: string, number: number) => Promise<void>;
  closeIssue: () => void;
  refresh: (repo: string) => Promise<void>;
  clearActionError: () => void;

  addComment: (repo: string, body: string) => Promise<boolean>;
  editTitle: (repo: string, title: string) => Promise<boolean>;
  editBody: (repo: string, body: string) => Promise<boolean>;
  addLabels: (repo: string, labels: string[]) => Promise<boolean>;
  removeLabels: (repo: string, labels: string[]) => Promise<boolean>;
  closeIssueAction: (repo: string, comment?: string) => Promise<boolean>;
  reopenIssueAction: (repo: string) => Promise<boolean>;
}

export const useIssueDetailStore = create<IssueDetailStore>((set, get) => ({
  activeIssue: null,
  detail: null,
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,

  openIssue: async (repo, number) => {
    set({ activeIssue: number, loading: true, error: null, detail: null });
    try {
      const detail = await window.api.getIssue({ repo, number });
      set({ detail, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load issue",
        loading: false,
      });
    }
  },

  closeIssue: () => {
    set({ activeIssue: null, detail: null, error: null });
  },

  refresh: async (repo) => {
    const { activeIssue } = get();
    if (!activeIssue) return;
    try {
      const detail = await window.api.getIssue({ repo, number: activeIssue });
      set({ detail });
    } catch {
      // Silent
    }
  },

  clearActionError: () => set({ actionError: null }),

  addComment: async (repo, body) => {
    const { activeIssue } = get();
    if (!activeIssue) return false;
    set({ actionLoading: true, actionError: null });
    try {
      await window.api.commentIssue({ repo, number: activeIssue, body });
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
    const { activeIssue } = get();
    if (!activeIssue) return false;
    set({ actionLoading: true, actionError: null });
    try {
      await window.api.editIssue({ repo, number: activeIssue, title });
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
    const { activeIssue } = get();
    if (!activeIssue) return false;
    set({ actionLoading: true, actionError: null });
    try {
      await window.api.editIssue({ repo, number: activeIssue, body });
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
    const { activeIssue } = get();
    if (!activeIssue) return false;
    set({ actionLoading: true, actionError: null });
    try {
      await window.api.editIssue({ repo, number: activeIssue, addLabels: labels });
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
    const { activeIssue } = get();
    if (!activeIssue) return false;
    set({ actionLoading: true, actionError: null });
    try {
      await window.api.editIssue({ repo, number: activeIssue, removeLabels: labels });
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

  closeIssueAction: async (repo, comment) => {
    const { activeIssue } = get();
    if (!activeIssue) return false;
    set({ actionLoading: true, actionError: null });
    try {
      await window.api.closeIssue({ repo, number: activeIssue, comment });
      set((s) => ({
        detail: s.detail
          ? { ...s.detail, state: "CLOSED", closedAt: new Date().toISOString() }
          : null,
        actionLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        actionError: err instanceof Error ? err.message : "Failed to close issue",
        actionLoading: false,
      });
      return false;
    }
  },

  reopenIssueAction: async (repo) => {
    const { activeIssue } = get();
    if (!activeIssue) return false;
    set({ actionLoading: true, actionError: null });
    try {
      await window.api.reopenIssue({ repo, number: activeIssue });
      set((s) => ({
        detail: s.detail ? { ...s.detail, state: "OPEN", closedAt: undefined } : null,
        actionLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        actionError: err instanceof Error ? err.message : "Failed to reopen issue",
        actionLoading: false,
      });
      return false;
    }
  },
}));

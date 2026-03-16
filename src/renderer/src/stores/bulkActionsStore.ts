import { create } from "zustand";

interface BulkActionsStore {
  selectedPRs: Set<number>;
  bulkMode: boolean;
  actionLoading: boolean;
  actionError: string | null;

  toggleBulkMode: () => void;
  togglePR: (number: number) => void;
  selectAll: (numbers: number[]) => void;
  clearSelection: () => void;

  bulkClose: (repo: string) => Promise<void>;
  bulkAddLabel: (repo: string, label: string) => Promise<void>;
  bulkRemoveLabel: (repo: string, label: string) => Promise<void>;
}

export const useBulkActionsStore = create<BulkActionsStore>((set, get) => ({
  selectedPRs: new Set(),
  bulkMode: false,
  actionLoading: false,
  actionError: null,

  toggleBulkMode: () => {
    set((s) => ({
      bulkMode: !s.bulkMode,
      selectedPRs: s.bulkMode ? new Set() : s.selectedPRs,
    }));
  },

  togglePR: (number) => {
    set((s) => {
      const next = new Set(s.selectedPRs);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return { selectedPRs: next };
    });
  },

  selectAll: (numbers) => {
    set({ selectedPRs: new Set(numbers) });
  },

  clearSelection: () => {
    set({ selectedPRs: new Set() });
  },

  bulkClose: async (repo) => {
    const { selectedPRs } = get();
    if (selectedPRs.size === 0) return;
    set({ actionLoading: true, actionError: null });
    try {
      for (const number of selectedPRs) {
        await window.api.closePR({ repo, number });
      }
      set({ selectedPRs: new Set(), actionLoading: false, bulkMode: false });
    } catch (err) {
      set({
        actionError: err instanceof Error ? err.message : "Failed to close PRs",
        actionLoading: false,
      });
    }
  },

  bulkAddLabel: async (repo, label) => {
    const { selectedPRs } = get();
    if (selectedPRs.size === 0) return;
    set({ actionLoading: true, actionError: null });
    try {
      for (const number of selectedPRs) {
        await window.api.editPR({ repo, number, addLabels: [label] });
      }
      set({ actionLoading: false });
    } catch (err) {
      set({
        actionError: err instanceof Error ? err.message : "Failed to add label",
        actionLoading: false,
      });
    }
  },

  bulkRemoveLabel: async (repo, label) => {
    const { selectedPRs } = get();
    if (selectedPRs.size === 0) return;
    set({ actionLoading: true, actionError: null });
    try {
      for (const number of selectedPRs) {
        await window.api.editPR({ repo, number, removeLabels: [label] });
      }
      set({ actionLoading: false });
    } catch (err) {
      set({
        actionError: err instanceof Error ? err.message : "Failed to remove label",
        actionLoading: false,
      });
    }
  },
}));

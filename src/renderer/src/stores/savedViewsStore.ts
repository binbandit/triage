import { create } from "zustand";

export interface SavedView {
  id: string;
  name: string;
  query: string;
  /** Filter PRs assigned to current user */
  assignedToMe: boolean;
  /** Filter PRs where review is requested from current user */
  reviewRequested: boolean;
  /** Only show stale PRs (not updated in X days) */
  staleOnly: boolean;
  staleDays: number;
  /** Label filters (PR must have all of these) */
  labels: string[];
  /** State filter */
  states: string[];
}

const STORAGE_KEY = "triage:saved-views";

function loadViews(): SavedView[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupt */
  }
  return defaultViews();
}

function defaultViews(): SavedView[] {
  return [
    {
      id: "needs-review",
      name: "Needs my review",
      query: "",
      assignedToMe: false,
      reviewRequested: true,
      staleOnly: false,
      staleDays: 14,
      labels: [],
      states: ["OPEN"],
    },
    {
      id: "assigned-to-me",
      name: "Assigned to me",
      query: "",
      assignedToMe: true,
      reviewRequested: false,
      staleOnly: false,
      staleDays: 14,
      labels: [],
      states: ["OPEN"],
    },
    {
      id: "stale",
      name: "Stale PRs",
      query: "",
      assignedToMe: false,
      reviewRequested: false,
      staleOnly: true,
      staleDays: 14,
      labels: [],
      states: ["OPEN"],
    },
  ];
}

interface SavedViewsStore {
  views: SavedView[];
  activeViewId: string | null;
  currentUser: string | null;

  setActiveView: (id: string | null) => void;
  addView: (view: SavedView) => void;
  updateView: (id: string, updates: Partial<SavedView>) => void;
  deleteView: (id: string) => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useSavedViewsStore = create<SavedViewsStore>((set) => ({
  views: loadViews(),
  activeViewId: null,
  currentUser: null,

  setActiveView: (activeViewId) => set({ activeViewId }),

  addView: (view) => {
    set((s) => {
      const views = [...s.views, view];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
      return { views };
    });
  },

  updateView: (id, updates) => {
    set((s) => {
      const views = s.views.map((v) => (v.id === id ? { ...v, ...updates } : v));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
      return { views };
    });
  },

  deleteView: (id) => {
    set((s) => {
      const views = s.views.filter((v) => v.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
      return { views, activeViewId: s.activeViewId === id ? null : s.activeViewId };
    });
  },

  fetchCurrentUser: async () => {
    try {
      const user = await window.api.currentUser();
      if (user && typeof user === "object" && "login" in user) {
        set({ currentUser: (user as { login: string }).login });
      }
    } catch {
      /* silent */
    }
  },
}));

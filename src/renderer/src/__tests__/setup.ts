import "@testing-library/jest-dom/vitest";

// Polyfill localStorage for jsdom if missing
if (!window.localStorage || typeof window.localStorage.clear !== "function") {
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (index: number) => [...store.keys()][index] ?? null,
    },
    writable: true,
  });
}

// Mock the Electron IPC bridge
const mockApi = {
  listPRs: vi.fn().mockResolvedValue([]),
  getPR: vi.fn().mockResolvedValue(null),
  getPRDiff: vi.fn().mockResolvedValue(""),
  getPRFiles: vi.fn().mockResolvedValue([]),
  authAccounts: vi.fn().mockResolvedValue([]),
  authSwitch: vi.fn().mockResolvedValue({ success: true }),
  authStatus: vi.fn().mockResolvedValue({ authenticated: true }),
  currentRepo: vi.fn().mockResolvedValue(null),
  fetchConfig: vi.fn().mockResolvedValue({ content: null, found: false }),
  closePR: vi.fn().mockResolvedValue({ success: true }),
  mergePR: vi.fn().mockResolvedValue({ success: true }),
  commentPR: vi.fn().mockResolvedValue({ success: true }),
  editPR: vi.fn().mockResolvedValue({ success: true }),
  toggleDraft: vi.fn().mockResolvedValue({ success: true }),
  submitReview: vi.fn().mockResolvedValue({ success: true }),
  reviewComment: vi.fn().mockResolvedValue({ success: true }),
  listIssues: vi.fn().mockResolvedValue([]),
  getIssue: vi.fn().mockResolvedValue(null),
  commentIssue: vi.fn().mockResolvedValue({ success: true }),
  closeIssue: vi.fn().mockResolvedValue({ success: true }),
  reopenIssue: vi.fn().mockResolvedValue({ success: true }),
  editIssue: vi.fn().mockResolvedValue({ success: true }),
  addReaction: vi.fn().mockResolvedValue({ success: true }),
  repoLabels: vi.fn().mockResolvedValue([]),
  searchUsers: vi.fn().mockResolvedValue([]),
  openExternal: vi.fn().mockResolvedValue(undefined),
};

Object.defineProperty(window, "api", {
  value: mockApi,
  writable: true,
});

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  document.documentElement.classList.remove("light");
});

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
  authStatus: vi.fn().mockResolvedValue({ authenticated: true }),
  currentRepo: vi.fn().mockResolvedValue(null),
  fetchConfig: vi.fn().mockResolvedValue({ content: null, found: false }),
  closePR: vi.fn().mockResolvedValue({ success: true }),
  mergePR: vi.fn().mockResolvedValue({ success: true }),
  commentPR: vi.fn().mockResolvedValue({ success: true }),
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

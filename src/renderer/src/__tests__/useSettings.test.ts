import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useSettingsStore } from "../stores/settingsStore";

beforeEach(() => {
  // Reset the zustand store between tests
  useSettingsStore.setState({
    repo: "",
    theme: "dark",
    viewMode: "list",
    inlinePRView: false,
    interceptGitHubLinks: false,
  });
});

describe("useSettingsStore", () => {
  it("has correct default state", () => {
    const state = useSettingsStore.getState();
    expect(state.repo).toBe("");
    expect(state.theme).toBe("dark");
    expect(state.viewMode).toBe("list");
    expect(state.inlinePRView).toBe(false);
  });

  it("setRepo updates repo", () => {
    act(() => useSettingsStore.getState().setRepo("test/repo"));
    expect(useSettingsStore.getState().repo).toBe("test/repo");
  });

  it("setRepo persists to localStorage", () => {
    act(() => useSettingsStore.getState().setRepo("saved/repo"));
    const stored = JSON.parse(localStorage.getItem("triage:settings") || "{}");
    expect(stored.repo).toBe("saved/repo");
  });

  it("setTheme updates theme", () => {
    act(() => useSettingsStore.getState().setTheme("light"));
    expect(useSettingsStore.getState().theme).toBe("light");
  });

  it("setTheme applies light class to document", () => {
    act(() => useSettingsStore.getState().setTheme("light"));
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("setTheme removes light class for dark", () => {
    act(() => useSettingsStore.getState().setTheme("light"));
    act(() => useSettingsStore.getState().setTheme("dark"));
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });

  it("setViewMode updates viewMode", () => {
    act(() => useSettingsStore.getState().setViewMode("kanban"));
    expect(useSettingsStore.getState().viewMode).toBe("kanban");
  });

  it("setInlinePRView toggles the flag", () => {
    act(() => useSettingsStore.getState().setInlinePRView(true));
    expect(useSettingsStore.getState().inlinePRView).toBe(true);
  });

  it("persists all settings to localStorage", () => {
    act(() => {
      useSettingsStore.getState().setRepo("my/repo");
      useSettingsStore.getState().setTheme("light");
      useSettingsStore.getState().setViewMode("kanban");
      useSettingsStore.getState().setInlinePRView(true);
    });
    const stored = JSON.parse(localStorage.getItem("triage:settings") || "{}");
    expect(stored.repo).toBe("my/repo");
    expect(stored.theme).toBe("light");
    expect(stored.viewMode).toBe("kanban");
    expect(stored.inlinePRView).toBe(true);
  });
});

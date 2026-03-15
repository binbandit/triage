import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettings } from "../hooks/useSettings";

describe("useSettings", () => {
  it("returns default settings on first load", () => {
    const { result } = renderHook(() => useSettings());
    const [settings] = result.current;
    expect(settings.repo).toBe("");
    expect(settings.theme).toBe("dark");
    expect(settings.viewMode).toBe("list");
  });

  it("persists settings to localStorage", () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current[1]({ repo: "test/repo", theme: "dark", viewMode: "list" });
    });
    const stored = JSON.parse(localStorage.getItem("triage:settings") || "{}");
    expect(stored.repo).toBe("test/repo");
  });

  it("loads persisted settings from localStorage", () => {
    localStorage.setItem(
      "triage:settings",
      JSON.stringify({ repo: "saved/repo", theme: "light", viewMode: "kanban" }),
    );
    const { result } = renderHook(() => useSettings());
    const [settings] = result.current;
    expect(settings.repo).toBe("saved/repo");
    expect(settings.theme).toBe("light");
    expect(settings.viewMode).toBe("kanban");
  });

  it("supports function updater", () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current[1]((prev) => ({ ...prev, repo: "updated/repo" }));
    });
    expect(result.current[0].repo).toBe("updated/repo");
  });

  it("applies dark theme class by default", () => {
    renderHook(() => useSettings());
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });

  it("applies light theme class when theme is light", () => {
    localStorage.setItem(
      "triage:settings",
      JSON.stringify({ repo: "", theme: "light", viewMode: "list" }),
    );
    renderHook(() => useSettings());
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("handles corrupt localStorage gracefully", () => {
    localStorage.setItem("triage:settings", "not-json{{{");
    const { result } = renderHook(() => useSettings());
    expect(result.current[0].repo).toBe("");
    expect(result.current[0].theme).toBe("dark");
  });

  it("merges partial stored settings with defaults", () => {
    localStorage.setItem("triage:settings", JSON.stringify({ repo: "partial/repo" }));
    const { result } = renderHook(() => useSettings());
    expect(result.current[0].repo).toBe("partial/repo");
    expect(result.current[0].theme).toBe("dark");
    expect(result.current[0].viewMode).toBe("list");
  });
});

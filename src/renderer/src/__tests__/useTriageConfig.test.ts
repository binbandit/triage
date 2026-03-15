import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTriageConfig } from "../hooks/useTriageConfig";

describe("useTriageConfig", () => {
  it("starts with null config, not loading, no error", () => {
    const { result } = renderHook(() => useTriageConfig());
    expect(result.current.config).toBeNull();
    expect(result.current.configLoading).toBe(false);
    expect(result.current.configError).toBeNull();
  });

  it("sets loading state during fetch", async () => {
    let resolvePromise: (value: unknown) => void;
    window.api.fetchConfig = vi.fn(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );

    const { result } = renderHook(() => useTriageConfig());

    let fetchPromise: Promise<void>;
    act(() => {
      fetchPromise = result.current.fetchConfig("test/repo");
    });

    expect(result.current.configLoading).toBe(true);

    await act(async () => {
      resolvePromise!({ content: null, found: false });
      await fetchPromise!;
    });

    expect(result.current.configLoading).toBe(false);
  });

  it("parses config when found", async () => {
    const yaml = "ready:\n  - approved\n  - ci-passed\n";
    window.api.fetchConfig = vi.fn().mockResolvedValue({ content: yaml, found: true });

    const { result } = renderHook(() => useTriageConfig());

    await act(async () => {
      await result.current.fetchConfig("test/repo");
    });

    expect(result.current.config?.groups).toHaveLength(1);
    expect(result.current.config?.groups[0]).toMatchObject({
      name: "ready",
      labels: ["approved", "ci-passed"],
    });
    expect(result.current.configError).toBeNull();
  });

  it("sets config to null when not found", async () => {
    window.api.fetchConfig = vi.fn().mockResolvedValue({ content: null, found: false });

    const { result } = renderHook(() => useTriageConfig());

    await act(async () => {
      await result.current.fetchConfig("test/repo");
    });

    expect(result.current.config).toBeNull();
  });

  it("sets config to null when found is true but content is null", async () => {
    window.api.fetchConfig = vi.fn().mockResolvedValue({ content: null, found: true });

    const { result } = renderHook(() => useTriageConfig());

    await act(async () => {
      await result.current.fetchConfig("test/repo");
    });

    expect(result.current.config).toBeNull();
  });

  it("sets config to null for empty YAML string (falsy content)", async () => {
    // Empty string is falsy, so `result.found && result.content` is false
    window.api.fetchConfig = vi.fn().mockResolvedValue({ content: "", found: true });

    const { result } = renderHook(() => useTriageConfig());

    await act(async () => {
      await result.current.fetchConfig("test/repo");
    });

    expect(result.current.config).toBeNull();
  });

  it("handles fetch error with Error instance", async () => {
    window.api.fetchConfig = vi.fn().mockRejectedValue(new Error("Network fail"));

    const { result } = renderHook(() => useTriageConfig());

    await act(async () => {
      await result.current.fetchConfig("test/repo");
    });

    expect(result.current.config).toBeNull();
    expect(result.current.configError).toBe("Network fail");
    expect(result.current.configLoading).toBe(false);
  });

  it("handles fetch error with non-Error rejection", async () => {
    window.api.fetchConfig = vi.fn().mockRejectedValue("string error");

    const { result } = renderHook(() => useTriageConfig());

    await act(async () => {
      await result.current.fetchConfig("test/repo");
    });

    expect(result.current.configError).toBe("Failed to fetch config");
  });

  it("clears error on subsequent successful fetch", async () => {
    window.api.fetchConfig = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({ content: null, found: false });

    const { result } = renderHook(() => useTriageConfig());

    await act(async () => {
      await result.current.fetchConfig("test/repo");
    });
    expect(result.current.configError).toBe("fail");

    await act(async () => {
      await result.current.fetchConfig("test/repo");
    });
    expect(result.current.configError).toBeNull();
  });

  it("passes repo to API call", async () => {
    window.api.fetchConfig = vi.fn().mockResolvedValue({ content: null, found: false });

    const { result } = renderHook(() => useTriageConfig());

    await act(async () => {
      await result.current.fetchConfig("my-org/my-repo");
    });

    expect(window.api.fetchConfig).toHaveBeenCalledWith({ repo: "my-org/my-repo" });
  });

  it("parses multiple groups from config", async () => {
    const yaml = "group-a:\n  - label-a\ngroup-b:\n  - label-b\n  - label-c\n";
    window.api.fetchConfig = vi.fn().mockResolvedValue({ content: yaml, found: true });

    const { result } = renderHook(() => useTriageConfig());

    await act(async () => {
      await result.current.fetchConfig("test/repo");
    });

    expect(result.current.config?.groups).toHaveLength(2);
    expect(result.current.config?.groups[0].name).toBe("group-a");
    expect(result.current.config?.groups[1].labels).toEqual(["label-b", "label-c"]);
  });
});

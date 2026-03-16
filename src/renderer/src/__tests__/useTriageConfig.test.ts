import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useConfigStore } from "../stores/configStore";

beforeEach(() => {
  useConfigStore.setState({
    config: null,
    configLoading: false,
    configError: null,
  });
});

describe("useConfigStore", () => {
  it("starts with null config, not loading, no error", () => {
    const state = useConfigStore.getState();
    expect(state.config).toBeNull();
    expect(state.configLoading).toBe(false);
    expect(state.configError).toBeNull();
  });

  it("parses config when found", async () => {
    const yaml = "ready:\n  - approved\n  - ci-passed\n";
    window.api.fetchConfig = vi.fn().mockResolvedValue({ content: yaml, found: true });

    await act(async () => {
      await useConfigStore.getState().fetchConfig("test/repo");
    });

    const state = useConfigStore.getState();
    expect(state.config?.groups).toHaveLength(1);
    expect(state.config?.groups[0]).toMatchObject({
      name: "ready",
      labels: ["approved", "ci-passed"],
    });
    expect(state.configError).toBeNull();
    expect(state.configLoading).toBe(false);
  });

  it("sets config to null when not found", async () => {
    window.api.fetchConfig = vi.fn().mockResolvedValue({ content: null, found: false });

    await act(async () => {
      await useConfigStore.getState().fetchConfig("test/repo");
    });

    expect(useConfigStore.getState().config).toBeNull();
  });

  it("sets config to null when found but content is null", async () => {
    window.api.fetchConfig = vi.fn().mockResolvedValue({ content: null, found: true });

    await act(async () => {
      await useConfigStore.getState().fetchConfig("test/repo");
    });

    expect(useConfigStore.getState().config).toBeNull();
  });

  it("sets config to null for empty string content", async () => {
    window.api.fetchConfig = vi.fn().mockResolvedValue({ content: "", found: true });

    await act(async () => {
      await useConfigStore.getState().fetchConfig("test/repo");
    });

    expect(useConfigStore.getState().config).toBeNull();
  });

  it("handles error with Error instance", async () => {
    window.api.fetchConfig = vi.fn().mockRejectedValue(new Error("Network fail"));

    await act(async () => {
      await useConfigStore.getState().fetchConfig("test/repo");
    });

    const state = useConfigStore.getState();
    expect(state.config).toBeNull();
    expect(state.configError).toBe("Network fail");
    expect(state.configLoading).toBe(false);
  });

  it("handles non-Error rejection", async () => {
    window.api.fetchConfig = vi.fn().mockRejectedValue("string error");

    await act(async () => {
      await useConfigStore.getState().fetchConfig("test/repo");
    });

    expect(useConfigStore.getState().configError).toBe("Failed to fetch config");
  });

  it("clears error on subsequent successful fetch", async () => {
    window.api.fetchConfig = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({ content: null, found: false });

    await act(async () => {
      await useConfigStore.getState().fetchConfig("test/repo");
    });
    expect(useConfigStore.getState().configError).toBe("fail");

    await act(async () => {
      await useConfigStore.getState().fetchConfig("test/repo");
    });
    expect(useConfigStore.getState().configError).toBeNull();
  });

  it("passes repo to API call", async () => {
    window.api.fetchConfig = vi.fn().mockResolvedValue({ content: null, found: false });

    await act(async () => {
      await useConfigStore.getState().fetchConfig("my-org/my-repo");
    });

    expect(window.api.fetchConfig).toHaveBeenCalledWith({ repo: "my-org/my-repo" });
  });

  it("sets loading state during fetch", async () => {
    let resolvePromise: (value: unknown) => void;
    window.api.fetchConfig = vi.fn(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );

    let fetchPromise: Promise<void>;
    act(() => {
      fetchPromise = useConfigStore.getState().fetchConfig("test/repo");
    });

    expect(useConfigStore.getState().configLoading).toBe(true);

    await act(async () => {
      resolvePromise!({ content: null, found: false });
      await fetchPromise!;
    });

    expect(useConfigStore.getState().configLoading).toBe(false);
  });
});

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePRs } from "../hooks/usePRs";

describe("usePRs", () => {
  it("starts with empty state", () => {
    const { result } = renderHook(() => usePRs());
    expect(result.current.prs).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets loading state during fetch", async () => {
    let resolvePromise: (value: unknown[]) => void;
    window.api.listPRs = vi.fn(
      () =>
        new Promise<unknown[]>((resolve) => {
          resolvePromise = resolve;
        }),
    );

    const { result } = renderHook(() => usePRs());

    let fetchPromise: Promise<void>;
    act(() => {
      fetchPromise = result.current.fetchPRs("test/repo");
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!([]);
      await fetchPromise!;
    });

    expect(result.current.loading).toBe(false);
  });

  it("stores fetched PRs", async () => {
    const mockPRs = [
      { number: 1, title: "PR 1" },
      { number: 2, title: "PR 2" },
    ];
    window.api.listPRs = vi.fn().mockResolvedValue(mockPRs);

    const { result } = renderHook(() => usePRs());

    await act(async () => {
      await result.current.fetchPRs("test/repo");
    });

    expect(result.current.prs).toEqual(mockPRs);
    expect(result.current.error).toBeNull();
  });

  it("handles errors gracefully", async () => {
    window.api.listPRs = vi.fn().mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => usePRs());

    await act(async () => {
      await result.current.fetchPRs("test/repo");
    });

    expect(result.current.prs).toEqual([]);
    expect(result.current.error).toBe("Network error");
    expect(result.current.loading).toBe(false);
  });

  it("handles non-Error rejections", async () => {
    window.api.listPRs = vi.fn().mockRejectedValue("string error");

    const { result } = renderHook(() => usePRs());

    await act(async () => {
      await result.current.fetchPRs("test/repo");
    });

    expect(result.current.error).toBe("Failed to fetch pull requests");
  });

  it("passes repo to API call", async () => {
    window.api.listPRs = vi.fn().mockResolvedValue([]);

    const { result } = renderHook(() => usePRs());

    await act(async () => {
      await result.current.fetchPRs("my/repo");
    });

    expect(window.api.listPRs).toHaveBeenCalledWith({
      state: "all",
      limit: 1000,
      repo: "my/repo",
    });
  });

  it("calls API without repo when none provided", async () => {
    window.api.listPRs = vi.fn().mockResolvedValue([]);

    const { result } = renderHook(() => usePRs());

    await act(async () => {
      await result.current.fetchPRs();
    });

    expect(window.api.listPRs).toHaveBeenCalledWith({
      state: "all",
      limit: 1000,
    });
  });

  it("handles non-array response", async () => {
    window.api.listPRs = vi.fn().mockResolvedValue("not an array");

    const { result } = renderHook(() => usePRs());

    await act(async () => {
      await result.current.fetchPRs("test/repo");
    });

    expect(result.current.prs).toEqual([]);
  });

  it("clears error on successful fetch after failure", async () => {
    window.api.listPRs = vi.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValueOnce([]);

    const { result } = renderHook(() => usePRs());

    await act(async () => {
      await result.current.fetchPRs("test/repo");
    });
    expect(result.current.error).toBe("fail");

    await act(async () => {
      await result.current.fetchPRs("test/repo");
    });
    expect(result.current.error).toBeNull();
  });
});

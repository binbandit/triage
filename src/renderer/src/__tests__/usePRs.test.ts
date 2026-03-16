import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { usePRStore } from "../stores/prStore";

beforeEach(() => {
  usePRStore.setState({
    prs: [],
    loading: false,
    error: null,
    search: "",
    closedFetchedRepo: "",
  });
});

describe("usePRStore", () => {
  it("starts with empty state", () => {
    const state = usePRStore.getState();
    expect(state.prs).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.search).toBe("");
  });

  it("setSearch updates search", () => {
    act(() => usePRStore.getState().setSearch("query"));
    expect(usePRStore.getState().search).toBe("query");
  });

  it("fetchPRs stores fetched PRs", async () => {
    const mockPRs = [
      { number: 1, title: "PR 1" },
      { number: 2, title: "PR 2" },
    ];
    window.api.listPRs = vi.fn().mockResolvedValue(mockPRs);

    await act(async () => {
      await usePRStore.getState().fetchPRs("test/repo");
    });

    expect(usePRStore.getState().prs).toEqual(mockPRs);
    expect(usePRStore.getState().error).toBeNull();
    expect(usePRStore.getState().loading).toBe(false);
  });

  it("fetchPRs sets loading state", async () => {
    let resolvePromise: (value: unknown[]) => void;
    window.api.listPRs = vi.fn(
      () =>
        new Promise<unknown[]>((resolve) => {
          resolvePromise = resolve;
        }),
    );

    let fetchPromise: Promise<void>;
    act(() => {
      fetchPromise = usePRStore.getState().fetchPRs("test/repo");
    });

    expect(usePRStore.getState().loading).toBe(true);

    await act(async () => {
      resolvePromise!([]);
      await fetchPromise!;
    });

    expect(usePRStore.getState().loading).toBe(false);
  });

  it("fetchPRs handles errors", async () => {
    window.api.listPRs = vi.fn().mockRejectedValue(new Error("Network error"));

    await act(async () => {
      await usePRStore.getState().fetchPRs("test/repo");
    });

    expect(usePRStore.getState().prs).toEqual([]);
    expect(usePRStore.getState().error).toBe("Network error");
    expect(usePRStore.getState().loading).toBe(false);
  });

  it("fetchPRs passes repo and state=open", async () => {
    window.api.listPRs = vi.fn().mockResolvedValue([]);

    await act(async () => {
      await usePRStore.getState().fetchPRs("my/repo");
    });

    expect(window.api.listPRs).toHaveBeenCalledWith({
      state: "open",
      limit: 1000,
      repo: "my/repo",
    });
  });

  it("fetchPRs handles non-array response", async () => {
    window.api.listPRs = vi.fn().mockResolvedValue("not an array");

    await act(async () => {
      await usePRStore.getState().fetchPRs("test/repo");
    });

    expect(usePRStore.getState().prs).toEqual([]);
  });

  it("fetchClosedPRs merges with existing PRs", async () => {
    usePRStore.setState({ prs: [{ number: 1, state: "OPEN" } as never] });
    window.api.listPRs = vi.fn().mockResolvedValue([
      { number: 2, state: "CLOSED" },
      { number: 1, state: "OPEN" },
    ]);

    await act(async () => {
      await usePRStore.getState().fetchClosedPRs("test/repo");
    });

    expect(usePRStore.getState().prs).toHaveLength(2);
    expect(usePRStore.getState().prs.map((p) => p.number)).toEqual([1, 2]);
  });

  it("fetchClosedPRs skips if already fetched for same repo", async () => {
    window.api.listPRs = vi.fn().mockResolvedValue([]);
    usePRStore.setState({ closedFetchedRepo: "test/repo" });

    await act(async () => {
      await usePRStore.getState().fetchClosedPRs("test/repo");
    });

    expect(window.api.listPRs).not.toHaveBeenCalled();
  });

  it("does nothing when repo is empty", async () => {
    window.api.listPRs = vi.fn().mockResolvedValue([]);

    await act(async () => {
      await usePRStore.getState().fetchPRs("");
    });

    expect(window.api.listPRs).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { usePRDetailStore } from "../stores/prDetailStore";

beforeEach(() => {
  usePRDetailStore.setState({
    activePR: null,
    detail: null,
    diff: [],
    rawDiff: "",
    loading: false,
    error: null,
    tab: "conversation",
    actionLoading: false,
    actionError: null,
  });
});

describe("usePRDetailStore", () => {
  it("starts with null state", () => {
    const state = usePRDetailStore.getState();
    expect(state.activePR).toBeNull();
    expect(state.detail).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.tab).toBe("conversation");
  });

  it("setTab changes tab", () => {
    act(() => usePRDetailStore.getState().setTab("changes"));
    expect(usePRDetailStore.getState().tab).toBe("changes");
  });

  it("closePR resets all state", () => {
    usePRDetailStore.setState({ activePR: 42, tab: "commits" });
    act(() => usePRDetailStore.getState().closePR());
    expect(usePRDetailStore.getState().activePR).toBeNull();
    expect(usePRDetailStore.getState().detail).toBeNull();
    expect(usePRDetailStore.getState().tab).toBe("conversation");
  });

  it("openPR sets activePR and loading", async () => {
    window.api.getPR = vi.fn().mockResolvedValue({ number: 1, title: "Test" });
    window.api.getPRDiff = vi.fn().mockResolvedValue("");

    let openPromise: Promise<void>;
    act(() => {
      openPromise = usePRDetailStore.getState().openPR("test/repo", 1);
    });

    expect(usePRDetailStore.getState().activePR).toBe(1);
    expect(usePRDetailStore.getState().loading).toBe(true);

    await act(async () => {
      await openPromise!;
    });

    expect(usePRDetailStore.getState().loading).toBe(false);
    expect(usePRDetailStore.getState().detail?.title).toBe("Test");
  });

  it("openPR handles errors", async () => {
    window.api.getPR = vi.fn().mockRejectedValue(new Error("Not found"));
    window.api.getPRDiff = vi.fn().mockResolvedValue("");

    await act(async () => {
      await usePRDetailStore.getState().openPR("test/repo", 1);
    });

    expect(usePRDetailStore.getState().error).toBe("Not found");
    expect(usePRDetailStore.getState().loading).toBe(false);
  });

  it("addComment calls API and clears actionLoading", async () => {
    usePRDetailStore.setState({ activePR: 1, detail: { number: 1 } as never });
    window.api.commentPR = vi.fn().mockResolvedValue({ success: true });
    window.api.getPR = vi.fn().mockResolvedValue({ number: 1 });
    window.api.getPRDiff = vi.fn().mockResolvedValue("");

    await act(async () => {
      const result = await usePRDetailStore.getState().addComment("test/repo", "hello");
      expect(result).toBe(true);
    });

    expect(window.api.commentPR).toHaveBeenCalledWith({
      repo: "test/repo",
      number: 1,
      body: "hello",
    });
    expect(usePRDetailStore.getState().actionLoading).toBe(false);
  });

  it("editTitle updates detail optimistically", async () => {
    usePRDetailStore.setState({ activePR: 1, detail: { number: 1, title: "Old" } as never });
    window.api.editPR = vi.fn().mockResolvedValue({ success: true });

    await act(async () => {
      await usePRDetailStore.getState().editTitle("test/repo", "New Title");
    });

    expect(usePRDetailStore.getState().detail?.title).toBe("New Title");
  });

  it("editBody updates detail optimistically", async () => {
    usePRDetailStore.setState({ activePR: 1, detail: { number: 1, body: "old body" } as never });
    window.api.editPR = vi.fn().mockResolvedValue({ success: true });

    await act(async () => {
      await usePRDetailStore.getState().editBody("test/repo", "new body");
    });

    expect(usePRDetailStore.getState().detail?.body).toBe("new body");
  });

  it("toggleDraft flips isDraft", async () => {
    usePRDetailStore.setState({ activePR: 1, detail: { number: 1, isDraft: false } as never });
    window.api.toggleDraft = vi.fn().mockResolvedValue({ success: true });

    await act(async () => {
      await usePRDetailStore.getState().toggleDraft("test/repo");
    });

    expect(usePRDetailStore.getState().detail?.isDraft).toBe(true);
  });

  it("submitReview calls API", async () => {
    usePRDetailStore.setState({ activePR: 1, detail: { number: 1 } as never });
    window.api.submitReview = vi.fn().mockResolvedValue({ success: true });
    window.api.getPR = vi.fn().mockResolvedValue({ number: 1 });
    window.api.getPRDiff = vi.fn().mockResolvedValue("");

    await act(async () => {
      const result = await usePRDetailStore.getState().submitReview("test/repo", "APPROVE", "LGTM");
      expect(result).toBe(true);
    });

    expect(window.api.submitReview).toHaveBeenCalledWith({
      repo: "test/repo",
      number: 1,
      event: "APPROVE",
      body: "LGTM",
    });
  });

  it("clearActionError clears the error", () => {
    usePRDetailStore.setState({ actionError: "something failed" });
    act(() => usePRDetailStore.getState().clearActionError());
    expect(usePRDetailStore.getState().actionError).toBeNull();
  });

  it("action methods return false when no activePR", async () => {
    usePRDetailStore.setState({ activePR: null });

    await act(async () => {
      expect(await usePRDetailStore.getState().addComment("repo", "hi")).toBe(false);
      expect(await usePRDetailStore.getState().editTitle("repo", "t")).toBe(false);
      expect(await usePRDetailStore.getState().editBody("repo", "b")).toBe(false);
      expect(await usePRDetailStore.getState().addLabels("repo", ["l"])).toBe(false);
      expect(await usePRDetailStore.getState().removeLabels("repo", ["l"])).toBe(false);
      expect(await usePRDetailStore.getState().submitReview("repo", "APPROVE")).toBe(false);
    });
  });
});

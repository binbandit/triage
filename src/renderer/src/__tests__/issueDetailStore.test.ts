import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useIssueDetailStore } from "../stores/issueDetailStore";

beforeEach(() => {
  useIssueDetailStore.setState({
    activeIssue: null,
    detail: null,
    loading: false,
    error: null,
    actionLoading: false,
    actionError: null,
  });
});

describe("useIssueDetailStore", () => {
  it("starts with null state", () => {
    const state = useIssueDetailStore.getState();
    expect(state.activeIssue).toBeNull();
    expect(state.detail).toBeNull();
    expect(state.loading).toBe(false);
  });

  it("openIssue fetches and stores detail", async () => {
    window.api.getIssue = vi.fn().mockResolvedValue({ number: 5, title: "Bug" });

    await act(async () => {
      await useIssueDetailStore.getState().openIssue("test/repo", 5);
    });

    expect(useIssueDetailStore.getState().activeIssue).toBe(5);
    expect(useIssueDetailStore.getState().detail?.title).toBe("Bug");
    expect(useIssueDetailStore.getState().loading).toBe(false);
  });

  it("openIssue handles errors", async () => {
    window.api.getIssue = vi.fn().mockRejectedValue(new Error("Not found"));

    await act(async () => {
      await useIssueDetailStore.getState().openIssue("test/repo", 5);
    });

    expect(useIssueDetailStore.getState().error).toBe("Not found");
  });

  it("closeIssue resets state", () => {
    useIssueDetailStore.setState({ activeIssue: 5, detail: { number: 5 } as never });
    act(() => useIssueDetailStore.getState().closeIssue());
    expect(useIssueDetailStore.getState().activeIssue).toBeNull();
    expect(useIssueDetailStore.getState().detail).toBeNull();
  });

  it("addComment calls API", async () => {
    useIssueDetailStore.setState({ activeIssue: 5, detail: { number: 5 } as never });
    window.api.commentIssue = vi.fn().mockResolvedValue({ success: true });
    window.api.getIssue = vi.fn().mockResolvedValue({ number: 5 });

    await act(async () => {
      const result = await useIssueDetailStore.getState().addComment("test/repo", "nice");
      expect(result).toBe(true);
    });

    expect(window.api.commentIssue).toHaveBeenCalledWith({
      repo: "test/repo",
      number: 5,
      body: "nice",
    });
  });

  it("editTitle updates optimistically", async () => {
    useIssueDetailStore.setState({ activeIssue: 5, detail: { number: 5, title: "Old" } as never });
    window.api.editIssue = vi.fn().mockResolvedValue({ success: true });

    await act(async () => {
      await useIssueDetailStore.getState().editTitle("test/repo", "New");
    });

    expect(useIssueDetailStore.getState().detail?.title).toBe("New");
  });

  it("closeIssueAction updates state optimistically", async () => {
    useIssueDetailStore.setState({ activeIssue: 5, detail: { number: 5, state: "OPEN" } as never });
    window.api.closeIssue = vi.fn().mockResolvedValue({ success: true });

    await act(async () => {
      await useIssueDetailStore.getState().closeIssueAction("test/repo");
    });

    expect(useIssueDetailStore.getState().detail?.state).toBe("CLOSED");
  });

  it("reopenIssueAction updates state optimistically", async () => {
    useIssueDetailStore.setState({
      activeIssue: 5,
      detail: { number: 5, state: "CLOSED" } as never,
    });
    window.api.reopenIssue = vi.fn().mockResolvedValue({ success: true });

    await act(async () => {
      await useIssueDetailStore.getState().reopenIssueAction("test/repo");
    });

    expect(useIssueDetailStore.getState().detail?.state).toBe("OPEN");
  });

  it("action methods return false when no activeIssue", async () => {
    useIssueDetailStore.setState({ activeIssue: null });

    await act(async () => {
      expect(await useIssueDetailStore.getState().addComment("repo", "hi")).toBe(false);
      expect(await useIssueDetailStore.getState().editTitle("repo", "t")).toBe(false);
      expect(await useIssueDetailStore.getState().editBody("repo", "b")).toBe(false);
      expect(await useIssueDetailStore.getState().addLabels("repo", ["l"])).toBe(false);
      expect(await useIssueDetailStore.getState().removeLabels("repo", ["l"])).toBe(false);
      expect(await useIssueDetailStore.getState().closeIssueAction("repo")).toBe(false);
      expect(await useIssueDetailStore.getState().reopenIssueAction("repo")).toBe(false);
    });
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { KanbanCard } from "../components/KanbanCard";
import type { PullRequest } from "../types";
import type { DragEvent } from "react";

function makePR(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    number: 1,
    title: "Test PR",
    url: "https://github.com/test/repo/pull/1",
    labels: [],
    state: "OPEN",
    author: { login: "testuser" },
    body: "",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    headRefName: "feature-branch",
    isDraft: false,
    ...overrides,
  };
}

describe("KanbanCard", () => {
  it("renders PR title", () => {
    render(<KanbanCard pr={makePR()} repo="test/repo" onDragStart={() => {}} />);
    expect(screen.getByText("Test PR")).toBeInTheDocument();
  });

  it("renders author and PR number", () => {
    render(<KanbanCard pr={makePR()} repo="test/repo" onDragStart={() => {}} />);
    expect(screen.getByText("testuser")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("renders labels", () => {
    const pr = makePR({
      labels: [{ id: "1", name: "enhancement", color: "a2eeef", description: "" }],
    });
    render(<KanbanCard pr={pr} repo="test/repo" onDragStart={() => {}} />);
    expect(screen.getByText("enhancement")).toBeInTheDocument();
  });

  it("shows draft indicator for draft PRs", () => {
    const pr = makePR({ isDraft: true });
    render(<KanbanCard pr={pr} repo="test/repo" onDragStart={() => {}} />);
    expect(screen.getByText("draft")).toBeInTheDocument();
  });

  it("is draggable when state is OPEN", () => {
    const { container } = render(
      <KanbanCard pr={makePR({ state: "OPEN" })} repo="test/repo" onDragStart={() => {}} />,
    );
    const li = container.querySelector("li");
    expect(li?.getAttribute("draggable")).toBe("true");
  });

  it("is NOT draggable when state is MERGED", () => {
    const { container } = render(
      <KanbanCard pr={makePR({ state: "MERGED" })} repo="test/repo" onDragStart={() => {}} />,
    );
    const li = container.querySelector("li");
    expect(li?.getAttribute("draggable")).toBe("false");
  });

  it("is NOT draggable when state is CLOSED", () => {
    const { container } = render(
      <KanbanCard pr={makePR({ state: "CLOSED" })} repo="test/repo" onDragStart={() => {}} />,
    );
    const li = container.querySelector("li");
    expect(li?.getAttribute("draggable")).toBe("false");
  });

  it("calls onDragStart for OPEN PRs", () => {
    const onDragStart = vi.fn();
    const pr = makePR({ state: "OPEN" });
    const { container } = render(<KanbanCard pr={pr} repo="test/repo" onDragStart={onDragStart} />);
    const li = container.querySelector("li")!;
    fireEvent.dragStart(li, { dataTransfer: { setData: vi.fn(), effectAllowed: "" } });
    expect(onDragStart).toHaveBeenCalled();
  });

  it("does NOT call onDragStart for MERGED PRs", () => {
    const onDragStart = vi.fn();
    const pr = makePR({ state: "MERGED" });
    const { container } = render(<KanbanCard pr={pr} repo="test/repo" onDragStart={onDragStart} />);
    const li = container.querySelector("li")!;
    fireEvent.dragStart(li);
    expect(onDragStart).not.toHaveBeenCalled();
  });

  it("opens external link on title click", () => {
    render(<KanbanCard pr={makePR()} repo="test/repo" onDragStart={() => {}} />);
    fireEvent.click(screen.getByText("Test PR"));
    expect(window.api.openExternal).toHaveBeenCalledWith("https://github.com/test/repo/pull/1");
  });
});

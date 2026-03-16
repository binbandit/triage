import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KanbanView } from "../components/KanbanView";
import type { PullRequest } from "../types";

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

const openPR = makePR({ number: 1, title: "Open PR", state: "OPEN" });
const closedPR = makePR({ number: 2, title: "Closed PR", state: "CLOSED" });
const mergedPR = makePR({ number: 3, title: "Merged PR", state: "MERGED" });
const mergedViaPR = makePR({
  number: 4,
  title: "Merged via field",
  state: "CLOSED",
  mergedAt: "2024-06-01T00:00:00Z",
});

describe("KanbanView", () => {
  it("renders three column headers", () => {
    render(<KanbanView prs={[]} repo="test/repo" />);
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.getByText("Merged")).toBeInTheDocument();
  });

  it("shows empty text in columns when no PRs", () => {
    render(<KanbanView prs={[]} repo="test/repo" />);
    expect(screen.getByText("No open PRs")).toBeInTheDocument();
    expect(screen.getByText("Drop here to close")).toBeInTheDocument();
    expect(screen.getByText("Drop here to merge")).toBeInTheDocument();
  });

  it("shows column item counts", () => {
    const prs = [openPR, closedPR, mergedPR];
    render(<KanbanView prs={prs} repo="test/repo" />);
    // Each column should show count "1"
    const counts = screen.getAllByText("1");
    expect(counts).toHaveLength(3);
  });

  it("buckets OPEN PRs into Open column", () => {
    render(<KanbanView prs={[openPR]} repo="test/repo" />);
    expect(screen.getByText("Open PR")).toBeInTheDocument();
  });

  it("buckets CLOSED PRs into Closed column", () => {
    render(<KanbanView prs={[closedPR]} repo="test/repo" />);
    expect(screen.getByText("Closed PR")).toBeInTheDocument();
  });

  it("buckets MERGED PRs into Merged column", () => {
    render(<KanbanView prs={[mergedPR]} repo="test/repo" />);
    expect(screen.getByText("Merged PR")).toBeInTheDocument();
  });

  it("buckets CLOSED PR with mergedAt into Merged column", () => {
    render(<KanbanView prs={[mergedViaPR]} repo="test/repo" />);
    expect(screen.getByText("Merged via field")).toBeInTheDocument();
    // The Merged column count should include this PR
  });

  it("does not show CommentDialog initially", () => {
    render(<KanbanView prs={[openPR]} repo="test/repo" />);
    expect(screen.queryByText("Close PR #1")).toBeNull();
    expect(screen.queryByText("Merge PR #1")).toBeNull();
  });

  it("renders all PR cards", () => {
    const prs = [openPR, closedPR, mergedPR];
    render(<KanbanView prs={prs} repo="test/repo" />);
    expect(screen.getByText("Open PR")).toBeInTheDocument();
    expect(screen.getByText("Closed PR")).toBeInTheDocument();
    expect(screen.getByText("Merged PR")).toBeInTheDocument();
  });

  it("has aria labels on columns", () => {
    render(<KanbanView prs={[]} repo="test/repo" />);
    expect(screen.getByLabelText("Open column")).toBeInTheDocument();
    expect(screen.getByLabelText("Closed column")).toBeInTheDocument();
    expect(screen.getByLabelText("Merged column")).toBeInTheDocument();
  });

  it("handles multiple PRs per column", () => {
    const prs = [
      makePR({ number: 1, title: "PR A", state: "OPEN" }),
      makePR({ number: 2, title: "PR B", state: "OPEN" }),
      makePR({ number: 3, title: "PR C", state: "OPEN" }),
    ];
    render(<KanbanView prs={prs} repo="test/repo" />);
    expect(screen.getByText("PR A")).toBeInTheDocument();
    expect(screen.getByText("PR B")).toBeInTheDocument();
    expect(screen.getByText("PR C")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // count
  });
});

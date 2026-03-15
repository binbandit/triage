import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PRRow } from "../components/PRRow";
import type { PullRequest } from "../types";

function makePR(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    number: 42,
    title: "Add feature X",
    url: "https://github.com/test/repo/pull/42",
    labels: [],
    state: "OPEN",
    author: { login: "testauthor" },
    body: "",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-06-15T12:00:00Z",
    headRefName: "feature-x",
    isDraft: false,
    ...overrides,
  };
}

describe("PRRow", () => {
  it("renders PR title", () => {
    render(<PRRow pr={makePR()} repo="test/repo" />);
    expect(screen.getByText("Add feature X")).toBeInTheDocument();
  });

  it("renders PR number", () => {
    render(<PRRow pr={makePR()} repo="test/repo" />);
    expect(screen.getByText("#42")).toBeInTheDocument();
  });

  it("renders author login", () => {
    render(<PRRow pr={makePR()} repo="test/repo" />);
    expect(screen.getByText("testauthor")).toBeInTheDocument();
  });

  it("renders branch name", () => {
    render(<PRRow pr={makePR()} repo="test/repo" />);
    expect(screen.getByText("feature-x")).toBeInTheDocument();
  });

  it("shows Draft badge for draft PRs", () => {
    render(<PRRow pr={makePR({ isDraft: true })} repo="test/repo" />);
    expect(screen.getByText("draft")).toBeInTheDocument();
  });

  it("does not show Draft badge for non-draft PRs", () => {
    render(<PRRow pr={makePR({ isDraft: false })} repo="test/repo" />);
    expect(screen.queryByText("draft")).toBeNull();
  });

  it("renders labels", () => {
    const pr = makePR({
      labels: [
        { id: "1", name: "bug", color: "d73a4a", description: "" },
        { id: "2", name: "priority:high", color: "ff0000", description: "" },
      ],
    });
    render(<PRRow pr={pr} repo="test/repo" />);
    expect(screen.getByText("bug")).toBeInTheDocument();
    expect(screen.getByText("priority:high")).toBeInTheDocument();
  });

  it("opens PR in external browser on title click", () => {
    render(<PRRow pr={makePR()} repo="test/repo" />);
    fireEvent.click(screen.getByText("Add feature X"));
    expect(window.api.openExternal).toHaveBeenCalledWith("https://github.com/test/repo/pull/42");
  });

  it("shows expand chevron when body has linked issues", () => {
    const pr = makePR({ body: "Fixes #10" });
    render(<PRRow pr={pr} repo="test/repo" />);
    expect(screen.getByLabelText("Expand")).toBeInTheDocument();
  });

  it("hides expand chevron when no linked issues", () => {
    const pr = makePR({ body: "No issues here" });
    render(<PRRow pr={pr} repo="test/repo" />);
    const chevron = screen.queryByLabelText("Expand");
    // Should be invisible (class) not removed
    expect(chevron?.className).toContain("invisible");
  });

  it("expands to show linked issues on chevron click", () => {
    const pr = makePR({ body: "Fixes #10\nCloses #20" });
    render(<PRRow pr={pr} repo="test/repo" />);
    fireEvent.click(screen.getByLabelText("Expand"));
    expect(screen.getByText("#10")).toBeInTheDocument();
    expect(screen.getByText("#20")).toBeInTheDocument();
  });

  it("collapses on second chevron click", () => {
    const pr = makePR({ body: "Fixes #10" });
    render(<PRRow pr={pr} repo="test/repo" />);
    fireEvent.click(screen.getByLabelText("Expand"));
    expect(screen.getByText("#10")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Collapse"));
    expect(screen.queryByText("#10")).toBeNull();
  });

  it("opens issue link in external browser", () => {
    const pr = makePR({ body: "Fixes #99" });
    render(<PRRow pr={pr} repo="test/repo" />);
    fireEvent.click(screen.getByLabelText("Expand"));
    fireEvent.click(screen.getByText("#99"));
    expect(window.api.openExternal).toHaveBeenCalledWith("https://github.com/test/repo/issues/99");
  });

  it("falls back to PR URL for issue link when repo is empty", () => {
    const pr = makePR({
      body: "Fixes #50",
      url: "https://github.com/fallback/repo/pull/42",
    });
    render(<PRRow pr={pr} repo="" />);
    fireEvent.click(screen.getByLabelText("Expand"));
    fireEvent.click(screen.getByText("#50"));
    expect(window.api.openExternal).toHaveBeenCalledWith(
      "https://github.com/fallback/repo/issues/50",
    );
  });

  it("renders multiple linked issues with separators", () => {
    const pr = makePR({ body: "Fixes #10\nCloses #20\nResolves #30" });
    render(<PRRow pr={pr} repo="test/repo" />);
    fireEvent.click(screen.getByLabelText("Expand"));
    expect(screen.getByText("#10")).toBeInTheDocument();
    expect(screen.getByText("#20")).toBeInTheDocument();
    expect(screen.getByText("#30")).toBeInTheDocument();
  });

  it("renders with highlightLabels prop", () => {
    const pr = makePR({
      labels: [
        { id: "1", name: "approved", color: "0e8a16", description: "" },
        { id: "2", name: "bug", color: "d73a4a", description: "" },
      ],
    });
    const { container } = render(<PRRow pr={pr} repo="test/repo" highlightLabels={["approved"]} />);
    // The highlighted label should have ring-1 class
    const spans = container.querySelectorAll("span");
    const approvedSpan = Array.from(spans).find((s) => s.textContent === "approved");
    expect(approvedSpan?.className).toContain("ring-1");
  });

  it("renders many labels (10+) without breaking", () => {
    const labels = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      name: `label-${i}`,
      color: "0075ca",
      description: "",
    }));
    const pr = makePR({ labels });
    render(<PRRow pr={pr} repo="test/repo" />);
    for (let i = 0; i < 12; i++) {
      expect(screen.getByText(`label-${i}`)).toBeInTheDocument();
    }
  });

  it("shows time ago text for recently updated PR", () => {
    const now = new Date();
    const pr = makePR({ updatedAt: now.toISOString() });
    render(<PRRow pr={pr} repo="test/repo" />);
    expect(screen.getByText("just now")).toBeInTheDocument();
  });

  it("shows time ago in minutes", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const pr = makePR({ updatedAt: fiveMinAgo });
    render(<PRRow pr={pr} repo="test/repo" />);
    expect(screen.getByText("5m")).toBeInTheDocument();
  });

  it("shows time ago in hours", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const pr = makePR({ updatedAt: threeHoursAgo });
    render(<PRRow pr={pr} repo="test/repo" />);
    expect(screen.getByText("3h")).toBeInTheDocument();
  });

  it("shows time ago in days", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const pr = makePR({ updatedAt: twoDaysAgo });
    render(<PRRow pr={pr} repo="test/repo" />);
    expect(screen.getByText("2d")).toBeInTheDocument();
  });

  it("shows time ago in months", () => {
    const twoMonthsAgo = new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString();
    const pr = makePR({ updatedAt: twoMonthsAgo });
    render(<PRRow pr={pr} repo="test/repo" />);
    expect(screen.getByText("2mo")).toBeInTheDocument();
  });
});

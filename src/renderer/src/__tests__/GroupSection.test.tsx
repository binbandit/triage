import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GroupSection } from "../components/GroupSection";
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

describe("GroupSection", () => {
  it("renders group name", () => {
    render(<GroupSection name="ready-to-merge" prs={[makePR()]} repo="test/repo" />);
    expect(screen.getByText("ready-to-merge")).toBeInTheDocument();
  });

  it("renders PR count", () => {
    const prs = [makePR({ number: 1 }), makePR({ number: 2 })];
    render(<GroupSection name="review" prs={prs} repo="test/repo" />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows PRs when defaultOpen is true", () => {
    render(
      <GroupSection
        name="group"
        prs={[makePR({ title: "Visible PR" })]}
        repo="test/repo"
        defaultOpen
      />,
    );
    expect(screen.getByText("Visible PR")).toBeInTheDocument();
  });

  it("hides PRs when defaultOpen is false", () => {
    render(
      <GroupSection
        name="group"
        prs={[makePR({ title: "Hidden PR" })]}
        repo="test/repo"
        defaultOpen={false}
      />,
    );
    expect(screen.queryByText("Hidden PR")).toBeNull();
  });

  it("toggles PRs visibility on header click", () => {
    render(<GroupSection name="group" prs={[makePR({ title: "Toggle PR" })]} repo="test/repo" />);
    expect(screen.getByText("Toggle PR")).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(screen.getByText("group"));
    expect(screen.queryByText("Toggle PR")).toBeNull();

    // Click to expand
    fireEvent.click(screen.getByText("group"));
    expect(screen.getByText("Toggle PR")).toBeInTheDocument();
  });

  it("passes highlightLabels to PRRow", () => {
    const pr = makePR({
      labels: [{ id: "1", name: "approved", color: "0e8a16", description: "" }],
    });
    render(
      <GroupSection name="group" prs={[pr]} repo="test/repo" highlightLabels={["approved"]} />,
    );
    expect(screen.getByText("approved")).toBeInTheDocument();
  });
});

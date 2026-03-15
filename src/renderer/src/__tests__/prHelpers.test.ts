import { describe, it, expect } from "vitest";
import { filterPRs, prMatchesGroup, groupPRs } from "../lib/prHelpers";
import type { PullRequest, LabelGroup } from "../types";

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

describe("filterPRs", () => {
  const prs = [
    makePR({
      number: 1,
      title: "Add authentication",
      author: { login: "alice" },
      labels: [{ id: "1", name: "feature", color: "0075ca", description: "" }],
    }),
    makePR({
      number: 2,
      title: "Fix login bug",
      author: { login: "bob" },
      labels: [{ id: "2", name: "bug", color: "d73a4a", description: "" }],
    }),
    makePR({ number: 3, title: "Update README", author: { login: "charlie" }, labels: [] }),
    makePR({
      number: 42,
      title: "Refactor database",
      author: { login: "alice" },
      labels: [{ id: "3", name: "refactor", color: "e4e669", description: "" }],
    }),
  ];

  it("returns all PRs for empty query", () => {
    expect(filterPRs(prs, "")).toEqual(prs);
  });

  it("returns all PRs for whitespace-only query", () => {
    expect(filterPRs(prs, "   ")).toEqual(prs);
  });

  it("filters by title (case-insensitive)", () => {
    const result = filterPRs(prs, "auth");
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(1);
  });

  it("filters by title (uppercase query)", () => {
    const result = filterPRs(prs, "README");
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(3);
  });

  it("filters by author login", () => {
    const result = filterPRs(prs, "alice");
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.number)).toEqual([1, 42]);
  });

  it("filters by issue number with #", () => {
    const result = filterPRs(prs, "#42");
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(42);
  });

  it("filters by partial issue number", () => {
    const result = filterPRs(prs, "#4");
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(42);
  });

  it("filters by label name", () => {
    const result = filterPRs(prs, "bug");
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(2);
  });

  it("filters by label name (case-insensitive)", () => {
    const result = filterPRs(prs, "FEATURE");
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(1);
  });

  it("returns empty when nothing matches", () => {
    const result = filterPRs(prs, "zzzznonexistent");
    expect(result).toEqual([]);
  });

  it("matches across multiple fields", () => {
    // "fix" matches title "Fix login bug"
    const result = filterPRs(prs, "fix");
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(2);
  });
});

describe("prMatchesGroup", () => {
  it("returns true when PR has all group labels", () => {
    const pr = makePR({
      labels: [
        { id: "1", name: "approved", color: "", description: "" },
        { id: "2", name: "ci-passed", color: "", description: "" },
      ],
    });
    const group: LabelGroup = { name: "ready", labels: ["approved", "ci-passed"] };
    expect(prMatchesGroup(pr, group)).toBe(true);
  });

  it("returns false when PR is missing a label", () => {
    const pr = makePR({
      labels: [{ id: "1", name: "approved", color: "", description: "" }],
    });
    const group: LabelGroup = { name: "ready", labels: ["approved", "ci-passed"] };
    expect(prMatchesGroup(pr, group)).toBe(false);
  });

  it("returns true for empty group labels (matches all)", () => {
    const pr = makePR({ labels: [] });
    const group: LabelGroup = { name: "all", labels: [] };
    expect(prMatchesGroup(pr, group)).toBe(true);
  });

  it("is case-insensitive", () => {
    const pr = makePR({
      labels: [{ id: "1", name: "Approved", color: "", description: "" }],
    });
    const group: LabelGroup = { name: "ready", labels: ["approved"] };
    expect(prMatchesGroup(pr, group)).toBe(true);
  });

  it("returns true when PR has extra labels beyond group requirement", () => {
    const pr = makePR({
      labels: [
        { id: "1", name: "approved", color: "", description: "" },
        { id: "2", name: "ci-passed", color: "", description: "" },
        { id: "3", name: "extra", color: "", description: "" },
      ],
    });
    const group: LabelGroup = { name: "ready", labels: ["approved"] };
    expect(prMatchesGroup(pr, group)).toBe(true);
  });
});

describe("groupPRs", () => {
  const prs = [
    makePR({
      number: 1,
      labels: [
        { id: "1", name: "approved", color: "", description: "" },
        { id: "2", name: "ci-passed", color: "", description: "" },
      ],
    }),
    makePR({ number: 2, labels: [{ id: "3", name: "needs-review", color: "", description: "" }] }),
    makePR({ number: 3, labels: [{ id: "4", name: "approved", color: "", description: "" }] }),
    makePR({ number: 4, labels: [] }),
  ];

  const groups: LabelGroup[] = [
    { name: "ready", labels: ["approved", "ci-passed"] },
    { name: "review", labels: ["needs-review"] },
  ];

  it("assigns PR to first matching group", () => {
    const result = groupPRs(prs, groups);
    expect(result.grouped[0].prs.map((p) => p.number)).toEqual([1]);
  });

  it("assigns PR to second group when not matching first", () => {
    const result = groupPRs(prs, groups);
    expect(result.grouped[1].prs.map((p) => p.number)).toEqual([2]);
  });

  it("puts unmatched PRs in ungrouped", () => {
    const result = groupPRs(prs, groups);
    expect(result.ungrouped.map((p) => p.number)).toEqual([3, 4]);
  });

  it("does not assign a PR to multiple groups", () => {
    const overlappingGroups: LabelGroup[] = [
      { name: "first", labels: ["approved"] },
      { name: "second", labels: ["approved", "ci-passed"] },
    ];
    const result = groupPRs(prs, overlappingGroups);
    // PR #1 has both approved and ci-passed, but should only be in "first"
    expect(result.grouped[0].prs.map((p) => p.number)).toEqual([1, 3]);
    expect(result.grouped[1].prs.map((p) => p.number)).toEqual([]);
  });

  it("returns all PRs as ungrouped when no groups defined", () => {
    const result = groupPRs(prs, []);
    expect(result.grouped).toEqual([]);
    expect(result.ungrouped).toHaveLength(4);
  });

  it("handles empty PR list", () => {
    const result = groupPRs([], groups);
    expect(result.grouped[0].prs).toEqual([]);
    expect(result.grouped[1].prs).toEqual([]);
    expect(result.ungrouped).toEqual([]);
  });
});

import { describe, it, expect } from "vitest";
import {
  filterPRs,
  prMatchesGroup,
  groupPRs,
  countApprovals,
  hasChangesRequested,
  countReviewers,
  prMatchesReview,
  sortGroupPRs,
} from "../lib/prHelpers";
import type { PullRequest, LabelGroup } from "../types";

function makeGroup(overrides: Partial<LabelGroup> & { name: string }): LabelGroup {
  return { labels: [], match: "all", sort: "updated", priority: 0, exclude: [], ...overrides };
}

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
    const group = makeGroup({ name: "ready", labels: ["approved", "ci-passed"] });
    expect(prMatchesGroup(pr, group)).toBe(true);
  });

  it("returns false when PR is missing a label", () => {
    const pr = makePR({
      labels: [{ id: "1", name: "approved", color: "", description: "" }],
    });
    const group = makeGroup({ name: "ready", labels: ["approved", "ci-passed"] });
    expect(prMatchesGroup(pr, group)).toBe(false);
  });

  it("returns true for empty group labels (matches all)", () => {
    const pr = makePR({ labels: [] });
    const group = makeGroup({ name: "all" });
    expect(prMatchesGroup(pr, group)).toBe(true);
  });

  it("is case-insensitive", () => {
    const pr = makePR({
      labels: [{ id: "1", name: "Approved", color: "", description: "" }],
    });
    const group = makeGroup({ name: "ready", labels: ["approved"] });
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
    const group = makeGroup({ name: "ready", labels: ["approved"] });
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
    makeGroup({ name: "ready", labels: ["approved", "ci-passed"] }),
    makeGroup({ name: "review", labels: ["needs-review"] }),
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
      makeGroup({ name: "first", labels: ["approved"] }),
      makeGroup({ name: "second", labels: ["approved", "ci-passed"] }),
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

  it("preserves group structure even when no PRs match", () => {
    const noMatchPRs = [makePR({ number: 99, labels: [] })];
    const result = groupPRs(noMatchPRs, groups);
    expect(result.grouped).toHaveLength(2);
    expect(result.grouped[0].group.name).toBe("ready");
    expect(result.grouped[0].prs).toEqual([]);
    expect(result.ungrouped).toHaveLength(1);
  });
});

describe("filterPRs - additional edge cases", () => {
  it("filters by bare number without # matches title content", () => {
    const prs = [
      makePR({ number: 42, title: "Normal PR" }),
      makePR({ number: 100, title: "Contains 42 in title" }),
    ];
    // Query "42" without # matches title containing "42" and also #42 contains "42"
    const result = filterPRs(prs, "42");
    // #42 contains the substring "42" (as "#42".includes("42") is true)
    expect(result.map((p) => p.number)).toEqual([42, 100]);
  });

  it("matches PR where author name appears in title too", () => {
    const prs = [makePR({ number: 1, title: "alice fixes auth", author: { login: "alice" } })];
    const result = filterPRs(prs, "alice");
    expect(result).toHaveLength(1);
  });

  it("handles PR with empty author login", () => {
    const prs = [makePR({ number: 1, author: { login: "" } })];
    const result = filterPRs(prs, "nonexistent");
    expect(result).toEqual([]);
  });

  it("filters by partial label match", () => {
    const prs = [
      makePR({
        number: 1,
        labels: [{ id: "1", name: "priority:high", color: "", description: "" }],
      }),
    ];
    const result = filterPRs(prs, "priority");
    expect(result).toHaveLength(1);
  });
});

describe("prMatchesGroup - additional edge cases", () => {
  it("handles group labels with colons", () => {
    const pr = makePR({
      labels: [{ id: "1", name: "size:S", color: "", description: "" }],
    });
    expect(prMatchesGroup(pr, makeGroup({ name: "small", labels: ["size:S"] }))).toBe(true);
  });

  it("handles group labels with slashes", () => {
    const pr = makePR({
      labels: [{ id: "1", name: "bug/critical", color: "", description: "" }],
    });
    expect(prMatchesGroup(pr, makeGroup({ name: "critical", labels: ["bug/critical"] }))).toBe(
      true,
    );
  });

  it("returns false for no labels on PR when group requires labels", () => {
    const pr = makePR({ labels: [] });
    expect(prMatchesGroup(pr, makeGroup({ name: "test", labels: ["required"] }))).toBe(false);
  });

  it("matches with 'any' match mode (OR logic)", () => {
    const pr = makePR({
      labels: [{ id: "1", name: "bug", color: "", description: "" }],
    });
    const group = makeGroup({ name: "issues", labels: ["bug", "feature"], match: "any" });
    expect(prMatchesGroup(pr, group)).toBe(true);
  });

  it("fails 'any' match when no labels match", () => {
    const pr = makePR({
      labels: [{ id: "1", name: "docs", color: "", description: "" }],
    });
    const group = makeGroup({ name: "issues", labels: ["bug", "feature"], match: "any" });
    expect(prMatchesGroup(pr, group)).toBe(false);
  });

  it("excludes PRs with excluded labels", () => {
    const pr = makePR({
      labels: [
        { id: "1", name: "approved", color: "", description: "" },
        { id: "2", name: "wip", color: "", description: "" },
      ],
    });
    const group = makeGroup({ name: "ready", labels: ["approved"], exclude: ["wip"] });
    expect(prMatchesGroup(pr, group)).toBe(false);
  });

  it("matches when PR has none of the excluded labels", () => {
    const pr = makePR({
      labels: [{ id: "1", name: "approved", color: "", description: "" }],
    });
    const group = makeGroup({
      name: "ready",
      labels: ["approved"],
      exclude: ["wip", "do-not-merge"],
    });
    expect(prMatchesGroup(pr, group)).toBe(true);
  });
});

describe("review helpers", () => {
  it("countApprovals returns 0 when no reviews", () => {
    expect(countApprovals(makePR())).toBe(0);
  });

  it("countApprovals counts APPROVED reviews", () => {
    const pr = makePR({
      latestReviews: [
        { author: { login: "a" }, state: "APPROVED", submittedAt: "" },
        { author: { login: "b" }, state: "COMMENTED", submittedAt: "" },
        { author: { login: "c" }, state: "APPROVED", submittedAt: "" },
      ],
    });
    expect(countApprovals(pr)).toBe(2);
  });

  it("hasChangesRequested returns false when no reviews", () => {
    expect(hasChangesRequested(makePR())).toBe(false);
  });

  it("hasChangesRequested returns true when changes requested", () => {
    const pr = makePR({
      latestReviews: [{ author: { login: "a" }, state: "CHANGES_REQUESTED", submittedAt: "" }],
    });
    expect(hasChangesRequested(pr)).toBe(true);
  });

  it("countReviewers returns 0 when no requests", () => {
    expect(countReviewers(makePR())).toBe(0);
  });

  it("countReviewers counts pending requests", () => {
    const pr = makePR({
      reviewRequests: [{ login: "a" }, { login: "b" }],
    });
    expect(countReviewers(pr)).toBe(2);
  });
});

describe("prMatchesReview", () => {
  it("matches min_approvals", () => {
    const pr = makePR({
      latestReviews: [
        { author: { login: "a" }, state: "APPROVED", submittedAt: "" },
        { author: { login: "b" }, state: "APPROVED", submittedAt: "" },
      ],
    });
    expect(prMatchesReview(pr, { min_approvals: 2 })).toBe(true);
    expect(prMatchesReview(pr, { min_approvals: 3 })).toBe(false);
  });

  it("matches max_approvals (0 = no approvals)", () => {
    const pr = makePR({ latestReviews: [] });
    expect(prMatchesReview(pr, { max_approvals: 0 })).toBe(true);
  });

  it("fails max_approvals when PR has too many", () => {
    const pr = makePR({
      latestReviews: [{ author: { login: "a" }, state: "APPROVED", submittedAt: "" }],
    });
    expect(prMatchesReview(pr, { max_approvals: 0 })).toBe(false);
  });

  it("matches changes_requested: true", () => {
    const pr = makePR({
      latestReviews: [{ author: { login: "a" }, state: "CHANGES_REQUESTED", submittedAt: "" }],
    });
    expect(prMatchesReview(pr, { changes_requested: true })).toBe(true);
  });

  it("matches changes_requested: false (no changes requested)", () => {
    const pr = makePR({ latestReviews: [] });
    expect(prMatchesReview(pr, { changes_requested: false })).toBe(true);
  });

  it("fails changes_requested: false when changes are requested", () => {
    const pr = makePR({
      latestReviews: [{ author: { login: "a" }, state: "CHANGES_REQUESTED", submittedAt: "" }],
    });
    expect(prMatchesReview(pr, { changes_requested: false })).toBe(false);
  });

  it("matches review_decision", () => {
    const pr = makePR({ reviewDecision: "APPROVED" });
    expect(prMatchesReview(pr, { review_decision: ["APPROVED"] })).toBe(true);
    expect(prMatchesReview(pr, { review_decision: ["REVIEW_REQUIRED"] })).toBe(false);
  });

  it("matches review_decision case-insensitively", () => {
    const pr = makePR({ reviewDecision: "APPROVED" });
    expect(prMatchesReview(pr, { review_decision: ["approved"] })).toBe(true);
  });

  it("matches min_reviewers", () => {
    const pr = makePR({ reviewRequests: [{ login: "a" }, { login: "b" }] });
    expect(prMatchesReview(pr, { min_reviewers: 1 })).toBe(true);
    expect(prMatchesReview(pr, { min_reviewers: 3 })).toBe(false);
  });

  it("matches max_reviewers (0 = no reviewers assigned)", () => {
    const pr = makePR({ reviewRequests: [] });
    expect(prMatchesReview(pr, { max_reviewers: 0 })).toBe(true);
  });

  it("combines multiple conditions (AND)", () => {
    const pr = makePR({
      latestReviews: [
        { author: { login: "a" }, state: "APPROVED", submittedAt: "" },
        { author: { login: "b" }, state: "APPROVED", submittedAt: "" },
      ],
      reviewRequests: [],
    });
    expect(prMatchesReview(pr, { min_approvals: 2, changes_requested: false })).toBe(true);
    expect(prMatchesReview(pr, { min_approvals: 3, changes_requested: false })).toBe(false);
  });

  it("integrates with prMatchesGroup", () => {
    const pr = makePR({
      labels: [{ id: "1", name: "approved", color: "", description: "" }],
      latestReviews: [{ author: { login: "a" }, state: "APPROVED", submittedAt: "" }],
    });
    const group = makeGroup({
      name: "ready",
      labels: ["approved"],
      review: { min_approvals: 1 },
    });
    expect(prMatchesGroup(pr, group)).toBe(true);
  });

  it("prMatchesGroup fails when review condition fails", () => {
    const pr = makePR({
      labels: [{ id: "1", name: "approved", color: "", description: "" }],
      latestReviews: [],
    });
    const group = makeGroup({
      name: "ready",
      labels: ["approved"],
      review: { min_approvals: 1 },
    });
    expect(prMatchesGroup(pr, group)).toBe(false);
  });
});

describe("sortGroupPRs", () => {
  const prs = [
    makePR({
      number: 1,
      title: "C PR",
      updatedAt: "2024-01-03T00:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
    }),
    makePR({
      number: 2,
      title: "A PR",
      updatedAt: "2024-01-01T00:00:00Z",
      createdAt: "2024-01-03T00:00:00Z",
    }),
    makePR({
      number: 3,
      title: "B PR",
      updatedAt: "2024-01-02T00:00:00Z",
      createdAt: "2024-01-02T00:00:00Z",
    }),
  ];

  it("sorts by updated (default, newest first)", () => {
    const sorted = sortGroupPRs(prs, "updated");
    expect(sorted.map((p) => p.number)).toEqual([1, 3, 2]);
  });

  it("sorts by created (newest first)", () => {
    const sorted = sortGroupPRs(prs, "created");
    expect(sorted.map((p) => p.number)).toEqual([2, 3, 1]);
  });

  it("sorts by title (alphabetical)", () => {
    const sorted = sortGroupPRs(prs, "title");
    expect(sorted.map((p) => p.number)).toEqual([2, 3, 1]);
  });

  it("returns same array for single item", () => {
    const single = [makePR({ number: 1 })];
    expect(sortGroupPRs(single, "updated")).toEqual(single);
  });
});

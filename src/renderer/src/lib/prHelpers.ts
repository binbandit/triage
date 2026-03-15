import type { PullRequest, LabelGroup, SortField, ReviewConditions } from "../types";

export function filterPRs(prs: PullRequest[], query: string): PullRequest[] {
  if (!query.trim()) return prs;
  const q = query.toLowerCase();
  return prs.filter((pr) => {
    if (pr.title.toLowerCase().includes(q)) return true;
    if (pr.author.login.toLowerCase().includes(q)) return true;
    if (`#${pr.number}`.includes(q)) return true;
    if (pr.labels.some((l) => l.name.toLowerCase().includes(q))) return true;
    return false;
  });
}

/**
 * Count approvals from latestReviews.
 */
export function countApprovals(pr: PullRequest): number {
  if (!pr.latestReviews) return 0;
  return pr.latestReviews.filter((r) => r.state === "APPROVED").length;
}

/**
 * Check if any latest review has changes requested.
 */
export function hasChangesRequested(pr: PullRequest): boolean {
  if (!pr.latestReviews) return false;
  return pr.latestReviews.some((r) => r.state === "CHANGES_REQUESTED");
}

/**
 * Count pending review requests.
 */
export function countReviewers(pr: PullRequest): number {
  if (!pr.reviewRequests) return 0;
  return pr.reviewRequests.length;
}

/**
 * Check if a PR matches review conditions.
 * All specified conditions must be met (AND logic).
 */
export function prMatchesReview(pr: PullRequest, review: ReviewConditions): boolean {
  const approvals = countApprovals(pr);
  const reviewers = countReviewers(pr);

  if (review.min_approvals !== undefined && approvals < review.min_approvals) {
    return false;
  }
  if (review.max_approvals !== undefined && approvals > review.max_approvals) {
    return false;
  }
  if (review.changes_requested !== undefined) {
    if (review.changes_requested !== hasChangesRequested(pr)) {
      return false;
    }
  }
  if (review.review_decision !== undefined && review.review_decision.length > 0) {
    const decision = (pr.reviewDecision || "").toUpperCase();
    if (!review.review_decision.some((d) => d.toUpperCase() === decision)) {
      return false;
    }
  }
  if (review.min_reviewers !== undefined && reviewers < review.min_reviewers) {
    return false;
  }
  if (review.max_reviewers !== undefined && reviewers > review.max_reviewers) {
    return false;
  }

  return true;
}

/**
 * Check if a PR matches a group's label and review criteria.
 *
 * - `match: "all"` (AND): PR must have every label in group.labels
 * - `match: "any"` (OR): PR must have at least one label in group.labels
 * - `exclude`: PR must NOT have any label in group.exclude
 * - `review`: All specified review conditions must be met
 *
 * An empty `labels` array matches all PRs (unless excluded or review fails).
 */
export function prMatchesGroup(pr: PullRequest, group: LabelGroup): boolean {
  const prLabelNames = pr.labels.map((l) => l.name.toLowerCase());

  // Check exclusions first
  if (group.exclude.length > 0) {
    const hasExcluded = group.exclude.some((ex) => prLabelNames.includes(ex.toLowerCase()));
    if (hasExcluded) return false;
  }

  // Check label match
  if (group.labels.length > 0) {
    if (group.match === "any") {
      if (!group.labels.some((gl) => prLabelNames.includes(gl.toLowerCase()))) {
        return false;
      }
    } else {
      if (!group.labels.every((gl) => prLabelNames.includes(gl.toLowerCase()))) {
        return false;
      }
    }
  }

  // Check review conditions
  if (group.review) {
    if (!prMatchesReview(pr, group.review)) {
      return false;
    }
  }

  return true;
}

/**
 * Sort PRs within a group based on the group's sort field.
 */
export function sortGroupPRs(prs: PullRequest[], sort: SortField): PullRequest[] {
  if (prs.length <= 1) return prs;

  return prs.toSorted((a, b) => {
    switch (sort) {
      case "created":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "title":
        return a.title.localeCompare(b.title);
      case "updated":
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });
}

export function groupPRs(
  prs: PullRequest[],
  groups: LabelGroup[],
): { grouped: { group: LabelGroup; prs: PullRequest[] }[]; ungrouped: PullRequest[] } {
  const assigned = new Set<number>();
  const grouped = groups.map((group) => {
    const matching = prs.filter((pr) => {
      if (assigned.has(pr.number)) return false;
      return prMatchesGroup(pr, group);
    });
    for (const pr of matching) assigned.add(pr.number);
    return { group, prs: sortGroupPRs(matching, group.sort) };
  });
  const ungrouped = prs.filter((pr) => !assigned.has(pr.number));
  return { grouped, ungrouped };
}

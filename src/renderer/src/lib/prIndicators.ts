import type { PullRequest } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PRIndicators {
  ageDays: number;
  ageLabel: string;
  staleDays: number;
  isStale: boolean;
  activityLevel: "hot" | "warm" | "cold" | "frozen";
  commentCount: number;
}

/**
 * Compute age, staleness, and activity indicators for a PR.
 * @param staleDaysThreshold - PRs not updated in this many days are considered stale (default 14)
 */
export function computePRIndicators(pr: PullRequest, staleDaysThreshold = 14): PRIndicators {
  const now = Date.now();
  const created = new Date(pr.createdAt).getTime();
  const updated = new Date(pr.updatedAt).getTime();

  const ageDays = Math.floor((now - created) / DAY_MS);
  const staleDays = Math.floor((now - updated) / DAY_MS);
  const isStale = staleDays >= staleDaysThreshold && pr.state === "OPEN";

  // Comment count from latestReviews + any review data
  const reviewCount = pr.latestReviews?.length ?? 0;
  const commentCount = reviewCount;

  // Activity level based on how recently updated
  let activityLevel: PRIndicators["activityLevel"];
  if (staleDays <= 1) activityLevel = "hot";
  else if (staleDays <= 7) activityLevel = "warm";
  else if (staleDays <= 30) activityLevel = "cold";
  else activityLevel = "frozen";

  let ageLabel: string;
  if (ageDays === 0) ageLabel = "today";
  else if (ageDays === 1) ageLabel = "1d old";
  else if (ageDays < 7) ageLabel = `${ageDays}d old`;
  else if (ageDays < 30) ageLabel = `${Math.floor(ageDays / 7)}w old`;
  else if (ageDays < 365) ageLabel = `${Math.floor(ageDays / 30)}mo old`;
  else ageLabel = `${Math.floor(ageDays / 365)}y old`;

  return { ageDays, ageLabel, staleDays, isStale, activityLevel, commentCount };
}

/**
 * Get a CSS color variable name for the activity level.
 */
export function activityColor(level: PRIndicators["activityLevel"]): string {
  switch (level) {
    case "hot":
      return "var(--color-green)";
    case "warm":
      return "var(--color-amber)";
    case "cold":
      return "var(--color-fg-muted)";
    case "frozen":
      return "var(--color-red)";
  }
}

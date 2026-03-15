import { parse } from "yaml";
import type { TriageConfig, LabelGroup, MatchMode, SortField, ReviewConditions } from "../types";

const VALID_MATCH: MatchMode[] = ["all", "any"];
const VALID_SORT: SortField[] = ["updated", "created", "title"];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Parse review conditions from the `review` key in an enhanced group config.
 */
function parseReviewConditions(obj: unknown): ReviewConditions | undefined {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return undefined;

  const r = obj as Record<string, unknown>;
  const conditions: ReviewConditions = {};
  let hasAny = false;

  if (isFiniteNumber(r.min_approvals)) {
    conditions.min_approvals = r.min_approvals;
    hasAny = true;
  }
  if (isFiniteNumber(r.max_approvals)) {
    conditions.max_approvals = r.max_approvals;
    hasAny = true;
  }
  if (typeof r.changes_requested === "boolean") {
    conditions.changes_requested = r.changes_requested;
    hasAny = true;
  }
  if (isStringArray(r.review_decision)) {
    conditions.review_decision = r.review_decision;
    hasAny = true;
  }
  if (isFiniteNumber(r.min_reviewers)) {
    conditions.min_reviewers = r.min_reviewers;
    hasAny = true;
  }
  if (isFiniteNumber(r.max_reviewers)) {
    conditions.max_reviewers = r.max_reviewers;
    hasAny = true;
  }

  return hasAny ? conditions : undefined;
}

/**
 * Parse a .triage.yml config file into typed label groups.
 *
 * Supports two formats:
 *
 * **Simple** (backward compatible):
 * ```yaml
 * ready-to-merge:
 *   - approved
 *   - ci-passed
 * ```
 *
 * **Enhanced** (with review conditions):
 * ```yaml
 * ready-to-merge:
 *   description: "PRs that have passed all checks"
 *   color: "#22c55e"
 *   match: all
 *   sort: updated
 *   priority: 0
 *   labels:
 *     - approved
 *     - ci-passed
 *   exclude:
 *     - do-not-merge
 *   review:
 *     min_approvals: 2
 *     changes_requested: false
 *
 * needs-review:
 *   description: "PRs with no approvals yet"
 *   color: "#f59e0b"
 *   review:
 *     max_approvals: 0
 *     min_reviewers: 1
 * ```
 */
export function parseTriageConfig(raw: string): TriageConfig {
  let doc: unknown;
  try {
    doc = parse(raw);
  } catch {
    return { groups: [] };
  }

  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    return { groups: [] };
  }

  const groups: LabelGroup[] = [];

  for (const [name, value] of Object.entries(doc as Record<string, unknown>)) {
    // Simple format: key -> string[]
    if (Array.isArray(value)) {
      groups.push({
        name,
        labels: value.filter((l): l is string => typeof l === "string"),
        match: "all",
        sort: "updated",
        priority: groups.length,
        exclude: [],
      });
      continue;
    }

    // Enhanced format: key -> object
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      const labels = isStringArray(obj.labels) ? obj.labels : [];
      const exclude = isStringArray(obj.exclude) ? obj.exclude : [];

      const match: MatchMode =
        typeof obj.match === "string" && VALID_MATCH.includes(obj.match as MatchMode)
          ? (obj.match as MatchMode)
          : "all";

      const sort: SortField =
        typeof obj.sort === "string" && VALID_SORT.includes(obj.sort as SortField)
          ? (obj.sort as SortField)
          : "updated";

      const priority = isFiniteNumber(obj.priority) ? obj.priority : groups.length;

      groups.push({
        name,
        labels,
        description: typeof obj.description === "string" ? obj.description : undefined,
        color: typeof obj.color === "string" ? obj.color : undefined,
        match,
        sort,
        priority,
        exclude,
        review: parseReviewConditions(obj.review),
      });
    }
  }

  // Sort groups by priority (lower first), preserving YAML order for equal priority
  groups.sort((a, b) => a.priority - b.priority);

  return { groups };
}

export interface PRLabel {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface PRAuthor {
  login: string;
  id?: string;
  name?: string;
}

export interface PRReview {
  author: { login: string };
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED";
  submittedAt: string;
}

export interface PRReviewRequest {
  login: string;
}

export interface PullRequest {
  number: number;
  title: string;
  url: string;
  labels: PRLabel[];
  state: string;
  author: PRAuthor;
  body: string;
  createdAt: string;
  updatedAt: string;
  headRefName: string;
  isDraft: boolean;
  closedAt?: string;
  mergedAt?: string;
  reviewDecision?: string;
  latestReviews?: PRReview[];
  reviewRequests?: PRReviewRequest[];
}

export type MatchMode = "all" | "any";
export type SortField = "updated" | "created" | "title";

/**
 * Review-based conditions for group matching.
 * All specified conditions must be met (AND logic).
 */
export interface ReviewConditions {
  /** Minimum number of approvals required */
  min_approvals?: number;
  /** Maximum number of approvals (e.g. 0 = "has no approvals") */
  max_approvals?: number;
  /** Whether changes have been requested (true = must have, false = must not have) */
  changes_requested?: boolean;
  /** reviewDecision matches one of these values */
  review_decision?: string[];
  /** Minimum number of pending review requests */
  min_reviewers?: number;
  /** Maximum number of pending review requests (e.g. 0 = "no reviewers assigned") */
  max_reviewers?: number;
}

export interface LabelGroup {
  name: string;
  labels: string[];
  description?: string;
  color?: string;
  match: MatchMode;
  sort: SortField;
  priority: number;
  exclude: string[];
  review?: ReviewConditions;
}

export interface TriageConfig {
  groups: LabelGroup[];
}

export type Theme = "dark" | "light";
export type ViewMode = "list" | "kanban";

export interface Settings {
  repo: string;
  theme: Theme;
  viewMode: ViewMode;
}

export interface AuthStatus {
  authenticated: boolean;
  error?: string;
}

export interface RepoInfo {
  nameWithOwner: string;
  description: string;
  url: string;
}

export interface ConfigFetchResult {
  content: string | null;
  found: boolean;
}

export interface ActionResult {
  success: boolean;
}

export interface TriageAPI {
  listPRs: (options: { repo?: string; state?: string; limit?: number }) => Promise<PullRequest[]>;
  getPR: (options: { repo?: string; number: number }) => Promise<PullRequest>;
  authStatus: () => Promise<AuthStatus>;
  currentRepo: () => Promise<RepoInfo | null>;
  fetchConfig: (options: { repo: string; path?: string }) => Promise<ConfigFetchResult>;
  closePR: (options: { repo: string; number: number; comment?: string }) => Promise<ActionResult>;
  mergePR: (options: { repo: string; number: number; comment?: string }) => Promise<ActionResult>;
  commentPR: (options: { repo: string; number: number; body: string }) => Promise<ActionResult>;
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    api: TriageAPI;
  }
}

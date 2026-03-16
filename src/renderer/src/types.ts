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
  authorAssociation?: string;
  body: string;
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED" | "PENDING";
  submittedAt: string;
}

export interface PRReviewRequest {
  login: string;
}

export interface PRComment {
  id: string;
  author: { login: string };
  authorAssociation?: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PRCommit {
  authoredDate: string;
  committedDate: string;
  messageBody: string;
  messageHeadline: string;
  oid: string;
  authors: { login: string; name: string; email: string }[];
}

export interface PRFile {
  path: string;
  additions: number;
  deletions: number;
  changeType: "ADDED" | "MODIFIED" | "DELETED" | "RENAMED" | "COPIED";
}

export interface PRCheckRun {
  __typename: string;
  name: string;
  status: string;
  conclusion: string;
  startedAt?: string;
  completedAt?: string;
  detailsUrl?: string;
  workflowName?: string;
}

export interface PRAssignee {
  login: string;
  name?: string;
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
  mergedBy?: { login: string };
  reviewDecision?: string;
  latestReviews?: PRReview[];
  reviewRequests?: PRReviewRequest[];
}

/** Extended PR data returned by gh:get-pr with full detail fields. */
export interface PullRequestDetail extends PullRequest {
  baseRefName: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  comments: PRComment[];
  commits: PRCommit[];
  files: PRFile[];
  reviews: PRReview[];
  assignees: PRAssignee[];
  statusCheckRollup: PRCheckRun[];
  mergeable: string;
  mergeStateStatus: string;
}

export type MatchMode = "all" | "any";
export type SortField = "updated" | "created" | "title";

export interface ReviewConditions {
  min_approvals?: number;
  max_approvals?: number;
  changes_requested?: boolean;
  review_decision?: string[];
  min_reviewers?: number;
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
  inlinePRView: boolean;
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

export type ReviewEvent = "APPROVE" | "REQUEST_CHANGES" | "COMMENT";

export interface GitHubUser {
  login: string;
  avatar_url?: string;
}

// ── Issue types ──────────────────────────────────────

export interface Issue {
  number: number;
  title: string;
  url: string;
  state: string;
  author: PRAuthor;
  body: string;
  labels: PRLabel[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  comments: PRComment[];
  assignees: PRAssignee[];
}

// ── API ──────────────────────────────────────────────

export interface TriageAPI {
  // PRs
  listPRs: (options: { repo?: string; state?: string; limit?: number }) => Promise<PullRequest[]>;
  getPR: (options: { repo?: string; number: number }) => Promise<PullRequestDetail>;
  getPRDiff: (options: { repo: string; number: number }) => Promise<string>;
  closePR: (options: { repo: string; number: number; comment?: string }) => Promise<ActionResult>;
  mergePR: (options: { repo: string; number: number; comment?: string }) => Promise<ActionResult>;
  commentPR: (options: { repo: string; number: number; body: string }) => Promise<ActionResult>;
  editPR: (options: {
    repo: string;
    number: number;
    title?: string;
    body?: string;
    addLabels?: string[];
    removeLabels?: string[];
  }) => Promise<ActionResult>;
  toggleDraft: (options: {
    repo: string;
    number: number;
    isDraft: boolean;
  }) => Promise<ActionResult>;
  submitReview: (options: {
    repo: string;
    number: number;
    event: ReviewEvent;
    body?: string;
  }) => Promise<ActionResult>;
  reviewComment: (options: {
    repo: string;
    number: number;
    body: string;
    path: string;
    line: number;
    startLine?: number;
    side?: string;
  }) => Promise<ActionResult>;

  // Issues
  listIssues: (options: { repo: string; state?: string; limit?: number }) => Promise<Issue[]>;
  getIssue: (options: { repo: string; number: number }) => Promise<Issue>;
  commentIssue: (options: { repo: string; number: number; body: string }) => Promise<ActionResult>;
  closeIssue: (options: {
    repo: string;
    number: number;
    comment?: string;
  }) => Promise<ActionResult>;
  reopenIssue: (options: { repo: string; number: number }) => Promise<ActionResult>;
  editIssue: (options: {
    repo: string;
    number: number;
    title?: string;
    body?: string;
    addLabels?: string[];
    removeLabels?: string[];
  }) => Promise<ActionResult>;

  // Shared
  authStatus: () => Promise<AuthStatus>;
  currentRepo: () => Promise<RepoInfo | null>;
  fetchConfig: (options: { repo: string; path?: string }) => Promise<ConfigFetchResult>;
  repoLabels: (options: { repo: string }) => Promise<string[] | string>;
  searchUsers: (options: { query: string }) => Promise<GitHubUser[]>;
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    api: TriageAPI;
  }
}

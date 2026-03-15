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
}

export interface Settings {
  requiredLabels: string[];
  repo: string;
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

export interface TriageAPI {
  listPRs: (options: { repo?: string; state?: string; limit?: number }) => Promise<PullRequest[]>;
  getPR: (options: { repo?: string; number: number }) => Promise<PullRequest>;
  authStatus: () => Promise<AuthStatus>;
  currentRepo: () => Promise<RepoInfo | null>;
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    api: TriageAPI;
  }
}

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  // PR listing
  listPRs: (options: { repo?: string; state?: string; limit?: number }) =>
    ipcRenderer.invoke("gh:list-prs", options),

  // PR detail
  getPR: (options: { repo?: string; number: number }) => ipcRenderer.invoke("gh:get-pr", options),
  getPRDiff: (options: { repo: string; number: number }) =>
    ipcRenderer.invoke("gh:pr-diff", options),

  // Auth & repo
  authStatus: () => ipcRenderer.invoke("gh:auth-status"),
  currentRepo: () => ipcRenderer.invoke("gh:current-repo"),
  fetchConfig: (options: { repo: string; path?: string }) =>
    ipcRenderer.invoke("gh:fetch-config", options),

  // PR actions
  closePR: (options: { repo: string; number: number; comment?: string }) =>
    ipcRenderer.invoke("gh:close-pr", options),
  mergePR: (options: { repo: string; number: number; comment?: string }) =>
    ipcRenderer.invoke("gh:merge-pr", options),
  commentPR: (options: { repo: string; number: number; body: string }) =>
    ipcRenderer.invoke("gh:comment-pr", options),

  // PR editing
  editPR: (options: {
    repo: string;
    number: number;
    title?: string;
    body?: string;
    addLabels?: string[];
    removeLabels?: string[];
  }) => ipcRenderer.invoke("gh:edit-pr", options),

  // Draft toggle
  toggleDraft: (options: { repo: string; number: number; isDraft: boolean }) =>
    ipcRenderer.invoke("gh:toggle-draft", options),

  // Reviews
  submitReview: (options: {
    repo: string;
    number: number;
    event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
    body?: string;
  }) => ipcRenderer.invoke("gh:submit-review", options),
  reviewComment: (options: {
    repo: string;
    number: number;
    body: string;
    path: string;
    line: number;
    startLine?: number;
    side?: string;
  }) => ipcRenderer.invoke("gh:review-comment", options),

  // Issues
  listIssues: (options: { repo: string; state?: string; limit?: number }) =>
    ipcRenderer.invoke("gh:list-issues", options),
  getIssue: (options: { repo: string; number: number }) =>
    ipcRenderer.invoke("gh:get-issue", options),
  commentIssue: (options: { repo: string; number: number; body: string }) =>
    ipcRenderer.invoke("gh:comment-issue", options),
  closeIssue: (options: { repo: string; number: number; comment?: string }) =>
    ipcRenderer.invoke("gh:close-issue", options),
  reopenIssue: (options: { repo: string; number: number }) =>
    ipcRenderer.invoke("gh:reopen-issue", options),
  editIssue: (options: {
    repo: string;
    number: number;
    title?: string;
    body?: string;
    addLabels?: string[];
    removeLabels?: string[];
  }) => ipcRenderer.invoke("gh:edit-issue", options),

  // Reactions
  addReaction: (options: {
    repo: string;
    commentId: string;
    type: "issue" | "pr";
    reaction: string;
  }) => ipcRenderer.invoke("gh:add-reaction", options),

  // Repo data
  repoLabels: (options: { repo: string }) => ipcRenderer.invoke("gh:repo-labels", options),
  searchUsers: (options: { query: string }) => ipcRenderer.invoke("gh:search-users", options),

  // Shell
  openExternal: (url: string) => ipcRenderer.invoke("shell:open-external", url),
});

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  // PR listing
  listPRs: (options: { repo?: string; state?: string; limit?: number }) =>
    ipcRenderer.invoke("gh:list-prs", options),

  // PR detail
  getPR: (options: { repo?: string; number: number }) => ipcRenderer.invoke("gh:get-pr", options),
  getPRDiff: (options: { repo: string; number: number }) =>
    ipcRenderer.invoke("gh:pr-diff", options),
  getPRFiles: (options: { repo: string; number: number }) =>
    ipcRenderer.invoke("gh:pr-files", options),
  getCommitFiles: (options: { repo: string; sha: string }) =>
    ipcRenderer.invoke("gh:commit-files", options),

  // Local config
  readLocalConfig: () => ipcRenderer.invoke("config:read-local"),
  readLocalConfigForRepo: (options: { repo: string }) =>
    ipcRenderer.invoke("config:read-local-for-repo", options),
  writeLocalConfig: (options: { content: string }) =>
    ipcRenderer.invoke("config:write-local", options),
  openLocalConfigDir: () => ipcRenderer.invoke("config:open-local-dir"),

  // Auth & accounts
  authAccounts: () => ipcRenderer.invoke("gh:auth-accounts"),
  authSwitch: (options: { hostname: string; user: string }) =>
    ipcRenderer.invoke("gh:auth-switch", options),
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
    commitSha: string;
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
  getReactions: (options: { repo: string; number: number }) =>
    ipcRenderer.invoke("gh:get-reactions", options),
  addReaction: (options: {
    repo: string;
    commentId: string;
    type: "issue" | "pr";
    reaction: string;
  }) => ipcRenderer.invoke("gh:add-reaction", options),

  // Repo data
  repoLabels: (options: { repo: string }) => ipcRenderer.invoke("gh:repo-labels", options),
  searchUsers: (options: { query: string }) => ipcRenderer.invoke("gh:search-users", options),

  // Canvas DB
  canvasGetNodes: (repo: string) => ipcRenderer.invoke("canvas:get-nodes", repo),
  canvasUpdateNodePos: (opts: { repo: string; id: string; x: number; y: number }) =>
    ipcRenderer.invoke("canvas:update-node-pos", opts),
  canvasDeleteNode: (opts: { repo: string; id: string }) =>
    ipcRenderer.invoke("canvas:delete-node", opts),
  canvasBatchUpsertNodes: (opts: { repo: string; nodes: unknown[] }) =>
    ipcRenderer.invoke("canvas:batch-upsert-nodes", opts),
  canvasGetZones: (repo: string) => ipcRenderer.invoke("canvas:get-zones", repo),
  canvasUpsertZone: (opts: { repo: string; zone: unknown }) =>
    ipcRenderer.invoke("canvas:upsert-zone", opts),
  canvasUpdateZonePos: (opts: { repo: string; id: string; x: number; y: number }) =>
    ipcRenderer.invoke("canvas:update-zone-pos", opts),
  canvasUpdateZoneSize: (opts: { repo: string; id: string; width: number; height: number }) =>
    ipcRenderer.invoke("canvas:update-zone-size", opts),
  canvasUpdateZoneLabel: (opts: { repo: string; id: string; label: string }) =>
    ipcRenderer.invoke("canvas:update-zone-label", opts),
  canvasDeleteZone: (opts: { repo: string; id: string }) =>
    ipcRenderer.invoke("canvas:delete-zone", opts),
  canvasGetViewport: (repo: string) => ipcRenderer.invoke("canvas:get-viewport", repo),
  canvasSaveViewport: (opts: { repo: string; viewport: unknown }) =>
    ipcRenderer.invoke("canvas:save-viewport", opts),

  // Shell
  openExternal: (url: string) => ipcRenderer.invoke("shell:open-external", url),
});

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  listPRs: (options: { repo?: string; state?: string; limit?: number }) =>
    ipcRenderer.invoke("gh:list-prs", options),
  getPR: (options: { repo?: string; number: number }) => ipcRenderer.invoke("gh:get-pr", options),
  authStatus: () => ipcRenderer.invoke("gh:auth-status"),
  currentRepo: () => ipcRenderer.invoke("gh:current-repo"),
  fetchConfig: (options: { repo: string; path?: string }) =>
    ipcRenderer.invoke("gh:fetch-config", options),
  closePR: (options: { repo: string; number: number; comment?: string }) =>
    ipcRenderer.invoke("gh:close-pr", options),
  mergePR: (options: { repo: string; number: number; comment?: string }) =>
    ipcRenderer.invoke("gh:merge-pr", options),
  commentPR: (options: { repo: string; number: number; body: string }) =>
    ipcRenderer.invoke("gh:comment-pr", options),
  openExternal: (url: string) => ipcRenderer.invoke("shell:open-external", url),
});

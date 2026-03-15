import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  listPRs: (options) => ipcRenderer.invoke("gh:list-prs", options),
  getPR: (options) => ipcRenderer.invoke("gh:get-pr", options),
  authStatus: () => ipcRenderer.invoke("gh:auth-status"),
  currentRepo: () => ipcRenderer.invoke("gh:current-repo"),
  openExternal: (url) => ipcRenderer.invoke("shell:open-external", url),
});

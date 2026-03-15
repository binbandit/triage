import { app, BrowserWindow, ipcMain, shell } from "electron";
import { execFile } from "node:child_process";
import { join } from "node:path";

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 680,
    minHeight: 480,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#09090b",
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

/**
 * Execute the gh CLI with given arguments.
 * Returns parsed JSON when `--json` is used, raw stdout otherwise.
 */
function execGh(args) {
  return new Promise((resolve, reject) => {
    execFile("gh", args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        resolve(stdout.trim());
      }
    });
  });
}

// --- IPC Handlers ---

ipcMain.handle("gh:list-prs", async (_event, { repo, state = "open", limit = 100 }) => {
  const args = [
    "pr",
    "list",
    "--json",
    "number,title,url,labels,state,author,body,createdAt,updatedAt,headRefName,isDraft",
    "--limit",
    String(limit),
    "--state",
    state,
  ];
  if (repo) {
    args.push("--repo", repo);
  }
  return execGh(args);
});

ipcMain.handle("gh:get-pr", async (_event, { repo, number }) => {
  const args = [
    "pr",
    "view",
    String(number),
    "--json",
    "number,title,url,labels,state,author,body,createdAt,updatedAt,headRefName,isDraft,closedAt,mergedAt",
  ];
  if (repo) {
    args.push("--repo", repo);
  }
  return execGh(args);
});

ipcMain.handle("gh:auth-status", async () => {
  try {
    await execGh(["auth", "status"]);
    return { authenticated: true };
  } catch (error) {
    return { authenticated: false, error: error.message };
  }
});

ipcMain.handle("gh:current-repo", async () => {
  try {
    const result = await execGh([
      "repo",
      "view",
      "--json",
      "nameWithOwner,description,url",
    ]);
    return result;
  } catch {
    return null;
  }
});

ipcMain.handle("shell:open-external", async (_event, url) => {
  shell.openExternal(url);
});

// --- App Lifecycle ---

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

import { app, BrowserWindow, ipcMain, shell } from "electron";
import { execFile } from "node:child_process";
import { join } from "node:path";

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
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
    mainWindow?.show();
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
function execGh(args: string[]): Promise<unknown> {
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

ipcMain.handle(
  "gh:list-prs",
  async (_event, options: { repo?: string; state?: string; limit?: number }) => {
    const { repo, state = "open", limit = 1000 } = options;
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
  },
);

ipcMain.handle("gh:get-pr", async (_event, options: { repo?: string; number: number }) => {
  const { repo, number } = options;
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
    return { authenticated: false, error: (error as Error).message };
  }
});

ipcMain.handle("gh:current-repo", async () => {
  try {
    const result = await execGh(["repo", "view", "--json", "nameWithOwner,description,url"]);
    return result;
  } catch {
    return null;
  }
});

ipcMain.handle("gh:fetch-config", async (_event, options: { repo: string; path?: string }) => {
  const { repo, path = ".triage.yml" } = options;
  try {
    const result = await execGh(["api", `repos/${repo}/contents/${path}`, "--jq", ".content"]);
    // GitHub returns base64-encoded content
    const decoded = Buffer.from(String(result), "base64").toString("utf-8");
    return { content: decoded, found: true };
  } catch {
    return { content: null, found: false };
  }
});

ipcMain.handle(
  "gh:close-pr",
  async (_event, options: { repo: string; number: number; comment?: string }) => {
    const { repo, number, comment } = options;
    if (comment) {
      await execGh(["pr", "comment", String(number), "--repo", repo, "--body", comment]);
    }
    await execGh(["pr", "close", String(number), "--repo", repo]);
    return { success: true };
  },
);

ipcMain.handle(
  "gh:merge-pr",
  async (_event, options: { repo: string; number: number; comment?: string }) => {
    const { repo, number, comment } = options;
    if (comment) {
      await execGh(["pr", "comment", String(number), "--repo", repo, "--body", comment]);
    }
    await execGh(["pr", "merge", String(number), "--repo", repo, "--merge"]);
    return { success: true };
  },
);

ipcMain.handle(
  "gh:comment-pr",
  async (_event, options: { repo: string; number: number; body: string }) => {
    const { repo, number, body } = options;
    await execGh(["pr", "comment", String(number), "--repo", repo, "--body", body]);
    return { success: true };
  },
);

ipcMain.handle("shell:open-external", async (_event, url: string) => {
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

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

// ── IPC: PR Listing ──────────────────────────────────

ipcMain.handle(
  "gh:list-prs",
  async (_event, options: { repo?: string; state?: string; limit?: number }) => {
    const { repo, state = "open", limit = 1000 } = options;
    const args = [
      "pr",
      "list",
      "--json",
      "number,title,url,labels,state,author,body,createdAt,updatedAt,headRefName,isDraft,reviewDecision,latestReviews,reviewRequests",
      "--limit",
      String(limit),
      "--state",
      state,
    ];
    if (repo) args.push("--repo", repo);
    return execGh(args);
  },
);

// ── IPC: PR Detail ───────────────────────────────────

const PR_DETAIL_FIELDS = [
  "number",
  "title",
  "url",
  "labels",
  "state",
  "author",
  "body",
  "createdAt",
  "updatedAt",
  "headRefName",
  "baseRefName",
  "isDraft",
  "closedAt",
  "mergedAt",
  "mergedBy",
  "additions",
  "deletions",
  "changedFiles",
  "comments",
  "commits",
  "files",
  "reviews",
  "latestReviews",
  "reviewRequests",
  "reviewDecision",
  "mergeable",
  "mergeStateStatus",
  "statusCheckRollup",
  "assignees",
].join(",");

ipcMain.handle("gh:get-pr", async (_event, options: { repo?: string; number: number }) => {
  const { repo, number } = options;
  const args = ["pr", "view", String(number), "--json", PR_DETAIL_FIELDS];
  if (repo) args.push("--repo", repo);
  return execGh(args);
});

// ── IPC: PR Diff ─────────────────────────────────────

ipcMain.handle("gh:pr-diff", async (_event, options: { repo: string; number: number }) => {
  const { repo, number } = options;
  const args = ["pr", "diff", String(number), "--repo", repo, "--patch"];
  return execGh(args);
});

// ── IPC: Config ──────────────────────────────────────

ipcMain.handle("gh:fetch-config", async (_event, options: { repo: string; path?: string }) => {
  const { repo, path = ".triage.yml" } = options;
  try {
    const result = await execGh(["api", `repos/${repo}/contents/${path}`, "--jq", ".content"]);
    const decoded = Buffer.from(String(result), "base64").toString("utf-8");
    return { content: decoded, found: true };
  } catch {
    return { content: null, found: false };
  }
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
    return await execGh(["repo", "view", "--json", "nameWithOwner,description,url"]);
  } catch {
    return null;
  }
});

// ── IPC: PR Actions ──────────────────────────────────

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

// ── IPC: PR Editing ──────────────────────────────────

ipcMain.handle(
  "gh:edit-pr",
  async (
    _event,
    options: {
      repo: string;
      number: number;
      title?: string;
      body?: string;
      addLabels?: string[];
      removeLabels?: string[];
    },
  ) => {
    const { repo, number, title, body, addLabels, removeLabels } = options;
    const args = ["pr", "edit", String(number), "--repo", repo];
    if (title) args.push("--title", title);
    if (body) args.push("--body", body);
    if (addLabels && addLabels.length > 0) args.push("--add-label", addLabels.join(","));
    if (removeLabels && removeLabels.length > 0)
      args.push("--remove-label", removeLabels.join(","));
    await execGh(args);
    return { success: true };
  },
);

// ── IPC: Draft Toggle ────────────────────────────────

ipcMain.handle(
  "gh:toggle-draft",
  async (_event, options: { repo: string; number: number; isDraft: boolean }) => {
    const { repo, number, isDraft } = options;
    if (isDraft) {
      // Convert to draft using gh pr ready --undo
      await execGh(["pr", "ready", String(number), "--repo", repo, "--undo"]);
    } else {
      // Mark as ready using gh pr ready
      await execGh(["pr", "ready", String(number), "--repo", repo]);
    }
    return { success: true };
  },
);

// ── IPC: Reviews ─────────────────────────────────────

ipcMain.handle(
  "gh:submit-review",
  async (
    _event,
    options: {
      repo: string;
      number: number;
      event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
      body?: string;
    },
  ) => {
    const { repo, number, event, body } = options;
    const args = ["pr", "review", String(number), "--repo", repo];
    if (event === "APPROVE") args.push("--approve");
    else if (event === "REQUEST_CHANGES") args.push("--request-changes");
    else args.push("--comment");
    if (body) args.push("--body", body);
    await execGh(args);
    return { success: true };
  },
);

// ── IPC: Review Comments (line-level) ────────────────

ipcMain.handle(
  "gh:review-comment",
  async (
    _event,
    options: {
      repo: string;
      number: number;
      body: string;
      path: string;
      line: number;
      startLine?: number;
      side?: string;
    },
  ) => {
    const { repo, number, body, path, line, startLine, side } = options;
    // Use the REST API for review comments with line info
    const apiPath = `repos/${repo}/pulls/${number}/comments`;
    const payload: Record<string, unknown> = {
      body,
      path,
      line,
      commit_id: "HEAD",
    };
    if (startLine && startLine !== line) payload.start_line = startLine;
    if (side) payload.side = side;

    await execGh(["api", apiPath, "--method", "POST", "--input", "-", "--silent"]);
    return { success: true };
  },
);

// ── IPC: Issues ──────────────────────────────────────

const ISSUE_LIST_FIELDS =
  "number,title,url,state,author,body,labels,createdAt,updatedAt,closedAt,comments,assignees";

ipcMain.handle(
  "gh:list-issues",
  async (_event, options: { repo: string; state?: string; limit?: number }) => {
    const { repo, state = "open", limit = 200 } = options;
    const args = [
      "issue",
      "list",
      "--json",
      ISSUE_LIST_FIELDS,
      "--limit",
      String(limit),
      "--state",
      state,
      "--repo",
      repo,
    ];
    return execGh(args);
  },
);

ipcMain.handle("gh:get-issue", async (_event, options: { repo: string; number: number }) => {
  const { repo, number } = options;
  const args = ["issue", "view", String(number), "--json", ISSUE_LIST_FIELDS, "--repo", repo];
  return execGh(args);
});

ipcMain.handle(
  "gh:comment-issue",
  async (_event, options: { repo: string; number: number; body: string }) => {
    const { repo, number, body } = options;
    await execGh(["issue", "comment", String(number), "--repo", repo, "--body", body]);
    return { success: true };
  },
);

ipcMain.handle(
  "gh:close-issue",
  async (_event, options: { repo: string; number: number; comment?: string }) => {
    const { repo, number, comment } = options;
    if (comment) {
      await execGh(["issue", "comment", String(number), "--repo", repo, "--body", comment]);
    }
    await execGh(["issue", "close", String(number), "--repo", repo]);
    return { success: true };
  },
);

ipcMain.handle("gh:reopen-issue", async (_event, options: { repo: string; number: number }) => {
  const { repo, number } = options;
  await execGh(["issue", "reopen", String(number), "--repo", repo]);
  return { success: true };
});

ipcMain.handle(
  "gh:edit-issue",
  async (
    _event,
    options: {
      repo: string;
      number: number;
      title?: string;
      body?: string;
      addLabels?: string[];
      removeLabels?: string[];
    },
  ) => {
    const { repo, number, title, body, addLabels, removeLabels } = options;
    const args = ["issue", "edit", String(number), "--repo", repo];
    if (title) args.push("--title", title);
    if (body) args.push("--body", body);
    if (addLabels && addLabels.length > 0) args.push("--add-label", addLabels.join(","));
    if (removeLabels && removeLabels.length > 0)
      args.push("--remove-label", removeLabels.join(","));
    await execGh(args);
    return { success: true };
  },
);

// ── IPC: Repo Labels ─────────────────────────────────

ipcMain.handle("gh:repo-labels", async (_event, options: { repo: string }) => {
  const { repo } = options;
  return execGh(["api", `repos/${repo}/labels`, "--paginate", "--jq", ".[].name"]);
});

// ── IPC: Search Users (@mention) ─────────────────────

ipcMain.handle("gh:search-users", async (_event, options: { query: string }) => {
  const { query } = options;
  if (!query || query.length < 2) return [];
  try {
    const result = await execGh([
      "api",
      `search/users?q=${encodeURIComponent(query)}&per_page=8`,
      "--jq",
      ".items | map({login: .login, avatar_url: .avatar_url})",
    ]);
    return result;
  } catch {
    return [];
  }
});

// ── IPC: Shell ───────────────────────────────────────

ipcMain.handle("shell:open-external", async (_event, url: string) => {
  shell.openExternal(url);
});

// ── App Lifecycle ────────────────────────────────────

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

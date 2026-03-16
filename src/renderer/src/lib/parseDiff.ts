export type DiffLineType = "add" | "remove" | "context" | "header";

export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLine: number | null;
  newLine: number | null;
}

export interface DiffFile {
  path: string;
  oldPath?: string;
  lines: DiffLine[];
  additions: number;
  deletions: number;
}

/**
 * Parse a unified diff (patch format) into structured file diffs.
 */
export function parseDiff(raw: string): DiffFile[] {
  const files: DiffFile[] = [];
  const lines = raw.split("\n");
  let current: DiffFile | null = null;
  let oldLine = 0;
  let newLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // New file header: diff --git a/path b/path
    if (line.startsWith("diff --git ")) {
      const match = line.match(/diff --git a\/(.+?) b\/(.+)/);
      if (match) {
        current = {
          path: match[2],
          oldPath: match[1] !== match[2] ? match[1] : undefined,
          lines: [],
          additions: 0,
          deletions: 0,
        };
        files.push(current);
      }
      continue;
    }

    // Skip file metadata lines
    if (
      !current ||
      line.startsWith("index ") ||
      line.startsWith("--- ") ||
      line.startsWith("+++ ") ||
      line.startsWith("old mode") ||
      line.startsWith("new mode") ||
      line.startsWith("new file") ||
      line.startsWith("deleted file") ||
      line.startsWith("rename from") ||
      line.startsWith("rename to") ||
      line.startsWith("similarity index") ||
      line.startsWith("Binary files")
    ) {
      continue;
    }

    // Hunk header: @@ -oldStart,oldCount +newStart,newCount @@
    if (line.startsWith("@@")) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)/);
      if (match) {
        oldLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
        current.lines.push({
          type: "header",
          content: match[3]?.trim() || line,
          oldLine: null,
          newLine: null,
        });
      }
      continue;
    }

    // Diff content lines
    if (line.startsWith("+")) {
      current.lines.push({
        type: "add",
        content: line.slice(1),
        oldLine: null,
        newLine: newLine++,
      });
      current.additions++;
    } else if (line.startsWith("-")) {
      current.lines.push({
        type: "remove",
        content: line.slice(1),
        oldLine: oldLine++,
        newLine: null,
      });
      current.deletions++;
    } else if (line.startsWith(" ") || line === "") {
      // Context line (or empty trailing line)
      if (current.lines.length > 0 || line.startsWith(" ")) {
        current.lines.push({
          type: "context",
          content: line.startsWith(" ") ? line.slice(1) : line,
          oldLine: oldLine++,
          newLine: newLine++,
        });
      }
    }
  }

  return files;
}

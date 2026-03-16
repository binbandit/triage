export type DiffLineType = "add" | "remove" | "context" | "header";

export interface DiffSegment {
  text: string;
  highlight: boolean;
}

export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLine: number | null;
  newLine: number | null;
  segments?: DiffSegment[];
}

export interface DiffFile {
  path: string;
  oldPath?: string;
  lines: DiffLine[];
  additions: number;
  deletions: number;
}

/**
 * Compute word-level diff between two lines.
 * Uses common prefix/suffix to find the changed middle portion.
 */
function computeWordDiff(
  oldContent: string,
  newContent: string,
): { oldSegments: DiffSegment[]; newSegments: DiffSegment[] } {
  let prefixLen = 0;
  const maxPrefix = Math.min(oldContent.length, newContent.length);
  while (prefixLen < maxPrefix && oldContent[prefixLen] === newContent[prefixLen]) {
    prefixLen++;
  }

  let suffixLen = 0;
  const maxSuffix = Math.min(oldContent.length - prefixLen, newContent.length - prefixLen);
  while (
    suffixLen < maxSuffix &&
    oldContent[oldContent.length - 1 - suffixLen] === newContent[newContent.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  const oldMid = oldContent.slice(prefixLen, oldContent.length - suffixLen);
  const newMid = newContent.slice(prefixLen, newContent.length - suffixLen);

  const prefix = oldContent.slice(0, prefixLen);
  const oldSuffix = oldContent.slice(oldContent.length - suffixLen);
  const newSuffix = newContent.slice(newContent.length - suffixLen);

  const makeSegments = (mid: string, suffix: string): DiffSegment[] => {
    const segs: DiffSegment[] = [];
    if (prefix) segs.push({ text: prefix, highlight: false });
    if (mid) segs.push({ text: mid, highlight: true });
    if (suffix) segs.push({ text: suffix, highlight: false });
    return segs.length > 0 ? segs : [{ text: "", highlight: false }];
  };

  return {
    oldSegments: makeSegments(oldMid, oldSuffix),
    newSegments: makeSegments(newMid, newSuffix),
  };
}

/**
 * Parse a per-file patch string (as returned by GitHub API) into DiffLine[].
 * Includes word-level diff computation for paired add/remove lines.
 */
export function parsePatch(patch: string): DiffLine[] {
  if (!patch) return [];

  const rawLines = patch.split("\n");
  const lines: DiffLine[] = [];
  let oldLine = 0;
  let newLine = 0;

  for (const raw of rawLines) {
    if (raw.startsWith("@@")) {
      const match = raw.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)/);
      if (match) {
        oldLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
        lines.push({
          type: "header",
          content: match[3]?.trim() || raw,
          oldLine: null,
          newLine: null,
        });
      }
      continue;
    }

    if (raw.startsWith("+")) {
      lines.push({ type: "add", content: raw.slice(1), oldLine: null, newLine: newLine++ });
    } else if (raw.startsWith("-")) {
      lines.push({ type: "remove", content: raw.slice(1), oldLine: oldLine++, newLine: null });
    } else if (raw.startsWith(" ") || raw === "") {
      if (lines.length > 0 || raw.startsWith(" ")) {
        lines.push({
          type: "context",
          content: raw.startsWith(" ") ? raw.slice(1) : raw,
          oldLine: oldLine++,
          newLine: newLine++,
        });
      }
    }
  }

  // Second pass: compute word-level diffs for paired remove/add blocks
  let i = 0;
  while (i < lines.length) {
    if (lines[i].type === "remove") {
      const removes: number[] = [];
      while (i + removes.length < lines.length && lines[i + removes.length].type === "remove") {
        removes.push(i + removes.length);
      }
      const adds: number[] = [];
      let j = i + removes.length;
      while (j + adds.length < lines.length && lines[j + adds.length].type === "add") {
        adds.push(j + adds.length);
      }

      const pairCount = Math.min(removes.length, adds.length);
      for (let k = 0; k < pairCount; k++) {
        const { oldSegments, newSegments } = computeWordDiff(
          lines[removes[k]].content,
          lines[adds[k]].content,
        );
        lines[removes[k]].segments = oldSegments;
        lines[adds[k]].segments = newSegments;
      }

      i = j + adds.length;
    } else {
      i++;
    }
  }

  return lines;
}

/**
 * Parse a unified diff (patch format) into structured file diffs.
 * Used as fallback when per-file patches are not available.
 */
export function parseDiff(raw: string): DiffFile[] {
  const files: DiffFile[] = [];
  const chunks = raw.split(/^diff --git /m);

  for (const chunk of chunks) {
    if (!chunk.trim()) continue;
    const match = chunk.match(/a\/(.+?) b\/(.+)/);
    if (!match) continue;

    const file: DiffFile = {
      path: match[2],
      oldPath: match[1] !== match[2] ? match[1] : undefined,
      lines: [],
      additions: 0,
      deletions: 0,
    };

    // Find the patch content (after the --- +++ lines)
    const patchStart = chunk.indexOf("@@");
    if (patchStart >= 0) {
      const patchContent = chunk.slice(patchStart);
      file.lines = parsePatch(patchContent);
      file.additions = file.lines.filter((l) => l.type === "add").length;
      file.deletions = file.lines.filter((l) => l.type === "remove").length;
    }

    files.push(file);
  }

  return files;
}

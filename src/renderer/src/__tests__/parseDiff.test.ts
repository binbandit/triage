import { describe, it, expect } from "vitest";
import { parseDiff } from "../lib/parseDiff";

const SIMPLE_DIFF = `diff --git a/src/index.ts b/src/index.ts
index abc1234..def5678 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,3 +1,4 @@
 import { foo } from "bar";
+import { baz } from "qux";
 
 export function main() {
@@ -10,4 +11,3 @@
   return result;
-  console.log("debug");
 }
`;

describe("parseDiff", () => {
  it("parses a simple diff into files", () => {
    const files = parseDiff(SIMPLE_DIFF);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("src/index.ts");
  });

  it("counts additions and deletions", () => {
    const files = parseDiff(SIMPLE_DIFF);
    expect(files[0].additions).toBe(1);
    expect(files[0].deletions).toBe(1);
  });

  it("parses context lines with correct line numbers", () => {
    const files = parseDiff(SIMPLE_DIFF);
    const contextLines = files[0].lines.filter((l) => l.type === "context");
    expect(contextLines.length).toBeGreaterThan(0);
    expect(contextLines[0].oldLine).toBe(1);
    expect(contextLines[0].newLine).toBe(1);
  });

  it("parses added lines", () => {
    const files = parseDiff(SIMPLE_DIFF);
    const addLines = files[0].lines.filter((l) => l.type === "add");
    expect(addLines).toHaveLength(1);
    expect(addLines[0].content).toContain("baz");
    expect(addLines[0].newLine).toBe(2);
    expect(addLines[0].oldLine).toBeNull();
  });

  it("parses removed lines", () => {
    const files = parseDiff(SIMPLE_DIFF);
    const removeLines = files[0].lines.filter((l) => l.type === "remove");
    expect(removeLines).toHaveLength(1);
    expect(removeLines[0].content).toContain("console.log");
    expect(removeLines[0].oldLine).toBe(11);
    expect(removeLines[0].newLine).toBeNull();
  });

  it("parses hunk headers", () => {
    const files = parseDiff(SIMPLE_DIFF);
    const headers = files[0].lines.filter((l) => l.type === "header");
    expect(headers).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(parseDiff("")).toEqual([]);
  });

  it("returns empty array for non-diff input", () => {
    expect(parseDiff("hello world")).toEqual([]);
  });

  it("handles multiple files", () => {
    const multiDiff = `diff --git a/file1.ts b/file1.ts
--- a/file1.ts
+++ b/file1.ts
@@ -1,1 +1,2 @@
 line1
+line2
diff --git a/file2.ts b/file2.ts
--- a/file2.ts
+++ b/file2.ts
@@ -1,2 +1,1 @@
 line1
-line2
`;
    const files = parseDiff(multiDiff);
    expect(files).toHaveLength(2);
    expect(files[0].path).toBe("file1.ts");
    expect(files[1].path).toBe("file2.ts");
    expect(files[0].additions).toBe(1);
    expect(files[1].deletions).toBe(1);
  });

  it("handles renamed files", () => {
    const renameDiff = `diff --git a/old.ts b/new.ts
rename from old.ts
rename to new.ts
--- a/old.ts
+++ b/new.ts
@@ -1,1 +1,1 @@
-old content
+new content
`;
    const files = parseDiff(renameDiff);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("new.ts");
    expect(files[0].oldPath).toBe("old.ts");
  });
});

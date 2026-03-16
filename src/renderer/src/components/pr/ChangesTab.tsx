import React, { useState, useCallback, useRef, useMemo } from "react";
import { FilePlus2, FileX2, FileEdit, ChevronRight, Plus, Loader2 } from "lucide-react";
import type { PRFile } from "../../types";
import type { DiffLine, DiffSegment } from "../../lib/parseDiff";
import { parsePatch } from "../../lib/parseDiff";
import { cn } from "../../lib/cn";
import { MentionInput } from "./MentionInput";

interface ChangesTabProps {
  files: PRFile[];
  repo: string;
  prNumber: number;
  headSha?: string;
}

function FileIcon({ changeType }: { changeType?: string }) {
  switch (changeType) {
    case "ADDED":
      return <FilePlus2 className="size-3 text-[var(--color-green)]" />;
    case "DELETED":
      return <FileX2 className="size-3 text-[var(--color-red)]" />;
    default:
      return <FileEdit className="size-3 text-[var(--color-amber)]" />;
  }
}

function fileName(path: string): string {
  return path.split("/").pop() || path;
}

function fileDir(path: string): string {
  const parts = path.split("/");
  parts.pop();
  return parts.join("/");
}

/* ── Segment renderer (word-level diff highlights) ── */

function SegmentedContent({ segments, type }: { segments?: DiffSegment[]; type: string }) {
  if (!segments) return null;
  return (
    <>
      {segments.map((seg, i) => (
        <span
          key={`${i}-${seg.text.slice(0, 8)}`}
          className={
            seg.highlight
              ? type === "add"
                ? "bg-[var(--color-green)]/20 rounded-sm"
                : "bg-[var(--color-red)]/20 rounded-sm"
              : ""
          }
        >
          {seg.text}
        </span>
      ))}
    </>
  );
}

/* ── Inline comment form ──────────────────────────── */

function InlineCommentForm({
  onSubmit,
  onCancel,
  startLineIdx,
  endLineIdx,
  lines,
}: {
  onSubmit: (body: string) => Promise<void>;
  onCancel: () => void;
  startLineIdx: number;
  endLineIdx: number;
  lines: DiffLine[];
}) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isMultiLine = startLineIdx !== endLineIdx;
  const startLineNum = lines[startLineIdx]?.newLine ?? lines[startLineIdx]?.oldLine;
  const endLineNum = lines[endLineIdx]?.newLine ?? lines[endLineIdx]?.oldLine;

  const handleSubmit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    await onSubmit(body.trim());
    setSubmitting(false);
  };

  const handleInsertSuggestion = () => {
    const selectedContent = lines
      .slice(startLineIdx, endLineIdx + 1)
      .filter((l) => l.type !== "header")
      .map((l) => l.content)
      .join("\n");
    const suggestion = `\`\`\`suggestion\n${selectedContent}\n\`\`\``;
    setBody(body ? `${body}\n${suggestion}` : suggestion);
  };

  return (
    <tr>
      <td colSpan={4} className="p-0">
        <div className="mx-3 my-1.5 max-w-xl rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-raised)] overflow-hidden shadow-sm">
          {isMultiLine && (
            <div className="px-3 py-1 bg-[var(--color-bg-inset)] border-b border-[var(--color-border)]">
              <span className="text-[10px] font-mono text-[var(--color-fg-dim)]">
                Lines {startLineNum}&ndash;{endLineNum}
              </span>
            </div>
          )}

          <MentionInput
            value={body}
            onChange={setBody}
            placeholder="Leave a comment..."
            rows={3}
            onSubmit={handleSubmit}
            autoFocus
            className="border-0 rounded-none focus-within:border-0"
          />

          <div className="flex items-center gap-1 px-2 py-1.5 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={handleInsertSuggestion}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-overlay)] transition-colors"
              title="Suggest a code change"
            >
              Suggest
            </button>

            <div className="flex-1" />

            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-2 py-1 text-[10px] text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] rounded-md cursor-pointer transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!body.trim() || submitting}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium cursor-pointer transition-all",
                body.trim()
                  ? "bg-[var(--color-fg)] text-[var(--color-bg)] hover:opacity-90"
                  : "bg-[var(--color-bg-overlay)] text-[var(--color-fg-muted)]",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}
            >
              {submitting ? <Loader2 className="size-3 animate-spin" /> : "Comment"}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ── Diff line row ────────────────────────────────── */

function DiffLineRow({
  line,
  lineIndex,
  isSelected,
  onStartSelect,
  onOpenComment,
  onHoverLine,
}: {
  line: DiffLine;
  lineIndex: number;
  isSelected: boolean;
  onStartSelect: (idx: number) => void;
  onOpenComment: (idx: number, shiftKey: boolean) => void;
  onHoverLine: (idx: number) => void;
}) {
  const hasSegments = line.segments && line.segments.length > 0;
  const canComment = line.type !== "header";

  return (
    <tr
      className={cn(
        "leading-5 group/line hover:brightness-95 dark:hover:brightness-110 transition-[filter] duration-75",
        line.type === "add" && "bg-[var(--color-green)]/[0.06]",
        line.type === "remove" && "bg-[var(--color-red)]/[0.06]",
        line.type === "header" && "bg-[var(--color-blue)]/[0.04]",
        isSelected && "!bg-[var(--color-blue)]/10",
      )}
      onMouseEnter={() => onHoverLine(lineIndex)}
    >
      {/* Plus button gutter */}
      <td className="w-5 min-w-5 text-center select-none relative">
        {canComment && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onStartSelect(lineIndex);
            }}
            onClick={(e) => onOpenComment(lineIndex, e.shiftKey)}
            className="absolute left-0 top-1/2 -translate-y-1/2 size-4 flex items-center justify-center opacity-0 group-hover/line:opacity-100 cursor-pointer text-[var(--color-fg-muted)] hover:text-[var(--color-blue)] transition-opacity"
            title="Add review comment (shift+click for range)"
          >
            <Plus className="size-3" />
          </button>
        )}
      </td>
      {/* Old line number */}
      <td
        className={cn(
          "select-none w-8 min-w-8 text-right px-1 text-[11px] font-mono tabular-nums",
          line.type === "add" && "text-[var(--color-green)]/40",
          line.type === "remove" && "text-[var(--color-red)]/40",
          line.type === "context" && "text-[var(--color-fg-dim)]",
        )}
      >
        {line.type !== "header" && line.type !== "add" ? line.oldLine : ""}
      </td>
      {/* New line number */}
      <td
        className={cn(
          "select-none w-8 min-w-8 text-right px-1 text-[11px] font-mono tabular-nums",
          line.type === "add" && "text-[var(--color-green)]/40",
          line.type === "remove" && "text-[var(--color-red)]/40",
          line.type === "context" && "text-[var(--color-fg-dim)]",
        )}
      >
        {line.type !== "header" && line.type !== "remove" ? line.newLine : ""}
      </td>
      {/* Content */}
      <td className="px-2 text-[12px] font-mono whitespace-pre-wrap break-all text-[var(--color-fg)]">
        {line.type === "header" ? (
          <span className="text-[var(--color-blue)]/60 text-[11px]">{line.content}</span>
        ) : hasSegments ? (
          <SegmentedContent segments={line.segments} type={line.type} />
        ) : (
          line.content
        )}
      </td>
    </tr>
  );
}

/* ── Single file diff ─────────────────────────────── */

function SingleFileDiff({
  file,
  onActivate,
  repo,
  prNumber,
  headSha,
}: {
  file: PRFile;
  onActivate: () => void;
  repo: string;
  prNumber: number;
  headSha?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Comment range: the committed selection the user wants to comment on
  const [commentRange, setCommentRange] = useState<{
    startIdx: number;
    endIdx: number;
    side: "LEFT" | "RIGHT";
  } | null>(null);

  // Drag selection state (transient, during mousedown-mousemove-mouseup)
  const [selectingFrom, setSelectingFrom] = useState<{
    idx: number;
    side: "LEFT" | "RIGHT";
  } | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const selectingFromRef = useRef<{ idx: number; side: "LEFT" | "RIGHT" } | null>(null);
  const hoverIdxRef = useRef<number | null>(null);

  const lines = useMemo(() => (file.patch ? parsePatch(file.patch) : []), [file.patch]);

  // Compute which side a line belongs to
  const getSide = useCallback(
    (idx: number): "LEFT" | "RIGHT" => {
      const line = lines[idx];
      return line?.type === "remove" ? "LEFT" : "RIGHT";
    },
    [lines],
  );

  // Start a potential drag selection
  const handleStartSelect = useCallback(
    (idx: number) => {
      const side = getSide(idx);
      selectingFromRef.current = { idx, side };
      hoverIdxRef.current = idx;
      setSelectingFrom({ idx, side });
      setHoverIdx(idx);

      const handleMouseUp = () => {
        document.removeEventListener("mouseup", handleMouseUp);
        const from = selectingFromRef.current;
        const hover = hoverIdxRef.current;
        if (from && hover !== null) {
          setCommentRange({
            startIdx: Math.min(from.idx, hover),
            endIdx: Math.max(from.idx, hover),
            side: from.side,
          });
        }
        selectingFromRef.current = null;
        hoverIdxRef.current = null;
        setSelectingFrom(null);
        setHoverIdx(null);
      };
      document.addEventListener("mouseup", handleMouseUp);
    },
    [getSide],
  );

  // Click handler: single click for single line, shift+click to extend
  const handleOpenComment = useCallback(
    (idx: number, shiftKey: boolean) => {
      if (selectingFromRef.current) return; // drag handled by mouseup

      if (shiftKey && commentRange) {
        const allIdxs = [commentRange.startIdx, commentRange.endIdx, idx];
        setCommentRange({
          startIdx: Math.min(...allIdxs),
          endIdx: Math.max(...allIdxs),
          side: commentRange.side,
        });
      } else {
        setCommentRange({ startIdx: idx, endIdx: idx, side: getSide(idx) });
      }
    },
    [commentRange, getSide],
  );

  // Track hover during drag
  const handleHoverLine = useCallback((idx: number) => {
    if (selectingFromRef.current) {
      hoverIdxRef.current = idx;
      setHoverIdx(idx);
    }
  }, []);

  // Compute visual selection range
  const selectionRange = useMemo(() => {
    if (selectingFrom && hoverIdx !== null) {
      return {
        start: Math.min(selectingFrom.idx, hoverIdx),
        end: Math.max(selectingFrom.idx, hoverIdx),
      };
    }
    if (commentRange) {
      return { start: commentRange.startIdx, end: commentRange.endIdx };
    }
    return null;
  }, [selectingFrom, hoverIdx, commentRange]);

  const closeComment = useCallback(() => {
    setCommentRange(null);
    setSelectingFrom(null);
    setHoverIdx(null);
  }, []);

  const handleCommentSubmit = async (body: string) => {
    if (!commentRange) return;
    const endLine = lines[commentRange.endIdx];
    const startLine = lines[commentRange.startIdx];
    const lineNum = endLine.newLine ?? endLine.oldLine ?? 0;
    const startLineNum = startLine.newLine ?? startLine.oldLine ?? undefined;

    if (!headSha) {
      closeComment();
      return;
    }

    try {
      await window.api.reviewComment({
        repo,
        number: prNumber,
        body,
        path: file.path,
        line: lineNum,
        startLine: startLineNum !== lineNum ? startLineNum : undefined,
        side: commentRange.side,
        commitSha: headSha,
      });
    } catch {
      // Silent
    }
    closeComment();
  };

  return (
    <section
      id={`file-${file.path}`}
      className="border-b border-[var(--color-border)]"
      aria-label={file.path}
    >
      <button
        type="button"
        onClick={() => {
          setCollapsed(!collapsed);
          onActivate();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-inset)] hover:bg-[var(--color-bg-overlay)] cursor-pointer transition-colors sticky top-0 z-10 border-b border-[var(--color-border)]"
      >
        <ChevronRight
          className={cn(
            "size-3 text-[var(--color-fg-dim)] transition-transform duration-100",
            !collapsed && "rotate-90",
          )}
        />
        <FileIcon changeType={file.changeType} />
        <span className="text-[11px] font-mono text-[var(--color-fg-dim)] truncate">
          {fileDir(file.path) && <span>{fileDir(file.path)}/</span>}
          <span className="text-[var(--color-fg-secondary)] font-medium">
            {fileName(file.path)}
          </span>
        </span>
        <span className="ml-auto text-[10px] font-mono tabular-nums shrink-0">
          <span className="text-[var(--color-green)]">+{file.additions}</span>{" "}
          <span className="text-[var(--color-red)]">-{file.deletions}</span>
        </span>
      </button>

      {!collapsed && lines.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <tbody>
              {lines.map((line, i) => {
                const isSelected =
                  selectionRange !== null && i >= selectionRange.start && i <= selectionRange.end;
                const showCommentForm = commentRange !== null && i === commentRange.endIdx;

                return (
                  <React.Fragment
                    key={`${line.type}-${line.oldLine ?? "x"}-${line.newLine ?? "x"}-${i}`}
                  >
                    <DiffLineRow
                      line={line}
                      lineIndex={i}
                      isSelected={isSelected}
                      onStartSelect={handleStartSelect}
                      onOpenComment={handleOpenComment}
                      onHoverLine={handleHoverLine}
                    />
                    {showCommentForm && (
                      <InlineCommentForm
                        onSubmit={handleCommentSubmit}
                        onCancel={closeComment}
                        startLineIdx={commentRange.startIdx}
                        endLineIdx={commentRange.endIdx}
                        lines={lines}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!collapsed && lines.length === 0 && (
        <div className="px-4 py-6 text-center text-[11px] text-[var(--color-fg-dim)]">
          Binary file or no changes to display.
        </div>
      )}
    </section>
  );
}

/* ── Changes tab (main) ───────────────────────────── */

export function ChangesTab({ files, repo, prNumber, headSha }: ChangesTabProps) {
  const [activeFile, setActiveFile] = useState<string | null>(null);

  const scrollToFile = (path: string) => {
    setActiveFile(path);
    const el = document.getElementById(`file-${path}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[12px] text-[var(--color-fg-dim)]">
        No changes to display.
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="shrink-0 w-56 border-r border-[var(--color-border)] overflow-y-auto bg-[var(--color-bg)]">
        <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[var(--color-fg-dim)]">
          Files ({files.length})
        </div>
        {files.map((file) => (
          <button
            key={file.path}
            type="button"
            onClick={() => scrollToFile(file.path)}
            className={cn(
              "w-full flex items-center gap-1.5 px-3 py-1.5 text-left cursor-pointer transition-colors text-[11px]",
              activeFile === file.path
                ? "bg-[var(--color-bg-overlay)] text-[var(--color-fg)]"
                : "text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-raised)]/50",
            )}
            title={file.path}
          >
            <FileIcon changeType={file.changeType} />
            <span className="truncate font-mono">{fileName(file.path)}</span>
            <span className="ml-auto shrink-0 text-[9px] font-mono tabular-nums">
              <span className="text-[var(--color-green)]">+{file.additions}</span>{" "}
              <span className="text-[var(--color-red)]">-{file.deletions}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {files.map((file) => (
          <SingleFileDiff
            key={file.path}
            file={file}
            onActivate={() => setActiveFile(file.path)}
            repo={repo}
            prNumber={prNumber}
            headSha={headSha}
          />
        ))}
      </div>
    </div>
  );
}

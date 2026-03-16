import { useState, useCallback, useRef, useMemo } from "react";
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
}: {
  onSubmit: (body: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    await onSubmit(body.trim());
    setSubmitting(false);
  };

  return (
    <tr>
      <td colSpan={4} className="p-0">
        <div className="mx-4 my-2 rounded-lg border border-[var(--color-blue)]/20 bg-[var(--color-bg-raised)] p-3 space-y-2">
          <MentionInput
            value={body}
            onChange={setBody}
            placeholder="Write a review comment... (Cmd+Enter to submit)"
            rows={2}
            onSubmit={handleSubmit}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-fg-muted)] cursor-pointer hover:bg-[var(--color-bg-overlay)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!body.trim() || submitting}
              className="rounded-md bg-[var(--color-blue)] px-2.5 py-1 text-[11px] font-medium text-white cursor-pointer hover:bg-[var(--color-blue)]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? <Loader2 className="size-3 animate-spin" /> : "Add comment"}
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
  onGutterMouseDown,
  onGutterMouseEnter,
}: {
  line: DiffLine;
  lineIndex: number;
  isSelected: boolean;
  onGutterMouseDown: (idx: number) => void;
  onGutterMouseEnter: (idx: number) => void;
}) {
  const hasSegments = line.segments && line.segments.length > 0;

  return (
    <tr
      className={cn(
        "leading-5 group/line",
        line.type === "add" && "bg-[var(--color-green)]/[0.06]",
        line.type === "remove" && "bg-[var(--color-red)]/[0.06]",
        line.type === "header" && "bg-[var(--color-blue)]/[0.04]",
        isSelected && "!bg-[var(--color-blue)]/10",
      )}
    >
      {/* Plus button gutter */}
      <td className="w-5 min-w-5 text-center select-none relative">
        {line.type !== "header" && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onGutterMouseDown(lineIndex);
            }}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/line:opacity-100 cursor-pointer text-[var(--color-blue)] hover:bg-[var(--color-blue)]/10 transition-opacity"
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
        onMouseEnter={() => onGutterMouseEnter(lineIndex)}
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
}: {
  file: PRFile;
  onActivate: () => void;
  repo: string;
  prNumber: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectStart, setSelectStart] = useState<number | null>(null);
  const [selectEnd, setSelectEnd] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [commentRange, setCommentRange] = useState<{ start: number; end: number } | null>(null);
  const selectStartRef = useRef<number | null>(null);
  const hoverRef = useRef<number | null>(null);

  const lines = useMemo(() => (file.patch ? parsePatch(file.patch) : []), [file.patch]);

  const handleGutterMouseDown = useCallback((idx: number) => {
    selectStartRef.current = idx;
    hoverRef.current = idx;
    setSelectStart(idx);
    setSelectEnd(idx);
    setIsSelecting(true);

    const handleMouseUp = () => {
      const start = selectStartRef.current;
      const end = hoverRef.current;
      if (start !== null && end !== null) {
        setCommentRange({ start: Math.min(start, end), end: Math.max(start, end) });
      }
      setIsSelecting(false);
      selectStartRef.current = null;
      hoverRef.current = null;
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  const handleGutterMouseEnter = useCallback(
    (idx: number) => {
      if (!isSelecting) return;
      hoverRef.current = idx;
      setSelectEnd(idx);
    },
    [isSelecting],
  );

  const selMin =
    selectStart !== null && selectEnd !== null ? Math.min(selectStart, selectEnd) : null;
  const selMax =
    selectStart !== null && selectEnd !== null ? Math.max(selectStart, selectEnd) : null;

  const effectiveSelMin = commentRange ? commentRange.start : selMin;
  const effectiveSelMax = commentRange ? commentRange.end : selMax;

  const handleCommentSubmit = async (body: string) => {
    if (!commentRange) return;
    const endLine = lines[commentRange.end];
    const startLine = lines[commentRange.start];
    const lineNum = endLine.newLine ?? endLine.oldLine ?? 0;
    const startLineNum = startLine.newLine ?? startLine.oldLine ?? undefined;
    const side = endLine.type === "remove" ? "LEFT" : "RIGHT";

    try {
      await window.api.reviewComment({
        repo,
        number: prNumber,
        body,
        path: file.path,
        line: lineNum,
        startLine: startLineNum !== lineNum ? startLineNum : undefined,
        side,
      });
    } catch {
      // Silent
    }
    setCommentRange(null);
    setSelectStart(null);
    setSelectEnd(null);
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
              {lines.map((line, i) => (
                <DiffLineRow
                  key={`${line.type}-${line.oldLine ?? "x"}-${line.newLine ?? "x"}-${i}`}
                  line={line}
                  lineIndex={i}
                  isSelected={
                    effectiveSelMin !== null &&
                    effectiveSelMax !== null &&
                    i >= effectiveSelMin &&
                    i <= effectiveSelMax
                  }
                  onGutterMouseDown={handleGutterMouseDown}
                  onGutterMouseEnter={handleGutterMouseEnter}
                />
              ))}
              {commentRange && (
                <InlineCommentForm
                  onSubmit={handleCommentSubmit}
                  onCancel={() => {
                    setCommentRange(null);
                    setSelectStart(null);
                    setSelectEnd(null);
                  }}
                />
              )}
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

export function ChangesTab({ files, repo, prNumber }: ChangesTabProps) {
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
          />
        ))}
      </div>
    </div>
  );
}

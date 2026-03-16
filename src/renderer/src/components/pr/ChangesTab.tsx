import { useState, useCallback } from "react";
import { FilePlus2, FileX2, FileEdit, ChevronRight } from "lucide-react";
import type { DiffFile, DiffLine } from "../../lib/parseDiff";
import { cn } from "../../lib/cn";

interface ChangesTabProps {
  files: DiffFile[];
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

/* ── Line gutter ──────────────────────────────────── */

function LineGutter({
  line,
  isSelecting,
  isSelected,
  onMouseDown,
  onMouseEnter,
}: {
  line: DiffLine;
  isSelecting: boolean;
  isSelected: boolean;
  onMouseDown: () => void;
  onMouseEnter: () => void;
}) {
  return (
    <td
      className={cn(
        "select-none w-8 min-w-8 text-right px-1 text-[11px] font-mono tabular-nums cursor-pointer transition-colors",
        line.type === "add" && "text-[var(--color-green)]/50 bg-[var(--color-green)]/4",
        line.type === "remove" && "text-[var(--color-red)]/50 bg-[var(--color-red)]/4",
        line.type === "context" && "text-[var(--color-fg-dim)]",
        isSelected && "bg-[var(--color-blue)]/10",
      )}
      onMouseDown={onMouseDown}
      onMouseEnter={isSelecting ? onMouseEnter : undefined}
    >
      {line.type === "header" ? "" : line.type === "remove" ? line.oldLine : line.newLine}
    </td>
  );
}

/* ── Diff line ────────────────────────────────────── */

function DiffLineRow({
  line,
  lineIndex,
  isSelecting,
  isSelected,
  onGutterMouseDown,
  onGutterMouseEnter,
}: {
  line: DiffLine;
  lineIndex: number;
  isSelecting: boolean;
  isSelected: boolean;
  onGutterMouseDown: (idx: number) => void;
  onGutterMouseEnter: (idx: number) => void;
}) {
  return (
    <tr
      className={cn(
        "leading-5",
        line.type === "add" && "bg-[var(--color-green)]/[0.06]",
        line.type === "remove" && "bg-[var(--color-red)]/[0.06]",
        line.type === "header" && "bg-[var(--color-blue)]/[0.04]",
        isSelected && "!bg-[var(--color-blue)]/10",
      )}
    >
      {/* Old line number */}
      <LineGutter
        line={line}
        isSelecting={isSelecting}
        isSelected={isSelected}
        onMouseDown={() => onGutterMouseDown(lineIndex)}
        onMouseEnter={() => onGutterMouseEnter(lineIndex)}
      />
      {/* New line number */}
      <td
        className={cn(
          "select-none w-8 min-w-8 text-right px-1 text-[11px] font-mono tabular-nums",
          line.type === "add" && "text-[var(--color-green)]/50 bg-[var(--color-green)]/4",
          line.type === "remove" && "text-[var(--color-red)]/50 bg-[var(--color-red)]/4",
          line.type === "context" && "text-[var(--color-fg-dim)]",
          isSelected && "bg-[var(--color-blue)]/10",
        )}
      >
        {line.type === "header"
          ? ""
          : line.type === "add"
            ? line.newLine
            : line.type === "remove"
              ? ""
              : line.newLine}
      </td>
      {/* Marker */}
      <td
        className={cn(
          "select-none w-4 min-w-4 text-center text-[11px] font-mono",
          line.type === "add" && "text-[var(--color-green)]",
          line.type === "remove" && "text-[var(--color-red)]",
          line.type === "context" && "text-transparent",
          line.type === "header" && "text-[var(--color-blue)]/60",
        )}
      >
        {line.type === "add"
          ? "+"
          : line.type === "remove"
            ? "-"
            : line.type === "header"
              ? "@@"
              : " "}
      </td>
      {/* Content */}
      <td className="px-2 text-[12px] font-mono whitespace-pre-wrap break-all text-[var(--color-fg)]">
        {line.type === "header" ? (
          <span className="text-[var(--color-blue)]/60 text-[11px]">{line.content}</span>
        ) : (
          line.content
        )}
      </td>
    </tr>
  );
}

/* ── File diff block ──────────────────────────────── */

function FileDiff({ file, onActivate }: { file: DiffFile; onActivate: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectStart, setSelectStart] = useState<number | null>(null);
  const [selectEnd, setSelectEnd] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleGutterMouseDown = useCallback((idx: number) => {
    setSelectStart(idx);
    setSelectEnd(idx);
    setIsSelecting(true);
  }, []);

  const handleGutterMouseEnter = useCallback((idx: number) => {
    setSelectEnd(idx);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  const selMin =
    selectStart !== null && selectEnd !== null ? Math.min(selectStart, selectEnd) : null;
  const selMax =
    selectStart !== null && selectEnd !== null ? Math.max(selectStart, selectEnd) : null;

  return (
    <section
      id={`file-${file.path}`}
      className="border-b border-[var(--color-border)]"
      onMouseUp={handleMouseUp}
      aria-label={file.path}
    >
      {/* File header */}
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
        <FileIcon changeType={file.oldPath ? "RENAMED" : undefined} />
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

      {/* Diff table */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <tbody>
              {file.lines.map((line, i) => (
                <DiffLineRow
                  key={`${line.type}-${line.oldLine ?? "x"}-${line.newLine ?? "x"}-${i}`}
                  line={line}
                  lineIndex={i}
                  isSelecting={isSelecting}
                  isSelected={selMin !== null && selMax !== null && i >= selMin && i <= selMax}
                  onGutterMouseDown={handleGutterMouseDown}
                  onGutterMouseEnter={handleGutterMouseEnter}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ── Changes tab (main) ───────────────────────────── */

export function ChangesTab({ files }: ChangesTabProps) {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [sidebarOpen] = useState(true);

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
      {/* File sidebar */}
      {sidebarOpen && (
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
              <FileIcon />
              <span className="truncate font-mono">{fileName(file.path)}</span>
              <span className="ml-auto shrink-0 text-[9px] font-mono tabular-nums">
                <span className="text-[var(--color-green)]">+{file.additions}</span>{" "}
                <span className="text-[var(--color-red)]">-{file.deletions}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Diff content */}
      <div className="flex-1 overflow-y-auto">
        {files.map((file) => (
          <FileDiff key={file.path} file={file} onActivate={() => setActiveFile(file.path)} />
        ))}
      </div>
    </div>
  );
}

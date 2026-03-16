import { useRef, useCallback } from "react";
import { GitPullRequest, GitMerge, XCircle, FileEdit, CircleDot, CircleCheck } from "lucide-react";
import type { PullRequest, Issue } from "../../types";
import type { CanvasNode } from "../../stores/canvasStore";
import { useCanvasStore } from "../../stores/canvasStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { usePRDetailStore } from "../../stores/prDetailStore";
import { useIssueDetailStore } from "../../stores/issueDetailStore";
import { LabelBadge } from "../LabelBadge";
import { cn } from "../../lib/cn";

interface CanvasCardProps {
  node: CanvasNode;
  data: PullRequest | Issue | null;
  zoom: number;
  highlighted: boolean;
  repo: string;
}

function PRIcon({ state, isDraft }: { state: string; isDraft: boolean }) {
  if (isDraft) return <FileEdit className="size-3 text-[var(--color-fg-dim)]" />;
  if (state === "MERGED") return <GitMerge className="size-3 text-[var(--color-purple)]" />;
  if (state === "CLOSED") return <XCircle className="size-3 text-[var(--color-red)]" />;
  return <GitPullRequest className="size-3 text-[var(--color-green)]" />;
}

function IssueIcon({ state }: { state: string }) {
  if (state === "CLOSED") return <CircleCheck className="size-3 text-[var(--color-purple)]" />;
  return <CircleDot className="size-3 text-[var(--color-green)]" />;
}

export function CanvasCard({ node, data, zoom, highlighted, repo }: CanvasCardProps) {
  const moveNode = useCanvasStore((s) => s.moveNode);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const inlinePRView = useSettingsStore((s) => s.inlinePRView);
  const openPR = usePRDetailStore((s) => s.openPR);
  const openIssue = useIssueDetailStore((s) => s.openIssue);
  const isSelected = selectedNodeId === node.id;
  const dragRef = useRef<{
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
    moved: boolean;
  } | null>(null);

  const handleOpen = useCallback(() => {
    if (!data) return;
    if (inlinePRView && repo) {
      if (node.type === "pr") openPR(repo, node.number);
      else openIssue(repo, node.number);
    } else if (data.url) {
      window.api.openExternal(data.url);
    }
  }, [data, inlinePRView, repo, node.type, node.number, openPR, openIssue]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      selectNode(node.id);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        nodeX: node.x,
        nodeY: node.y,
        moved: false,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = (ev.clientX - dragRef.current.startX) / zoom;
        const dy = (ev.clientY - dragRef.current.startY) / zoom;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragRef.current.moved = true;
        moveNode(node.id, dragRef.current.nodeX + dx, dragRef.current.nodeY + dy);
      };

      const handleMouseUp = () => {
        const wasDrag = dragRef.current?.moved ?? false;
        dragRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        if (!wasDrag) handleOpen();
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [node.id, node.x, node.y, zoom, moveNode, selectNode, handleOpen],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleOpen();
    },
    [handleOpen],
  );

  if (!data) {
    return (
      <button
        type="button"
        className="absolute rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-2.5 opacity-50 cursor-default text-left"
        style={{ left: node.x, top: node.y, width: node.width }}
      >
        <span className="text-[10px] text-[var(--color-fg-dim)] font-mono">
          {node.type === "pr" ? "PR" : "Issue"} #{node.number}
        </span>
      </button>
    );
  }

  const isPR = node.type === "pr";
  const pr = isPR ? (data as PullRequest) : null;
  const title = data.title;
  const state = data.state;
  const author = data.author.login;
  const labels = data.labels ?? [];

  return (
    <button
      type="button"
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "absolute rounded-lg border bg-[var(--color-bg-raised)] cursor-grab active:cursor-grabbing select-none transition-shadow text-left",
        isSelected
          ? "border-[var(--color-blue)] shadow-lg shadow-[var(--color-blue)]/10 z-10"
          : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
        highlighted &&
          "ring-2 ring-[var(--color-amber)] ring-offset-1 ring-offset-[var(--color-bg)]",
      )}
      style={{ left: node.x, top: node.y, width: node.width }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2.5 py-2">
        {isPR && pr ? <PRIcon state={state} isDraft={pr.isDraft} /> : <IssueIcon state={state} />}
        <span className="text-[11px] font-medium text-[var(--color-fg)] truncate flex-1">
          {title}
        </span>
        <span className="text-[9px] font-mono text-[var(--color-fg-dim)] shrink-0">
          #{data.number}
        </span>
      </div>
      {/* Meta + labels */}
      <div className="px-2.5 pb-2 space-y-1">
        <div className="flex items-center gap-1 text-[9px] text-[var(--color-fg-muted)]">
          <span className="font-medium">{author}</span>
          <span className="text-[var(--color-fg-dim)]">&middot;</span>
          <span
            className={cn(
              "uppercase tracking-wider font-semibold",
              state === "OPEN" && "text-[var(--color-green)]",
              state === "CLOSED" && "text-[var(--color-red)]",
              state === "MERGED" && "text-[var(--color-purple)]",
            )}
          >
            {state}
          </span>
        </div>
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {labels.slice(0, 4).map((l) => (
              <LabelBadge key={l.name} label={l} />
            ))}
            {labels.length > 4 && (
              <span className="text-[8px] text-[var(--color-fg-dim)]">+{labels.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

import { useRef, useCallback } from "react";
import { GitPullRequest, GitMerge, XCircle, FileEdit, CircleDot, CircleCheck } from "lucide-react";
import type { PullRequest, Issue } from "../../types";
import type { CanvasNode } from "../../stores/canvasStore";
import { useCanvasStore } from "../../stores/canvasStore";
import { LabelBadge } from "../LabelBadge";
import { cn } from "../../lib/cn";

interface CanvasCardProps {
  node: CanvasNode;
  data: PullRequest | Issue | null;
  zoom: number;
  highlighted: boolean;
}

function PRIcon({ state, isDraft }: { state: string; isDraft: boolean }) {
  if (isDraft) return <FileEdit className="size-3.5 text-[var(--color-fg-dim)]" />;
  if (state === "MERGED") return <GitMerge className="size-3.5 text-[var(--color-purple)]" />;
  if (state === "CLOSED") return <XCircle className="size-3.5 text-[var(--color-red)]" />;
  return <GitPullRequest className="size-3.5 text-[var(--color-green)]" />;
}

function IssueIcon({ state }: { state: string }) {
  if (state === "CLOSED") return <CircleCheck className="size-3.5 text-[var(--color-purple)]" />;
  return <CircleDot className="size-3.5 text-[var(--color-green)]" />;
}

export function CanvasCard({ node, data, zoom, highlighted }: CanvasCardProps) {
  const moveNode = useCanvasStore((s) => s.moveNode);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const isSelected = selectedNodeId === node.id;
  const dragRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number } | null>(
    null,
  );

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
      };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = (ev.clientX - dragRef.current.startX) / zoom;
        const dy = (ev.clientY - dragRef.current.startY) / zoom;
        moveNode(node.id, dragRef.current.nodeX + dx, dragRef.current.nodeY + dy);
      };

      const handleMouseUp = () => {
        dragRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [node.id, node.x, node.y, zoom, moveNode, selectNode],
  );

  if (!data) {
    return (
      <div
        className="absolute rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-3 opacity-50"
        style={{ left: node.x, top: node.y, width: node.width }}
      >
        <span className="text-[11px] text-[var(--color-fg-dim)]">
          {node.type === "pr" ? "PR" : "Issue"} #{node.number}
        </span>
      </div>
    );
  }

  const isPR = node.type === "pr";
  const pr = isPR ? (data as PullRequest) : null;
  const title = data.title;
  const state = data.state;
  const author = data.author.login;
  const labels = data.labels ?? [];

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onKeyDown={(e) => {
        if (e.key === "Enter") selectNode(node.id);
      }}
      className={cn(
        "absolute rounded-lg border bg-[var(--color-bg-raised)] cursor-grab active:cursor-grabbing select-none transition-shadow",
        isSelected
          ? "border-[var(--color-blue)] shadow-lg shadow-[var(--color-blue)]/10"
          : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
        highlighted &&
          "ring-2 ring-[var(--color-amber)] ring-offset-1 ring-offset-[var(--color-bg)]",
      )}
      style={{ left: node.x, top: node.y, width: node.width }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        {isPR && pr ? <PRIcon state={state} isDraft={pr.isDraft} /> : <IssueIcon state={state} />}
        <span className="text-[11px] font-medium text-[var(--color-fg)] truncate flex-1">
          {title}
        </span>
        <span className="text-[10px] font-mono text-[var(--color-fg-dim)] shrink-0">
          #{data.number}
        </span>
      </div>
      {/* Meta */}
      <div className="flex items-center gap-1.5 px-3 pb-2 text-[10px] text-[var(--color-fg-muted)]">
        <span className="font-medium">{author}</span>
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-0.5 ml-1">
            {labels.slice(0, 3).map((l) => (
              <LabelBadge key={l.name} label={l} />
            ))}
            {labels.length > 3 && (
              <span className="text-[9px] text-[var(--color-fg-dim)]">+{labels.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, type DragEvent } from "react";
import { GitPullRequest, XCircle, GitMerge } from "lucide-react";
import type { PullRequest } from "../types";
import { KanbanCard } from "./KanbanCard";
import { CommentDialog, type DialogAction } from "./CommentDialog";

interface KanbanViewProps {
  prs: PullRequest[];
  repo: string;
  onRefresh: () => void;
}

type ColumnId = "open" | "closed" | "merged";

interface ColumnDef {
  id: ColumnId;
  label: string;
  icon: typeof GitPullRequest;
  iconColor: string;
  emptyText: string;
}

const COLUMNS: ColumnDef[] = [
  {
    id: "open",
    label: "Open",
    icon: GitPullRequest,
    iconColor: "var(--color-green)",
    emptyText: "No open PRs",
  },
  {
    id: "closed",
    label: "Closed",
    icon: XCircle,
    iconColor: "var(--color-red)",
    emptyText: "Drop here to close",
  },
  {
    id: "merged",
    label: "Merged",
    icon: GitMerge,
    iconColor: "var(--color-purple)",
    emptyText: "Drop here to merge",
  },
];

function handleDragStart(e: DragEvent, pr: PullRequest): void {
  e.dataTransfer.setData("text/plain", String(pr.number));
  e.dataTransfer.effectAllowed = "move";
}

export function KanbanView({ prs, repo, onRefresh }: KanbanViewProps) {
  const [dragOverColumn, setDragOverColumn] = useState<ColumnId | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    pr: PullRequest;
    action: DialogAction;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Bucket PRs into columns by state
  const openPRs = prs.filter((pr) => pr.state === "OPEN");
  const closedPRs = prs.filter((pr) => pr.state === "CLOSED" && !pr.mergedAt);
  const mergedPRs = prs.filter((pr) => pr.state === "MERGED" || pr.mergedAt);

  const columnPRs: Record<ColumnId, PullRequest[]> = {
    open: openPRs,
    closed: closedPRs,
    merged: mergedPRs,
  };

  const handleDragOver = (e: DragEvent, columnId: ColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: DragEvent, columnId: ColumnId) => {
    e.preventDefault();
    setDragOverColumn(null);

    const prNumber = parseInt(e.dataTransfer.getData("text/plain"), 10);
    const pr = prs.find((p) => p.number === prNumber);
    if (!pr) return;

    // Only act on drops into different columns
    if (columnId === "open") return;
    if (columnId === "closed" && pr.state !== "OPEN") return;
    if (columnId === "merged" && pr.state !== "OPEN") return;

    const action: DialogAction = columnId === "merged" ? "merge" : "close";
    setPendingAction({ pr, action });
  };

  const handleConfirm = async (comment?: string) => {
    if (!pendingAction) return;
    setActionLoading(true);
    try {
      const { pr, action } = pendingAction;
      if (action === "merge") {
        await window.api.mergePR({ repo, number: pr.number, comment });
      } else {
        await window.api.closePR({ repo, number: pr.number, comment });
      }
      onRefresh();
    } catch {
      // Error will surface on next refresh
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  };

  const handleCancel = () => {
    setPendingAction(null);
  };

  return (
    <>
      <div className="flex h-full gap-3 p-4 overflow-x-auto min-w-0">
        {COLUMNS.map((col) => {
          const items = columnPRs[col.id];
          const isOver = dragOverColumn === col.id;
          const isDropTarget = col.id !== "open";
          const Icon = col.icon;

          return (
            <section
              key={col.id}
              aria-label={`${col.label} column`}
              className="flex flex-col flex-1 min-w-0 basis-0"
              onDragOver={isDropTarget ? (e) => handleDragOver(e, col.id) : undefined}
              onDragLeave={isDropTarget ? handleDragLeave : undefined}
              onDrop={isDropTarget ? (e) => handleDrop(e, col.id) : undefined}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 px-2 pb-2.5">
                <Icon className="size-3.5" style={{ color: col.iconColor }} />
                <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-fg-secondary)]">
                  {col.label}
                </span>
                <span className="text-[11px] font-mono text-[var(--color-fg-dim)] tabular-nums">
                  {items.length}
                </span>
              </div>

              {/* Column body */}
              <ul
                className={`
                  flex-1 rounded-xl p-2 space-y-2 overflow-y-auto
                  border transition-colors duration-100
                  ${
                    isOver
                      ? "border-[var(--color-blue)]/40 bg-[var(--color-blue)]/5"
                      : "border-[var(--color-border)] bg-[var(--color-bg-inset)]"
                  }
                `}
              >
                {items.length === 0 && (
                  <li className="list-none flex items-center justify-center py-12 text-[11px] text-[var(--color-fg-dim)]">
                    {col.emptyText}
                  </li>
                )}
                {items.map((pr) => (
                  <KanbanCard key={pr.number} pr={pr} repo={repo} onDragStart={handleDragStart} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Comment dialog */}
      {pendingAction && (
        <CommentDialog
          pr={pendingAction.pr}
          action={pendingAction.action}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          loading={actionLoading}
        />
      )}
    </>
  );
}

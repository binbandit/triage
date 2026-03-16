import { useState, useMemo, type DragEvent } from "react";
import {
  GitPullRequest,
  GitMerge,
  XCircle,
  FileEdit,
  ExternalLink,
  GripVertical,
  ChevronRight,
  CircleDot,
} from "lucide-react";
import type { PullRequest } from "../types";
import { useSettingsStore } from "../stores/settingsStore";
import { usePRDetailStore } from "../stores/prDetailStore";
import { useIssueDetailStore } from "../stores/issueDetailStore";
import { LabelBadge } from "./LabelBadge";
import { parseLinkedIssues } from "../lib/parseIssues";

interface KanbanCardProps {
  pr: PullRequest;
  repo: string;
  onDragStart: (e: DragEvent, pr: PullRequest) => void;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

export function KanbanCard({ pr, repo, onDragStart }: KanbanCardProps) {
  const canDrag = pr.state === "OPEN";
  const inlinePRView = useSettingsStore((s) => s.inlinePRView);
  const openPR = usePRDetailStore((s) => s.openPR);
  const openIssue = useIssueDetailStore((s) => s.openIssue);
  const [expanded, setExpanded] = useState(false);

  const linkedIssues = useMemo(() => parseLinkedIssues(pr.body), [pr.body]);
  const hasIssues = linkedIssues.length > 0;

  const handleOpen = () => {
    if (inlinePRView && repo) {
      openPR(repo, pr.number);
    } else {
      const url = repo ? `https://github.com/${repo}/pull/${pr.number}` : pr.url;
      window.api.openExternal(url);
    }
  };

  const handleIssueClick = (issueNumber: number) => {
    if (inlinePRView && repo) {
      openIssue(repo, issueNumber);
    } else {
      const repoBase = repo ? `https://github.com/${repo}` : pr.url.replace(/\/pull\/\d+$/, "");
      window.api.openExternal(`${repoBase}/issues/${issueNumber}`);
    }
  };

  return (
    <li
      draggable={canDrag}
      onDragStart={canDrag ? (e) => onDragStart(e, pr) : undefined}
      className={`
        group list-none rounded-lg border border-[var(--color-border)]
        bg-[var(--color-bg-raised)]
        hover:border-[var(--color-border-strong)]
        transition-colors
        ${canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
      `}
    >
      <div className="p-3">
        {/* Top row: expand + drag handle + title + external link */}
        <div className="flex items-start gap-1.5">
          {/* Expand chevron */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className={`shrink-0 mt-0.5 p-0.5 rounded-sm cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)] transition-all ${hasIssues ? "" : "invisible"}`}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <ChevronRight
              className={`size-3 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
            />
          </button>

          {canDrag && (
            <GripVertical className="size-3.5 shrink-0 mt-0.5 text-[var(--color-fg-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              {pr.isDraft && (
                <FileEdit className="size-3 shrink-0 text-[var(--color-fg-dim)] translate-y-[1px]" />
              )}
              {!pr.isDraft && pr.state === "MERGED" && (
                <GitMerge className="size-3 shrink-0 text-[var(--color-purple)] translate-y-[1px]" />
              )}
              {!pr.isDraft && pr.state === "CLOSED" && (
                <XCircle className="size-3 shrink-0 text-[var(--color-red)] translate-y-[1px]" />
              )}
              {!pr.isDraft && pr.state === "OPEN" && (
                <GitPullRequest className="size-3 shrink-0 text-[var(--color-green)] translate-y-[1px]" />
              )}
              <button
                type="button"
                onClick={handleOpen}
                className="text-[12px] font-medium text-[var(--color-fg)] hover:text-[var(--color-blue)] cursor-pointer truncate text-left transition-colors"
                title={pr.title}
              >
                {pr.title}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpen}
            className="shrink-0 p-0.5 cursor-pointer text-[var(--color-fg-dim)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-fg-secondary)] transition-all"
            aria-label="Open in browser"
          >
            <ExternalLink className="size-3" />
          </button>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-1.5 mt-1.5 ml-[22px] text-[10px] text-[var(--color-fg-muted)]">
          <span className="font-medium">{pr.author.login}</span>
          <span className="text-[var(--color-fg-dim)]">&middot;</span>
          <span className="font-mono">#{pr.number}</span>
          <span className="text-[var(--color-fg-dim)]">&middot;</span>
          <span>{timeAgo(pr.updatedAt)}</span>
          {pr.isDraft && (
            <>
              <span className="text-[var(--color-fg-dim)]">&middot;</span>
              <span className="uppercase tracking-wider text-[var(--color-fg-dim)]">draft</span>
            </>
          )}
          {hasIssues && (
            <>
              <span className="text-[var(--color-fg-dim)]">&middot;</span>
              <span className="text-[var(--color-fg-dim)]">
                {linkedIssues.length} issue{linkedIssues.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>

        {/* Labels */}
        {pr.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 ml-[22px]">
            {pr.labels.map((label) => (
              <LabelBadge key={label.name} label={label} />
            ))}
          </div>
        )}
      </div>

      {/* Expanded linked issues */}
      {expanded && hasIssues && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-inset)] rounded-b-lg overflow-hidden">
          {linkedIssues.map((issue) => (
            <button
              key={issue.number}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleIssueClick(issue.number);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 cursor-pointer text-left hover:bg-[var(--color-bg-overlay)] transition-colors"
            >
              <CircleDot className="size-3 shrink-0 text-[var(--color-fg-dim)]" />
              <span className="text-[11px] font-mono font-medium text-[var(--color-fg-secondary)]">
                #{issue.number}
              </span>
              <span className="text-[10px] text-[var(--color-fg-dim)] capitalize">
                {issue.keyword}
              </span>
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

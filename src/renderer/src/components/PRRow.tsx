import { useState, useMemo } from "react";
import {
  ChevronRight,
  GitPullRequest,
  GitMerge,
  XCircle,
  ExternalLink,
  FileEdit,
  CircleDot,
} from "lucide-react";
import type { PullRequest } from "../types";
import { LabelBadge } from "./LabelBadge";
import { parseLinkedIssues } from "../lib/parseIssues";

interface PRRowProps {
  pr: PullRequest;
  repo: string;
  highlightLabels?: string[];
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

export function PRRow({ pr, repo, highlightLabels = [] }: PRRowProps) {
  const [expanded, setExpanded] = useState(false);

  const linkedIssues = useMemo(() => parseLinkedIssues(pr.body), [pr.body]);
  const hasIssues = linkedIssues.length > 0;

  const handleOpen = () => {
    window.api.openExternal(pr.url);
  };

  const handleIssueClick = (issueNumber: number) => {
    const repoBase = repo ? `https://github.com/${repo}` : pr.url.replace(/\/pull\/\d+$/, "");
    window.api.openExternal(`${repoBase}/issues/${issueNumber}`);
  };

  return (
    <div className="border-b border-[var(--color-border)]">
      {/* Main row */}
      <div className="flex items-start gap-2.5 px-5 py-3.5 hover:bg-[var(--color-bg-raised)] transition-colors duration-100 group">
        {/* Expand chevron */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`
            shrink-0 mt-[3px] p-0.5 rounded-sm cursor-pointer
            text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)]
            transition-colors
            ${hasIssues ? "" : "invisible"}
          `}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <ChevronRight
            className={`size-3.5 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
          />
        </button>

        {/* PR icon - state-aware */}
        <div className="shrink-0 mt-[3px]">
          {pr.isDraft && <FileEdit className="size-3.5 text-[var(--color-fg-dim)]" />}
          {!pr.isDraft && pr.state === "MERGED" && (
            <GitMerge className="size-3.5 text-[var(--color-purple)]" />
          )}
          {!pr.isDraft && pr.state === "CLOSED" && (
            <XCircle className="size-3.5 text-[var(--color-red)]" />
          )}
          {!pr.isDraft && pr.state === "OPEN" && (
            <GitPullRequest className="size-3.5 text-[var(--color-green)]" />
          )}
        </div>

        {/* Content block */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-baseline gap-2 leading-snug">
            <button
              type="button"
              onClick={handleOpen}
              className="text-[13px] font-medium text-[var(--color-fg)] hover:text-[var(--color-blue)] cursor-pointer truncate text-left transition-colors"
              title={pr.title}
            >
              {pr.title}
            </button>
            <span className="shrink-0 text-[11px] text-[var(--color-fg-dim)] font-mono">
              #{pr.number}
            </span>
            {pr.isDraft && (
              <span className="shrink-0 text-[10px] uppercase tracking-wider text-[var(--color-fg-dim)] border border-[var(--color-border)] rounded px-1 py-px leading-none">
                draft
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[var(--color-fg-muted)]">
            <span className="font-medium">{pr.author.login}</span>
            <span className="text-[var(--color-fg-dim)]">&middot;</span>
            <span>{timeAgo(pr.updatedAt)}</span>
            <span className="text-[var(--color-fg-dim)]">&middot;</span>
            <span className="font-mono text-[var(--color-fg-dim)] truncate max-w-[140px]">
              {pr.headRefName}
            </span>
          </div>

          {/* Labels */}
          {pr.labels.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-2">
              {pr.labels.map((label) => (
                <LabelBadge
                  key={label.name}
                  label={label}
                  highlighted={highlightLabels.some(
                    (hl) => hl.toLowerCase() === label.name.toLowerCase(),
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* External link */}
        <button
          type="button"
          onClick={handleOpen}
          className="
            shrink-0 mt-[3px] p-1 rounded-sm cursor-pointer
            text-[var(--color-fg-dim)]
            opacity-0 group-hover:opacity-100
            hover:text-[var(--color-fg-secondary)]
            transition-all duration-100
          "
          aria-label="Open in browser"
        >
          <ExternalLink className="size-3.5" />
        </button>
      </div>

      {/* Expanded linked issues */}
      {expanded && hasIssues && (
        <div className="pl-[52px] pr-5 pb-3.5">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-inset)] overflow-hidden">
            {linkedIssues.map((issue, i) => (
              <button
                key={issue.number}
                type="button"
                onClick={() => handleIssueClick(issue.number)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 cursor-pointer
                  text-left transition-colors
                  hover:bg-[var(--color-bg-overlay)]
                  ${i > 0 ? "border-t border-[var(--color-border)]" : ""}
                `}
              >
                <CircleDot className="size-3.5 shrink-0 text-[var(--color-fg-dim)]" />
                <span className="text-[12px] font-mono font-medium text-[var(--color-fg-secondary)]">
                  #{issue.number}
                </span>
                <span className="text-[11px] text-[var(--color-fg-muted)] capitalize">
                  {issue.keyword}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

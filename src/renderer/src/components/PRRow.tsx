import { useState, useMemo } from "react";
import { ChevronRight, GitPullRequest, ExternalLink, FileEdit } from "lucide-react";
import type { PullRequest } from "../types";
import { LabelBadge } from "./LabelBadge";
import { parseLinkedIssues } from "../lib/parseIssues";

interface PRRowProps {
  pr: PullRequest;
  requiredLabels: string[];
  repo: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function PRRow({ pr, requiredLabels, repo }: PRRowProps) {
  const [expanded, setExpanded] = useState(false);

  const linkedIssues = useMemo(() => parseLinkedIssues(pr.body), [pr.body]);
  const hasIssues = linkedIssues.length > 0;

  const labelNames = pr.labels.map((l) => l.name.toLowerCase());
  const hasAllRequired = requiredLabels.every((rl) => labelNames.includes(rl.toLowerCase()));

  const handleOpen = () => {
    window.api.openExternal(pr.url);
  };

  const handleIssueClick = (issueNumber: number) => {
    const repoBase = repo ? `https://github.com/${repo}` : pr.url.replace(/\/pull\/\d+$/, "");
    window.api.openExternal(`${repoBase}/issues/${issueNumber}`);
  };

  return (
    <div
      className={`group border-b border-border transition-colors ${
        hasAllRequired ? "" : "opacity-60"
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-surface-raised/50 transition-colors">
        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`shrink-0 p-0.5 rounded text-dim hover:text-muted-foreground transition-all ${
            hasIssues ? "visible" : "invisible"
          }`}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <ChevronRight
            className={`size-4 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
          />
        </button>

        {/* PR icon */}
        <div className="shrink-0">
          {pr.isDraft ? (
            <FileEdit className="size-4 text-dim" />
          ) : (
            <GitPullRequest className="size-4 text-success" />
          )}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpen}
              className="text-sm font-medium text-foreground hover:text-accent truncate text-left transition-colors"
              title={pr.title}
            >
              {pr.title}
            </button>
            <span className="shrink-0 text-xs text-dim font-mono">#{pr.number}</span>
            {pr.isDraft && (
              <span className="shrink-0 text-xs text-dim border border-border-subtle rounded px-1.5 py-0.5">
                Draft
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted">{pr.author.login}</span>
            <span className="text-xs text-dim">{timeAgo(pr.updatedAt)}</span>
            <span className="text-xs text-dim font-mono truncate max-w-[160px]">
              {pr.headRefName}
            </span>
          </div>
        </div>

        {/* Labels */}
        <div className="flex items-center gap-1.5 shrink-0 max-w-[280px] overflow-hidden">
          {pr.labels.map((label) => (
            <LabelBadge
              key={label.name}
              label={label}
              highlighted={requiredLabels.some(
                (rl) => rl.toLowerCase() === label.name.toLowerCase(),
              )}
            />
          ))}
        </div>

        {/* Open external */}
        <button
          type="button"
          onClick={handleOpen}
          className="shrink-0 p-1.5 rounded text-dim opacity-0 group-hover:opacity-100 hover:text-muted-foreground transition-all"
          aria-label="Open in browser"
        >
          <ExternalLink className="size-3.5" />
        </button>
      </div>

      {/* Expanded issue inset */}
      {expanded && hasIssues && (
        <div className="ml-12 mr-4 mb-3 rounded-lg border-l-2 border-accent-muted bg-surface/80 px-4 py-2.5">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Linked issues</p>
          <ul className="space-y-1">
            {linkedIssues.map((issue) => (
              <li key={issue.number} className="flex items-center gap-2">
                <span className="text-xs text-dim capitalize">{issue.keyword}</span>
                <button
                  type="button"
                  onClick={() => handleIssueClick(issue.number)}
                  className="text-xs text-accent hover:underline font-mono"
                >
                  #{issue.number}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

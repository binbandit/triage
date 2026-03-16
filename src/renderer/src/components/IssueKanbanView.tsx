import { CircleDot, CircleCheck, ExternalLink, Loader2 } from "lucide-react";
import type { Issue } from "../types";
import { useSettingsStore } from "../stores/settingsStore";
import { useIssueDetailStore } from "../stores/issueDetailStore";
import { LabelBadge } from "./LabelBadge";
import { EmptyState } from "./EmptyState";

interface IssueKanbanViewProps {
  issues: Issue[];
  repo: string;
  loading: boolean;
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

function IssueCard({ issue, repo }: { issue: Issue; repo: string }) {
  const inlinePRView = useSettingsStore((s) => s.inlinePRView);
  const openIssue = useIssueDetailStore((s) => s.openIssue);

  const handleOpen = () => {
    if (inlinePRView) {
      openIssue(repo, issue.number);
    } else {
      window.api.openExternal(issue.url);
    }
  };

  return (
    <li className="group list-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-3 hover:border-[var(--color-border-strong)] transition-colors">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            {issue.state === "OPEN" ? (
              <CircleDot className="size-3 shrink-0 text-[var(--color-green)] translate-y-[1px]" />
            ) : (
              <CircleCheck className="size-3 shrink-0 text-[var(--color-purple)] translate-y-[1px]" />
            )}
            <button
              type="button"
              onClick={handleOpen}
              className="text-[12px] font-medium text-[var(--color-fg)] hover:text-[var(--color-blue)] cursor-pointer truncate text-left transition-colors"
              title={issue.title}
            >
              {issue.title}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.api.openExternal(issue.url)}
          className="shrink-0 p-0.5 cursor-pointer text-[var(--color-fg-dim)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-fg-secondary)] transition-all"
          aria-label="Open in browser"
        >
          <ExternalLink className="size-3" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 ml-[18px] text-[10px] text-[var(--color-fg-muted)]">
        <span className="font-medium">{issue.author.login}</span>
        <span className="text-[var(--color-fg-dim)]">&middot;</span>
        <span className="font-mono">#{issue.number}</span>
        <span className="text-[var(--color-fg-dim)]">&middot;</span>
        <span>{timeAgo(issue.updatedAt)}</span>
        {(issue.comments?.length ?? 0) > 0 && (
          <>
            <span className="text-[var(--color-fg-dim)]">&middot;</span>
            <span>{issue.comments.length} comments</span>
          </>
        )}
      </div>
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 ml-[18px]">
          {issue.labels.map((label) => (
            <LabelBadge key={label.name} label={label} />
          ))}
        </div>
      )}
    </li>
  );
}

export function IssueKanbanView({ issues, repo, loading }: IssueKanbanViewProps) {
  const openIssues = issues.filter((i) => i.state === "OPEN");
  const closedIssues = issues.filter((i) => i.state === "CLOSED");

  const columns = [
    {
      id: "open",
      label: "Open",
      icon: CircleDot,
      iconColor: "var(--color-green)",
      items: openIssues,
    },
    {
      id: "closed",
      label: "Closed",
      icon: CircleCheck,
      iconColor: "var(--color-purple)",
      items: closedIssues,
    },
  ];

  return (
    <div className="flex h-full gap-3 p-4 overflow-x-auto min-w-0">
      {columns.map((col) => {
        const Icon = col.icon;
        return (
          <section
            key={col.id}
            aria-label={`${col.label} column`}
            className="flex flex-col flex-1 min-w-0 basis-0"
          >
            <div className="flex items-center gap-2 px-2 pb-2.5">
              <Icon className="size-3.5" style={{ color: col.iconColor }} />
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-fg-secondary)]">
                {col.label}
              </span>
              <span className="text-[11px] font-mono text-[var(--color-fg-dim)] tabular-nums">
                {loading ? <Loader2 className="size-3 animate-spin inline" /> : col.items.length}
              </span>
            </div>
            <ul className="flex-1 rounded-xl p-2 space-y-2 overflow-y-auto border border-[var(--color-border)] bg-[var(--color-bg-inset)]">
              {col.items.length === 0 && (
                <li className="list-none">
                  {loading ? (
                    <EmptyState type="loading" message="Loading issues..." compact />
                  ) : (
                    <EmptyState
                      type="empty"
                      message={`No ${col.label.toLowerCase()} issues`}
                      compact
                    />
                  )}
                </li>
              )}
              {col.items.map((issue) => (
                <IssueCard key={issue.number} issue={issue} repo={repo} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

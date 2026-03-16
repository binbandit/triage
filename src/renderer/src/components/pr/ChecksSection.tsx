import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  SkipForward,
  ExternalLink,
  ChevronDown,
  ShieldAlert,
} from "lucide-react";
import { useState, useMemo } from "react";
import type { PRCheckRun } from "../../types";
import { cn } from "../../lib/cn";

interface ChecksSectionProps {
  checks: PRCheckRun[];
}

function checkIcon(status: string, conclusion: string) {
  if (status === "COMPLETED") {
    switch (conclusion) {
      case "SUCCESS":
        return <CheckCircle2 className="size-3.5 text-[var(--color-green)]" />;
      case "FAILURE":
        return <XCircle className="size-3.5 text-[var(--color-red)]" />;
      case "SKIPPED":
        return <SkipForward className="size-3.5 text-[var(--color-fg-dim)]" />;
      case "CANCELLED":
        return <XCircle className="size-3.5 text-[var(--color-fg-dim)]" />;
      case "ACTION_REQUIRED":
        return <ShieldAlert className="size-3.5 text-[var(--color-amber)]" />;
      default:
        return <CheckCircle2 className="size-3.5 text-[var(--color-fg-dim)]" />;
    }
  }
  if (status === "IN_PROGRESS" || status === "QUEUED") {
    return <Loader2 className="size-3.5 text-[var(--color-amber)] animate-spin" />;
  }
  if (status === "WAITING") {
    return <Clock className="size-3.5 text-[var(--color-amber)]" />;
  }
  if (status === "PENDING") {
    return <Clock className="size-3.5 text-[var(--color-fg-dim)]" />;
  }
  return <Clock className="size-3.5 text-[var(--color-fg-dim)]" />;
}

function formatDuration(start?: string, end?: string): string {
  if (!start || !end) return "";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 0) return "";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function ChecksSection({ checks }: ChecksSectionProps) {
  const [expanded, setExpanded] = useState(true);

  const grouped = useMemo(() => {
    const workflows = new Map<string, PRCheckRun[]>();
    for (const check of checks) {
      const name = check.workflowName || "Other";
      const existing = workflows.get(name) || [];
      existing.push(check);
      workflows.set(name, existing);
    }
    return [...workflows.entries()];
  }, [checks]);

  const summary = useMemo(() => {
    let passed = 0;
    let failed = 0;
    let pending = 0;
    let skipped = 0;
    for (const check of checks) {
      if (check.status !== "COMPLETED") {
        pending++;
      } else if (check.conclusion === "SUCCESS") {
        passed++;
      } else if (check.conclusion === "FAILURE") {
        failed++;
      } else {
        skipped++;
      }
    }
    return { passed, failed, pending, skipped, total: checks.length };
  }, [checks]);

  if (checks.length === 0) return null;

  const overallColor =
    summary.failed > 0
      ? "var(--color-red)"
      : summary.pending > 0
        ? "var(--color-amber)"
        : "var(--color-green)";

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-raised)]">
      {/* Summary header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-[var(--color-bg-overlay)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: overallColor }} />
          <span className="text-[12px] font-medium text-[var(--color-fg-secondary)]">Checks</span>
          <span className="text-[10px] text-[var(--color-fg-dim)] tabular-nums">
            {summary.passed > 0 && (
              <span className="text-[var(--color-green)]">{summary.passed} passed</span>
            )}
            {summary.failed > 0 && (
              <span className="text-[var(--color-red)]">
                {summary.passed > 0 && ", "}
                {summary.failed} failed
              </span>
            )}
            {summary.pending > 0 && (
              <span className="text-[var(--color-amber)]">
                {(summary.passed > 0 || summary.failed > 0) && ", "}
                {summary.pending} pending
              </span>
            )}
            {summary.skipped > 0 && (
              <span className="text-[var(--color-fg-dim)]">
                {(summary.passed > 0 || summary.failed > 0 || summary.pending > 0) && ", "}
                {summary.skipped} skipped
              </span>
            )}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-3.5 text-[var(--color-fg-dim)] transition-transform",
            !expanded && "-rotate-90",
          )}
        />
      </button>

      {/* Detail list */}
      {expanded && (
        <div className="border-t border-[var(--color-border)]">
          {grouped.map(([workflow, workflowChecks]) => (
            <div key={workflow}>
              <div className="px-3 py-1.5 bg-[var(--color-bg-inset)]">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-fg-dim)]">
                  {workflow}
                </span>
              </div>
              {workflowChecks.map((check) => (
                <div
                  key={`${check.name}-${check.startedAt}`}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--color-bg-overlay)] transition-colors"
                >
                  {checkIcon(check.status, check.conclusion)}
                  <span className="text-[11px] text-[var(--color-fg)] flex-1 truncate">
                    {check.name}
                  </span>
                  <span className="text-[10px] text-[var(--color-fg-dim)] font-mono tabular-nums shrink-0">
                    {formatDuration(check.startedAt, check.completedAt)}
                  </span>
                  {check.detailsUrl && (
                    <button
                      type="button"
                      onClick={() => window.api.openExternal(check.detailsUrl!)}
                      className="p-0.5 cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)] transition-colors shrink-0"
                      aria-label="View details"
                    >
                      <ExternalLink className="size-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, type KeyboardEvent } from "react";
import {
  ArrowLeft,
  GitPullRequest,
  GitMerge,
  XCircle,
  FileEdit,
  ExternalLink,
  Check,
  AlertTriangle,
  Users,
  Pencil,
  Loader2,
} from "lucide-react";
import type { PullRequestDetail } from "../../types";
import { LabelBadge } from "../LabelBadge";
import { LabelPicker } from "./LabelPicker";
import { countApprovals, hasChangesRequested, countReviewers } from "../../lib/prHelpers";

interface PRHeaderProps {
  pr: PullRequestDetail;
  repo: string;
  onBack: () => void;
  onEditTitle: (title: string) => Promise<boolean>;
  onAddLabel: (label: string) => Promise<boolean>;
  onRemoveLabel: (label: string) => Promise<boolean>;
  onToggleDraft: () => Promise<boolean>;
}

function StatusBadge({ pr }: { pr: PullRequestDetail }) {
  if (pr.isDraft) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] px-1.5 py-0.5 text-[11px] text-[var(--color-fg-dim)]">
        <FileEdit className="size-3" />
        Draft
      </span>
    );
  }
  if (pr.state === "MERGED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-purple)]/10 border border-[var(--color-purple)]/20 px-1.5 py-0.5 text-[11px] text-[var(--color-purple)]">
        <GitMerge className="size-3" />
        Merged
      </span>
    );
  }
  if (pr.state === "CLOSED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-red)]/10 border border-[var(--color-red)]/20 px-1.5 py-0.5 text-[11px] text-[var(--color-red)]">
        <XCircle className="size-3" />
        Closed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-green)]/10 border border-[var(--color-green)]/20 px-1.5 py-0.5 text-[11px] text-[var(--color-green)]">
      <GitPullRequest className="size-3" />
      Open
    </span>
  );
}

export function PRHeader({
  pr,
  repo,
  onBack,
  onEditTitle,
  onAddLabel,
  onRemoveLabel,
  onToggleDraft,
}: PRHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(pr.title);
  const [titleSaving, setTitleSaving] = useState(false);
  const approvals = countApprovals(pr);
  const changesReq = hasChangesRequested(pr);
  const reviewers = countReviewers(pr);

  const handleTitleSave = async () => {
    if (titleValue.trim() && titleValue.trim() !== pr.title) {
      setTitleSaving(true);
      await onEditTitle(titleValue.trim());
      setTitleSaving(false);
    }
    setEditingTitle(false);
  };

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleSave();
    }
    if (e.key === "Escape") {
      setTitleValue(pr.title);
      setEditingTitle(false);
    }
  };

  return (
    <div className="shrink-0 border-b border-[var(--color-border-strong)] bg-[var(--color-bg)]">
      {/* Top bar: back + external link */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border)]">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded-md cursor-pointer text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-overlay)] transition-colors"
          aria-label="Back to list"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span className="text-[12px] text-[var(--color-fg-dim)] font-mono">{repo}</span>
        <span className="text-[12px] text-[var(--color-fg-dim)]">#</span>
        <span className="text-[12px] text-[var(--color-fg)] font-mono font-medium">
          {pr.number}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => window.api.openExternal(pr.url)}
          className="p-1 rounded-md cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)] transition-colors"
          aria-label="Open in browser"
        >
          <ExternalLink className="size-3.5" />
        </button>
      </div>

      {/* Title + status */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start gap-2 mb-2">
          <StatusBadge pr={pr} />
          {pr.state === "OPEN" && (
            <button
              type="button"
              onClick={onToggleDraft}
              className="text-[10px] text-[var(--color-fg-dim)] cursor-pointer hover:text-[var(--color-fg-secondary)] transition-colors"
              title={pr.isDraft ? "Mark as ready for review" : "Convert to draft"}
            >
              {pr.isDraft ? "Ready for review" : "Convert to draft"}
            </button>
          )}
          {editingTitle ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleTitleSave}
                className="flex-1 rounded-md border border-[var(--color-blue)]/40 bg-[var(--color-bg-inset)] px-2 py-1 text-[14px] font-semibold text-[var(--color-fg)] outline-none"
                disabled={titleSaving}
              />
              {titleSaving && (
                <Loader2 className="size-3.5 animate-spin text-[var(--color-fg-dim)]" />
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              className="group flex-1 flex items-center gap-1.5 text-left cursor-pointer"
            >
              <h1 className="text-[14px] font-semibold text-[var(--color-fg)] leading-snug">
                {pr.title}
              </h1>
              <Pencil className="size-3 text-[var(--color-fg-dim)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 text-[11px] text-[var(--color-fg-muted)] mb-2">
          <span className="font-medium">{pr.author.login}</span>
          <span className="text-[var(--color-fg-dim)]">wants to merge</span>
          <span className="font-mono text-[var(--color-fg-secondary)]">{pr.headRefName}</span>
          <span className="text-[var(--color-fg-dim)]">into</span>
          <span className="font-mono text-[var(--color-fg-secondary)]">{pr.baseRefName}</span>
          <span className="text-[var(--color-fg-dim)]">&middot;</span>
          <span className="text-[var(--color-green)]">+{pr.additions}</span>
          <span className="text-[var(--color-red)]">-{pr.deletions}</span>
          <span className="text-[var(--color-fg-dim)]">&middot;</span>
          <span>{pr.changedFiles} files</span>

          {/* Review indicators */}
          {approvals > 0 && (
            <>
              <span className="text-[var(--color-fg-dim)]">&middot;</span>
              <span className="inline-flex items-center gap-0.5 text-[var(--color-green)]">
                <Check className="size-3" />
                {approvals}
              </span>
            </>
          )}
          {changesReq && (
            <>
              <span className="text-[var(--color-fg-dim)]">&middot;</span>
              <span className="inline-flex items-center gap-0.5 text-[var(--color-amber)]">
                <AlertTriangle className="size-3" />
              </span>
            </>
          )}
          {reviewers > 0 && (
            <>
              <span className="text-[var(--color-fg-dim)]">&middot;</span>
              <span className="inline-flex items-center gap-0.5 text-[var(--color-fg-muted)]">
                <Users className="size-3" />
                {reviewers}
              </span>
            </>
          )}
        </div>

        {/* Labels */}
        <div className="flex flex-wrap items-center gap-1">
          {pr.labels.map((label) => (
            <LabelBadge key={label.name} label={label} />
          ))}
          <LabelPicker
            currentLabels={pr.labels}
            repo={repo}
            onAdd={(label) => onAddLabel(label)}
            onRemove={(label) => onRemoveLabel(label)}
          />
        </div>
      </div>
    </div>
  );
}

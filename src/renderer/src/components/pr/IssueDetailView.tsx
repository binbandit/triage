import { useState, type KeyboardEvent } from "react";
import {
  ArrowLeft,
  CircleDot,
  CircleCheck,
  ExternalLink,
  Pencil,
  Loader2,
  AlertCircle,
  X,
  Plus,
  Tag,
} from "lucide-react";
import { useIssueDetailStore } from "../../stores/issueDetailStore";
import { LabelBadge } from "../LabelBadge";
import { MarkdownBody } from "./MarkdownBody";
import { MentionInput } from "./MentionInput";

interface IssueDetailViewProps {
  repo: string;
}

function timeFormat(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function IssueDetailView({ repo }: IssueDetailViewProps) {
  const detail = useIssueDetailStore((s) => s.detail);
  const loading = useIssueDetailStore((s) => s.loading);
  const error = useIssueDetailStore((s) => s.error);
  const actionError = useIssueDetailStore((s) => s.actionError);
  const closeView = useIssueDetailStore((s) => s.closeIssue);
  const clearActionError = useIssueDetailStore((s) => s.clearActionError);
  const addComment = useIssueDetailStore((s) => s.addComment);
  const editTitle = useIssueDetailStore((s) => s.editTitle);
  const editBody = useIssueDetailStore((s) => s.editBody);
  const addLabels = useIssueDetailStore((s) => s.addLabels);
  const removeLabels = useIssueDetailStore((s) => s.removeLabels);
  const closeIssueAction = useIssueDetailStore((s) => s.closeIssueAction);
  const reopenIssueAction = useIssueDetailStore((s) => s.reopenIssueAction);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [titleSaving, setTitleSaving] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const [bodyValue, setBodyValue] = useState("");
  const [bodySaving, setBodySaving] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const [showLabelInput, setShowLabelInput] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="size-5 text-[var(--color-fg-dim)] animate-spin mb-4" />
        <p className="text-[13px] text-[var(--color-fg-muted)]">Loading issue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle className="size-5 text-[var(--color-red)]/60 mb-4" />
        <p className="text-[13px] text-[var(--color-fg-secondary)] font-medium mb-1">
          Failed to load issue
        </p>
        <p className="text-[12px] text-[var(--color-fg-muted)] max-w-xs text-center">{error}</p>
        <button
          type="button"
          onClick={closeView}
          className="mt-4 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] cursor-pointer hover:bg-[var(--color-bg-overlay)] transition-colors"
        >
          Back to list
        </button>
      </div>
    );
  }

  if (!detail) return null;

  const isOpen = detail.state === "OPEN";

  const handleTitleSave = async () => {
    if (titleValue.trim() && titleValue.trim() !== detail.title) {
      setTitleSaving(true);
      await editTitle(repo, titleValue.trim());
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
      setTitleValue(detail.title);
      setEditingTitle(false);
    }
  };

  const handleSaveBody = async () => {
    setBodySaving(true);
    await editBody(repo, bodyValue);
    setBodySaving(false);
    setEditingBody(false);
  };

  const handleSubmitComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    const success = await addComment(repo, comment.trim());
    if (success) setComment("");
    setSubmitting(false);
  };

  const handleAddLabel = async () => {
    const label = labelInput.trim();
    if (label) {
      await addLabels(repo, [label]);
      setLabelInput("");
      setShowLabelInput(false);
    }
  };

  const handleLabelKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddLabel();
    }
    if (e.key === "Escape") {
      setShowLabelInput(false);
      setLabelInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--color-border-strong)] bg-[var(--color-bg)]">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border)]">
          <button
            type="button"
            onClick={closeView}
            className="p-1 rounded-md cursor-pointer text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-overlay)] transition-colors"
            aria-label="Back to list"
          >
            <ArrowLeft className="size-4" />
          </button>
          <span className="text-[12px] text-[var(--color-fg-dim)] font-mono">{repo}</span>
          <span className="text-[12px] text-[var(--color-fg-dim)]">#</span>
          <span className="text-[12px] text-[var(--color-fg)] font-mono font-medium">
            {detail.number}
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => window.api.openExternal(detail.url)}
            className="p-1 rounded-md cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)] transition-colors"
            aria-label="Open in browser"
          >
            <ExternalLink className="size-3.5" />
          </button>
        </div>

        {/* Title + status */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-start gap-2 mb-2">
            {/* Status badge */}
            {isOpen ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-green)]/10 border border-[var(--color-green)]/20 px-1.5 py-0.5 text-[11px] text-[var(--color-green)]">
                <CircleDot className="size-3" />
                Open
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-purple)]/10 border border-[var(--color-purple)]/20 px-1.5 py-0.5 text-[11px] text-[var(--color-purple)]">
                <CircleCheck className="size-3" />
                Closed
              </span>
            )}

            {/* Title */}
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
                onClick={() => {
                  setTitleValue(detail.title);
                  setEditingTitle(true);
                }}
                className="group flex-1 flex items-center gap-1.5 text-left cursor-pointer"
              >
                <h1 className="text-[14px] font-semibold text-[var(--color-fg)] leading-snug">
                  {detail.title}
                </h1>
                <Pencil className="size-3 text-[var(--color-fg-dim)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 text-[11px] text-[var(--color-fg-muted)] mb-2">
            <span className="font-medium">{detail.author.login}</span>
            <span className="text-[var(--color-fg-dim)]">
              opened {timeFormat(detail.createdAt)}
            </span>
            <span className="text-[var(--color-fg-dim)]">&middot;</span>
            <span>{detail.comments?.length ?? 0} comments</span>
          </div>

          {/* Labels */}
          <div className="flex flex-wrap items-center gap-1">
            {detail.labels.map((label) => (
              <span key={label.name} className="group/label inline-flex items-center gap-0.5">
                <LabelBadge label={label} />
                <button
                  type="button"
                  onClick={() => removeLabels(repo, [label.name])}
                  className="opacity-0 group-hover/label:opacity-100 p-0.5 cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-red)] transition-all"
                  aria-label={`Remove ${label.name}`}
                >
                  <X className="size-2.5" />
                </button>
              </span>
            ))}
            {showLabelInput ? (
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={handleLabelKeyDown}
                onBlur={() => {
                  if (!labelInput.trim()) setShowLabelInput(false);
                }}
                placeholder="label name"
                className="rounded border border-[var(--color-blue)]/40 bg-[var(--color-bg-inset)] px-1.5 py-0.5 text-[11px] text-[var(--color-fg)] outline-none w-24"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowLabelInput(true)}
                className="inline-flex items-center gap-0.5 rounded-md border border-dashed border-[var(--color-border)] px-1.5 py-0.5 text-[10px] text-[var(--color-fg-dim)] cursor-pointer hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg-muted)] transition-colors"
              >
                <Plus className="size-2.5" />
                <Tag className="size-2.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="mx-4 mt-2 flex items-center gap-2 rounded-lg border border-[var(--color-red)]/20 bg-[var(--color-red)]/5 px-3 py-2">
          <p className="flex-1 text-[12px] text-[var(--color-red)]">{actionError}</p>
          <button
            type="button"
            onClick={clearActionError}
            className="shrink-0 p-0.5 cursor-pointer text-[var(--color-red)]/60 hover:text-[var(--color-red)] transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Body + comments */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Issue body */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-raised)]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
            <span className="text-[11px] font-medium text-[var(--color-fg-secondary)]">
              {detail.author.login}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[var(--color-fg-dim)]">
                {timeFormat(detail.createdAt)}
              </span>
              {!editingBody && (
                <button
                  type="button"
                  onClick={() => {
                    setBodyValue(detail.body);
                    setEditingBody(true);
                  }}
                  className="p-0.5 cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)] transition-colors"
                  aria-label="Edit body"
                >
                  <Pencil className="size-3" />
                </button>
              )}
            </div>
          </div>
          <div className="px-3 py-3">
            {editingBody ? (
              <div className="space-y-2">
                <MentionInput
                  value={bodyValue}
                  onChange={setBodyValue}
                  rows={8}
                  placeholder="Issue description..."
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingBody(false)}
                    className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-fg-muted)] cursor-pointer hover:bg-[var(--color-bg-overlay)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBody}
                    disabled={bodySaving}
                    className="rounded-md bg-[var(--color-blue)] px-2.5 py-1 text-[11px] font-medium text-white cursor-pointer hover:bg-[var(--color-blue)]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {bodySaving ? <Loader2 className="size-3 animate-spin" /> : "Save"}
                  </button>
                </div>
              </div>
            ) : detail.body ? (
              <MarkdownBody
                content={detail.body}
                className="text-[13px] text-[var(--color-fg)] leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-2 [&_h1]:text-[15px] [&_h1]:font-semibold [&_h1]:mb-2 [&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:mb-2 [&_ul]:pl-4 [&_ul]:list-disc [&_ol]:pl-4 [&_ol]:list-decimal"
              />
            ) : (
              <p className="text-[12px] text-[var(--color-fg-dim)] italic">
                No description provided.
              </p>
            )}
          </div>
        </div>

        {/* Comments */}
        {(detail.comments ?? []).map((c) => (
          <div
            key={c.id}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-raised)]"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
              <span className="text-[11px] font-medium text-[var(--color-fg-secondary)]">
                {c.author.login}
              </span>
              <span className="text-[10px] text-[var(--color-fg-dim)]">
                {timeFormat(c.createdAt)}
              </span>
            </div>
            {c.body && (
              <div className="px-3 py-3">
                <MarkdownBody
                  content={c.body}
                  className="text-[13px] text-[var(--color-fg)] leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-2 [&_ul]:pl-4 [&_ul]:list-disc [&_ol]:pl-4 [&_ol]:list-decimal"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comment input + close/reopen */}
      <div className="shrink-0 border-t border-[var(--color-border-strong)] px-5 py-3 bg-[var(--color-bg)]">
        <MentionInput
          value={comment}
          onChange={setComment}
          placeholder="Leave a comment... (@ to mention, Cmd+Enter to submit)"
          rows={2}
          onSubmit={handleSubmitComment}
        />
        <div className="flex items-center justify-between mt-2">
          <button
            type="button"
            onClick={() =>
              isOpen ? closeIssueAction(repo, comment.trim() || undefined) : reopenIssueAction(repo)
            }
            className={`
              rounded-md border px-3 py-1.5 text-[11px] font-medium cursor-pointer transition-colors
              ${
                isOpen
                  ? "border-[var(--color-red)]/20 text-[var(--color-red)] hover:bg-[var(--color-red)]/5"
                  : "border-[var(--color-green)]/20 text-[var(--color-green)] hover:bg-[var(--color-green)]/5"
              }
            `}
          >
            {isOpen ? "Close issue" : "Reopen issue"}
          </button>
          <button
            type="button"
            onClick={handleSubmitComment}
            disabled={!comment.trim() || submitting}
            className="rounded-md bg-[var(--color-blue)] px-3 py-1.5 text-[11px] font-medium text-white cursor-pointer hover:bg-[var(--color-blue)]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? <Loader2 className="size-3 animate-spin" /> : "Comment"}
          </button>
        </div>
      </div>
    </div>
  );
}

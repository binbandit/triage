import { useState } from "react";
import { Check, AlertTriangle, MessageSquare, Pencil, X, Loader2 } from "lucide-react";
import type { PullRequestDetail } from "../../types";
import { MarkdownBody } from "./MarkdownBody";
import { MentionInput } from "./MentionInput";

interface ConversationTabProps {
  pr: PullRequestDetail;
  repo: string;
  onComment: (body: string) => Promise<boolean>;
  onEditBody: (body: string) => Promise<boolean>;
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

function ReviewBadge({ state }: { state: string }) {
  if (state === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-green)]">
        <Check className="size-3" />
        approved
      </span>
    );
  }
  if (state === "CHANGES_REQUESTED") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-amber)]">
        <AlertTriangle className="size-3" />
        changes requested
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-fg-muted)]">
      <MessageSquare className="size-3" />
      commented
    </span>
  );
}

export function ConversationTab({ pr, onComment, onEditBody }: ConversationTabProps) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const [bodyValue, setBodyValue] = useState(pr.body);
  const [bodySaving, setBodySaving] = useState(false);

  // Build a unified timeline from comments and reviews
  type TimelineItem =
    | { type: "comment"; author: string; body: string; date: string }
    | { type: "review"; author: string; body: string; state: string; date: string };

  const timeline: TimelineItem[] = [];

  for (const c of pr.comments ?? []) {
    timeline.push({
      type: "comment",
      author: c.author.login,
      body: c.body,
      date: c.createdAt,
    });
  }

  for (const r of pr.reviews ?? []) {
    if (r.state === "PENDING") continue;
    timeline.push({
      type: "review",
      author: r.author.login,
      body: r.body || "",
      state: r.state,
      date: r.submittedAt,
    });
  }

  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleSubmitComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    const success = await onComment(comment.trim());
    if (success) setComment("");
    setSubmitting(false);
  };

  const handleSaveBody = async () => {
    setBodySaving(true);
    await onEditBody(bodyValue);
    setBodySaving(false);
    setEditingBody(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* PR body */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-raised)]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
            <span className="text-[11px] font-medium text-[var(--color-fg-secondary)]">
              {pr.author.login}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[var(--color-fg-dim)]">
                {timeFormat(pr.createdAt)}
              </span>
              {!editingBody && (
                <button
                  type="button"
                  onClick={() => {
                    setBodyValue(pr.body);
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
                  placeholder="PR description..."
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
            ) : pr.body ? (
              <MarkdownBody
                content={pr.body}
                className="text-[13px] text-[var(--color-fg)] leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-2 [&_h1]:text-[15px] [&_h1]:font-semibold [&_h1]:mb-2 [&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:mb-1 [&_ul]:pl-4 [&_ul]:list-disc [&_ol]:pl-4 [&_ol]:list-decimal [&_li]:mb-0.5"
              />
            ) : (
              <p className="text-[12px] text-[var(--color-fg-dim)] italic">
                No description provided.
              </p>
            )}
          </div>
        </div>

        {/* Timeline */}
        {timeline.map((item, i) => (
          <div
            key={`${item.type}-${item.date}-${i}`}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-raised)]"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[var(--color-fg-secondary)]">
                  {item.author}
                </span>
                {item.type === "review" && (
                  <ReviewBadge state={(item as TimelineItem & { state: string }).state} />
                )}
              </div>
              <span className="text-[10px] text-[var(--color-fg-dim)]">
                {timeFormat(item.date)}
              </span>
            </div>
            {item.body && (
              <div className="px-3 py-3">
                <MarkdownBody
                  content={item.body}
                  className="text-[13px] text-[var(--color-fg)] leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-2 [&_ul]:pl-4 [&_ul]:list-disc [&_ol]:pl-4 [&_ol]:list-decimal"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comment input */}
      {pr.state === "OPEN" && (
        <div className="shrink-0 border-t border-[var(--color-border-strong)] px-5 py-3 bg-[var(--color-bg)]">
          <MentionInput
            value={comment}
            onChange={setComment}
            placeholder="Leave a comment... (@ to mention, Cmd+Enter to submit)"
            rows={2}
            onSubmit={handleSubmitComment}
          />
          <div className="flex justify-end mt-2">
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
      )}
    </div>
  );
}

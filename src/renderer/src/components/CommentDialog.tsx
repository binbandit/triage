import { useState, useRef, useEffect } from "react";
import { X, GitMerge, XCircle, Loader2 } from "lucide-react";
import type { PullRequest } from "../types";

export type DialogAction = "close" | "merge";

interface CommentDialogProps {
  pr: PullRequest;
  action: DialogAction;
  onConfirm: (comment?: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function CommentDialog({
  pr,
  action,
  onConfirm,
  onCancel,
  loading = false,
}: CommentDialogProps) {
  const [comment, setComment] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    onConfirm(comment.trim() || undefined);
  };

  const isMerge = action === "merge";
  const actionLabel = isMerge ? "Merge" : "Close";
  const ActionIcon = isMerge ? GitMerge : XCircle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onCancel} aria-hidden="true" />

      <div className="relative w-full max-w-md rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg-raised)] p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ActionIcon
              className={`size-4 ${isMerge ? "text-[var(--color-purple)]" : "text-[var(--color-red)]"}`}
            />
            <h2 className="text-[14px] font-semibold text-[var(--color-fg)]">
              {actionLabel} PR #{pr.number}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-sm cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* PR title */}
        <p className="text-[12px] text-[var(--color-fg-muted)] mb-3 truncate">{pr.title}</p>

        {/* Comment textarea */}
        <div className="mb-4">
          <label
            htmlFor="pr-comment"
            className="block text-[12px] font-medium text-[var(--color-fg-secondary)] mb-1.5"
          >
            Comment <span className="text-[var(--color-fg-dim)] font-normal">(optional)</span>
          </label>
          <textarea
            ref={textareaRef}
            id="pr-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Reason for ${action === "merge" ? "merging" : "closing"}...`}
            rows={3}
            className="
              w-full rounded-lg
              border border-[var(--color-border)] bg-[var(--color-bg-inset)]
              px-3 py-2
              text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)]
              outline-none resize-none transition-colors
              focus:border-[var(--color-blue)]/40
            "
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              rounded-lg border border-[var(--color-border)] px-3 py-1.5
              text-[12px] font-medium text-[var(--color-fg-muted)] cursor-pointer
              hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-fg-secondary)]
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors
            "
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`
              rounded-lg px-3 py-1.5
              text-[12px] font-medium text-white cursor-pointer
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors
              ${
                isMerge
                  ? "bg-[var(--color-green)] hover:bg-[var(--color-green)]/80"
                  : "bg-[var(--color-red)] hover:bg-[var(--color-red)]/80"
              }
            `}
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

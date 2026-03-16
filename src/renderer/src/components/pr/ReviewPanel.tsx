import { useState } from "react";
import { Check, AlertTriangle, MessageSquare, Loader2 } from "lucide-react";
import type { ReviewEvent } from "../../types";
import { MentionInput } from "./MentionInput";

interface ReviewPanelProps {
  onSubmit: (event: ReviewEvent, body?: string) => Promise<boolean>;
}

const EVENTS: {
  value: ReviewEvent;
  label: string;
  icon: typeof Check;
  color: string;
  description: string;
}[] = [
  {
    value: "COMMENT",
    label: "Comment",
    icon: MessageSquare,
    color: "var(--color-fg-secondary)",
    description: "General feedback without explicit approval.",
  },
  {
    value: "APPROVE",
    label: "Approve",
    icon: Check,
    color: "var(--color-green)",
    description: "Approve merging these changes.",
  },
  {
    value: "REQUEST_CHANGES",
    label: "Request changes",
    icon: AlertTriangle,
    color: "var(--color-amber)",
    description: "Changes must be addressed before merging.",
  },
];

export function ReviewPanel({ onSubmit }: ReviewPanelProps) {
  const [event, setEvent] = useState<ReviewEvent>("COMMENT");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    if (event === "REQUEST_CHANGES" && !body.trim()) return;
    setSubmitting(true);
    const success = await onSubmit(event, body.trim() || undefined);
    if (success) {
      setBody("");
      setOpen(false);
    }
    setSubmitting(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] cursor-pointer hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-fg-secondary)] transition-colors"
      >
        Review
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-raised)] p-4 space-y-3">
      <MentionInput
        value={body}
        onChange={setBody}
        placeholder="Leave a review comment... (@ to mention)"
        rows={3}
        onSubmit={handleSubmit}
      />

      {/* Event selection */}
      <div className="space-y-1.5">
        {EVENTS.map((e) => {
          const Icon = e.icon;
          return (
            <button
              key={e.value}
              type="button"
              onClick={() => setEvent(e.value)}
              className={`
                w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-left cursor-pointer transition-colors
                ${event === e.value ? "bg-[var(--color-bg-overlay)] border border-[var(--color-border-strong)]" : "hover:bg-[var(--color-bg-inset)]"}
              `}
            >
              <Icon className="size-3.5 shrink-0" style={{ color: e.color }} />
              <div>
                <p className="text-[12px] font-medium text-[var(--color-fg)]">{e.label}</p>
                <p className="text-[10px] text-[var(--color-fg-dim)]">{e.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] cursor-pointer hover:bg-[var(--color-bg-overlay)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || (event === "REQUEST_CHANGES" && !body.trim())}
          className="rounded-md bg-[var(--color-blue)] px-3 py-1.5 text-[11px] font-medium text-white cursor-pointer hover:bg-[var(--color-blue)]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? <Loader2 className="size-3 animate-spin" /> : "Submit review"}
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Check, AlertTriangle, MessageSquare, Loader2, X } from "lucide-react";
import type { ReviewEvent } from "../../types";
import { MentionInput } from "./MentionInput";
import { cn } from "../../lib/cn";

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
      setEvent("COMMENT");
      setOpen(false);
    }
    setSubmitting(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] cursor-pointer hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-fg-secondary)] transition-colors"
      >
        Review
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setOpen(false)} aria-hidden="true" />

          <div className="relative w-full max-w-md rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg-raised)] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <h2 className="text-[14px] font-semibold text-[var(--color-fg)]">Submit review</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-sm cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)] transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 pb-3">
              <MentionInput
                value={body}
                onChange={setBody}
                placeholder="Leave a review comment... (@ to mention)"
                rows={4}
                onSubmit={handleSubmit}
              />
            </div>

            {/* Event selection */}
            <div className="px-5 pb-3 space-y-1">
              {EVENTS.map((e) => {
                const Icon = e.icon;
                const isActive = event === e.value;
                return (
                  <button
                    key={e.value}
                    type="button"
                    onClick={() => setEvent(e.value)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left cursor-pointer transition-colors",
                      isActive
                        ? "bg-[var(--color-bg-overlay)] border border-[var(--color-border-strong)]"
                        : "border border-transparent hover:bg-[var(--color-bg-inset)]",
                    )}
                  >
                    {/* Radio circle */}
                    <span
                      className={cn(
                        "size-4 shrink-0 rounded-full border-[1.5px] flex items-center justify-center transition-colors",
                        isActive ? "border-[var(--color-blue)]" : "border-[var(--color-fg-dim)]",
                      )}
                    >
                      {isActive && <span className="size-2 rounded-full bg-[var(--color-blue)]" />}
                    </span>
                    <Icon className="size-3.5 shrink-0" style={{ color: e.color }} />
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-[var(--color-fg)]">{e.label}</p>
                      <p className="text-[10px] text-[var(--color-fg-dim)]">{e.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--color-border)]">
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
                className={cn(
                  "rounded-md px-3 py-1.5 text-[11px] font-medium cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                  event === "APPROVE"
                    ? "bg-[var(--color-green)] text-white hover:bg-[var(--color-green)]/80"
                    : event === "REQUEST_CHANGES"
                      ? "bg-[var(--color-amber)] text-white hover:bg-[var(--color-amber)]/80"
                      : "bg-[var(--color-blue)] text-white hover:bg-[var(--color-blue)]/80",
                )}
              >
                {submitting ? <Loader2 className="size-3 animate-spin" /> : "Submit review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { MessageSquare, GitCommit, FileCode, Loader2, AlertCircle, X } from "lucide-react";
import { usePRDetailStore } from "../../stores/prDetailStore";
import { PRHeader } from "./PRHeader";
import { ConversationTab } from "./ConversationTab";
import { CommitsTab } from "./CommitsTab";
import { ChangesTab } from "./ChangesTab";
import { ReviewPanel } from "./ReviewPanel";

interface PRDetailViewProps {
  repo: string;
}

const TAB_CONFIG = [
  { id: "conversation" as const, label: "Conversation", icon: MessageSquare },
  { id: "commits" as const, label: "Commits", icon: GitCommit },
  { id: "changes" as const, label: "Changes", icon: FileCode },
];

export function PRDetailView({ repo }: PRDetailViewProps) {
  const detail = usePRDetailStore((s) => s.detail);
  const filesWithPatch = usePRDetailStore((s) => s.filesWithPatch);
  const loading = usePRDetailStore((s) => s.loading);
  const error = usePRDetailStore((s) => s.error);
  const tab = usePRDetailStore((s) => s.tab);
  const actionError = usePRDetailStore((s) => s.actionError);
  const setTab = usePRDetailStore((s) => s.setTab);
  const closePR = usePRDetailStore((s) => s.closePR);
  const clearActionError = usePRDetailStore((s) => s.clearActionError);
  const addComment = usePRDetailStore((s) => s.addComment);
  const editTitle = usePRDetailStore((s) => s.editTitle);
  const editBody = usePRDetailStore((s) => s.editBody);
  const addLabels = usePRDetailStore((s) => s.addLabels);
  const removeLabels = usePRDetailStore((s) => s.removeLabels);
  const submitReview = usePRDetailStore((s) => s.submitReview);
  const toggleDraft = usePRDetailStore((s) => s.toggleDraft);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="size-5 text-[var(--color-fg-dim)] animate-spin mb-4" />
        <p className="text-[13px] text-[var(--color-fg-muted)]">Loading pull request...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle className="size-5 text-[var(--color-red)]/60 mb-4" />
        <p className="text-[13px] text-[var(--color-fg-secondary)] font-medium mb-1">
          Failed to load PR
        </p>
        <p className="text-[12px] text-[var(--color-fg-muted)] max-w-xs text-center">{error}</p>
        <button
          type="button"
          onClick={closePR}
          className="mt-4 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] cursor-pointer hover:bg-[var(--color-bg-overlay)] transition-colors"
        >
          Back to list
        </button>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="flex flex-col h-full">
      {/* PR Header */}
      <PRHeader
        pr={detail}
        repo={repo}
        onBack={closePR}
        onEditTitle={(title) => editTitle(repo, title)}
        onAddLabel={(label) => addLabels(repo, [label])}
        onRemoveLabel={(label) => removeLabels(repo, [label])}
        onToggleDraft={() => toggleDraft(repo)}
      />

      {/* Tab bar + review */}
      <div className="shrink-0 flex items-center justify-between border-b border-[var(--color-border)] px-4 bg-[var(--color-bg)]">
        <div className="flex items-center gap-0.5">
          {TAB_CONFIG.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            let badge: string | undefined;
            if (t.id === "conversation")
              badge = String((detail.comments?.length ?? 0) + (detail.reviews?.length ?? 0));
            if (t.id === "commits") badge = String(detail.commits?.length ?? 0);
            if (t.id === "changes") badge = String(detail.changedFiles ?? 0);

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium cursor-pointer transition-colors border-b-2
                  ${isActive ? "border-[var(--color-blue)] text-[var(--color-fg)]" : "border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg-secondary)]"}
                `}
              >
                <Icon className="size-3.5" />
                {t.label}
                {badge && badge !== "0" && (
                  <span className="text-[10px] font-mono text-[var(--color-fg-dim)] tabular-nums">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Review button */}
        {detail.state === "OPEN" && (
          <ReviewPanel onSubmit={(event, body) => submitReview(repo, event, body)} />
        )}
      </div>

      {/* Action error banner */}
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

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === "conversation" && (
          <ConversationTab
            pr={detail}
            repo={repo}
            onComment={(body) => addComment(repo, body)}
            onEditBody={(body) => editBody(repo, body)}
          />
        )}
        {tab === "commits" && <CommitsTab pr={detail} repo={repo} />}
        {tab === "changes" && (
          <ChangesTab files={filesWithPatch} repo={repo} prNumber={detail.number} />
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { CheckSquare, Square, XCircle, Tag, Loader2, X } from "lucide-react";
import { useBulkActionsStore } from "../stores/bulkActionsStore";
import { usePRStore } from "../stores/prStore";
import { useSettingsStore } from "../stores/settingsStore";

export function BulkActionBar() {
  const bulkMode = useBulkActionsStore((s) => s.bulkMode);
  const selectedPRs = useBulkActionsStore((s) => s.selectedPRs);
  const actionLoading = useBulkActionsStore((s) => s.actionLoading);
  const actionError = useBulkActionsStore((s) => s.actionError);
  const toggleBulkMode = useBulkActionsStore((s) => s.toggleBulkMode);
  const clearSelection = useBulkActionsStore((s) => s.clearSelection);
  const selectAll = useBulkActionsStore((s) => s.selectAll);
  const bulkClose = useBulkActionsStore((s) => s.bulkClose);
  const bulkAddLabel = useBulkActionsStore((s) => s.bulkAddLabel);

  const prs = usePRStore((s) => s.prs);
  const repo = useSettingsStore((s) => s.repo);

  const [labelInput, setLabelInput] = useState("");
  const [showLabelInput, setShowLabelInput] = useState(false);

  const openPRNumbers = prs.filter((pr) => pr.state === "OPEN").map((pr) => pr.number);

  if (!bulkMode) {
    return (
      <button
        type="button"
        onClick={toggleBulkMode}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-[var(--color-fg-dim)] cursor-pointer border border-[var(--color-border)] hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-fg-secondary)] transition-colors"
        title="Select multiple PRs for bulk actions"
      >
        <CheckSquare className="size-3" />
        Bulk
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 pb-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() =>
            selectedPRs.size === openPRNumbers.length ? clearSelection() : selectAll(openPRNumbers)
          }
          className="p-1 cursor-pointer text-[var(--color-fg-muted)] hover:text-[var(--color-fg-secondary)] transition-colors"
          title={selectedPRs.size === openPRNumbers.length ? "Deselect all" : "Select all open PRs"}
        >
          {selectedPRs.size === openPRNumbers.length ? (
            <CheckSquare className="size-3.5" />
          ) : (
            <Square className="size-3.5" />
          )}
        </button>
        <span className="text-[10px] text-[var(--color-fg-muted)] tabular-nums font-mono">
          {selectedPRs.size} selected
        </span>
      </div>

      {selectedPRs.size > 0 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => bulkClose(repo)}
            disabled={actionLoading}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[var(--color-red)] border border-[var(--color-red)]/20 cursor-pointer hover:bg-[var(--color-red)]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <XCircle className="size-3" />
            )}
            Close
          </button>

          {showLabelInput ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && labelInput.trim()) {
                    bulkAddLabel(repo, labelInput.trim());
                    setLabelInput("");
                    setShowLabelInput(false);
                  }
                  if (e.key === "Escape") setShowLabelInput(false);
                }}
                placeholder="Label name"
                className="w-24 rounded border border-[var(--color-blue)]/40 bg-[var(--color-bg-inset)] px-1.5 py-0.5 text-[10px] text-[var(--color-fg)] outline-none"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLabelInput(true)}
              disabled={actionLoading}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[var(--color-fg-muted)] border border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-bg-overlay)] disabled:opacity-40 transition-colors"
            >
              <Tag className="size-3" />
              Label
            </button>
          )}
        </div>
      )}

      {actionError && <span className="text-[10px] text-[var(--color-red)]">{actionError}</span>}

      <div className="flex-1" />
      <button
        type="button"
        onClick={toggleBulkMode}
        className="p-1 cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)] transition-colors"
        title="Exit bulk mode"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

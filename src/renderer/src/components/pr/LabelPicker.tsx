import { useState, useEffect, useMemo } from "react";
import { Plus, Tag, X, Check, Loader2, Search } from "lucide-react";
import type { PRLabel, RepoLabel } from "../../types";
import { labelColors } from "../../lib/color";

interface LabelPickerProps {
  currentLabels: PRLabel[];
  repo: string;
  onAdd: (label: string) => Promise<boolean>;
  onRemove: (label: string) => Promise<boolean>;
}

export function LabelPicker({ currentLabels, repo, onAdd, onRemove }: LabelPickerProps) {
  const [open, setOpen] = useState(false);
  const [repoLabels, setRepoLabels] = useState<RepoLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!open || repoLabels.length > 0) return;
    setLoading(true);
    window.api
      .repoLabels({ repo })
      .then((result) => {
        if (Array.isArray(result)) {
          setRepoLabels(result as RepoLabel[]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, repo, repoLabels.length]);

  const currentNames = useMemo(
    () => new Set(currentLabels.map((l) => l.name.toLowerCase())),
    [currentLabels],
  );

  const filtered = useMemo(() => {
    if (!filter.trim()) return repoLabels;
    const q = filter.toLowerCase();
    return repoLabels.filter((l) => l.name.toLowerCase().includes(q));
  }, [repoLabels, filter]);

  const handleToggle = async (label: RepoLabel) => {
    if (currentNames.has(label.name.toLowerCase())) {
      await onRemove(label.name);
    } else {
      await onAdd(label.name);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-0.5 rounded-md border border-dashed border-[var(--color-border)] px-1.5 py-0.5 text-[10px] text-[var(--color-fg-dim)] cursor-pointer hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg-muted)] transition-colors"
      >
        <Plus className="size-2.5" />
        <Tag className="size-2.5" />
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Trigger (close) */}
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setFilter("");
        }}
        className="inline-flex items-center gap-0.5 rounded-md border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/5 px-1.5 py-0.5 text-[10px] text-[var(--color-blue)] cursor-pointer transition-colors"
      >
        <X className="size-2.5" />
        Done
      </button>

      {/* Dropdown */}
      <div className="absolute left-0 top-full mt-1 z-50 w-56 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-raised)] shadow-xl overflow-hidden">
        {/* Search */}
        <div className="relative border-b border-[var(--color-border)]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-[var(--color-fg-dim)] pointer-events-none" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter labels..."
            className="w-full bg-transparent pl-7 pr-3 py-2 text-[11px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] outline-none"
          />
        </div>

        {/* Label list */}
        <div className="max-h-48 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-3.5 animate-spin text-[var(--color-fg-dim)]" />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="py-3 text-center text-[11px] text-[var(--color-fg-dim)]">
              No labels found
            </p>
          )}
          {!loading &&
            filtered.map((label) => {
              const isActive = currentNames.has(label.name.toLowerCase());
              const colors = label.color ? labelColors(label.color) : null;
              return (
                <button
                  key={label.name}
                  type="button"
                  onClick={() => handleToggle(label)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left cursor-pointer hover:bg-[var(--color-bg-overlay)] transition-colors"
                >
                  <div className="size-3.5 shrink-0 flex items-center justify-center">
                    {isActive && <Check className="size-3 text-[var(--color-blue)]" />}
                  </div>
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={
                      colors
                        ? { backgroundColor: colors.fg }
                        : { backgroundColor: "var(--color-fg-dim)" }
                    }
                  />
                  <span className="text-[11px] text-[var(--color-fg)] truncate">{label.name}</span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

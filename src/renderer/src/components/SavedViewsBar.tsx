import { useState } from "react";
import { Bookmark, Plus, X, Loader2 } from "lucide-react";
import { useSavedViewsStore, type SavedView } from "../stores/savedViewsStore";
import { cn } from "../lib/cn";

export function SavedViewsBar() {
  const views = useSavedViewsStore((s) => s.views);
  const activeViewId = useSavedViewsStore((s) => s.activeViewId);
  const setActiveView = useSavedViewsStore((s) => s.setActiveView);
  const addView = useSavedViewsStore((s) => s.addView);
  const deleteView = useSavedViewsStore((s) => s.deleteView);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    addView({
      id: `view-${Date.now()}`,
      name: newName.trim(),
      query: "",
      assignedToMe: false,
      reviewRequested: false,
      staleOnly: false,
      staleDays: 14,
      labels: [],
      states: ["OPEN"],
    });
    setNewName("");
    setAdding(false);
  };

  return (
    <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto">
      <Bookmark className="size-3 text-[var(--color-fg-dim)] shrink-0" />
      {views.map((view) => (
        <button
          key={view.id}
          type="button"
          onClick={() => setActiveView(activeViewId === view.id ? null : view.id)}
          className={cn(
            "shrink-0 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium cursor-pointer transition-colors",
            activeViewId === view.id
              ? "bg-[var(--color-blue)]/10 text-[var(--color-blue)] border border-[var(--color-blue)]/20"
              : "text-[var(--color-fg-muted)] border border-[var(--color-border)] hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-fg-secondary)]",
          )}
        >
          {view.name}
          {view.id.startsWith("view-") && activeViewId === view.id && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteView(view.id);
              }}
              className="hover:text-[var(--color-red)] cursor-pointer"
            >
              <X className="size-2.5" />
            </button>
          )}
        </button>
      ))}
      {adding ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="View name"
            className="w-24 rounded border border-[var(--color-blue)]/40 bg-[var(--color-bg-inset)] px-1.5 py-0.5 text-[10px] text-[var(--color-fg)] outline-none"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="shrink-0 p-1 rounded-md text-[var(--color-fg-dim)] cursor-pointer hover:text-[var(--color-fg-secondary)] hover:bg-[var(--color-bg-overlay)] transition-colors"
          title="Add saved view"
        >
          <Plus className="size-3" />
        </button>
      )}
    </div>
  );
}

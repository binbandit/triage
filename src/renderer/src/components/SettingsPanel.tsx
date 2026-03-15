import { useState, type KeyboardEvent } from "react";
import { X, Plus, Tag } from "lucide-react";
import type { Settings } from "../types";

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (updater: (prev: Settings) => Settings) => void;
  onClose: () => void;
}

export function SettingsPanel({ settings, onSettingsChange, onClose }: SettingsPanelProps) {
  const [labelInput, setLabelInput] = useState("");

  const addLabel = () => {
    const trimmed = labelInput.trim().toLowerCase();
    if (trimmed && !settings.requiredLabels.includes(trimmed)) {
      onSettingsChange((prev) => ({
        ...prev,
        requiredLabels: [...prev.requiredLabels, trimmed],
      }));
    }
    setLabelInput("");
  };

  const removeLabel = (label: string) => {
    onSettingsChange((prev) => ({
      ...prev,
      requiredLabels: prev.requiredLabels.filter((l) => l !== label),
    }));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLabel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-raised p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-foreground">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-dim hover:text-muted-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Required Labels */}
        <div className="space-y-3">
          <div>
            <label
              htmlFor="label-input"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-2"
            >
              <Tag className="size-3.5" />
              Required labels
            </label>
            <p className="text-xs text-dim mb-3">
              PRs with all required labels will be highlighted. Others will appear dimmed.
            </p>
            <div className="flex gap-2">
              <input
                id="label-input"
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. needs-review"
                className="flex-1 rounded-lg border border-border bg-surface pl-3 pr-3 py-2 text-sm text-foreground placeholder:text-dim outline-none transition-colors focus:border-accent"
              />
              <button
                type="button"
                onClick={addLabel}
                disabled={!labelInput.trim()}
                className="shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted-foreground hover:bg-surface-overlay hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {/* Label list */}
          {settings.requiredLabels.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {settings.requiredLabels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2.5 py-1 text-xs font-medium text-accent"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => removeLabel(label)}
                    className="hover:text-foreground transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { X, Moon, Sun } from "lucide-react";
import type { Settings, Theme } from "../types";

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (updater: (prev: Settings) => Settings) => void;
  onClose: () => void;
}

export function SettingsPanel({ settings, onSettingsChange, onClose }: SettingsPanelProps) {
  const setTheme = (theme: Theme) => {
    onSettingsChange((prev) => ({ ...prev, theme }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-sm rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg-raised)] p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[14px] font-semibold text-[var(--color-fg)]">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-sm cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Theme */}
        <div>
          <p className="text-[12px] font-medium text-[var(--color-fg-secondary)] mb-2.5">
            Appearance
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`
                flex-1 flex items-center justify-center gap-2
                rounded-lg border px-3 py-2 cursor-pointer
                text-[12px] font-medium transition-colors
                ${
                  settings.theme === "dark"
                    ? "border-[var(--color-blue)]/30 bg-[var(--color-blue)]/8 text-[var(--color-blue)]"
                    : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg-secondary)]"
                }
              `}
            >
              <Moon className="size-3.5" />
              Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`
                flex-1 flex items-center justify-center gap-2
                rounded-lg border px-3 py-2 cursor-pointer
                text-[12px] font-medium transition-colors
                ${
                  settings.theme === "light"
                    ? "border-[var(--color-blue)]/30 bg-[var(--color-blue)]/8 text-[var(--color-blue)]"
                    : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg-secondary)]"
                }
              `}
            >
              <Sun className="size-3.5" />
              Light
            </button>
          </div>
        </div>

        {/* Config hint */}
        <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
          <p className="text-[11px] text-[var(--color-fg-dim)] leading-relaxed">
            PR groups are configured via a{" "}
            <code className="font-mono text-[var(--color-fg-muted)] bg-[var(--color-bg-overlay)] px-1 py-px rounded">
              .triage.yml
            </code>{" "}
            file in the repository root.
          </p>
        </div>
      </div>
    </div>
  );
}

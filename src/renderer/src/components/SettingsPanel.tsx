import { X, Moon, Sun } from "lucide-react";
import { useSettingsStore } from "../stores/settingsStore";

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const theme = useSettingsStore((s) => s.theme);
  const inlinePRView = useSettingsStore((s) => s.inlinePRView);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setInlinePRView = useSettingsStore((s) => s.setInlinePRView);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
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
                  theme === "dark"
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
                  theme === "light"
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

        {/* Inline PR View */}
        <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-[var(--color-fg-secondary)]">
                Inline PR view
              </p>
              <p className="text-[11px] text-[var(--color-fg-dim)] mt-0.5">
                View PR details, diffs, and conversations without leaving the app.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInlinePRView(!inlinePRView)}
              className={`
                relative shrink-0 w-9 h-5 rounded-full cursor-pointer transition-colors
                ${inlinePRView ? "bg-[var(--color-blue)]" : "bg-[var(--color-fg-dim)]"}
              `}
              role="switch"
              aria-checked={inlinePRView}
            >
              <span
                className={`
                  absolute top-0.5 size-4 rounded-full bg-white transition-transform
                  ${inlinePRView ? "translate-x-[18px]" : "translate-x-0.5"}
                `}
              />
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

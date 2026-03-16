import { useState, useEffect } from "react";
import { X, Moon, Sun, Check, Loader2, FolderOpen } from "lucide-react";
import { useSettingsStore } from "../stores/settingsStore";
import { useConfigStore } from "../stores/configStore";
import { Switch } from "./ui/Switch";
import type { AuthAccount } from "../types";

interface SettingsPanelProps {
  onClose: () => void;
}

function ConfigSourceIndicator() {
  const configSource = useConfigStore((s) => s.configSource);
  const config = useConfigStore((s) => s.config);

  if (!config) {
    return <p className="text-[11px] text-[var(--color-fg-dim)]">No config loaded.</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="size-2 rounded-full shrink-0"
        style={{
          backgroundColor: configSource === "local" ? "var(--color-blue)" : "var(--color-green)",
        }}
      />
      <span className="text-[11px] text-[var(--color-fg-secondary)]">
        {configSource === "local" ? "Local config" : "Repo config"}
      </span>
      <span className="text-[10px] text-[var(--color-fg-dim)]">
        {config.groups.length} group{config.groups.length !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const theme = useSettingsStore((s) => s.theme);
  const inlinePRView = useSettingsStore((s) => s.inlinePRView);
  const interceptGitHubLinks = useSettingsStore((s) => s.interceptGitHubLinks);
  const experimentalCanvas = useSettingsStore((s) => s.experimentalCanvas);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setInlinePRView = useSettingsStore((s) => s.setInlinePRView);
  const setInterceptGitHubLinks = useSettingsStore((s) => s.setInterceptGitHubLinks);
  const setExperimentalCanvas = useSettingsStore((s) => s.setExperimentalCanvas);

  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    window.api
      .authAccounts()
      .then((result) => setAccounts(Array.isArray(result) ? result : []))
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false));
  }, []);

  const handleSwitch = async (account: AuthAccount) => {
    if (account.active || switching) return;
    setSwitching(account.login);
    try {
      await window.api.authSwitch({ hostname: account.host, user: account.login });
      setAccounts((prev) =>
        prev.map((a) => ({
          ...a,
          active: a.login === account.login && a.host === account.host,
        })),
      );
    } catch {
      // Silent fail
    } finally {
      setSwitching(null);
    }
  };

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

        {/* Account switcher */}
        <div className="mb-5">
          <p className="text-[12px] font-medium text-[var(--color-fg-secondary)] mb-2.5">Account</p>
          {accountsLoading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="size-3.5 animate-spin text-[var(--color-fg-dim)]" />
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-[11px] text-[var(--color-fg-dim)]">
              No accounts found. Run{" "}
              <code className="font-mono bg-[var(--color-bg-overlay)] px-1 py-px rounded">
                gh auth login
              </code>{" "}
              to authenticate.
            </p>
          ) : (
            <div className="space-y-1">
              {accounts.map((account) => (
                <button
                  key={`${account.host}-${account.login}`}
                  type="button"
                  onClick={() => handleSwitch(account)}
                  disabled={account.active || switching !== null}
                  className={`
                    w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors
                    ${
                      account.active
                        ? "bg-[var(--color-blue)]/5 border border-[var(--color-blue)]/20 cursor-default"
                        : "border border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-bg-overlay)] disabled:opacity-50 disabled:cursor-not-allowed"
                    }
                  `}
                >
                  <img
                    src={account.avatarUrl}
                    alt=""
                    className="size-8 rounded-full shrink-0 bg-[var(--color-bg-overlay)]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[var(--color-fg)] truncate">
                      {account.login}
                    </p>
                    <p className="text-[10px] text-[var(--color-fg-dim)] truncate">
                      {account.host}
                    </p>
                  </div>
                  {switching === account.login ? (
                    <Loader2 className="size-3.5 animate-spin text-[var(--color-fg-dim)] shrink-0" />
                  ) : account.active ? (
                    <Check className="size-3.5 text-[var(--color-blue)] shrink-0" />
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme */}
        <div className="pt-4 border-t border-[var(--color-border)]">
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
            <Switch checked={inlinePRView} onCheckedChange={setInlinePRView} />
          </div>
        </div>

        {/* Intercept GitHub Links */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-[var(--color-fg-secondary)]">
                Intercept GitHub links
              </p>
              <p className="text-[11px] text-[var(--color-fg-dim)] mt-0.5">
                Open GitHub PR and issue links inside the app instead of the browser.
              </p>
            </div>
            <Switch checked={interceptGitHubLinks} onCheckedChange={setInterceptGitHubLinks} />
          </div>
        </div>

        {/* Experimental */}
        <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
          <p className="text-[12px] font-medium text-[var(--color-fg-secondary)] mb-2.5">
            Experimental
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-[var(--color-fg-secondary)]">
                Canvas view
              </p>
              <p className="text-[11px] text-[var(--color-fg-dim)] mt-0.5">
                Infinite canvas to visually map PRs, issues, and their relationships.
              </p>
            </div>
            <Switch checked={experimentalCanvas} onCheckedChange={setExperimentalCanvas} />
          </div>
        </div>

        {/* Config source */}
        <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
          <p className="text-[12px] font-medium text-[var(--color-fg-secondary)] mb-2">
            Configuration
          </p>
          <ConfigSourceIndicator />
          <div className="flex items-center gap-2 mt-2.5">
            <button
              type="button"
              onClick={() => window.api.openLocalConfigDir()}
              className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] cursor-pointer hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-fg-secondary)] transition-colors"
            >
              <FolderOpen className="size-3" />
              Open config folder
            </button>
          </div>
          <p className="text-[10px] text-[var(--color-fg-dim)] mt-2 leading-relaxed">
            Local config at{" "}
            <code className="font-mono bg-[var(--color-bg-overlay)] px-1 py-px rounded">
              ~/.config/triage/triage.yaml
            </code>{" "}
            overrides repo{" "}
            <code className="font-mono bg-[var(--color-bg-overlay)] px-1 py-px rounded">
              .triage.yml
            </code>
            . Define per-repo groups using{" "}
            <code className="font-mono bg-[var(--color-bg-overlay)] px-1 py-px rounded">
              owner/repo:
            </code>{" "}
            keys.
          </p>
        </div>
      </div>
    </div>
  );
}

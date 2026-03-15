import { useState, useEffect, useMemo, useCallback, type KeyboardEvent } from "react";
import { Settings as SettingsIcon, RefreshCw } from "lucide-react";
import { useSettings } from "./hooks/useSettings";
import { usePRs } from "./hooks/usePRs";
import { useTriageConfig } from "./hooks/useTriageConfig";
import { SearchBar } from "./components/SearchBar";
import { PRRow } from "./components/PRRow";
import { GroupSection } from "./components/GroupSection";
import { SettingsPanel } from "./components/SettingsPanel";
import { EmptyState } from "./components/EmptyState";
import type { PullRequest, LabelGroup } from "./types";

/* ── Helpers ──────────────────────────────────────── */

function filterPRs(prs: PullRequest[], query: string): PullRequest[] {
  if (!query.trim()) return prs;
  const q = query.toLowerCase();
  return prs.filter((pr) => {
    if (pr.title.toLowerCase().includes(q)) return true;
    if (pr.author.login.toLowerCase().includes(q)) return true;
    if (`#${pr.number}`.includes(q)) return true;
    if (pr.labels.some((l) => l.name.toLowerCase().includes(q))) return true;
    return false;
  });
}

function prMatchesGroup(pr: PullRequest, group: LabelGroup): boolean {
  const names = pr.labels.map((l) => l.name.toLowerCase());
  return group.labels.every((gl) => names.includes(gl.toLowerCase()));
}

function groupPRs(
  prs: PullRequest[],
  groups: LabelGroup[],
): { grouped: { group: LabelGroup; prs: PullRequest[] }[]; ungrouped: PullRequest[] } {
  const assigned = new Set<number>();
  const grouped = groups.map((group) => {
    const matching = prs.filter((pr) => {
      if (assigned.has(pr.number)) return false;
      return prMatchesGroup(pr, group);
    });
    for (const pr of matching) assigned.add(pr.number);
    return { group, prs: matching };
  });
  const ungrouped = prs.filter((pr) => !assigned.has(pr.number));
  return { grouped, ungrouped };
}

/* ── App ──────────────────────────────────────────── */

export default function App() {
  const [settings, setSettings] = useSettings();
  const { prs, loading, error, fetchPRs } = usePRs();
  const { config, fetchConfig } = useTriageConfig();
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [repoInput, setRepoInput] = useState(settings.repo);

  const loadRepo = useCallback(
    (repo: string) => {
      if (!repo) return;
      fetchPRs(repo);
      fetchConfig(repo);
    },
    [fetchPRs, fetchConfig],
  );

  // Load on repo change
  useEffect(() => {
    loadRepo(settings.repo);
  }, [settings.repo, loadRepo]);

  // Sync input to settings
  useEffect(() => {
    setRepoInput(settings.repo);
  }, [settings.repo]);

  const handleRepoSubmit = () => {
    const trimmed = repoInput.trim();
    if (trimmed !== settings.repo) {
      setSettings((prev) => ({ ...prev, repo: trimmed }));
    } else if (trimmed) {
      loadRepo(trimmed);
    }
  };

  const handleRepoKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRepoSubmit();
    }
  };

  const filtered = useMemo(() => filterPRs(prs, search), [prs, search]);

  const groups = useMemo(() => config?.groups ?? [], [config]);
  const { grouped, ungrouped } = useMemo(() => groupPRs(filtered, groups), [filtered, groups]);

  const hasGroups = groups.length > 0;
  const hasResults = filtered.length > 0;

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)] text-[var(--color-fg)]">
      {/* macOS drag region */}
      <div className="drag-region h-7 shrink-0" />

      {/* Header */}
      <header className="shrink-0 border-b border-[var(--color-border-strong)] no-drag">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-2.5">
          {/* Repo input */}
          <input
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            onKeyDown={handleRepoKeyDown}
            onBlur={handleRepoSubmit}
            placeholder="owner/repo"
            spellCheck={false}
            className="
              flex-1 min-w-0
              bg-transparent border-none outline-none
              text-[13px] font-mono text-[var(--color-fg)]
              placeholder:text-[var(--color-fg-dim)]
            "
          />

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {settings.repo && (
              <span className="text-[11px] text-[var(--color-fg-dim)] font-mono tabular-nums mr-1.5">
                {loading ? "..." : filtered.length}
              </span>
            )}
            <button
              type="button"
              onClick={() => loadRepo(settings.repo)}
              disabled={loading || !settings.repo}
              className="
                p-1.5 rounded-md cursor-pointer
                text-[var(--color-fg-dim)]
                hover:text-[var(--color-fg-secondary)] hover:bg-[var(--color-bg-overlay)]
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-colors
              "
              aria-label="Refresh"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="
                p-1.5 rounded-md cursor-pointer
                text-[var(--color-fg-dim)]
                hover:text-[var(--color-fg-secondary)] hover:bg-[var(--color-bg-overlay)]
                transition-colors
              "
              aria-label="Settings"
            >
              <SettingsIcon className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Search */}
        {settings.repo && (
          <div className="px-4 pb-2.5">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {!settings.repo && <EmptyState type="no-repo" />}
        {settings.repo && loading && prs.length === 0 && <EmptyState type="loading" />}
        {settings.repo && error && <EmptyState type="error" message={error} />}
        {settings.repo && !loading && !error && prs.length === 0 && <EmptyState type="empty" />}
        {settings.repo && !error && !hasResults && prs.length > 0 && (
          <EmptyState type="empty" message="No PRs match your filter." />
        )}

        {/* Grouped view */}
        {hasResults && hasGroups && (
          <div>
            {grouped.map(
              ({ group, prs: groupPrs }) =>
                groupPrs.length > 0 && (
                  <GroupSection
                    key={group.name}
                    name={group.name}
                    prs={groupPrs}
                    repo={settings.repo}
                    highlightLabels={group.labels}
                  />
                ),
            )}
            {ungrouped.length > 0 && (
              <GroupSection
                name="other"
                prs={ungrouped}
                repo={settings.repo}
                defaultOpen={groups.length === 0}
              />
            )}
          </div>
        )}

        {/* Flat view (no config) */}
        {hasResults && !hasGroups && (
          <div>
            {filtered.map((pr) => (
              <PRRow key={pr.number} pr={pr} repo={settings.repo} />
            ))}
          </div>
        )}
      </main>

      {/* Settings modal */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

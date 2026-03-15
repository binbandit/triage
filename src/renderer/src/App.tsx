import { useState, useEffect, useMemo, useCallback, type KeyboardEvent } from "react";
import { Settings as SettingsIcon, RefreshCw, GitBranch } from "lucide-react";
import { useSettings } from "./hooks/useSettings";
import { usePRs } from "./hooks/usePRs";
import { SearchBar } from "./components/SearchBar";
import { PRRow } from "./components/PRRow";
import { SettingsPanel } from "./components/SettingsPanel";
import { EmptyState } from "./components/EmptyState";
import type { PullRequest } from "./types";

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

function sortPRs(prs: PullRequest[], requiredLabels: string[]): PullRequest[] {
  if (requiredLabels.length === 0) return prs;

  return prs.toSorted((a, b) => {
    const aLabels = a.labels.map((l) => l.name.toLowerCase());
    const bLabels = b.labels.map((l) => l.name.toLowerCase());
    const aMatch = requiredLabels.every((rl) => aLabels.includes(rl.toLowerCase()));
    const bMatch = requiredLabels.every((rl) => bLabels.includes(rl.toLowerCase()));

    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });
}

export default function App() {
  const [settings, setSettings] = useSettings();
  const { prs, loading, error, fetchPRs } = usePRs();
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [repoInput, setRepoInput] = useState(settings.repo);

  const loadPRs = useCallback(() => {
    if (settings.repo) {
      fetchPRs(settings.repo);
    }
  }, [settings.repo, fetchPRs]);

  // Fetch PRs when repo changes in settings
  useEffect(() => {
    loadPRs();
  }, [loadPRs]);

  // Keep repoInput in sync when settings change externally
  useEffect(() => {
    setRepoInput(settings.repo);
  }, [settings.repo]);

  const handleRepoSubmit = () => {
    const trimmed = repoInput.trim();
    if (trimmed !== settings.repo) {
      setSettings((prev) => ({ ...prev, repo: trimmed }));
    } else if (trimmed) {
      // Same repo, still allow refresh
      fetchPRs(trimmed);
    }
  };

  const handleRepoKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRepoSubmit();
    }
  };

  const filtered = useMemo(() => filterPRs(prs, search), [prs, search]);
  const sorted = useMemo(
    () => sortPRs(filtered, settings.requiredLabels),
    [filtered, settings.requiredLabels],
  );

  const prCount = prs.length;
  const filteredCount = sorted.length;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Title bar drag region */}
      <div className="drag-region h-8 shrink-0 border-b border-border-subtle" />

      {/* Header */}
      <header className="shrink-0 border-b border-border px-4 py-3 space-y-3 no-drag">
        {/* Top row: repo input + actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GitBranch className="size-4 text-dim shrink-0" />
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              onKeyDown={handleRepoKeyDown}
              onBlur={handleRepoSubmit}
              placeholder="owner/repo"
              className="flex-1 min-w-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground font-mono placeholder:text-dim outline-none transition-colors focus:border-accent focus:bg-surface-raised"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {settings.repo && (
              <span className="text-xs text-dim tabular-nums mr-2">
                {loading ? "..." : search ? `${filteredCount}/${prCount}` : prCount} PRs
              </span>
            )}
            <button
              type="button"
              onClick={loadPRs}
              disabled={loading || !settings.repo}
              className="p-2 rounded-lg text-dim hover:text-muted-foreground hover:bg-surface-overlay disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg text-dim hover:text-muted-foreground hover:bg-surface-overlay transition-colors"
              aria-label="Settings"
            >
              <SettingsIcon className="size-4" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        {settings.repo && <SearchBar value={search} onChange={setSearch} />}
      </header>

      {/* PR List */}
      <main className="flex-1 overflow-y-auto">
        {!settings.repo && <EmptyState type="no-repo" />}
        {settings.repo && loading && prs.length === 0 && <EmptyState type="loading" />}
        {settings.repo && error && <EmptyState type="error" message={error} />}
        {settings.repo && !loading && !error && prs.length === 0 && <EmptyState type="empty" />}
        {settings.repo && !error && sorted.length === 0 && prs.length > 0 && (
          <EmptyState type="empty" message="No PRs match your filter." />
        )}
        {sorted.length > 0 && (
          <div>
            {sorted.map((pr) => (
              <PRRow
                key={pr.number}
                pr={pr}
                requiredLabels={settings.requiredLabels}
                repo={settings.repo}
              />
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

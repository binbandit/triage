import { useState, useEffect, useMemo, useCallback, type KeyboardEvent } from "react";
import { Settings as SettingsIcon, RefreshCw, GitFork, List, Columns3 } from "lucide-react";
import { useSettings } from "./hooks/useSettings";
import { usePRs } from "./hooks/usePRs";
import { useTriageConfig } from "./hooks/useTriageConfig";
import { filterPRs, groupPRs } from "./lib/prHelpers";
import { classifyError } from "./lib/errorUtils";
import { SearchBar } from "./components/SearchBar";
import { PRRow } from "./components/PRRow";
import { GroupSection } from "./components/GroupSection";
import { KanbanView } from "./components/KanbanView";
import { SettingsPanel } from "./components/SettingsPanel";
import { EmptyState } from "./components/EmptyState";
import type { ViewMode } from "./types";

/* ── View toggle button ───────────────────────────── */

function ViewToggleButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`
        p-1.5 cursor-pointer transition-colors first:rounded-l-[5px] last:rounded-r-[5px]
        ${
          active
            ? "bg-[var(--color-bg-overlay)] text-[var(--color-fg-secondary)]"
            : "text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)]"
        }
      `}
    >
      {children}
    </button>
  );
}

/* ── App ──────────────────────────────────────────── */

export default function App() {
  const [settings, setSettings] = useSettings();
  const { prs, loading, error, fetchPRs } = usePRs();
  const { config, fetchConfig } = useTriageConfig();
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [repoInput, setRepoInput] = useState(settings.repo);

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      setSettings((prev) => ({ ...prev, viewMode: mode }));
    },
    [setSettings],
  );

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

  // List view: open PRs only. Kanban view: all states.
  const openPRs = useMemo(() => prs.filter((pr) => pr.state === "OPEN"), [prs]);
  const viewPRs = settings.viewMode === "kanban" ? prs : openPRs;
  const filtered = useMemo(() => filterPRs(viewPRs, search), [viewPRs, search]);

  const groups = useMemo(() => config?.groups ?? [], [config]);
  const { grouped, ungrouped } = useMemo(() => groupPRs(filtered, groups), [filtered, groups]);

  const hasGroups = groups.length > 0;
  const hasResults = filtered.length > 0;
  const classifiedError = error ? classifyError(error) : null;

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)] text-[var(--color-fg)]">
      {/* macOS drag region */}
      <div className="drag-region h-7 shrink-0" />

      {/* Header */}
      <header className="shrink-0 border-b border-[var(--color-border-strong)] no-drag">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-2.5">
          {/* Repo input */}
          <div className="relative flex-1 min-w-0">
            <GitFork className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-dim)]" />
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              onKeyDown={handleRepoKeyDown}
              onBlur={handleRepoSubmit}
              placeholder="owner/repo"
              spellCheck={false}
              className="
                w-full
                rounded-lg border border-[var(--color-border)]
                bg-[var(--color-bg-raised)]
                pl-8 pr-3 py-1.5
                text-[13px] font-mono text-[var(--color-fg)]
                placeholder:text-[var(--color-fg-dim)]
                outline-none transition-colors
                focus:border-[var(--color-blue)]/40 focus:bg-[var(--color-bg-overlay)]
              "
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {settings.repo && (
              <span className="text-[11px] text-[var(--color-fg-dim)] font-mono tabular-nums mr-1.5">
                {loading ? "..." : filtered.length}
              </span>
            )}

            {/* View toggle */}
            {settings.repo && (
              <div className="flex items-center rounded-md border border-[var(--color-border)] mr-1">
                <ViewToggleButton
                  active={settings.viewMode === "list"}
                  onClick={() => setViewMode("list")}
                  label="List view"
                >
                  <List className="size-3.5" />
                </ViewToggleButton>
                <ViewToggleButton
                  active={settings.viewMode === "kanban"}
                  onClick={() => setViewMode("kanban")}
                  label="Kanban view"
                >
                  <Columns3 className="size-3.5" />
                </ViewToggleButton>
              </div>
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
      <main className="flex-1 overflow-hidden">
        {!settings.repo && <EmptyState type="no-repo" />}
        {settings.repo && loading && prs.length === 0 && <EmptyState type="loading" />}
        {settings.repo && classifiedError && (
          <EmptyState type={classifiedError.type} message={classifiedError.message} />
        )}
        {settings.repo && !loading && !error && prs.length === 0 && <EmptyState type="empty" />}
        {settings.repo && !error && !hasResults && prs.length > 0 && (
          <EmptyState type="empty" message="No PRs match your filter." />
        )}

        {/* Kanban view */}
        {hasResults && settings.viewMode === "kanban" && (
          <KanbanView
            prs={filtered}
            repo={settings.repo}
            onRefresh={() => loadRepo(settings.repo)}
          />
        )}

        {/* List view - Grouped */}
        {hasResults && settings.viewMode === "list" && hasGroups && (
          <div className="h-full overflow-y-auto">
            {grouped.map(
              ({ group, prs: groupPrs }) =>
                groupPrs.length > 0 && (
                  <GroupSection
                    key={group.name}
                    name={group.name}
                    description={group.description}
                    color={group.color}
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

        {/* List view - Flat (no config) */}
        {hasResults && settings.viewMode === "list" && !hasGroups && (
          <div className="h-full overflow-y-auto">
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

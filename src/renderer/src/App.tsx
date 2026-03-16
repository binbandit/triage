import { useState, useEffect, useMemo } from "react";
import { Settings as SettingsIcon, RefreshCw, List, Columns3, Loader2 } from "lucide-react";
import { useSettingsStore } from "./stores/settingsStore";
import { usePRStore } from "./stores/prStore";
import { useConfigStore } from "./stores/configStore";
import { usePRDetailStore } from "./stores/prDetailStore";
import { useIssueDetailStore } from "./stores/issueDetailStore";
import { filterPRs, groupPRs } from "./lib/prHelpers";
import { classifyError } from "./lib/errorUtils";
import { RepoInput } from "./components/RepoInput";
import { SearchBar } from "./components/SearchBar";
import { PRRow } from "./components/PRRow";
import { GroupSection } from "./components/GroupSection";
import { KanbanView } from "./components/KanbanView";
import { PRDetailView } from "./components/pr/PRDetailView";
import { IssueDetailView } from "./components/pr/IssueDetailView";
import { SettingsPanel } from "./components/SettingsPanel";
import { EmptyState } from "./components/EmptyState";

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

/* ── Header ───────────────────────────────────────── */

function AppHeader({ showSettings }: { showSettings: () => void }) {
  const repo = useSettingsStore((s) => s.repo);
  const viewMode = useSettingsStore((s) => s.viewMode);
  const inlinePRView = useSettingsStore((s) => s.inlinePRView);
  const setRepo = useSettingsStore((s) => s.setRepo);
  const setViewMode = useSettingsStore((s) => s.setViewMode);

  const loading = usePRStore((s) => s.loading);
  const search = usePRStore((s) => s.search);
  const setSearch = usePRStore((s) => s.setSearch);
  const prs = usePRStore((s) => s.prs);
  const fetchPRs = usePRStore((s) => s.fetchPRs);
  const fetchConfig = useConfigStore((s) => s.fetchConfig);

  const activePR = usePRDetailStore((s) => s.activePR);
  const activeIssue = useIssueDetailStore((s) => s.activeIssue);
  const refreshPRDetail = usePRDetailStore((s) => s.refresh);
  const refreshIssueDetail = useIssueDetailStore((s) => s.refresh);

  const isDetailView = inlinePRView && (activePR !== null || activeIssue !== null);

  const filteredCount = useMemo(() => {
    const viewPRs = viewMode === "kanban" ? prs : prs.filter((pr) => pr.state === "OPEN");
    return filterPRs(viewPRs, search).length;
  }, [prs, search, viewMode]);

  const handleRepoSubmit = (value: string) => {
    if (value !== repo) {
      setRepo(value);
    } else if (value) {
      fetchPRs(value);
      fetchConfig(value);
    }
  };

  const handleRefresh = () => {
    if (!repo) return;
    if (isDetailView) {
      if (activePR) refreshPRDetail(repo);
      if (activeIssue) refreshIssueDetail(repo);
    } else {
      fetchPRs(repo);
      fetchConfig(repo);
    }
  };

  return (
    <header className="shrink-0 border-b border-[var(--color-border-strong)] no-drag">
      <div className="flex items-center gap-2 px-4 py-2.5">
        {!isDetailView && <RepoInput repo={repo} onSubmit={handleRepoSubmit} />}
        {isDetailView && <div className="flex-1" />}

        <div className="flex items-center gap-0.5 shrink-0">
          {!isDetailView && repo && (
            <span className="text-[11px] text-[var(--color-fg-dim)] font-mono tabular-nums mr-1.5">
              {loading ? <Loader2 className="size-3 animate-spin" /> : filteredCount}
            </span>
          )}

          {!isDetailView && repo && (
            <div className="flex items-center rounded-md border border-[var(--color-border)] mr-1">
              <ViewToggleButton
                active={viewMode === "list"}
                onClick={() => setViewMode("list")}
                label="List view"
              >
                <List className="size-3.5" />
              </ViewToggleButton>
              <ViewToggleButton
                active={viewMode === "kanban"}
                onClick={() => setViewMode("kanban")}
                label="Kanban view"
              >
                <Columns3 className="size-3.5" />
              </ViewToggleButton>
            </div>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={!repo}
            className="
              p-1.5 rounded-md cursor-pointer
              text-[var(--color-fg-dim)]
              hover:text-[var(--color-fg-secondary)] hover:bg-[var(--color-bg-overlay)]
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-colors
            "
            aria-label="Refresh"
          >
            <RefreshCw className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={showSettings}
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

      {!isDetailView && repo && (
        <div className="px-4 pb-2.5">
          <SearchBar value={search} onChange={setSearch} />
        </div>
      )}
    </header>
  );
}

/* ── Content ──────────────────────────────────────── */

function AppContent({ onSettings }: { onSettings: () => void }) {
  const repo = useSettingsStore((s) => s.repo);
  const viewMode = useSettingsStore((s) => s.viewMode);
  const inlinePRView = useSettingsStore((s) => s.inlinePRView);

  const prs = usePRStore((s) => s.prs);
  const loading = usePRStore((s) => s.loading);
  const error = usePRStore((s) => s.error);
  const search = usePRStore((s) => s.search);
  const fetchPRs = usePRStore((s) => s.fetchPRs);
  const fetchClosedPRs = usePRStore((s) => s.fetchClosedPRs);
  const fetchConfig = useConfigStore((s) => s.fetchConfig);
  const activePR = usePRDetailStore((s) => s.activePR);
  const activeIssue = useIssueDetailStore((s) => s.activeIssue);
  const config = useConfigStore((s) => s.config);

  const openPRs = useMemo(() => prs.filter((pr) => pr.state === "OPEN"), [prs]);
  const viewPRs = viewMode === "kanban" ? prs : openPRs;
  const filtered = useMemo(() => filterPRs(viewPRs, search), [viewPRs, search]);

  const groups = useMemo(() => config?.groups ?? [], [config]);
  const { grouped, ungrouped } = useMemo(() => groupPRs(filtered, groups), [filtered, groups]);

  const hasGroups = groups.length > 0;
  const hasResults = filtered.length > 0;
  const classifiedError = error ? classifyError(error) : null;

  // Lazy-load closed PRs when switching to kanban
  useEffect(() => {
    if (viewMode === "kanban" && repo) {
      fetchClosedPRs(repo);
    }
  }, [viewMode, repo, fetchClosedPRs]);

  // Load PRs + config when repo changes
  useEffect(() => {
    if (repo) {
      fetchPRs(repo);
      fetchConfig(repo);
    }
  }, [repo, fetchPRs, fetchConfig]);

  // Show detail views if inline view is enabled
  if (inlinePRView && activePR && repo) {
    return (
      <main className="flex-1 overflow-hidden">
        <PRDetailView repo={repo} onSettings={onSettings} />
      </main>
    );
  }

  if (inlinePRView && activeIssue && repo) {
    return (
      <main className="flex-1 overflow-hidden">
        <IssueDetailView repo={repo} onSettings={onSettings} />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-hidden">
      {!repo && <EmptyState type="no-repo" />}
      {repo && loading && prs.length === 0 && <EmptyState type="loading" />}
      {repo && classifiedError && (
        <EmptyState type={classifiedError.type} message={classifiedError.message} />
      )}
      {repo && !loading && !error && prs.length === 0 && <EmptyState type="empty" />}
      {repo && !error && !hasResults && prs.length > 0 && (
        <EmptyState type="empty" message="No PRs match your filter." />
      )}

      {hasResults && viewMode === "kanban" && <KanbanView prs={filtered} repo={repo} />}

      {hasResults && viewMode === "list" && hasGroups && (
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
                  repo={repo}
                  highlightLabels={group.labels}
                />
              ),
          )}
          {ungrouped.length > 0 && (
            <GroupSection
              name="other"
              prs={ungrouped}
              repo={repo}
              defaultOpen={groups.length === 0}
            />
          )}
        </div>
      )}

      {hasResults && viewMode === "list" && !hasGroups && (
        <div className="h-full overflow-y-auto">
          {filtered.map((pr) => (
            <PRRow key={pr.number} pr={pr} repo={repo} />
          ))}
        </div>
      )}
    </main>
  );
}

/* ── App ──────────────────────────────────────────── */

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const inlinePRView = useSettingsStore((s) => s.inlinePRView);
  const activePR = usePRDetailStore((s) => s.activePR);
  const activeIssue = useIssueDetailStore((s) => s.activeIssue);
  const isDetailView = inlinePRView && (activePR !== null || activeIssue !== null);

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)] text-[var(--color-fg)]">
      <div className="drag-region h-7 shrink-0" />
      {!isDetailView && <AppHeader showSettings={() => setShowSettings(true)} />}
      <AppContent onSettings={() => setShowSettings(true)} />
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search,
  RefreshCw,
  List,
  Columns3,
  LayoutDashboard,
  Settings,
  GitPullRequest,
  CircleDot,
  Moon,
  Sun,
  CheckSquare,
  Bookmark,
  ExternalLink,
  ArrowLeft,
  Eye,
  EyeOff,
  type LucideIcon,
} from "lucide-react";
import { useSettingsStore } from "../stores/settingsStore";
import { usePRStore } from "../stores/prStore";
import { usePRDetailStore } from "../stores/prDetailStore";
import { useIssueDetailStore } from "../stores/issueDetailStore";
import { useConfigStore } from "../stores/configStore";
import { useBulkActionsStore } from "../stores/bulkActionsStore";
import { useSavedViewsStore } from "../stores/savedViewsStore";

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  shortcut?: string;
  action: () => void;
  section: string;
  /** Only show when this returns true */
  when?: () => boolean;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export function CommandPalette({ open, onClose, onOpenSettings }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const repo = useSettingsStore((s) => s.repo);
  const viewMode = useSettingsStore((s) => s.viewMode);
  const theme = useSettingsStore((s) => s.theme);
  const inlinePRView = useSettingsStore((s) => s.inlinePRView);
  const experimentalCanvas = useSettingsStore((s) => s.experimentalCanvas);
  const setViewMode = useSettingsStore((s) => s.setViewMode);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setInlinePRView = useSettingsStore((s) => s.setInlinePRView);

  const fetchPRs = usePRStore((s) => s.fetchPRs);
  const prs = usePRStore((s) => s.prs);
  const fetchConfig = useConfigStore((s) => s.fetchConfig);

  const activePR = usePRDetailStore((s) => s.activePR);
  const activeIssue = useIssueDetailStore((s) => s.activeIssue);
  const closePRDetail = usePRDetailStore((s) => s.closePR);
  const closeIssueDetail = useIssueDetailStore((s) => s.closeIssue);
  const openPR = usePRDetailStore((s) => s.openPR);
  const prDetail = usePRDetailStore((s) => s.detail);
  const setTab = usePRDetailStore((s) => s.setTab);
  const refreshPR = usePRDetailStore((s) => s.refresh);
  const refreshIssue = useIssueDetailStore((s) => s.refresh);

  const toggleBulkMode = useBulkActionsStore((s) => s.toggleBulkMode);

  const savedViews = useSavedViewsStore((s) => s.views);
  const setActiveView = useSavedViewsStore((s) => s.setActiveView);

  const isDetailView = activePR !== null || activeIssue !== null;

  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [];

    // Navigation
    cmds.push({
      id: "view-list",
      label: "Switch to List View",
      icon: List,
      shortcut: "L",
      section: "Navigation",
      action: () => {
        setViewMode("list");
        onClose();
      },
      when: () => !isDetailView && viewMode !== "list",
    });
    cmds.push({
      id: "view-kanban",
      label: "Switch to Kanban View",
      icon: Columns3,
      shortcut: "B",
      section: "Navigation",
      action: () => {
        setViewMode("kanban");
        onClose();
      },
      when: () => !isDetailView && viewMode !== "kanban",
    });
    if (experimentalCanvas) {
      cmds.push({
        id: "view-canvas",
        label: "Switch to Canvas View",
        icon: LayoutDashboard,
        section: "Navigation",
        action: () => {
          setViewMode("canvas");
          onClose();
        },
        when: () => !isDetailView && viewMode !== "canvas",
      });
    }
    cmds.push({
      id: "go-back",
      label: "Go Back to List",
      icon: ArrowLeft,
      shortcut: "Esc",
      section: "Navigation",
      action: () => {
        if (activePR) closePRDetail();
        if (activeIssue) closeIssueDetail();
        onClose();
      },
      when: () => isDetailView,
    });

    // PR Detail tabs
    cmds.push({
      id: "tab-conversation",
      label: "Conversation Tab",
      icon: GitPullRequest,
      shortcut: "1",
      section: "PR Detail",
      action: () => {
        setTab("conversation");
        onClose();
      },
      when: () => activePR !== null,
    });
    cmds.push({
      id: "tab-commits",
      label: "Commits Tab",
      icon: GitPullRequest,
      shortcut: "2",
      section: "PR Detail",
      action: () => {
        setTab("commits");
        onClose();
      },
      when: () => activePR !== null,
    });
    cmds.push({
      id: "tab-changes",
      label: "Changes Tab",
      icon: GitPullRequest,
      shortcut: "3",
      section: "PR Detail",
      action: () => {
        setTab("changes");
        onClose();
      },
      when: () => activePR !== null,
    });
    cmds.push({
      id: "open-in-browser",
      label: "Open in Browser",
      icon: ExternalLink,
      section: "PR Detail",
      action: () => {
        if (prDetail?.url) window.api.openExternal(prDetail.url);
        onClose();
      },
      when: () => activePR !== null && prDetail !== null,
    });

    // Actions
    cmds.push({
      id: "refresh",
      label: "Refresh Data",
      icon: RefreshCw,
      shortcut: "R",
      section: "Actions",
      action: () => {
        if (isDetailView && repo) {
          if (activePR) refreshPR(repo);
          if (activeIssue) refreshIssue(repo);
        } else if (repo) {
          fetchPRs(repo);
          fetchConfig(repo);
        }
        onClose();
      },
    });
    cmds.push({
      id: "focus-search",
      label: "Focus Search",
      icon: Search,
      shortcut: "/",
      section: "Actions",
      action: () => {
        onClose();
        requestAnimationFrame(() =>
          (document.querySelector("[data-search-input]") as HTMLInputElement)?.focus(),
        );
      },
      when: () => !isDetailView,
    });
    cmds.push({
      id: "bulk-mode",
      label: "Toggle Bulk Select Mode",
      icon: CheckSquare,
      section: "Actions",
      action: () => {
        toggleBulkMode();
        onClose();
      },
      when: () => !isDetailView && viewMode === "list",
    });
    cmds.push({
      id: "settings",
      label: "Open Settings",
      icon: Settings,
      section: "Actions",
      action: () => {
        onOpenSettings();
        onClose();
      },
    });

    // Saved views
    for (const view of savedViews) {
      cmds.push({
        id: `view-${view.id}`,
        label: `Apply: ${view.name}`,
        icon: Bookmark,
        section: "Saved Views",
        action: () => {
          setActiveView(view.id);
          onClose();
        },
        when: () => !isDetailView,
      });
    }

    // Quick PR navigation (top 10 open PRs)
    const openPRs = prs.filter((pr) => pr.state === "OPEN").slice(0, 10);
    for (const pr of openPRs) {
      cmds.push({
        id: `pr-${pr.number}`,
        label: `#${pr.number} ${pr.title}`,
        description: pr.author.login,
        icon: GitPullRequest,
        section: "Open PRs",
        action: () => {
          if (inlinePRView && repo) {
            openPR(repo, pr.number);
          } else {
            window.api.openExternal(pr.url);
          }
          onClose();
        },
        when: () => !isDetailView,
      });
    }

    // Toggle commands
    cmds.push({
      id: "toggle-theme",
      label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      icon: theme === "dark" ? Sun : Moon,
      section: "Preferences",
      action: () => {
        setTheme(theme === "dark" ? "light" : "dark");
        onClose();
      },
    });
    cmds.push({
      id: "toggle-inline",
      label: inlinePRView ? "Disable Inline PR View" : "Enable Inline PR View",
      icon: inlinePRView ? EyeOff : Eye,
      section: "Preferences",
      action: () => {
        setInlinePRView(!inlinePRView);
        onClose();
      },
    });

    return cmds;
  }, [
    repo,
    viewMode,
    theme,
    inlinePRView,
    experimentalCanvas,
    isDetailView,
    activePR,
    activeIssue,
    prDetail,
    prs,
    savedViews,
    setViewMode,
    setTheme,
    setInlinePRView,
    onClose,
    onOpenSettings,
    fetchPRs,
    fetchConfig,
    closePRDetail,
    closeIssueDetail,
    setTab,
    refreshPR,
    refreshIssue,
    openPR,
    toggleBulkMode,
    setActiveView,
  ]);

  const filtered = useMemo(() => {
    const available = commands.filter((c) => !c.when || c.when());
    if (!query.trim()) return available;
    const q = query.toLowerCase();
    return available.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q),
    );
  }, [commands, query]);

  // Group by section
  const sections = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const cmd of filtered) {
      const existing = map.get(cmd.section) ?? [];
      existing.push(cmd);
      map.set(cmd.section, existing);
    }
    return [...map.entries()];
  }, [filtered]);

  // Reset selection when query changes
  // Reset selection when filtered results change
  const prevFilteredLen = useRef(filtered.length);
  if (prevFilteredLen.current !== filtered.length) {
    prevFilteredLen.current = filtered.length;
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(0);
    }
  }

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [filtered, selectedIndex, onClose],
  );

  if (!open) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-label="Command palette"
        className="relative w-full max-w-lg rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg-raised)] shadow-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
          <Search className="size-4 text-[var(--color-fg-dim)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-[14px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] outline-none"
          />
          <kbd className="text-[10px] text-[var(--color-fg-dim)] bg-[var(--color-bg-overlay)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-[12px] text-[var(--color-fg-dim)]">
              No commands match your query.
            </div>
          )}
          {sections.map(([section, cmds]) => (
            <div key={section}>
              <div className="px-4 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)]">
                  {section}
                </span>
              </div>
              {cmds.map((cmd) => {
                const idx = flatIndex++;
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2 text-left cursor-pointer transition-colors
                      ${idx === selectedIndex ? "bg-[var(--color-bg-overlay)]" : ""}
                    `}
                  >
                    <Icon className="size-4 shrink-0 text-[var(--color-fg-muted)]" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] text-[var(--color-fg)]">{cmd.label}</span>
                      {cmd.description && (
                        <span className="text-[11px] text-[var(--color-fg-dim)] ml-2">
                          {cmd.description}
                        </span>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="text-[10px] text-[var(--color-fg-dim)] bg-[var(--color-bg-inset)] px-1.5 py-0.5 rounded border border-[var(--color-border)] shrink-0">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

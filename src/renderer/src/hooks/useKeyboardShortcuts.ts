import { useEffect, useCallback } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { usePRStore } from "../stores/prStore";
import { usePRDetailStore } from "../stores/prDetailStore";
import { useIssueDetailStore } from "../stores/issueDetailStore";
import { useConfigStore } from "../stores/configStore";

/**
 * Global keyboard shortcuts for power-user triage workflow.
 *
 * Navigation:
 *   j/k     - Move focus down/up in PR list
 *   Enter   - Open focused PR (inline or browser)
 *   Escape  - Close detail view / clear search
 *   r       - Refresh current data
 *   /       - Focus search bar
 *   1/2/3   - Switch PR detail tabs (conversation/commits/changes)
 *   l       - Switch to list view
 *   b       - Switch to kanban (board) view
 */
export function useKeyboardShortcuts() {
  const repo = useSettingsStore((s) => s.repo);
  const setViewMode = useSettingsStore((s) => s.setViewMode);
  const fetchPRs = usePRStore((s) => s.fetchPRs);
  const fetchConfig = useConfigStore((s) => s.fetchConfig);
  const setSearch = usePRStore((s) => s.setSearch);

  const activePR = usePRDetailStore((s) => s.activePR);
  const closePRDetail = usePRDetailStore((s) => s.closePR);
  const setTab = usePRDetailStore((s) => s.setTab);
  const refreshPR = usePRDetailStore((s) => s.refresh);

  const activeIssue = useIssueDetailStore((s) => s.activeIssue);
  const closeIssueDetail = useIssueDetailStore((s) => s.closeIssue);
  const refreshIssue = useIssueDetailStore((s) => s.refresh);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs/textareas
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        // Allow Escape to blur inputs
        if (e.key === "Escape") {
          target.blur();
        }
        return;
      }

      const isDetailView = activePR !== null || activeIssue !== null;

      switch (e.key) {
        case "Escape":
          if (isDetailView) {
            if (activePR) closePRDetail();
            if (activeIssue) closeIssueDetail();
          } else {
            setSearch("");
          }
          break;

        case "/":
          e.preventDefault();
          (document.querySelector("[data-search-input]") as HTMLInputElement)?.focus();
          break;

        case "r":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            if (isDetailView && repo) {
              if (activePR) refreshPR(repo);
              if (activeIssue) refreshIssue(repo);
            } else if (repo) {
              fetchPRs(repo);
              fetchConfig(repo);
            }
          }
          break;

        case "1":
          if (isDetailView && activePR) {
            e.preventDefault();
            setTab("conversation");
          }
          break;

        case "2":
          if (isDetailView && activePR) {
            e.preventDefault();
            setTab("commits");
          }
          break;

        case "3":
          if (isDetailView && activePR) {
            e.preventDefault();
            setTab("changes");
          }
          break;

        case "l":
          if (!isDetailView) {
            e.preventDefault();
            setViewMode("list");
          }
          break;

        case "b":
          if (!isDetailView) {
            e.preventDefault();
            setViewMode("kanban");
          }
          break;

        default:
          break;
      }
    },
    [
      repo,
      activePR,
      activeIssue,
      closePRDetail,
      closeIssueDetail,
      setSearch,
      fetchPRs,
      fetchConfig,
      refreshPR,
      refreshIssue,
      setTab,
      setViewMode,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

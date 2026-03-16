import { GitPullRequest, AlertCircle, Loader2, Lock } from "lucide-react";

export type EmptyStateType = "loading" | "empty" | "error" | "no-repo" | "forbidden" | "not-found";

interface EmptyStateProps {
  type: EmptyStateType;
  message?: string;
  /** Compact mode for use inside constrained containers like kanban columns */
  compact?: boolean;
}

export function EmptyState({ type, message, compact = false }: EmptyStateProps) {
  const py = compact ? "py-10 px-4" : "py-24 px-6";
  const icon = compact ? "size-4 mb-3" : "size-5 mb-4";
  const title = compact ? "text-[12px]" : "text-[13px]";
  const body = compact ? "text-[11px]" : "text-[12px]";

  return (
    <div className={`flex flex-col items-center justify-center ${py} text-center`}>
      {type === "loading" && (
        <>
          <Loader2 className={`${icon} text-[var(--color-fg-dim)] animate-spin`} />
          <p className={`${body} text-[var(--color-fg-muted)]`}>
            {message || "Fetching pull requests..."}
          </p>
        </>
      )}
      {type === "empty" && (
        <>
          <GitPullRequest className={`${icon} text-[var(--color-fg-dim)]`} />
          <p className={`${title} text-[var(--color-fg-secondary)] font-medium mb-1`}>
            {compact ? message || "None yet" : "No pull requests"}
          </p>
          {!compact && (
            <p className={`${body} text-[var(--color-fg-muted)]`}>
              {message || "No open PRs found for this repository."}
            </p>
          )}
        </>
      )}
      {type === "error" && (
        <>
          <AlertCircle className={`${icon} text-[var(--color-red)]/60`} />
          <p className={`${title} text-[var(--color-fg-secondary)] font-medium mb-1`}>
            Something went wrong
          </p>
          <p className={`${body} text-[var(--color-fg-muted)] max-w-xs`}>{message}</p>
        </>
      )}
      {type === "not-found" && (
        <>
          <AlertCircle className={`${icon} text-[var(--color-amber)]/60`} />
          <p className={`${title} text-[var(--color-fg-secondary)] font-medium mb-1`}>
            Repository not found
          </p>
          <p className={`${body} text-[var(--color-fg-muted)] max-w-xs`}>
            {message || "Check the owner/repo name and try again."}
          </p>
        </>
      )}
      {type === "forbidden" && (
        <>
          <Lock className={`${icon} text-[var(--color-amber)]/60`} />
          <p className={`${title} text-[var(--color-fg-secondary)] font-medium mb-1`}>
            Access denied
          </p>
          <p className={`${body} text-[var(--color-fg-muted)] max-w-xs`}>
            {message ||
              "You don't have permission to access this repository. Check that you're authenticated with `gh auth login`."}
          </p>
        </>
      )}
      {type === "no-repo" && (
        <>
          <GitPullRequest className={`${icon} text-[var(--color-fg-dim)]`} />
          <p className={`${title} text-[var(--color-fg-secondary)] font-medium mb-1`}>
            Enter a repository
          </p>
          <p className={`${body} text-[var(--color-fg-muted)]`}>
            Type owner/repo above to start triaging pull requests.
          </p>
        </>
      )}
    </div>
  );
}

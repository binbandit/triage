import { GitPullRequest, AlertCircle, Loader2 } from "lucide-react";

interface EmptyStateProps {
  type: "loading" | "empty" | "error" | "no-repo";
  message?: string;
}

export function EmptyState({ type, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      {type === "loading" && (
        <>
          <Loader2 className="size-5 text-[var(--color-fg-dim)] animate-spin mb-4" />
          <p className="text-[13px] text-[var(--color-fg-muted)]">Fetching pull requests...</p>
        </>
      )}
      {type === "empty" && (
        <>
          <GitPullRequest className="size-5 text-[var(--color-fg-dim)] mb-4" />
          <p className="text-[13px] text-[var(--color-fg-secondary)] font-medium mb-1">
            No pull requests
          </p>
          <p className="text-[12px] text-[var(--color-fg-muted)]">
            {message || "No open PRs found for this repository."}
          </p>
        </>
      )}
      {type === "error" && (
        <>
          <AlertCircle className="size-5 text-[var(--color-red)]/60 mb-4" />
          <p className="text-[13px] text-[var(--color-fg-secondary)] font-medium mb-1">
            Something went wrong
          </p>
          <p className="text-[12px] text-[var(--color-fg-muted)] max-w-xs">{message}</p>
        </>
      )}
      {type === "no-repo" && (
        <>
          <GitPullRequest className="size-5 text-[var(--color-fg-dim)] mb-4" />
          <p className="text-[13px] text-[var(--color-fg-secondary)] font-medium mb-1">
            Enter a repository
          </p>
          <p className="text-[12px] text-[var(--color-fg-muted)]">
            Type owner/repo above to start triaging pull requests.
          </p>
        </>
      )}
    </div>
  );
}

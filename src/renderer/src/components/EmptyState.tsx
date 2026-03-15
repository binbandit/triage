import { GitPullRequest, AlertCircle, Loader2 } from "lucide-react";

interface EmptyStateProps {
  type: "loading" | "empty" | "error" | "no-repo";
  message?: string;
}

export function EmptyState({ type, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {type === "loading" && (
        <>
          <Loader2 className="size-8 text-dim animate-spin mb-4" />
          <p className="text-sm text-muted">Fetching pull requests...</p>
        </>
      )}
      {type === "empty" && (
        <>
          <GitPullRequest className="size-8 text-dim mb-4" />
          <p className="text-sm text-muted-foreground font-medium mb-1">No pull requests</p>
          <p className="text-xs text-dim">{message || "No open PRs found for this repository."}</p>
        </>
      )}
      {type === "error" && (
        <>
          <AlertCircle className="size-8 text-destructive/60 mb-4" />
          <p className="text-sm text-muted-foreground font-medium mb-1">Something went wrong</p>
          <p className="text-xs text-dim max-w-sm">{message}</p>
        </>
      )}
      {type === "no-repo" && (
        <>
          <GitPullRequest className="size-8 text-dim mb-4" />
          <p className="text-sm text-muted-foreground font-medium mb-1">Enter a repository</p>
          <p className="text-xs text-dim">
            Type an owner/repo above to start triaging pull requests.
          </p>
        </>
      )}
    </div>
  );
}

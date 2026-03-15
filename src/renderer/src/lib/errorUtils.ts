import type { EmptyStateType } from "../components/EmptyState";

/**
 * Classify a gh CLI error message into a user-facing error type.
 */
export function classifyError(message: string): { type: EmptyStateType; message: string } {
  const lower = message.toLowerCase();

  if (lower.includes("could not resolve to a repository") || lower.includes("not found")) {
    return {
      type: "not-found",
      message:
        "This repository doesn't exist or the name is incorrect. Check the owner/repo format.",
    };
  }

  if (
    lower.includes("403") ||
    lower.includes("forbidden") ||
    lower.includes("denied") ||
    lower.includes("resource not accessible")
  ) {
    return {
      type: "forbidden",
      message:
        "You don't have permission to access this repository. Run `gh auth login` to authenticate.",
    };
  }

  if (
    lower.includes("401") ||
    lower.includes("authentication") ||
    lower.includes("not logged in") ||
    lower.includes("auth login")
  ) {
    return {
      type: "forbidden",
      message: "Not authenticated with GitHub. Run `gh auth login` in your terminal.",
    };
  }

  if (lower.includes("no pull requests match") || lower.includes("no pull requests")) {
    return {
      type: "empty",
      message: "No pull requests found for this repository.",
    };
  }

  return {
    type: "error",
    message,
  };
}

/**
 * Classify an action error (close/merge) into a user-friendly message.
 */
export function classifyActionError(message: string, action: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("403") ||
    lower.includes("forbidden") ||
    lower.includes("resource not accessible")
  ) {
    return `You don't have permission to ${action} this PR. Only collaborators with write access can perform this action.`;
  }

  if (lower.includes("not mergeable") || lower.includes("merge conflict")) {
    return "This PR has merge conflicts and cannot be merged. Resolve conflicts first.";
  }

  if (lower.includes("required status check")) {
    return "Required status checks have not passed. Wait for CI to complete.";
  }

  if (lower.includes("review") && lower.includes("required")) {
    return "Required reviews have not been met. Get the required approvals first.";
  }

  if (lower.includes("already closed") || lower.includes("already merged")) {
    return `This PR has already been ${action === "merge" ? "merged" : "closed"}.`;
  }

  return `Failed to ${action} PR: ${message}`;
}

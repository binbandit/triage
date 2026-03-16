/**
 * Parse a GitHub URL into its components.
 * Returns null if the URL is not a recognized GitHub PR or issue URL.
 */
export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  type: "pull" | "issues";
  number: number;
}

const GITHUB_URL_PATTERN = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(pull|issues)\/(\d+)/;

export function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  const match = url.match(GITHUB_URL_PATTERN);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
    type: match[3] as "pull" | "issues",
    number: parseInt(match[4], 10),
  };
}

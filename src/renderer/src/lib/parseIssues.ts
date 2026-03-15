export interface LinkedIssue {
  keyword: string;
  number: number;
  raw: string;
}

/**
 * Parse a PR body for linked issue references.
 * Supports:
 *   - "Fixes #123", "Closes #456", "Resolves #789"
 *   - "Fixes owner/repo#123"
 *   - Standalone "#123" references
 */
export function parseLinkedIssues(body: string): LinkedIssue[] {
  if (!body) return [];

  const issues: LinkedIssue[] = [];
  const seen = new Set<number>();

  // Match keyword-prefixed issue references
  const keywordPattern =
    /\b(fix(?:es|ed)?|close[sd]?|resolve[sd]?)\s+(?:[\w.-]+\/[\w.-]+)?#(\d+)/gi;
  for (const match of body.matchAll(keywordPattern)) {
    const num = parseInt(match[2], 10);
    if (!seen.has(num)) {
      seen.add(num);
      issues.push({ keyword: match[1], number: num, raw: match[0] });
    }
  }

  // Match standalone #NNN references not already captured
  const standalonePattern = /(?:^|[\s(,])#(\d+)\b/gm;
  for (const match of body.matchAll(standalonePattern)) {
    const num = parseInt(match[1], 10);
    if (!seen.has(num)) {
      seen.add(num);
      issues.push({ keyword: "references", number: num, raw: `#${num}` });
    }
  }

  return issues;
}

import { parse, stringify } from "yaml";
import { parseTriageConfig } from "./parseConfig";
import type { TriageConfig } from "../types";

/**
 * Parse the local multi-repo config file (~/.config/triage/triage.yaml).
 *
 * Format:
 * ```yaml
 * vercel/next.js:
 *   ready-to-merge:
 *     labels:
 *       - approved
 *
 * facebook/react:
 *   urgent:
 *     - priority:critical
 * ```
 *
 * Each top-level key is an owner/repo. Its value uses the same format
 * as a repo's .triage.yml (groups as either arrays or objects).
 *
 * Returns the config for the specified repo, or null if not found.
 */
export function parseLocalConfigForRepo(raw: string, repo: string): TriageConfig | null {
  let doc: unknown;
  try {
    doc = parse(raw);
  } catch {
    return null;
  }

  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    return null;
  }

  const entries = doc as Record<string, unknown>;

  // Try exact match first, then case-insensitive
  const repoConfig = entries[repo] ?? entries[repo.toLowerCase()];
  if (!repoConfig || typeof repoConfig !== "object") {
    return null;
  }

  // Re-serialize this repo's section and parse as a normal triage config
  const repoYaml = stringify(repoConfig);
  return parseTriageConfig(repoYaml);
}

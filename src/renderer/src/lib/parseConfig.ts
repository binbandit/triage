import { parse } from "yaml";
import type { TriageConfig, LabelGroup } from "../types";

/**
 * Parse a .triage.yml config file into typed label groups.
 *
 * Expected format:
 * ```yaml
 * ready-to-merge:
 *   - approved
 *   - ci-passed
 *
 * needs-review:
 *   - needs-review
 * ```
 *
 * Each top-level key becomes a group name.
 * Each value is an array of label strings that a PR must have to belong to that group.
 */
export function parseTriageConfig(raw: string): TriageConfig {
  let doc: unknown;
  try {
    doc = parse(raw);
  } catch {
    return { groups: [] };
  }

  if (!doc || typeof doc !== "object") {
    return { groups: [] };
  }

  const groups: LabelGroup[] = [];

  for (const [name, labels] of Object.entries(doc)) {
    if (Array.isArray(labels)) {
      groups.push({
        name,
        labels: labels.filter((l): l is string => typeof l === "string"),
      });
    }
  }

  return { groups };
}

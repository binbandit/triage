import type { PullRequest, LabelGroup } from "../types";

export function filterPRs(prs: PullRequest[], query: string): PullRequest[] {
  if (!query.trim()) return prs;
  const q = query.toLowerCase();
  return prs.filter((pr) => {
    if (pr.title.toLowerCase().includes(q)) return true;
    if (pr.author.login.toLowerCase().includes(q)) return true;
    if (`#${pr.number}`.includes(q)) return true;
    if (pr.labels.some((l) => l.name.toLowerCase().includes(q))) return true;
    return false;
  });
}

export function prMatchesGroup(pr: PullRequest, group: LabelGroup): boolean {
  const names = pr.labels.map((l) => l.name.toLowerCase());
  return group.labels.every((gl) => names.includes(gl.toLowerCase()));
}

export function groupPRs(
  prs: PullRequest[],
  groups: LabelGroup[],
): { grouped: { group: LabelGroup; prs: PullRequest[] }[]; ungrouped: PullRequest[] } {
  const assigned = new Set<number>();
  const grouped = groups.map((group) => {
    const matching = prs.filter((pr) => {
      if (assigned.has(pr.number)) return false;
      return prMatchesGroup(pr, group);
    });
    for (const pr of matching) assigned.add(pr.number);
    return { group, prs: matching };
  });
  const ungrouped = prs.filter((pr) => !assigned.has(pr.number));
  return { grouped, ungrouped };
}

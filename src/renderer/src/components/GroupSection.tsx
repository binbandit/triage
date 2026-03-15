import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { PullRequest } from "../types";
import { PRRow } from "./PRRow";

interface GroupSectionProps {
  name: string;
  description?: string;
  color?: string;
  prs: PullRequest[];
  repo: string;
  highlightLabels?: string[];
  defaultOpen?: boolean;
}

export function GroupSection({
  name,
  description,
  color,
  prs,
  repo,
  highlightLabels = [],
  defaultOpen = true,
}: GroupSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section>
      {/* Group header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="
          w-full flex items-center justify-between
          px-5 py-2.5
          bg-[var(--color-bg-inset)]
          border-b border-[var(--color-border)]
          cursor-pointer select-none
          hover:bg-[var(--color-bg-overlay)]
          transition-colors duration-100
        "
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {color && (
            <span className="shrink-0 size-2 rounded-full" style={{ backgroundColor: color }} />
          )}
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-fg-secondary)]">
            {name}
          </span>
          <span className="text-[11px] font-mono text-[var(--color-fg-dim)] tabular-nums">
            {prs.length}
          </span>
          {description && (
            <span className="text-[11px] text-[var(--color-fg-dim)] truncate hidden sm:inline">
              {description}
            </span>
          )}
        </div>
        <ChevronDown
          className={`size-3.5 shrink-0 text-[var(--color-fg-dim)] transition-transform duration-150 ${
            open ? "" : "-rotate-90"
          }`}
        />
      </button>

      {/* PR list */}
      {open && (
        <div>
          {prs.map((pr) => (
            <PRRow key={pr.number} pr={pr} repo={repo} highlightLabels={highlightLabels} />
          ))}
        </div>
      )}
    </section>
  );
}

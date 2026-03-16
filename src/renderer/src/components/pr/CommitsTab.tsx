import { GitCommit, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { PullRequestDetail } from "../../types";

interface CommitsTabProps {
  pr: PullRequestDetail;
  repo: string;
}

function CopyOid({ oid }: { oid: string }) {
  const [copied, setCopied] = useState(false);
  const short = oid.slice(0, 7);

  const handleCopy = () => {
    navigator.clipboard.writeText(oid);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--color-fg-dim)] cursor-pointer hover:text-[var(--color-fg-secondary)] transition-colors"
      title="Copy full SHA"
    >
      {short}
      {copied ? (
        <Check className="size-2.5 text-[var(--color-green)]" />
      ) : (
        <Copy className="size-2.5" />
      )}
    </button>
  );
}

export function CommitsTab({ pr }: CommitsTabProps) {
  const commits = pr.commits ?? [];

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-5 py-3">
        <p className="text-[11px] text-[var(--color-fg-dim)] mb-3">
          {commits.length} commit{commits.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div>
        {commits.map((commit) => {
          const authorName = commit.authors?.[0]?.name || commit.authors?.[0]?.login || "Unknown";
          const date = new Date(commit.committedDate);
          const dateStr = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={commit.oid}
              className="flex items-start gap-3 px-5 py-3 border-b border-[var(--color-border)] hover:bg-[var(--color-bg-raised)]/50 transition-colors"
            >
              <GitCommit className="size-4 shrink-0 mt-0.5 text-[var(--color-fg-dim)]" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--color-fg)] leading-snug truncate">
                  {commit.messageHeadline}
                </p>
                {commit.messageBody && (
                  <p className="text-[11px] text-[var(--color-fg-muted)] mt-1 line-clamp-2 whitespace-pre-line">
                    {commit.messageBody}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[var(--color-fg-dim)]">
                  <span className="font-medium text-[var(--color-fg-muted)]">{authorName}</span>
                  <span>{dateStr}</span>
                </div>
              </div>
              <CopyOid oid={commit.oid} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

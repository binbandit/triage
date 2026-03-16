import { GitCommit, Copy, Check, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import type { PullRequestDetail, PRFile } from "../../types";
import { ChangesTab } from "./ChangesTab";
import { Avatar } from "../ui/Avatar";
import { cn } from "../../lib/cn";

interface CommitsTabProps {
  pr: PullRequestDetail;
  repo: string;
}

function CopyOid({ oid }: { oid: string }) {
  const [copied, setCopied] = useState(false);
  const short = oid.slice(0, 7);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
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

function CommitRow({
  commit,
  repo,
  prNumber,
}: {
  commit: PullRequestDetail["commits"][0];
  repo: string;
  prNumber: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [files, setFiles] = useState<PRFile[]>([]);
  const [loading, setLoading] = useState(false);

  const authorLogin = commit.authors?.[0]?.login || "";
  const authorName = commit.authors?.[0]?.name || authorLogin || "Unknown";
  const date = new Date(commit.committedDate);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const handleToggle = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);

    if (files.length === 0) {
      setLoading(true);
      try {
        const result = await window.api.getCommitFiles({ repo, sha: commit.oid });
        setFiles(Array.isArray(result) ? result : []);
      } catch {
        setFiles([]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="border-b border-[var(--color-border)]">
      {/* Commit header */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-start gap-3 px-5 py-3 hover:bg-[var(--color-bg-raised)]/50 transition-colors cursor-pointer text-left"
      >
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 mt-1 text-[var(--color-fg-dim)] transition-transform duration-100",
            expanded && "rotate-90",
          )}
        />
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
            {authorLogin && <Avatar login={authorLogin} size={14} />}
            <span className="font-medium text-[var(--color-fg-muted)]">{authorName}</span>
            <span>{dateStr}</span>
          </div>
        </div>
        <CopyOid oid={commit.oid} />
      </button>

      {/* Expanded diff view */}
      {expanded && (
        <div className="border-t border-[var(--color-border)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-4 animate-spin text-[var(--color-fg-dim)]" />
            </div>
          ) : files.length === 0 ? (
            <div className="py-6 text-center text-[11px] text-[var(--color-fg-dim)]">
              No file changes in this commit.
            </div>
          ) : (
            <div className="h-[400px]">
              <ChangesTab files={files} repo={repo} prNumber={prNumber} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CommitsTab({ pr, repo }: CommitsTabProps) {
  const commits = pr.commits ?? [];

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-5 py-3">
        <p className="text-[11px] text-[var(--color-fg-dim)] mb-1">
          {commits.length} commit{commits.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div>
        {commits.map((commit) => (
          <CommitRow key={commit.oid} commit={commit} repo={repo} prNumber={pr.number} />
        ))}
      </div>
    </div>
  );
}

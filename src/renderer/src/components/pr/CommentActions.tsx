import { useState } from "react";
import { SmilePlus, Link, Check } from "lucide-react";

const REACTIONS = [
  { emoji: "👍", content: "+1" },
  { emoji: "👎", content: "-1" },
  { emoji: "😄", content: "laugh" },
  { emoji: "🎉", content: "hooray" },
  { emoji: "😕", content: "confused" },
  { emoji: "❤️", content: "heart" },
  { emoji: "🚀", content: "rocket" },
  { emoji: "👀", content: "eyes" },
];

interface CommentActionsProps {
  commentId: string;
  commentUrl: string;
  repo: string;
  type: "issue" | "pr";
}

export function CommentActions({ commentId, commentUrl, repo, type }: CommentActionsProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reacting, setReacting] = useState(false);

  const handleReaction = async (reaction: string) => {
    setReacting(true);
    try {
      await window.api.addReaction({ repo, commentId, type, reaction });
    } catch {
      // Silent
    } finally {
      setReacting(false);
      setShowReactions(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(commentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-0.5">
      {/* Copy link */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="p-1 rounded-sm cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)] transition-colors"
        title="Copy link"
      >
        {copied ? (
          <Check className="size-3 text-[var(--color-green)]" />
        ) : (
          <Link className="size-3" />
        )}
      </button>

      {/* Reaction trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowReactions(!showReactions)}
          className="p-1 rounded-sm cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)] transition-colors"
          title="Add reaction"
        >
          <SmilePlus className="size-3" />
        </button>

        {showReactions && (
          <div className="absolute right-0 top-full mt-1 z-50 flex items-center gap-0.5 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-raised)] px-1.5 py-1 shadow-xl">
            {REACTIONS.map((r) => (
              <button
                key={r.content}
                type="button"
                onClick={() => handleReaction(r.content)}
                disabled={reacting}
                className="p-1 rounded cursor-pointer hover:bg-[var(--color-bg-overlay)] text-[14px] leading-none transition-colors disabled:opacity-50"
                title={r.content}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

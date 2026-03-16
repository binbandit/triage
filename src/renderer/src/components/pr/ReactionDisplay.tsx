import type { ReactionGroup } from "../../types";

const REACTION_EMOJI: Record<string, string> = {
  THUMBS_UP: "\uD83D\uDC4D",
  THUMBS_DOWN: "\uD83D\uDC4E",
  LAUGH: "\uD83D\uDE04",
  HOORAY: "\uD83C\uDF89",
  CONFUSED: "\uD83D\uDE15",
  HEART: "\u2764\uFE0F",
  ROCKET: "\uD83D\uDE80",
  EYES: "\uD83D\uDC40",
  // REST API format (lowercase)
  "+1": "\uD83D\uDC4D",
  "-1": "\uD83D\uDC4E",
  laugh: "\uD83D\uDE04",
  hooray: "\uD83C\uDF89",
  confused: "\uD83D\uDE15",
  heart: "\u2764\uFE0F",
  rocket: "\uD83D\uDE80",
  eyes: "\uD83D\uDC40",
};

interface ReactionDisplayProps {
  reactions?: ReactionGroup[];
}

/**
 * Displays existing reactions as small emoji badges with counts.
 */
export function ReactionDisplay({ reactions }: ReactionDisplayProps) {
  if (!reactions || reactions.length === 0) return null;

  const activeReactions = reactions.filter((r) => r.users.totalCount > 0);
  if (activeReactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {activeReactions.map((r) => {
        const emoji = REACTION_EMOJI[r.content] || r.content;
        return (
          <span
            key={r.content}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-overlay)] px-1.5 py-0.5 text-[11px]"
          >
            <span>{emoji}</span>
            <span className="text-[10px] font-mono text-[var(--color-fg-muted)] tabular-nums">
              {r.users.totalCount}
            </span>
          </span>
        );
      })}
    </div>
  );
}

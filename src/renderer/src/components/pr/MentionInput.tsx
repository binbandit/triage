import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react";
import { GitPullRequest, CircleDot } from "lucide-react";
import type { GitHubUser } from "../../types";
import { useSettingsStore } from "../../stores/settingsStore";

type SuggestionItem =
  | { type: "user"; login: string; avatar_url?: string }
  | { type: "ref"; number: number; title: string; isPR: boolean; state: string };

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  onSubmit?: () => void;
  className?: string;
  /** Pre-fill participants from the thread for quick @mention */
  participants?: string[];
  /** Auto-focus the textarea on mount */
  autoFocus?: boolean;
}

/**
 * Textarea with @ mention and # issue/PR reference autocomplete.
 *
 * @triggers -> search users (participants first, then GitHub search)
 * #triggers -> search issues and PRs by number or title
 */
export function MentionInput({
  value,
  onChange,
  placeholder,
  rows = 3,
  onSubmit,
  className = "",
  participants = [],
  autoFocus = false,
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerStart, setTriggerStart] = useState(-1);
  const [triggerChar, setTriggerChar] = useState<"@" | "#" | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const repo = useSettingsStore((s) => s.repo);

  const searchUsers = useCallback(
    async (query: string) => {
      // Show filtered participants immediately for short queries
      if (participants.length > 0) {
        const q = query.toLowerCase();
        const matching: SuggestionItem[] = participants
          .filter((p) => p.toLowerCase().includes(q))
          .map((login) => ({ type: "user", login }));

        if (matching.length > 0 && query.length < 3) {
          setSuggestions(matching);
          setShowSuggestions(true);
          setSelectedIndex(0);
          return;
        }
      }

      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const results = await window.api.searchUsers({ query });
        const participantMatches: SuggestionItem[] = participants
          .filter((p) => p.toLowerCase().includes(query.toLowerCase()))
          .map((login) => ({ type: "user", login }));
        const apiResults: SuggestionItem[] = Array.isArray(results)
          ? results.map((r) => ({
              type: "user" as const,
              login: r.login,
              avatar_url: r.avatar_url,
            }))
          : [];
        const seen = new Set(participantMatches.map((p) => (p as { login: string }).login));
        const merged = [
          ...participantMatches,
          ...apiResults.filter((r) => !seen.has((r as { login: string }).login)),
        ].slice(0, 8);

        if (merged.length > 0) {
          setSuggestions(merged);
          setShowSuggestions(true);
          setSelectedIndex(0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [participants],
  );

  const searchRefs = useCallback(
    async (query: string) => {
      if (!repo || query.length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const results = await window.api.searchIssuesPRs({ repo, query });
        if (Array.isArray(results) && results.length > 0) {
          const items: SuggestionItem[] = results.map((r) => ({
            type: "ref" as const,
            number: r.number,
            title: r.title,
            isPR: !!r.pull_request,
            state: r.state,
          }));
          setSuggestions(items);
          setShowSuggestions(true);
          setSelectedIndex(0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [repo],
  );

  const handleChange = (newValue: string) => {
    onChange(newValue);

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursor);

    // Check for @ mention trigger
    const mentionMatch = textBeforeCursor.match(/(^|[^a-zA-Z0-9])@([a-zA-Z0-9_-]*)$/);
    if (mentionMatch) {
      const query = mentionMatch[2];
      setTriggerStart(cursor - query.length - 1);
      setTriggerChar("@");
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => searchUsers(query), 200);
      return;
    }

    // Check for # ref trigger
    const refMatch = textBeforeCursor.match(/(^|[^a-zA-Z0-9])#([a-zA-Z0-9 _-]*)$/);
    if (refMatch) {
      const query = refMatch[2];
      setTriggerStart(cursor - query.length - 1);
      setTriggerChar("#");
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => searchRefs(query), 300);
      return;
    }

    setShowSuggestions(false);
    setTriggerStart(-1);
    setTriggerChar(null);
  };

  const insertSuggestion = (item: SuggestionItem) => {
    if (triggerStart < 0 || !triggerChar) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const before = value.slice(0, triggerStart);
    const after = value.slice(cursor);

    let insertText: string;
    if (item.type === "user") {
      insertText = `@${item.login} `;
    } else {
      insertText = `#${item.number} `;
    }

    const newValue = `${before}${insertText}${after}`;
    onChange(newValue);
    setShowSuggestions(false);
    setTriggerStart(-1);
    setTriggerChar(null);

    requestAnimationFrame(() => {
      const newCursor = triggerStart + insertText.length;
      textarea.setSelectionRange(newCursor, newCursor);
      textarea.focus();
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertSuggestion(suggestions[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        data-comment-input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={`
          w-full rounded-lg resize-none
          border border-[var(--color-border)] bg-[var(--color-bg-inset)]
          px-3 py-2
          text-[13px] text-[var(--color-fg)] font-mono
          placeholder:text-[var(--color-fg-dim)]
          outline-none transition-colors
          focus:border-[var(--color-blue)]/40
          ${className}
        `}
      />
      {/* Suggestions dropdown - opens upward */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 bottom-full mb-1 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-raised)] shadow-xl overflow-hidden max-h-48 overflow-y-auto">
          {suggestions.map((item, i) => (
            <button
              key={item.type === "user" ? `user-${item.login}` : `ref-${item.number}`}
              type="button"
              onClick={() => insertSuggestion(item)}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer
                text-[12px] transition-colors
                ${i === selectedIndex ? "bg-[var(--color-bg-overlay)] text-[var(--color-fg)]" : "text-[var(--color-fg-secondary)]"}
              `}
            >
              {item.type === "user" && (
                <>
                  {item.avatar_url && (
                    <img src={item.avatar_url} alt="" className="size-5 rounded-full" />
                  )}
                  <span className="font-mono font-medium">@{item.login}</span>
                </>
              )}
              {item.type === "ref" && (
                <>
                  {item.isPR ? (
                    <GitPullRequest className="size-3.5 shrink-0 text-[var(--color-green)]" />
                  ) : (
                    <CircleDot className="size-3.5 shrink-0 text-[var(--color-green)]" />
                  )}
                  <span className="font-mono text-[var(--color-fg-muted)] shrink-0">
                    #{item.number}
                  </span>
                  <span className="truncate">{item.title}</span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

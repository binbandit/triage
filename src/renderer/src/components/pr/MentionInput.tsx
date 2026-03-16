import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react";
import type { GitHubUser } from "../../types";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  onSubmit?: () => void;
  className?: string;
}

/**
 * Textarea with @ mention autocomplete.
 * Triggers user search when typing @username.
 */
export function MentionInput({
  value,
  onChange,
  placeholder,
  rows = 3,
  onSubmit,
  className = "",
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<GitHubUser[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const results = await window.api.searchUsers({ query });
      if (Array.isArray(results) && results.length > 0) {
        setSuggestions(results);
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
  }, []);

  const handleChange = (newValue: string) => {
    onChange(newValue);

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursor);

    // Find the last @ that isn't preceded by a word character
    const mentionMatch = textBeforeCursor.match(/(^|[^a-zA-Z0-9])@([a-zA-Z0-9_-]*)$/);
    if (mentionMatch) {
      const query = mentionMatch[2];
      setMentionStart(cursor - query.length - 1); // -1 for @
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => searchUsers(query), 200);
    } else {
      setShowSuggestions(false);
      setMentionStart(-1);
    }
  };

  const insertMention = (user: GitHubUser) => {
    if (mentionStart < 0) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const before = value.slice(0, mentionStart);
    const after = value.slice(cursor);
    const newValue = `${before}@${user.login} ${after}`;

    onChange(newValue);
    setShowSuggestions(false);
    setMentionStart(-1);

    // Restore cursor position after the inserted mention
    requestAnimationFrame(() => {
      const newCursor = mentionStart + user.login.length + 2; // @ + login + space
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
        insertMention(suggestions[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    // Cmd/Ctrl+Enter to submit
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
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
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-raised)] shadow-xl overflow-hidden">
          {suggestions.map((user, i) => (
            <button
              key={user.login}
              type="button"
              onClick={() => insertMention(user)}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer
                text-[12px] transition-colors
                ${i === selectedIndex ? "bg-[var(--color-bg-overlay)] text-[var(--color-fg)]" : "text-[var(--color-fg-secondary)]"}
              `}
            >
              {user.avatar_url && (
                <img src={user.avatar_url} alt="" className="size-5 rounded-full" />
              )}
              <span className="font-mono font-medium">@{user.login}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

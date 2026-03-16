import { useState, useEffect, type KeyboardEvent } from "react";
import { GitFork } from "lucide-react";

interface RepoInputProps {
  repo: string;
  onSubmit: (repo: string) => void;
}

/**
 * Isolated repo input component.
 * Manages its own input state to avoid re-rendering the parent on every keystroke.
 */
export function RepoInput({ repo, onSubmit }: RepoInputProps) {
  const [value, setValue] = useState(repo);

  // Sync when the external repo prop changes (e.g. from settings)
  useEffect(() => {
    setValue(repo);
  }, [repo]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative flex-1 min-w-0">
      <GitFork className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-dim)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        placeholder="owner/repo"
        spellCheck={false}
        className="
          w-full
          rounded-lg border border-[var(--color-border)]
          bg-[var(--color-bg-raised)]
          pl-8 pr-3 py-1.5
          text-[13px] font-mono text-[var(--color-fg)]
          placeholder:text-[var(--color-fg-dim)]
          outline-none transition-colors
          focus:border-[var(--color-blue)]/40 focus:bg-[var(--color-bg-overlay)]
        "
      />
    </div>
  );
}

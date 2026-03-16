import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-muted)]" />
      <input
        type="text"
        data-search-input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Filter by title, author, or #issue... (/ to focus)"
        className="
          w-full rounded-lg
          border border-[var(--color-border)] bg-[var(--color-bg-raised)]
          pl-9 pr-9 py-2
          text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)]
          outline-none transition-colors
          focus:border-[var(--color-blue)]/40 focus:bg-[var(--color-bg-overlay)]
        "
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)] transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

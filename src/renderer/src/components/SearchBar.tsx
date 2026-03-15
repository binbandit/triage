import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Filter by title, author, or #issue..."
        className="w-full rounded-lg border border-border bg-surface pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-dim outline-none transition-colors focus:border-accent focus:bg-surface-raised"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-muted-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

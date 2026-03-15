import type { PRLabel } from "../types";

interface LabelBadgeProps {
  label: PRLabel;
  highlighted?: boolean;
}

export function LabelBadge({ label, highlighted = false }: LabelBadgeProps) {
  const hex = label.color ? `#${label.color}` : undefined;

  return (
    <span
      className={`
        inline-flex items-center rounded-md px-1.5 py-px
        text-[11px] font-medium leading-5 select-none
        transition-colors
        ${highlighted ? "ring-1 ring-[var(--color-blue)]/40" : ""}
      `}
      style={
        hex
          ? {
              backgroundColor: `${hex}18`,
              color: `${hex}cc`,
              border: `1px solid ${hex}30`,
            }
          : {
              backgroundColor: "var(--color-bg-overlay)",
              color: "var(--color-fg-secondary)",
              border: "1px solid var(--color-border)",
            }
      }
      title={label.description || label.name}
    >
      {label.name}
    </span>
  );
}

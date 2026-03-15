import { useMemo } from "react";
import type { PRLabel } from "../types";
import { labelColors } from "../lib/color";

interface LabelBadgeProps {
  label: PRLabel;
  highlighted?: boolean;
}

export function LabelBadge({ label, highlighted = false }: LabelBadgeProps) {
  const colors = useMemo(() => (label.color ? labelColors(label.color) : null), [label.color]);

  return (
    <span
      className={`
        inline-flex items-center rounded-md px-1.5 py-px
        text-[11px] font-medium leading-5 select-none
        ${highlighted ? "ring-1 ring-[var(--color-blue)]/40" : ""}
      `}
      style={
        colors
          ? {
              color: colors.fg,
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
            }
          : {
              color: "var(--color-fg-secondary)",
              backgroundColor: "var(--color-bg-overlay)",
              border: "1px solid var(--color-border)",
            }
      }
      title={label.description || label.name}
    >
      {label.name}
    </span>
  );
}

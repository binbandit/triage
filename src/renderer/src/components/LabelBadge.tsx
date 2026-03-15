import type { PRLabel } from "../types";

interface LabelBadgeProps {
  label: PRLabel;
  highlighted?: boolean;
}

/**
 * Render a label with its GitHub color as a subtle background tint.
 */
export function LabelBadge({ label, highlighted = false }: LabelBadgeProps) {
  const color = label.color ? `#${label.color}` : undefined;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
        highlighted ? "ring-1 ring-accent text-accent" : "text-muted-foreground"
      }`}
      style={
        color
          ? {
              backgroundColor: `${color}1a`,
              borderColor: `${color}40`,
              borderWidth: "1px",
              color: highlighted ? undefined : color,
            }
          : {
              backgroundColor: "var(--color-surface-overlay)",
            }
      }
      title={label.description || label.name}
    >
      {label.name}
    </span>
  );
}

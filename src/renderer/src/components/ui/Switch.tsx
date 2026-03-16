import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "../../lib/cn";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onCheckedChange, disabled, className }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-px outline-none",
        "transition-colors duration-200",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-blue)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-bg)]",
        "data-[checked]:bg-[var(--color-blue)] data-[unchecked]:bg-[var(--color-fg-dim)]",
        "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
        className,
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-white shadow-sm",
          "transition-transform duration-150",
          "data-[checked]:translate-x-[18px] data-[unchecked]:translate-x-0.5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

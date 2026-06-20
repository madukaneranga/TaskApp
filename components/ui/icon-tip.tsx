import { cn } from "@/lib/utils";

interface IconTipProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  side?: "top" | "bottom";
}

export function IconTip({ label, children, className, side = "top" }: IconTipProps) {
  return (
    <span className={cn("group/icon-tip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground opacity-0 shadow transition-opacity group-hover/icon-tip:opacity-100 group-focus-within/icon-tip:opacity-100",
          side === "bottom" ? "top-full mt-1.5" : "bottom-full mb-1.5"
        )}
      >
        {label}
      </span>
    </span>
  );
}

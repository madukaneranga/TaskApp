import { cn } from "@/lib/utils";

interface IconTipProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function IconTip({ label, children, className }: IconTipProps) {
  return (
    <span className={cn("group/icon-tip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground opacity-0 shadow transition-opacity group-hover/icon-tip:opacity-100 group-focus-within/icon-tip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

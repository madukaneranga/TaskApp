import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface AppBrandProps {
  variant?: "sidebar" | "header" | "auth";
  className?: string;
  href?: string;
}

export function AppBrand({ variant = "header", className, href = "/dashboard" }: AppBrandProps) {
  if (variant === "auth") {
    return (
      <div className={cn("mb-6 flex flex-col items-center gap-2 text-center", className)}>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-navy text-white">
          <ClipboardList className="h-6 w-6" aria-hidden />
        </div>
        <span className="text-2xl font-bold text-brand-navy dark:text-foreground">{APP_NAME}</span>
      </div>
    );
  }

  const label = (
    <>
      <ClipboardList className="h-5 w-5 shrink-0" aria-hidden />
      <span className="truncate font-semibold">{APP_NAME}</span>
    </>
  );

  if (variant === "sidebar") {
    return (
      <Link
        href={href}
        className={cn(
          "flex h-10 w-full items-center justify-center gap-2 rounded-md bg-brand-navy px-3 text-sm text-white transition-opacity hover:opacity-90",
          className
        )}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 text-brand-navy transition-opacity hover:opacity-80 dark:text-foreground",
        className
      )}
    >
      {label}
    </Link>
  );
}

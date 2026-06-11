"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/lib/pagination";

interface PaginationProps {
  pagination: PaginationMeta;
  pageParam?: string;
  className?: string;
}

export function Pagination({
  pagination,
  pageParam = "page",
  className,
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { page, totalPages, totalItems } = pagination;

  function buildHref(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (targetPage <= 1) {
      params.delete(pageParam);
    } else {
      params.set(pageParam, String(targetPage));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  if (totalPages <= 1) {
    return null;
  }

  const start = (page - 1) * pagination.pageSize + 1;
  const end = Math.min(page * pagination.pageSize, totalItems);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
          {page > 1 ? (
            <Link href={buildHref(page - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Link>
          ) : (
            <span>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </span>
          )}
        </Button>
        <span className="px-2 text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          asChild={page < totalPages}
        >
          {page < totalPages ? (
            <Link href={buildHref(page + 1)}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          ) : (
            <span>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

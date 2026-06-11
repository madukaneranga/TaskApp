"use client";

import { formatDate, formatDateTime } from "@/lib/utils";

export function LocalDate({ value }: { value: string }) {
  return (
    <time suppressHydrationWarning dateTime={value}>
      {formatDate(value)}
    </time>
  );
}

export function LocalDateTime({ value }: { value: string }) {
  return (
    <time suppressHydrationWarning dateTime={value}>
      {formatDateTime(value)}
    </time>
  );
}

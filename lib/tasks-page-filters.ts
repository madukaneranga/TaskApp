import type { TaskStatus } from "@/lib/types";
import { parseStatusFilter } from "@/lib/task-utils";

export type TasksDatePreset = "all" | "today" | "7d" | "30d" | "custom";

export interface TasksPageFilterParams {
  status: TaskStatus | "all";
  userId?: string;
  date: {
    preset: TasksDatePreset;
    from: string;
    to: string;
    fromIso?: string;
    toIso?: string;
  };
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseDateInput(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function parseTasksPageFilters(searchParams: {
  status?: string;
  user?: string;
  range?: string;
  from?: string;
  to?: string;
}): TasksPageFilterParams {
  const preset = (["all", "today", "7d", "30d", "custom"].includes(searchParams.range || "")
    ? searchParams.range
    : "all") as TasksDatePreset;

  const now = new Date();
  let fromDate: Date | null = null;
  let toDate: Date | null = null;

  if (preset === "today") {
    fromDate = startOfDay(now);
    toDate = endOfDay(now);
  } else if (preset === "7d") {
    fromDate = startOfDay(new Date(now));
    fromDate.setDate(fromDate.getDate() - 6);
    toDate = endOfDay(now);
  } else if (preset === "30d") {
    fromDate = startOfDay(new Date(now));
    fromDate.setDate(fromDate.getDate() - 29);
    toDate = endOfDay(now);
  } else if (preset === "custom") {
    const customFrom = parseDateInput(searchParams.from);
    const customTo = parseDateInput(searchParams.to);
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 6);
    fromDate = customFrom ? startOfDay(customFrom) : startOfDay(defaultFrom);
    toDate = customTo ? endOfDay(customTo) : endOfDay(new Date());
  }

  return {
    status: parseStatusFilter(searchParams.status),
    userId: searchParams.user || undefined,
    date: {
      preset,
      from: fromDate ? formatDateInput(fromDate) : searchParams.from || "",
      to: toDate ? formatDateInput(toDate) : searchParams.to || "",
      fromIso: fromDate?.toISOString(),
      toIso: toDate?.toISOString(),
    },
  };
}

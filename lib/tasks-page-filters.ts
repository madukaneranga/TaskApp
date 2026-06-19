import type { SupabaseClient } from "@supabase/supabase-js";
import { parseStatusFilter, parseTaskId } from "@/lib/task-utils";
import type { TaskStatus } from "@/lib/types";

export type TasksDatePreset = "all" | "today" | "7d" | "30d" | "custom";
export type TasksDateField = "created" | "started" | "ended";

export interface TasksPageFilterParams {
  status: TaskStatus | "all";
  userId?: string;
  taskId?: number;
  date: {
    field: TasksDateField;
    preset: TasksDatePreset;
    from: string;
    to: string;
    fromIso?: string;
    toIso?: string;
  };
}

export type TasksPageSearchParams = {
  page?: string;
  status?: string;
  user?: string;
  taskId?: string;
  dateField?: string;
  range?: string;
  from?: string;
  to?: string;
};

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

function parseDateTimeInput(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function formatDateTimeLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDateField(value: string | undefined): TasksDateField {
  if (value === "started" || value === "ended") return value;
  return "created";
}

export function parseTasksPageFilters(searchParams: TasksPageSearchParams): TasksPageFilterParams {
  const preset = (["all", "today", "7d", "30d", "custom"].includes(searchParams.range || "")
    ? searchParams.range
    : "all") as TasksDatePreset;

  const field = parseDateField(searchParams.dateField);
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
    const customFrom = parseDateTimeInput(searchParams.from) ?? parseDateInput(searchParams.from);
    const customTo = parseDateTimeInput(searchParams.to) ?? parseDateInput(searchParams.to);
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 6);
    fromDate = customFrom ? (parseDateTimeInput(searchParams.from) ? customFrom : startOfDay(customFrom)) : startOfDay(defaultFrom);
    toDate = customTo ? (parseDateTimeInput(searchParams.to) ? customTo : endOfDay(customTo)) : endOfDay(new Date());
  }

  const fromDisplay =
    fromDate && preset === "custom" && parseDateTimeInput(searchParams.from)
      ? formatDateTimeLocalInput(fromDate)
      : fromDate
        ? formatDateInput(fromDate)
        : searchParams.from || "";
  const toDisplay =
    toDate && preset === "custom" && parseDateTimeInput(searchParams.to)
      ? formatDateTimeLocalInput(toDate)
      : toDate
        ? formatDateInput(toDate)
        : searchParams.to || "";

  const taskId = parseTaskId(searchParams.taskId) ?? undefined;

  return {
    status: parseStatusFilter(searchParams.status),
    userId: searchParams.user || undefined,
    taskId,
    date: {
      field,
      preset,
      from: fromDisplay,
      to: toDisplay,
      fromIso: fromDate?.toISOString(),
      toIso: toDate?.toISOString(),
    },
  };
}

const EMPTY_TASK_ID = "00000000-0000-0000-0000-000000000000";

type SessionTimeRow = {
  task_id: string;
  start_time: string;
  end_time: string | null;
};

export async function getTaskIdsForSessionDateFilter(
  supabase: SupabaseClient,
  field: "started" | "ended",
  fromIso?: string,
  toIso?: string
): Promise<string[] | null> {
  if (!fromIso && !toIso) return null;

  const { data: sessions } = await supabase
    .from("sessions")
    .select("task_id, start_time, end_time");

  const agg = new Map<string, { start: string; end: string | null }>();
  for (const session of (sessions || []) as SessionTimeRow[]) {
    const existing = agg.get(session.task_id);
    if (!existing) {
      agg.set(session.task_id, { start: session.start_time, end: session.end_time });
      continue;
    }
    if (session.start_time < existing.start) existing.start = session.start_time;
    if (session.end_time && (!existing.end || session.end_time > existing.end)) {
      existing.end = session.end_time;
    }
  }

  const from = fromIso ? new Date(fromIso).getTime() : Number.NEGATIVE_INFINITY;
  const to = toIso ? new Date(toIso).getTime() : Number.POSITIVE_INFINITY;

  const ids: string[] = [];
  for (const [taskId, times] of Array.from(agg.entries())) {
    const iso = field === "started" ? times.start : times.end;
    if (!iso) continue;
    const t = new Date(iso).getTime();
    if (t >= from && t <= to) ids.push(taskId);
  }

  return ids;
}

export async function applyTasksPageFiltersToQuery(
  supabase: SupabaseClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters: TasksPageFilterParams,
  options?: { restrictToUserId?: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  let nextQuery = query;

  if (options?.restrictToUserId) {
    nextQuery = nextQuery.eq("assigned_to", options.restrictToUserId);
  } else if (filters.userId) {
    nextQuery = nextQuery.eq("assigned_to", filters.userId);
  }

  if (filters.status !== "all") {
    nextQuery = nextQuery.eq("status", filters.status);
  }

  if (filters.taskId != null) {
    nextQuery = nextQuery.eq("task_id", filters.taskId);
  }

  const { fromIso, toIso, field } = filters.date;
  if (filters.date.preset !== "all" && (fromIso || toIso)) {
    if (field === "created") {
      if (fromIso) nextQuery = nextQuery.gte("created_at", fromIso);
      if (toIso) nextQuery = nextQuery.lte("created_at", toIso);
    } else {
      const taskIds = await getTaskIdsForSessionDateFilter(supabase, field, fromIso, toIso);
      const ids = taskIds && taskIds.length > 0 ? taskIds : [EMPTY_TASK_ID];
      nextQuery = nextQuery.in("id", ids);
    }
  }

  return nextQuery;
}

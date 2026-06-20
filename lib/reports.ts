import {
  computeSpanDurationSeconds,
  computeTaskWorkDurationSeconds,
} from "@/lib/task-utils";
import type { SessionSegment, TaskStatus, User, UserOption } from "@/lib/types";
import { getUserLabel } from "@/lib/user-utils";

export type ReportRangePreset = "today" | "7d" | "30d" | "custom";

export interface ReportDateRange {
  preset: ReportRangePreset;
  from: Date;
  to: Date;
  fromIso: string;
  toIso: string;
}

export interface ReportParams {
  range: ReportDateRange;
  userId?: string;
  status: TaskStatus | "all";
}

export interface EnrichedReportTask {
  id: string;
  task_id: number;
  task_name: string;
  status: TaskStatus;
  assigned_to: string;
  assigned_user?: { id: string; user_code: string };
  created_at: string;
  total_images_count: number;
  start_time: string | null;
  end_time: string | null;
  total_duration: number;
  total_span_duration: number;
  edited_images_count: number | null;
}

export interface ReportTaskRow {
  id: string;
  taskId: number;
  taskName: string;
  status: TaskStatus;
  assignedTo: string;
  createdAt: string;
  startTime: string | null;
  endTime: string | null;
  durationSeconds: number | null;
  spanDurationSeconds: number | null;
  totalImages: number;
  editedImages: number | null;
}

export interface ReportUserRow {
  userId: string;
  userName: string;
  completed: number;
  inProgress: number;
  paused: number;
  pending: number;
  totalHours: number;
  imagesEdited: number;
}

export interface ReportSummary {
  completed: number;
  inProgress: number;
  paused: number;
  pending: number;
  totalHours: number;
  imagesEdited: number;
  totalImages: number;
  completedByDay: { day: string; count: number }[];
}

type SessionRow = {
  task_id: string;
  user_id: string;
  start_time: string;
  duration: number;
  end_time: string | null;
  edited_images_count: number | null;
  session_segments?: SessionSegment[];
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

export function parseReportParams(searchParams: {
  range?: string;
  from?: string;
  to?: string;
  user?: string;
  status?: string;
}): ReportParams {
  const preset = (["today", "7d", "30d", "custom"].includes(searchParams.range || "")
    ? searchParams.range
    : "7d") as ReportRangePreset;

  const now = new Date();
  let from: Date;
  let to: Date = endOfDay(now);

  if (preset === "today") {
    from = startOfDay(now);
  } else if (preset === "30d") {
    from = startOfDay(new Date(now));
    from.setDate(from.getDate() - 29);
  } else if (preset === "custom") {
    const customFrom = parseDateInput(searchParams.from);
    const customTo = parseDateInput(searchParams.to);
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 6);
    from = customFrom ? startOfDay(customFrom) : startOfDay(defaultFrom);
    to = customTo ? endOfDay(customTo) : endOfDay(new Date());
  } else {
    from = startOfDay(new Date());
    from.setDate(from.getDate() - 6);
  }

  const status = (["pending", "in_progress", "paused", "completed", "all"].includes(
    searchParams.status || ""
  )
    ? searchParams.status
    : "all") as TaskStatus | "all";

  return {
    range: {
      preset,
      from,
      to,
      fromIso: from.toISOString(),
      toIso: to.toISOString(),
    },
    userId: searchParams.user || undefined,
    status,
  };
}

function isInRange(iso: string | null | undefined, from: Date, to: Date): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t <= to.getTime();
}

export function getTodayDateRange(now = new Date()): { from: Date; to: Date } {
  return { from: startOfDay(now), to: endOfDay(now) };
}

export function sumSessionHoursInRange(
  sessions: Pick<SessionRow, "start_time" | "end_time" | "duration">[],
  from: Date,
  to: Date
): number {
  const seconds = sessions.reduce((sum, session) => {
    const touchesRange =
      isInRange(session.start_time, from, to) ||
      isInRange(session.end_time, from, to);
    if (!touchesRange || !session.end_time) return sum;
    return sum + (session.duration || 0);
  }, 0);
  return Math.round((seconds / 3600) * 10) / 10;
}

export function countCompletedTasksInRange(
  tasks: Array<{ id: string; status: TaskStatus }>,
  sessions: Pick<SessionRow, "task_id" | "end_time">[],
  from: Date,
  to: Date
): number {
  let count = 0;

  for (const task of tasks) {
    if (task.status !== "completed") continue;

    let endTime: string | null = null;
    for (const session of sessions) {
      if (session.task_id !== task.id || !session.end_time) continue;
      if (!endTime || session.end_time > endTime) {
        endTime = session.end_time;
      }
    }

    if (isInRange(endTime, from, to)) count++;
  }

  return count;
}

function taskTouchesRange(task: EnrichedReportTask, from: Date, to: Date): boolean {
  return (
    isInRange(task.created_at, from, to) ||
    isInRange(task.start_time, from, to) ||
    isInRange(task.end_time, from, to)
  );
}

export function enrichTasksForReport(
  tasks: Array<{
    id: string;
    task_id: number;
    task_name: string;
    status: TaskStatus;
    assigned_to: string;
    created_at: string;
    total_images_count: number;
    assigned_user?: { id: string; user_code: string };
  }>,
  sessions: SessionRow[]
): EnrichedReportTask[] {
  const sessionsByTask = new Map<string, SessionRow[]>();
  for (const session of sessions) {
    const list = sessionsByTask.get(session.task_id) || [];
    list.push(session);
    sessionsByTask.set(session.task_id, list);
  }

  return tasks.map((task) => {
    const taskSessions = sessionsByTask.get(task.id) || [];
    let start_time: string | null = null;
    let end_time: string | null = null;
    let edited_images_count: number | null = null;

    for (const session of taskSessions) {
      if (!start_time || session.start_time < start_time) {
        start_time = session.start_time;
      }
      if (session.end_time) {
        if (!end_time || session.end_time > end_time) {
          end_time = session.end_time;
        }
        if (session.edited_images_count != null && edited_images_count == null) {
          edited_images_count = session.edited_images_count;
        }
      }
    }

    const isCompleted = task.status === "completed";

    return {
      ...task,
      start_time,
      end_time,
      total_duration: isCompleted ? computeTaskWorkDurationSeconds(taskSessions) : 0,
      total_span_duration: isCompleted
        ? computeSpanDurationSeconds(start_time, end_time)
        : 0,
      edited_images_count: isCompleted ? edited_images_count : null,
    };
  });
}

function toTaskRow(task: EnrichedReportTask): ReportTaskRow {
  return {
    id: task.id,
    taskId: task.task_id,
    taskName: task.task_name,
    status: task.status,
    assignedTo: getUserLabel(task.assigned_user),
    createdAt: task.created_at,
    startTime: task.start_time,
    endTime: task.end_time,
    durationSeconds: task.status === "completed" ? task.total_duration : null,
    spanDurationSeconds:
      task.status === "completed" ? task.total_span_duration : null,
    totalImages: task.total_images_count,
    editedImages: task.edited_images_count,
  };
}

export function buildReportData(
  tasks: EnrichedReportTask[],
  sessions: SessionRow[],
  users: UserOption[],
  params: ReportParams
): {
  summary: ReportSummary;
  taskRows: ReportTaskRow[];
  userRows: ReportUserRow[];
  backlogRows: ReportTaskRow[];
} {
  const { from, to } = params.range;

  let filtered = tasks;
  if (params.userId) {
    filtered = filtered.filter((t) => t.assigned_to === params.userId);
  }
  if (params.status !== "all") {
    filtered = filtered.filter((t) => t.status === params.status);
  }

  const inRangeTasks = filtered.filter((t) => taskTouchesRange(t, from, to));
  const taskRows = inRangeTasks.map(toTaskRow);

  const backlogRows = filtered
    .filter((t) => t.status === "pending" || t.status === "paused")
    .map(toTaskRow);

  const completedInRange = filtered.filter(
    (t) => t.status === "completed" && isInRange(t.end_time, from, to)
  );

  const completedByDayMap: Record<string, number> = {};
  for (const task of completedInRange) {
    if (!task.end_time) continue;
    const day = new Date(task.end_time).toISOString().split("T")[0];
    completedByDayMap[day] = (completedByDayMap[day] || 0) + 1;
  }

  const completedByDay = Object.entries(completedByDayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }));

  const sessionsInRange = sessions.filter((s) => {
    const touch =
      isInRange(s.start_time, from, to) ||
      isInRange(s.end_time, from, to);
    if (!touch) return false;
    if (params.userId && s.user_id !== params.userId) return false;
    return true;
  });

  const hoursInRange = sessionsInRange.reduce((sum, s) => {
    if (!s.end_time) return sum;
    return sum + (s.duration || 0);
  }, 0);

  const imagesEdited = sessionsInRange.reduce(
    (sum, s) => sum + (s.edited_images_count || 0),
    0
  );

  const summary: ReportSummary = {
    completed: completedInRange.length,
    inProgress: filtered.filter((t) => t.status === "in_progress").length,
    paused: filtered.filter((t) => t.status === "paused").length,
    pending: filtered.filter((t) => t.status === "pending").length,
    totalHours: Math.round((hoursInRange / 3600) * 10) / 10,
    imagesEdited,
    totalImages: inRangeTasks.reduce((s, t) => s + t.total_images_count, 0),
    completedByDay,
  };

  const userMap = new Map<string, ReportUserRow>();
  for (const user of users) {
    userMap.set(user.id, {
      userId: user.id,
      userName: getUserLabel(user),
      completed: 0,
      inProgress: 0,
      paused: 0,
      pending: 0,
      totalHours: 0,
      imagesEdited: 0,
    });
  }

  for (const task of filtered) {
    const row = userMap.get(task.assigned_to);
    if (!row) continue;
    if (task.status === "completed" && isInRange(task.end_time, from, to)) row.completed++;
    else if (task.status === "in_progress") row.inProgress++;
    else if (task.status === "paused") row.paused++;
    else if (task.status === "pending") row.pending++;
  }

  for (const session of sessionsInRange) {
    const row = userMap.get(session.user_id);
    if (!row) continue;
    if (!session.end_time) continue;
    row.totalHours += (session.duration || 0) / 3600;
    row.imagesEdited += session.edited_images_count || 0;
  }

  const userRows = Array.from(userMap.values())
    .map((r) => ({
      ...r,
      totalHours: Math.round(r.totalHours * 10) / 10,
    }))
    .filter(
      (r) =>
        r.completed > 0 ||
        r.inProgress > 0 ||
        r.paused > 0 ||
        r.pending > 0 ||
        r.totalHours > 0 ||
        r.imagesEdited > 0
    )
    .sort((a, b) => a.userName.localeCompare(b.userName));

  return { summary, taskRows, userRows, backlogRows };
}

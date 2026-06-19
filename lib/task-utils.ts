import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateWorkDuration } from "@/lib/session-utils";
import { formatDuration } from "@/lib/utils";
import type { SessionSegment, Task, TaskStatus } from "@/lib/types";

const TASK_STATUS_FILTERS: TaskStatus[] = [
  "pending",
  "in_progress",
  "paused",
  "completed",
];

export function parseStatusFilter(value: string | undefined): TaskStatus | "all" {
  if (value && TASK_STATUS_FILTERS.includes(value as TaskStatus)) {
    return value as TaskStatus;
  }
  return "all";
}

export function getTaskStartActionLabel(status: TaskStatus): string {
  return status === "paused" ? "Resume" : "Start";
}

export function canShowTaskStartAction(
  task: Pick<Task, "id" | "status">,
  options?: {
    assignedTo?: string;
    currentUserId?: string;
    hasActiveSession?: boolean;
    activeTaskIds?: Iterable<string>;
  }
): boolean {
  if (task.status === "completed") return false;

  if (
    options?.assignedTo &&
    options.currentUserId &&
    options.assignedTo !== options.currentUserId
  ) {
    return false;
  }

  if (options?.hasActiveSession) return false;

  if (options?.activeTaskIds) {
    const activeIds = Array.from(options.activeTaskIds);
    if (activeIds.includes(task.id)) return false;
  }

  return (
    task.status === "pending" ||
    task.status === "paused" ||
    task.status === "in_progress"
  );
}

type SessionDurationRow = {
  task_id: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  edited_images_count: number | null;
  session_segments?: SessionSegment[];
};

export function computeSpanDurationSeconds(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): number {
  if (!startTime || !endTime) return 0;
  return Math.max(
    0,
    Math.floor(
      (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000
    )
  );
}

function getCompletedSessionWorkDurationSeconds(
  session: Pick<SessionDurationRow, "end_time" | "duration" | "session_segments">
): number {
  if (!session.end_time) return 0;
  if (session.duration) return session.duration;
  return calculateWorkDuration(session.session_segments || []);
}

export function computeTaskWorkDurationSeconds(
  sessions: Array<Pick<SessionDurationRow, "end_time" | "duration" | "session_segments">>
): number {
  return sessions.reduce(
    (sum, session) => sum + getCompletedSessionWorkDurationSeconds(session),
    0
  );
}

/** @deprecated Use computeTaskWorkDurationSeconds */
export function computeTaskTotalDurationSeconds(
  sessions: Array<Pick<SessionDurationRow, "end_time" | "duration" | "session_segments">>
): number {
  return computeTaskWorkDurationSeconds(sessions);
}

export function formatCompletedDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  return formatDuration(seconds);
}

export function formatTaskWorkDuration(
  task: Pick<Task, "status" | "total_duration">
): string {
  if (task.status !== "completed") return "—";
  return formatCompletedDuration(task.total_duration);
}

export function formatTaskSpanDuration(
  task: Pick<Task, "status" | "total_span_duration">
): string {
  if (task.status !== "completed") return "—";
  return formatCompletedDuration(task.total_span_duration);
}

export const DEFAULT_CLIENT_NAME = "Default Client";

export const TASK_NAME_OPTIONS = [
  "GREEN",
  "RED PDR",
  "RED DA",
  "ORANGE PDR",
  "ORANGE DA",
  "BLACK DA",
] as const;

export function isNumericTaskId(value: string): boolean {
  return /^\d+$/.test(value.trim());
}

export function parseTaskId(value: unknown): number | null {
  if (value == null || value === "") return null;
  const normalized = String(value).trim();
  if (!isNumericTaskId(normalized)) return null;
  return Number(normalized);
}

export function formatTaskImageCount(task: Pick<Task, "status" | "total_images_count" | "edited_images_count">): string {
  if (task.status === "completed" && task.edited_images_count != null) {
    return `${task.edited_images_count}/${task.total_images_count}`;
  }

  return String(task.total_images_count);
}

export async function enrichTasksWithEditedCount(
  supabase: SupabaseClient,
  tasks: Task[]
): Promise<Task[]> {
  if (tasks.length === 0) return tasks;

  const taskIds = tasks.map((t) => t.id);

  const { data: sessions } = await supabase
    .from("sessions")
    .select("task_id, edited_images_count, start_time, end_time, duration, session_segments(*)")
    .in("task_id", taskIds);

  const editedByTask = new Map<string, number>();
  const startTimeByTask = new Map<string, string>();
  const endTimeByTask = new Map<string, string>();
  const sessionsByTask = new Map<string, SessionDurationRow[]>();

  for (const session of (sessions || []) as SessionDurationRow[]) {
    const taskSessions = sessionsByTask.get(session.task_id) || [];
    taskSessions.push(session);
    sessionsByTask.set(session.task_id, taskSessions);

    if (session.start_time) {
      const existing = startTimeByTask.get(session.task_id);
      if (!existing || session.start_time < existing) {
        startTimeByTask.set(session.task_id, session.start_time);
      }
    }
    if (session.end_time) {
      const existing = endTimeByTask.get(session.task_id);
      if (!existing || session.end_time > existing) {
        endTimeByTask.set(session.task_id, session.end_time);
      }
    }
    if (!editedByTask.has(session.task_id) && session.edited_images_count != null) {
      editedByTask.set(session.task_id, session.edited_images_count);
    }
  }

  return tasks.map((task) => {
    const start_time = startTimeByTask.get(task.id) ?? null;
    const end_time = endTimeByTask.get(task.id) ?? null;
    const isCompleted = task.status === "completed";
    const taskSessions = sessionsByTask.get(task.id) || [];

    return {
      ...task,
      start_time,
      end_time,
      total_duration: isCompleted ? computeTaskWorkDurationSeconds(taskSessions) : undefined,
      total_span_duration: isCompleted
        ? computeSpanDurationSeconds(start_time, end_time)
        : undefined,
      ...(isCompleted
        ? { edited_images_count: editedByTask.get(task.id) ?? null }
        : {}),
    };
  });
}


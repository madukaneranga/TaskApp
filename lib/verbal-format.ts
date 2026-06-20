import type { AuditLogEntry } from "@/lib/audit-logs";
import { AUDIT_OPERATION_LABELS, getAuditTableLabel } from "@/lib/audit-logs";
import {
  TASK_STATUS_LABELS,
  type SegmentType,
  type StatusHistoryEntry,
  type TaskStatus,
} from "@/lib/types";
import { getUserLabel, type UserLabelSource } from "@/lib/user-utils";

export type TaskLabelSource = {
  task_id?: number | null;
  task_name?: string | null;
};

/** Short task label, e.g. "GREEN (#123)". */
export function getTaskLabel(task: TaskLabelSource | null | undefined): string {
  if (!task) return "an unknown task";
  const name = task.task_name?.trim() || "Untitled";
  if (task.task_id != null) return `${name} (#${task.task_id})`;
  return name;
}

export function formatUserWorkingOnTask(
  user: UserLabelSource | null | undefined,
  task: TaskLabelSource | null | undefined,
  options?: { paused?: boolean }
): string {
  const userLabel = getUserLabel(user);
  const taskLabel = getTaskLabel(task);
  const verb = options?.paused ? "is paused on" : "is working on";
  return `${userLabel} ${verb} ${taskLabel}`;
}

export function formatYouWorkingOnTask(
  task: TaskLabelSource | null | undefined,
  options?: { paused?: boolean }
): string {
  const taskLabel = getTaskLabel(task);
  const verb = options?.paused ? "You are paused on" : "You are working on";
  return `${verb} ${taskLabel}`;
}

export function formatTaskAssignedTo(
  user: UserLabelSource | null | undefined,
  task?: TaskLabelSource | null | undefined
): string {
  const userLabel = getUserLabel(user);
  if (task) return `${userLabel} is assigned to ${getTaskLabel(task)}`;
  return `Assigned to ${userLabel}`;
}

export function formatStatusChange(
  entry: Pick<StatusHistoryEntry, "old_status" | "new_status">,
  user: UserLabelSource | null | undefined
): string {
  const userLabel = getUserLabel(user);
  const oldLabel = entry.old_status ? TASK_STATUS_LABELS[entry.old_status] : "none";
  const newLabel = TASK_STATUS_LABELS[entry.new_status];
  return `${userLabel} changed status from ${oldLabel} to ${newLabel}`;
}

export function formatSegmentActivity(
  userName: string,
  type: SegmentType,
  durationSeconds: number,
  formatDuration: (seconds: number) => string
): string {
  const duration = formatDuration(durationSeconds);
  if (type === "work") return `${userName} worked for ${duration}`;
  return `${userName} paused for ${duration}`;
}

export function formatSessionActivity(
  user: UserLabelSource | null | undefined,
  task: TaskLabelSource | null | undefined,
  options: { workDuration?: string | null; active?: boolean }
): string {
  const userLabel = getUserLabel(user);
  const taskLabel = getTaskLabel(task);

  if (options.active) {
    return `${userLabel} is working on ${taskLabel}`;
  }

  if (options.workDuration) {
    return `${userLabel} worked on ${taskLabel} for ${options.workDuration}`;
  }

  return `${userLabel} had a session on ${taskLabel}`;
}

export function formatNoteActivity(user: UserLabelSource | null | undefined): string {
  return `${getUserLabel(user)} added a note`;
}

export function formatProblemReported(user: UserLabelSource | null | undefined): string {
  return `Reported by ${getUserLabel(user)}`;
}

function readTaskStatus(value: unknown): TaskStatus | null {
  if (typeof value !== "string") return null;
  return value in TASK_STATUS_LABELS ? (value as TaskStatus) : null;
}

function readTaskLabelFromData(data: Record<string, unknown> | null): string | null {
  if (!data) return null;
  const taskId = data.task_id;
  const taskName = data.task_name;
  if (typeof taskName === "string" && taskName.trim()) {
    if (typeof taskId === "number") return getTaskLabel({ task_id: taskId, task_name: taskName });
    return taskName.trim();
  }
  return null;
}

export function formatAuditLogSummary(
  log: AuditLogEntry,
  actorLabel: string
): string {
  const tableLabel = getAuditTableLabel(log.table_name);
  const action = AUDIT_OPERATION_LABELS[log.operation].toLowerCase();
  const newData =
    log.new_data && typeof log.new_data === "object" && !Array.isArray(log.new_data)
      ? (log.new_data as Record<string, unknown>)
      : null;
  const oldData =
    log.old_data && typeof log.old_data === "object" && !Array.isArray(log.old_data)
      ? (log.old_data as Record<string, unknown>)
      : null;

  if (log.table_name === "tasks") {
    const taskLabel =
      readTaskLabelFromData(newData) ?? readTaskLabelFromData(oldData) ?? "a task";

    if (log.operation === "INSERT") {
      return `${actorLabel} created task ${taskLabel}`;
    }

    if (log.operation === "DELETE") {
      return `${actorLabel} deleted task ${taskLabel}`;
    }

    if (log.changed_fields?.includes("status")) {
      const oldStatus = readTaskStatus(oldData?.status);
      const newStatus = readTaskStatus(newData?.status);
      if (oldStatus && newStatus) {
        return `${actorLabel} changed ${taskLabel} from ${TASK_STATUS_LABELS[oldStatus]} to ${TASK_STATUS_LABELS[newStatus]}`;
      }
    }

    if (log.changed_fields?.includes("assigned_to")) {
      return `${actorLabel} reassigned ${taskLabel}`;
    }

    return `${actorLabel} updated task ${taskLabel}`;
  }

  if (log.table_name === "sessions") {
    if (log.operation === "INSERT") {
      return `${actorLabel} started a session`;
    }
    if (log.operation === "UPDATE") {
      return `${actorLabel} updated a session`;
    }
    return `${actorLabel} deleted a session`;
  }

  if (log.table_name === "notes" && log.operation === "INSERT") {
    return `${actorLabel} added a note`;
  }

  if (log.table_name === "status_history" && log.operation === "INSERT") {
    const oldStatus = readTaskStatus(newData?.old_status);
    const newStatus = readTaskStatus(newData?.new_status);
    if (oldStatus && newStatus) {
      return `${actorLabel} changed status from ${TASK_STATUS_LABELS[oldStatus]} to ${TASK_STATUS_LABELS[newStatus]}`;
    }
  }

  if (log.table_name === "problem_reports" && log.operation === "INSERT") {
    const title = typeof newData?.title === "string" ? newData.title : "a problem";
    return `${actorLabel} reported "${title}"`;
  }

  if (log.table_name === "users") {
    if (log.operation === "INSERT") return `${actorLabel} created a user account`;
    if (log.operation === "DELETE") return `${actorLabel} removed a user account`;
    return `${actorLabel} updated a user account`;
  }

  return `${actorLabel} ${action}d a ${tableLabel.toLowerCase()} record`;
}

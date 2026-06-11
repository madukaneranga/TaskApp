import { parseTaskId } from "@/lib/task-utils";
import type { TaskStatus } from "@/lib/types";

export const MAX_TASK_ID_RANGE_SIZE = 500;

export interface TaskIdRangeInput {
  from: number;
  to: number;
}

export interface TaskIdRangeAuditRow {
  id: string;
  task_id: number;
  task_name: string;
  status: TaskStatus;
  assigned_user?: { user_code: string } | null;
}

export interface TaskIdRangeAuditTask extends TaskIdRangeAuditRow {
  excluded: boolean;
}

export interface TaskIdRangeAuditResult {
  from: number;
  to: number;
  totalInRange: number;
  exceptCount: number;
  exceptIds: number[];
  exceptGroups: string[];
  expectedCount: number;
  foundCount: number;
  missingCount: number;
  missingNumbers: number[];
  missingGroups: string[];
  statusCounts: Record<TaskStatus, number>;
  tasks: TaskIdRangeAuditTask[];
}

export function parseTaskIdRange(
  fromValue: unknown,
  toValue: unknown
): { ok: true; range: TaskIdRangeInput } | { ok: false; error: string } {
  const from = parseTaskId(fromValue);
  const to = parseTaskId(toValue);

  if (from === null || to === null) {
    return { ok: false, error: "Enter valid numeric task IDs for both fields." };
  }

  if (from > to) {
    return { ok: false, error: "From task ID must be less than or equal to To task ID." };
  }

  const totalInRange = to - from + 1;
  if (totalInRange > MAX_TASK_ID_RANGE_SIZE) {
    return {
      ok: false,
      error: `Range is too large (${totalInRange} numbers). Maximum allowed is ${MAX_TASK_ID_RANGE_SIZE}.`,
    };
  }

  return { ok: true, range: { from, to } };
}

export function parseExceptTaskIds(
  value: unknown,
  range?: TaskIdRangeInput
): { ok: true; ids: number[] } | { ok: false; error: string } {
  if (value == null || String(value).trim() === "") {
    return { ok: true, ids: [] };
  }

  const parts = String(value)
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const ids: number[] = [];
  const seen = new Set<number>();

  for (const part of parts) {
    const parsed = parseTaskId(part);
    if (parsed === null) {
      return { ok: false, error: `"${part}" is not a valid task ID.` };
    }

    if (!seen.has(parsed)) {
      seen.add(parsed);
      ids.push(parsed);
    }
  }

  if (range) {
    const outOfRange = ids.filter((id) => id < range.from || id > range.to);
    if (outOfRange.length > 0) {
      return {
        ok: false,
        error: `Except IDs must be within the range (${range.from}-${range.to}). Invalid: ${outOfRange.join(", ")}.`,
      };
    }
  }

  return { ok: true, ids };
}

export function groupConsecutiveNumbers(numbers: number[]): string[] {
  if (numbers.length === 0) return [];

  const sorted = [...numbers].sort((a, b) => a - b);
  const groups: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
      continue;
    }

    groups.push(start === end ? String(start) : `${start}-${end}`);
    start = sorted[i];
    end = sorted[i];
  }

  groups.push(start === end ? String(start) : `${start}-${end}`);
  return groups;
}

const EMPTY_STATUS_COUNTS: Record<TaskStatus, number> = {
  pending: 0,
  in_progress: 0,
  paused: 0,
  completed: 0,
};

export function auditTaskIdRange(
  range: TaskIdRangeInput,
  tasks: TaskIdRangeAuditRow[],
  exceptIds: number[] = []
): TaskIdRangeAuditResult {
  const { from, to } = range;
  const totalInRange = to - from + 1;
  const exceptIdsInRange: number[] = [];
  const exceptSet = new Set<number>();
  for (const id of exceptIds) {
    if (id >= from && id <= to && !exceptSet.has(id)) {
      exceptSet.add(id);
      exceptIdsInRange.push(id);
    }
  }
  exceptIdsInRange.sort((a, b) => a - b);
  const expectedCount = totalInRange - exceptSet.size;
  const existingIds = new Set(tasks.map((task) => task.task_id));
  const missingNumbers: number[] = [];

  for (let taskId = from; taskId <= to; taskId++) {
    if (exceptSet.has(taskId) || existingIds.has(taskId)) {
      continue;
    }
    missingNumbers.push(taskId);
  }

  const includedTasks = tasks.filter((task) => !exceptSet.has(task.task_id));

  const statusCounts = { ...EMPTY_STATUS_COUNTS };
  for (const task of includedTasks) {
    statusCounts[task.status] += 1;
  }

  const sortedTasks = [...tasks]
    .sort((a, b) => a.task_id - b.task_id)
    .map((task) => ({
      ...task,
      excluded: exceptSet.has(task.task_id),
    }));

  return {
    from,
    to,
    totalInRange,
    exceptCount: exceptSet.size,
    exceptIds: exceptIdsInRange,
    exceptGroups: groupConsecutiveNumbers(exceptIdsInRange),
    expectedCount,
    foundCount: includedTasks.length,
    missingCount: missingNumbers.length,
    missingNumbers,
    missingGroups: groupConsecutiveNumbers(missingNumbers),
    statusCounts,
    tasks: sortedTasks,
  };
}

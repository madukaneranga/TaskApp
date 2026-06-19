import type { Json } from "@/lib/database.types";
import type { UserOption } from "@/lib/types";

export const AUDITED_TABLES = [
  "users",
  "tasks",
  "task_members",
  "sessions",
  "session_segments",
  "notes",
  "status_history",
  "problem_reports",
] as const;

export type AuditedTable = (typeof AUDITED_TABLES)[number];

export const AUDIT_OPERATIONS = ["INSERT", "UPDATE", "DELETE"] as const;

export type AuditOperation = (typeof AUDIT_OPERATIONS)[number];

export const AUDITED_TABLE_LABELS: Record<AuditedTable, string> = {
  users: "Users",
  tasks: "Tasks",
  task_members: "Task Members",
  sessions: "Sessions",
  session_segments: "Session Segments",
  notes: "Notes",
  status_history: "Status History",
  problem_reports: "Problem Reports",
};

export const AUDIT_OPERATION_LABELS: Record<AuditOperation, string> = {
  INSERT: "Insert",
  UPDATE: "Update",
  DELETE: "Delete",
};

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  operation: AuditOperation;
  user_id: string | null;
  old_data: Json | null;
  new_data: Json | null;
  changed_fields: string[] | null;
  created_at: string;
}

export interface AuditLogsFilterParams {
  table: "all" | AuditedTable;
  userId: string | null;
  operation: "all" | AuditOperation;
}

export function parseAuditLogsFilters(searchParams: {
  table?: string;
  user?: string;
  operation?: string;
}): AuditLogsFilterParams {
  const table =
    searchParams.table &&
    AUDITED_TABLES.includes(searchParams.table as AuditedTable)
      ? (searchParams.table as AuditedTable)
      : "all";

  const operation =
    searchParams.operation &&
    AUDIT_OPERATIONS.includes(searchParams.operation as AuditOperation)
      ? (searchParams.operation as AuditOperation)
      : "all";

  const userId = searchParams.user?.trim() || null;

  return { table, userId, operation };
}

export function getAuditTableLabel(tableName: string): string {
  return (
    AUDITED_TABLE_LABELS[tableName as AuditedTable] ??
    tableName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function resolveAuditActor(
  userId: string | null,
  usersById: Map<string, UserOption>
): string {
  if (!userId) return "System";
  return usersById.get(userId)?.user_code ?? userId.slice(0, 8);
}

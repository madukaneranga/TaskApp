import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AuditLogsFilters } from "@/components/admin/audit-logs-filters";
import { AuditLogsTable } from "@/components/admin/audit-logs-table";
import {
  parseAuditLogsFilters,
  type AuditLogEntry,
} from "@/lib/audit-logs";
import {
  buildPaginationMeta,
  getPaginationRange,
  PAGE_SIZE,
  parsePageParam,
} from "@/lib/pagination";
import type { UserOption } from "@/lib/types";

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: { page?: string; table?: string; user?: string; operation?: string };
}) {
  await requireAdmin();
  const supabase = createClient();

  const page = parsePageParam(searchParams.page);
  const filters = parseAuditLogsFilters(searchParams);
  const { from, to } = getPaginationRange(page);

  let logsQuery = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.table !== "all") {
    logsQuery = logsQuery.eq("table_name", filters.table);
  }

  if (filters.userId === "system") {
    logsQuery = logsQuery.is("user_id", null);
  } else if (filters.userId) {
    logsQuery = logsQuery.eq("user_id", filters.userId);
  }

  if (filters.operation !== "all") {
    logsQuery = logsQuery.eq("operation", filters.operation);
  }

  const [{ data: logsData, count }, { data: usersData }] = await Promise.all([
    logsQuery,
    supabase.from("users").select("id, user_code").order("user_code"),
  ]);

  const users = (usersData || []) as UserOption[];
  const actorByUserId = Object.fromEntries(
    users.map((user) => [user.id, user.user_code])
  );

  const pagination = buildPaginationMeta(page, count ?? 0, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy dark:text-foreground">Audit Log</h1>
        <p className="text-muted-foreground">
          Track inserts, updates, and deletes across the application
        </p>
      </div>

      <Suspense fallback={null}>
        <AuditLogsFilters filters={filters} users={users} />
      </Suspense>

      <AuditLogsTable
        logs={(logsData || []) as AuditLogEntry[]}
        actorByUserId={actorByUserId}
        pagination={pagination}
      />
    </div>
  );
}

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UsersTable } from "@/components/admin/users-table";
import {
  buildPaginationMeta,
  getPaginationRange,
  PAGE_SIZE,
  parsePageParam,
} from "@/lib/pagination";
import type { User } from "@/lib/types";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  await requireAdmin();
  const supabase = createClient();
  const page = parsePageParam(searchParams.page);
  const { from, to } = getPaginationRange(page);

  const { data: users, count } = await supabase
    .from("users")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const pagination = buildPaginationMeta(page, count ?? 0, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy dark:text-foreground">User Management</h1>
        <p className="text-muted-foreground">Approve, reject, and manage team members</p>
      </div>
      <UsersTable users={(users || []) as User[]} pagination={pagination} />
    </div>
  );
}

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import {
  buildPaginationMeta,
  getPaginationRange,
  PAGE_SIZE,
  parsePageParam,
} from "@/lib/pagination";
import { enrichTasksWithEditedCount } from "@/lib/task-utils";
import type { Session, Task, TaskStatus } from "@/lib/types";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  await requireAdmin();
  const supabase = createClient();

  const page = parsePageParam(searchParams.page);
  const statusFilter = searchParams.status || "all";
  const { from, to } = getPaginationRange(page);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  let tasksQuery = supabase
    .from("tasks")
    .select("*, assigned_user:users!tasks_assigned_to_fkey(id, full_name)", {
      count: "exact",
    })
    .order("task_id", { ascending: false })
    .range(from, to);

  if (statusFilter !== "all") {
    tasksQuery = tasksQuery.eq("status", statusFilter as TaskStatus);
  }

  const [
    { count: totalTasks },
    { data: tasksData, count: filteredTasksCount },
    { data: activeSessions },
    { data: completedToday },
    { data: sessionsToday },
  ] = await Promise.all([
    supabase.from("tasks").select("*", { count: "exact", head: true }),
    tasksQuery,
    supabase
      .from("sessions")
      .select("*, user:users(id, full_name), tasks(id, task_name, client_name, status)")
      .is("end_time", null),
    supabase
      .from("tasks")
      .select("id")
      .eq("status", "completed")
      .gte("created_at", todayIso),
    supabase.from("sessions").select("duration").gte("start_time", todayIso),
  ]);

  const hoursToday =
    Math.round(
      ((sessionsToday || []) as { duration: number }[]).reduce(
        (sum, s) => sum + (s.duration || 0),
        0
      ) /
        3600 *
        10
    ) / 10;

  const stats = {
    totalTasks: totalTasks || 0,
    activeNow: activeSessions?.length || 0,
    completedToday: completedToday?.length || 0,
    hoursToday,
  };

  const pagination = buildPaginationMeta(page, filteredTasksCount ?? 0, PAGE_SIZE);
  const tasks = await enrichTasksWithEditedCount(supabase, (tasksData || []) as Task[]);

  return (
    <AdminDashboard
      stats={stats}
      tasks={tasks}
      activeSessions={((activeSessions || []) as Array<Session & { tasks: Task }>).map((s) => ({
        ...s,
        task: s.tasks,
      }))}
      pagination={pagination}
      statusFilter={statusFilter}
    />
  );
}

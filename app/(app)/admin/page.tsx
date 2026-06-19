import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { TasksPageFilters } from "@/components/tasks/tasks-page-filters";
import {
  buildPaginationMeta,
  getPaginationRange,
  PAGE_SIZE,
  parsePageParam,
} from "@/lib/pagination";
import {
  applyTasksPageFiltersToQuery,
  parseTasksPageFilters,
  type TasksPageSearchParams,
} from "@/lib/tasks-page-filters";
import { enrichTasksWithEditedCount } from "@/lib/task-utils";
import type { Session, Task, UserOption } from "@/lib/types";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: TasksPageSearchParams;
}) {
  await requireAdmin();
  const supabase = createClient();

  const page = parsePageParam(searchParams.page);
  const filters = parseTasksPageFilters(searchParams);
  const { from, to } = getPaginationRange(page);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const tasksQuery = await applyTasksPageFiltersToQuery(
    supabase,
    supabase
      .from("tasks")
      .select("*, assigned_user:users!tasks_assigned_to_fkey(id, user_code)", {
        count: "exact",
      })
      .order("task_id", { ascending: false })
      .range(from, to),
    filters
  );

  const [
    { count: totalTasks },
    { data: tasksData, count: filteredTasksCount },
    { data: activeSessions },
    { data: completedSessions },
    { data: sessionsToday },
    { data: usersData },
  ] = await Promise.all([
    supabase.from("tasks").select("*", { count: "exact", head: true }),
    tasksQuery,
    supabase
      .from("sessions")
      .select("*, user:users(id, user_code), tasks(id, task_id, task_name, status)")
      .is("end_time", null),
    supabase
      .from("tasks")
      .select("id")
      .eq("status", "completed")
      .gte("created_at", todayIso),
    supabase.from("sessions").select("duration").gte("start_time", todayIso),
    supabase.from("users").select("id, user_code").eq("status", "active").order("user_code"),
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
    completedToday: completedSessions?.length || 0,
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
      filters={
        <Suspense fallback={null}>
          <TasksPageFilters
            basePath="/admin"
            isAdmin
            users={(usersData || []) as UserOption[]}
            filters={filters}
          />
        </Suspense>
      }
    />
  );
}

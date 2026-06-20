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
import {
  countCompletedTasksInRange,
  getTodayDateRange,
  sumSessionHoursInRange,
} from "@/lib/reports";
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

  const { from: todayFrom, to: todayTo } = getTodayDateRange();

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
    { data: completedTasks },
    { data: sessionsData },
    { data: usersData },
  ] = await Promise.all([
    supabase.from("tasks").select("*", { count: "exact", head: true }),
    tasksQuery,
    supabase
      .from("sessions")
      .select("*, user:users(id, user_code), tasks(id, task_id, task_name, status)")
      .is("end_time", null),
    supabase.from("tasks").select("id, status").eq("status", "completed"),
    supabase.from("sessions").select("task_id, start_time, end_time, duration"),
    supabase.from("users").select("id, user_code").eq("status", "active").order("user_code"),
  ]);

  const stats = {
    totalTasks: totalTasks || 0,
    activeNow: activeSessions?.length || 0,
    completedToday: countCompletedTasksInRange(
      (completedTasks || []) as Array<{ id: string; status: "completed" }>,
      (sessionsData || []) as Array<{
        task_id: string;
        end_time: string | null;
      }>,
      todayFrom,
      todayTo
    ),
    hoursToday: sumSessionHoursInRange(
      (sessionsData || []) as Array<{
        start_time: string;
        end_time: string | null;
        duration: number;
      }>,
      todayFrom,
      todayTo
    ),
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

import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActiveTasksPanel } from "@/components/timer/active-tasks-panel";
import { DashboardTasks } from "@/components/tasks/dashboard-tasks";
import { TasksPageFilters } from "@/components/tasks/tasks-page-filters";
import { mapActiveSessionRows } from "@/lib/session-mapper";
import {
  buildPaginationMeta,
  getPaginationRange,
  PAGE_SIZE,
  parsePageParam,
} from "@/lib/pagination";
import { parseTasksPageFilters } from "@/lib/tasks-page-filters";
import { enrichTasksWithEditedCount } from "@/lib/task-utils";
import type { Task, TaskStatus, UserOption } from "@/lib/types";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    status?: string;
    user?: string;
    range?: string;
    from?: string;
    to?: string;
  };
}) {
  const user = await requireUser();
  const supabase = createClient();
  const page = parsePageParam(searchParams.page);
  const filters = parseTasksPageFilters(searchParams);
  const { from, to } = getPaginationRange(page);
  const isAdmin = user.role === "admin";

  let tasksQuery = supabase
    .from("tasks")
    .select("*, assigned_user:users!tasks_assigned_to_fkey(id, user_code)", {
      count: "exact",
    })
    .order("task_id", { ascending: false })
    .range(from, to);

  if (!isAdmin) {
    tasksQuery = tasksQuery.eq("assigned_to", user.id);
  } else if (filters.userId) {
    tasksQuery = tasksQuery.eq("assigned_to", filters.userId);
  }

  if (filters.status !== "all") {
    tasksQuery = tasksQuery.eq("status", filters.status as TaskStatus);
  }

  if (filters.date.fromIso) {
    tasksQuery = tasksQuery.gte("created_at", filters.date.fromIso);
  }
  if (filters.date.toIso) {
    tasksQuery = tasksQuery.lte("created_at", filters.date.toIso);
  }

  const usersQuery = isAdmin
    ? supabase.from("users").select("id, user_code").eq("status", "active").order("user_code")
    : Promise.resolve({ data: [] as UserOption[] });

  const [
    { data: activeSessionsData },
    { data: tasksData, count: tasksCount },
    { data: usersData },
  ] = await Promise.all([
    supabase
      .from("sessions")
      .select("*, tasks(*), session_segments(*)")
      .eq("user_id", user.id)
      .is("end_time", null)
      .order("start_time", { ascending: false }),
    tasksQuery,
    usersQuery,
  ]);

  const activeSessions = mapActiveSessionRows(activeSessionsData);
  const activeTaskIds = new Set(
    activeSessions.map((session) => session.task_id).filter(Boolean) as string[]
  );
  const tasks = await enrichTasksWithEditedCount(
    supabase,
    (tasksData || []) as Task[]
  );
  const pagination = buildPaginationMeta(page, tasksCount ?? 0, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy dark:text-foreground">Tasks</h1>
        <p className="text-muted-foreground">
          {isAdmin ? "All team tasks" : "Your assigned tasks"}
        </p>
      </div>

      <ActiveTasksPanel sessions={activeSessions} />

      <div className="space-y-4">
        <Suspense fallback={null}>
          <TasksPageFilters
            isAdmin={isAdmin}
            users={(usersData || []) as UserOption[]}
            filters={filters}
          />
        </Suspense>

        <div>
          <h2 className="mb-4 text-lg font-semibold">
            {isAdmin ? "All Tasks" : "Your Tasks"}
          </h2>
          <DashboardTasks
            tasks={tasks}
            showAssignedTo={isAdmin}
            pagination={pagination}
            activeTaskIds={activeTaskIds}
            currentUserId={user.id}
          />
        </div>
      </div>
    </div>
  );
}


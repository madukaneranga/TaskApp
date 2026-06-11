import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActiveTasksPanel } from "@/components/timer/active-tasks-panel";
import { DashboardTasks } from "@/components/tasks/dashboard-tasks";
import { Button } from "@/components/ui/button";
import { mapActiveSessionRows } from "@/lib/session-mapper";
import {
  buildPaginationMeta,
  getPaginationRange,
  PAGE_SIZE,
  parsePageParam,
} from "@/lib/pagination";
import { enrichTasksWithEditedCount } from "@/lib/task-utils";
import type { Task } from "@/lib/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const user = await requireUser();
  const supabase = createClient();
  const page = parsePageParam(searchParams.page);
  const { from, to } = getPaginationRange(page);

  const [{ data: activeSessionsData }, { data: tasksData, count: tasksCount }] =
    await Promise.all([
      supabase
        .from("sessions")
        .select("*, tasks(*), session_segments(*)")
        .eq("user_id", user.id)
        .is("end_time", null)
        .order("start_time", { ascending: false }),
      supabase
        .from("tasks")
        .select("*, assigned_user:users!tasks_assigned_to_fkey(id, user_code)", {
          count: "exact",
        })
        .eq("assigned_to", user.id)
        .order("task_id", { ascending: false })
        .range(from, to),
    ]);

  const activeSessions = mapActiveSessionRows(activeSessionsData);
  const tasks = await enrichTasksWithEditedCount(
    supabase,
    (tasksData || []) as Task[]
  );
  const pagination = buildPaginationMeta(page, tasksCount ?? 0, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy dark:text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.user_code}</p>
        </div>
        <Button className="bg-brand-blue gap-2" asChild>
          <Link href="/tasks/new">
            <PlusCircle className="h-4 w-4" />
            New Task
          </Link>
        </Button>
      </div>

      <ActiveTasksPanel sessions={activeSessions} />

      <div>
        <h2 className="mb-4 text-lg font-semibold">Your Tasks</h2>
        <DashboardTasks tasks={tasks} pagination={pagination} />
      </div>
    </div>
  );
}

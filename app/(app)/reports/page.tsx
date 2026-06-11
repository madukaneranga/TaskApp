import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ReportsView } from "@/components/reports/reports-view";
import {
  buildReportData,
  enrichTasksForReport,
  parseReportParams,
} from "@/lib/reports";
import type { TaskStatus, User } from "@/lib/types";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: {
    range?: string;
    from?: string;
    to?: string;
    user?: string;
    status?: string;
  };
}) {
  const currentUser = await requireUser();
  const supabase = createClient();
  const isAdmin = currentUser.role === "admin";

  const params = parseReportParams(searchParams);
  if (!isAdmin) {
    params.userId = currentUser.id;
  }

  let tasksQuery = supabase
    .from("tasks")
    .select("*, assigned_user:users!tasks_assigned_to_fkey(id, full_name)")
    .order("task_id", { ascending: false });

  if (!isAdmin) {
    tasksQuery = tasksQuery.eq("assigned_to", currentUser.id);
  } else if (params.userId) {
    tasksQuery = tasksQuery.eq("assigned_to", params.userId);
  }

  const usersQuery = isAdmin
    ? supabase.from("users").select("id, full_name").eq("status", "active").order("full_name")
    : supabase.from("users").select("id, full_name").eq("id", currentUser.id);

  const [{ data: tasksData }, { data: sessionsData }, { data: usersData }] = await Promise.all([
    tasksQuery,
    supabase
      .from("sessions")
      .select("task_id, user_id, start_time, end_time, duration, edited_images_count, session_segments(*)"),
    usersQuery,
  ]);

  const tasks = enrichTasksForReport(
    (tasksData || []) as Array<{
      id: string;
      task_id: number;
      task_name: string;
      status: TaskStatus;
      assigned_to: string;
      created_at: string;
      total_images_count: number;
      assigned_user?: { id: string; full_name: string };
    }>,
    (sessionsData || []) as Parameters<typeof enrichTasksForReport>[1]
  );

  const report = buildReportData(
    tasks,
    (sessionsData || []) as Parameters<typeof buildReportData>[1],
    (usersData || []) as Pick<User, "id" | "full_name">[],
    params
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy dark:text-foreground">Reports</h1>
        <p className="text-muted-foreground">
          {isAdmin ? "Team productivity and task analytics" : "Your task and productivity stats"}
        </p>
      </div>
      <ReportsView
        isAdmin={isAdmin}
        users={(usersData || []) as Pick<User, "id" | "full_name">[]}
        params={params}
        summary={report.summary}
        taskRows={report.taskRows}
        userRows={report.userRows}
        backlogRows={report.backlogRows}
      />
    </div>
  );
}

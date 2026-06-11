import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/tasks/status-badge";
import { NotesThread } from "@/components/notes/notes-thread";
import { ActiveTaskCard } from "@/components/timer/active-task-card";
import { Pagination } from "@/components/ui/pagination";
import { LocalDateTime } from "@/components/ui/local-date";
import {
  computeSpanDurationSeconds,
  computeTaskWorkDurationSeconds,
  formatCompletedDuration,
  formatTaskImageCount,
} from "@/lib/task-utils";
import {
  buildPaginationMeta,
  getPaginationRange,
  PAGE_SIZE,
  parsePageParam,
} from "@/lib/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditTaskButton } from "@/components/admin/edit-task-button";
import { ForcePauseButton } from "@/components/admin/force-pause-button";
import { TaskStartResumeButton } from "@/components/tasks/task-start-resume-button";
import { SegmentLog, buildSegmentLogRows } from "@/components/tasks/segment-log";
import { getSessionElapsedSeconds } from "@/lib/session-mapper";
import type { Note, Session, SessionSegment, StatusHistoryEntry, Task, User } from "@/lib/types";
import { getUserLabel } from "@/lib/user-utils";

export default async function TaskDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: {
    sessionsPage?: string;
    notesPage?: string;
    historyPage?: string;
  };
}) {
  const currentUser = await requireUser();
  const supabase = createClient();

  const sessionsPage = parsePageParam(searchParams.sessionsPage);
  const notesPage = parsePageParam(searchParams.notesPage);
  const historyPage = parsePageParam(searchParams.historyPage);

  const sessionsRange = getPaginationRange(sessionsPage);
  const notesRange = getPaginationRange(notesPage);
  const historyRange = getPaginationRange(historyPage);

  const [
    { data: taskData },
    { data: sessionsData, count: sessionsCount },
    { data: notesData, count: notesCount },
    { data: historyData, count: historyCount },
    { data: activeSessionData },
    { data: openSession },
    { data: submitSessionData },
    { data: firstSessionData },
    { data: lastSessionData },
    { data: taskSessionsData },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, assigned_user:users!tasks_assigned_to_fkey(id, user_code, email)")
      .eq("id", params.id)
      .single(),
    supabase
      .from("sessions")
      .select("*, user:users(id, user_code)", { count: "exact" })
      .eq("task_id", params.id)
      .order("start_time", { ascending: false })
      .range(sessionsRange.from, sessionsRange.to),
    supabase
      .from("notes")
      .select("*, user:users(id, user_code)", { count: "exact" })
      .eq("task_id", params.id)
      .order("created_at", { ascending: false })
      .range(notesRange.from, notesRange.to),
    supabase
      .from("status_history")
      .select("*, changed_by_user:users!status_history_changed_by_fkey(id, user_code)", {
        count: "exact",
      })
      .eq("task_id", params.id)
      .order("changed_at", { ascending: false })
      .range(historyRange.from, historyRange.to),
    supabase
      .from("sessions")
      .select("*, tasks(*), session_segments(*)")
      .eq("task_id", params.id)
      .eq("user_id", currentUser.id)
      .is("end_time", null)
      .maybeSingle(),
    supabase
      .from("sessions")
      .select("id")
      .eq("task_id", params.id)
      .is("end_time", null)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("sessions")
      .select("edited_images_count")
      .eq("task_id", params.id)
      .not("edited_images_count", "is", null)
      .order("end_time", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("sessions")
      .select("start_time")
      .eq("task_id", params.id)
      .order("start_time", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("sessions")
      .select("end_time")
      .eq("task_id", params.id)
      .not("end_time", "is", null)
      .order("end_time", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("sessions")
      .select("id, start_time, end_time, duration, user:users(id, user_code), session_segments(*)")
      .eq("task_id", params.id)
      .order("start_time", { ascending: true }),
  ]);

  if (!taskData) notFound();

  let activeUsers: User[] = [];
  if (currentUser.role === "admin") {
    const { data: usersData } = await supabase
      .from("users")
      .select("*")
      .eq("status", "active")
      .order("user_code");
    activeUsers = (usersData || []) as User[];
  }

  const task = taskData as Task & { assigned_user: { user_code: string; email: string } };

  const sessions = (sessionsData || []) as Session[];
  const notes = (notesData || []) as Note[];
  const history = (historyData || []) as StatusHistoryEntry[];

  const editedImagesCount =
    task.status === "completed" ? submitSessionData?.edited_images_count ?? null : null;

  const isCompleted = task.status === "completed";
  const workDuration = isCompleted
    ? computeTaskWorkDurationSeconds(taskSessionsData || [])
    : null;
  const segmentRows = buildSegmentLogRows(taskSessionsData || []);
  const spanDuration =
    isCompleted && firstSessionData?.start_time && lastSessionData?.end_time
      ? computeSpanDurationSeconds(firstSessionData.start_time, lastSessionData.end_time)
      : null;

  const sessionsPagination = buildPaginationMeta(sessionsPage, sessionsCount ?? 0, PAGE_SIZE);
  const notesPagination = buildPaginationMeta(notesPage, notesCount ?? 0, PAGE_SIZE);
  const historyPagination = buildPaginationMeta(historyPage, historyCount ?? 0, PAGE_SIZE);

  const activeSessionForCard = activeSessionData as (Session & {
    tasks: Task;
    session_segments: SessionSegment[];
  }) | null;

  const sessionForTimer: Session | null = activeSessionForCard
    ? {
        ...activeSessionForCard,
        task: activeSessionForCard.tasks,
        segments: activeSessionForCard.session_segments,
      }
    : null;

  const canStartOrResume =
    task.assigned_to === currentUser.id &&
    (task.status === "pending" || task.status === "paused") &&
    !sessionForTimer;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-sm text-muted-foreground">{task.task_id}</p>
          <h1 className="text-2xl font-bold">{task.task_name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          {canStartOrResume && (
            <TaskStartResumeButton
              taskId={task.id}
              taskName={task.task_name}
              status={task.status}
            />
          )}
          {currentUser.role === "admin" && (
            <EditTaskButton
              task={task}
              users={activeUsers}
              hasActiveSession={!!openSession}
            />
          )}
          {currentUser.role === "admin" &&
            openSession &&
            (task.status === "in_progress" || task.status === "paused") && (
              <ForcePauseButton sessionId={openSession.id} />
            )}
        </div>
      </div>

      {sessionForTimer && (
        <ActiveTaskCard
          session={sessionForTimer}
          task={sessionForTimer.task || task}
          initialElapsed={getSessionElapsedSeconds(sessionForTimer)}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Images</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatTaskImageCount({ ...task, edited_images_count: editedImagesCount })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned To</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{getUserLabel(task.assigned_user)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              <LocalDateTime value={task.created_at} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Start</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {firstSessionData?.start_time ? (
                <LocalDateTime value={firstSessionData.start_time} />
              ) : (
                "—"
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Work</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold font-mono">
              {formatCompletedDuration(workDuration)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Span</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold font-mono">
              {formatCompletedDuration(spanDuration)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">End</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {lastSessionData?.end_time ? (
                <LocalDateTime value={lastSessionData.end_time} />
              ) : (
                "—"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Session Log</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions recorded.</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Work</TableHead>
                    <TableHead>Span</TableHead>
                    <TableHead>Edited</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{getUserLabel(s.user)}</TableCell>
                      <TableCell>
                        <LocalDateTime value={s.start_time} />
                      </TableCell>
                      <TableCell>
                        {s.end_time ? <LocalDateTime value={s.end_time} /> : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatCompletedDuration(s.end_time ? s.duration : null)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatCompletedDuration(
                          s.end_time ? computeSpanDurationSeconds(s.start_time, s.end_time) : null
                        )}
                      </TableCell>
                      <TableCell>{s.edited_images_count ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Suspense fallback={null}>
              <Pagination pagination={sessionsPagination} pageParam="sessionsPage" />
            </Suspense>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Segments</h2>
        <SegmentLog rows={segmentRows} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Status History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No status changes recorded.</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex flex-wrap gap-2 text-sm">
                  <span className="text-muted-foreground">
                    <LocalDateTime value={h.changed_at} />
                  </span>
                  <span>
                    {h.old_status || "—"} → {h.new_status}
                  </span>
                  <span className="text-muted-foreground">by {getUserLabel(h.changed_by_user)}</span>
                </div>
              ))}
            </div>
            <Suspense fallback={null}>
              <Pagination pagination={historyPagination} pageParam="historyPage" />
            </Suspense>
          </div>
        )}
      </div>

      <NotesThread
        taskId={params.id}
        notes={notes}
        pagination={notesPagination}
        pageParam="notesPage"
      />
    </div>
  );
}

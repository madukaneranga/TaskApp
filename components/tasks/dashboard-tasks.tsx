"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { TaskTable } from "@/components/tasks/task-table";
import { Pagination } from "@/components/ui/pagination";
import { startOrResumeTask } from "@/lib/start-or-resume-task";
import { toastError, toastSuccess } from "@/lib/toast-helpers";
import type { PaginationMeta } from "@/lib/pagination";
import type { Task } from "@/lib/types";

interface DashboardTasksProps {
  tasks: Task[];
  showAssignedTo?: boolean;
  pagination?: PaginationMeta;
  activeTaskIds?: Iterable<string>;
  currentUserId?: string;
}

export function DashboardTasks({
  tasks,
  showAssignedTo = false,
  pagination,
  activeTaskIds,
  currentUserId,
}: DashboardTasksProps) {
  const router = useRouter();

  async function handleStart(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const res = await startOrResumeTask(taskId, task.status);

    if (!res.ok) {
      const data = await res.json();
      toastError("Could not start task", data.error || "Please try again.");
      return;
    }

    const actionLabel = task.status === "paused" ? "resumed" : "started";
    toastSuccess(`Task ${actionLabel}`, task.task_name);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <TaskTable
        tasks={tasks}
        onStart={handleStart}
        showAssignedTo={showAssignedTo}
        activeTaskIds={activeTaskIds}
        currentUserId={currentUserId}
      />
      {pagination && (
        <Suspense fallback={null}>
          <Pagination pagination={pagination} />
        </Suspense>
      )}
    </div>
  );
}

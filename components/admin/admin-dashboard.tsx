"use client";

import { Suspense, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Clock, CheckCircle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskTable } from "@/components/tasks/task-table";
import { Pagination } from "@/components/ui/pagination";
import { useRealtime } from "@/lib/hooks/useRealtime";
import type { PaginationMeta } from "@/lib/pagination";
import type { Session, Task } from "@/lib/types";

interface AdminDashboardProps {
  stats: {
    totalTasks: number;
    activeNow: number;
    completedToday: number;
    hoursToday: number;
  };
  tasks: Task[];
  activeSessions: Session[];
  pagination: PaginationMeta;
  filters?: ReactNode;
}

export function AdminDashboard({
  stats,
  tasks,
  activeSessions,
  pagination,
  filters,
}: AdminDashboardProps) {
  const router = useRouter();

  const refresh = useCallback(() => router.refresh(), [router]);
  useRealtime(["tasks", "sessions", "notes"], refresh);

  const statCards = [
    { label: "Total Tasks", value: stats.totalTasks, icon: ClipboardList },
    { label: "Active Now", value: stats.activeNow, icon: Users },
    { label: "Completed Today", value: stats.completedToday, icon: CheckCircle },
    { label: "Hours Today", value: stats.hoursToday, icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy dark:text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of team activity</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-brand-blue" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Working on Tasks Now</CardTitle>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No one is currently working.</p>
          ) : (
            <div className="space-y-2">
              {activeSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium">{s.user?.user_code}</p>
                    <p className="text-sm text-muted-foreground">
                      #{s.task?.task_id} — {s.task?.task_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {filters}

      <div>
        <h2 className="mb-4 text-lg font-semibold">All Tasks</h2>
        <div className="space-y-4">
          <TaskTable tasks={tasks} showAssignedTo />
          <Suspense fallback={null}>
            <Pagination pagination={pagination} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

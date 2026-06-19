"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskIdRangeFilter } from "@/components/tasks/task-id-range-filter";
import type { TasksDateField, TasksPageFilterParams } from "@/lib/tasks-page-filters";
import { TASK_STATUS_LABELS, type TaskStatus, type UserOption } from "@/lib/types";
import { getUserLabel } from "@/lib/user-utils";

interface TasksPageFiltersProps {
  basePath: "/tasks" | "/admin";
  isAdmin: boolean;
  users: UserOption[];
  filters: TasksPageFilterParams;
}

const DATE_FIELD_LABELS: Record<TasksDateField, string> = {
  created: "Created",
  started: "Started",
  ended: "Ended",
};

export function TasksPageFilters({
  basePath,
  isAdmin,
  users,
  filters,
}: TasksPageFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    const status = updates.status ?? filters.status;
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }

    if (isAdmin) {
      const user = updates.user !== undefined ? updates.user : filters.userId;
      if (user) {
        params.set("user", user);
      } else {
        params.delete("user");
      }
    }

    const taskId = updates.taskId !== undefined ? updates.taskId : filters.taskId?.toString();
    if (taskId?.trim()) {
      params.set("taskId", taskId.trim());
    } else {
      params.delete("taskId");
    }

    const dateField = updates.dateField ?? filters.date.field;
    if (dateField === "created") {
      params.delete("dateField");
    } else {
      params.set("dateField", dateField);
    }

    const range = updates.range ?? filters.date.preset;
    if (range === "all") {
      params.delete("range");
      params.delete("from");
      params.delete("to");
    } else {
      params.set("range", range);
      if (range === "custom") {
        const from = updates.from ?? filters.date.from;
        const to = updates.to ?? filters.date.to;
        if (from) params.set("from", from);
        if (to) params.set("to", to);
      } else {
        params.delete("from");
        params.delete("to");
      }
    }

    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg">Filters</CardTitle>
        {isAdmin && <TaskIdRangeFilter />}
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="filter-task-id">Task ID</Label>
          <Input
            id="filter-task-id"
            inputMode="numeric"
            placeholder="e.g. 1000"
            defaultValue={filters.taskId?.toString() || ""}
            onBlur={(e) => updateParams({ taskId: e.target.value || undefined })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParams({ taskId: (e.target as HTMLInputElement).value || undefined });
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => updateParams({ status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {TASK_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isAdmin && (
          <div className="space-y-2">
            <Label>Assigned to (user code)</Label>
            <Select
              value={filters.userId || "all"}
              onValueChange={(value) =>
                updateParams({ user: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {getUserLabel(user)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Date field</Label>
          <Select
            value={filters.date.field}
            onValueChange={(value) => updateParams({ dateField: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(DATE_FIELD_LABELS) as TasksDateField[]).map((field) => (
                <SelectItem key={field} value={field}>
                  {DATE_FIELD_LABELS[field]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date range</Label>
          <Select
            value={filters.date.preset}
            onValueChange={(value) => updateParams({ range: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filters.date.preset === "custom" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="tasks-from">From</Label>
              <Input
                id="tasks-from"
                type="datetime-local"
                defaultValue={filters.date.from}
                onChange={(e) =>
                  updateParams({
                    range: "custom",
                    from: e.target.value,
                    to: filters.date.to,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tasks-to">To</Label>
              <Input
                id="tasks-to"
                type="datetime-local"
                defaultValue={filters.date.to}
                onChange={(e) =>
                  updateParams({
                    range: "custom",
                    from: filters.date.from,
                    to: e.target.value,
                  })
                }
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  hasActiveTasksPageFilters,
  type TasksDateField,
  type TasksDatePreset,
  type TasksPageFilterParams,
} from "@/lib/tasks-page-filters";
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

type FilterDraft = {
  status: TaskStatus | "all";
  userId?: string;
  taskId: string;
  dateField: TasksDateField;
  datePreset: TasksDatePreset;
  dateFrom: string;
  dateTo: string;
};

const DEFAULT_DRAFT: FilterDraft = {
  status: "all",
  userId: undefined,
  taskId: "",
  dateField: "created",
  datePreset: "all",
  dateFrom: "",
  dateTo: "",
};

function draftFromFilters(filters: TasksPageFilterParams): FilterDraft {
  return {
    status: filters.status,
    userId: filters.userId,
    taskId: filters.taskId?.toString() || "",
    dateField: filters.date.field,
    datePreset: filters.date.preset,
    dateFrom: filters.date.from,
    dateTo: filters.date.to,
  };
}

function draftsEqual(a: FilterDraft, b: FilterDraft): boolean {
  return (
    a.status === b.status &&
    a.userId === b.userId &&
    a.taskId === b.taskId &&
    a.dateField === b.dateField &&
    a.datePreset === b.datePreset &&
    a.dateFrom === b.dateFrom &&
    a.dateTo === b.dateTo
  );
}

export function TasksPageFilters({
  basePath,
  isAdmin,
  users,
  filters,
}: TasksPageFiltersProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<FilterDraft>(() => draftFromFilters(filters));
  const appliedDraft = draftFromFilters(filters);
  const hasDraftChanges = !draftsEqual(draft, appliedDraft);

  useEffect(() => {
    setDraft(draftFromFilters(filters));
  }, [
    filters.status,
    filters.userId,
    filters.taskId,
    filters.date.field,
    filters.date.preset,
    filters.date.from,
    filters.date.to,
  ]);

  function applyDraft(nextDraft: FilterDraft) {
    const params = new URLSearchParams();

    if (nextDraft.status !== "all") {
      params.set("status", nextDraft.status);
    }

    if (isAdmin && nextDraft.userId) {
      params.set("user", nextDraft.userId);
    }

    if (nextDraft.taskId.trim()) {
      params.set("taskId", nextDraft.taskId.trim());
    }

    if (nextDraft.dateField !== "created") {
      params.set("dateField", nextDraft.dateField);
    }

    if (nextDraft.datePreset !== "all") {
      params.set("range", nextDraft.datePreset);
      if (nextDraft.datePreset === "custom") {
        if (nextDraft.dateFrom) params.set("from", nextDraft.dateFrom);
        if (nextDraft.dateTo) params.set("to", nextDraft.dateTo);
      }
    }

    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function applyFilters() {
    applyDraft(draft);
  }

  function resetFilters() {
    setDraft(DEFAULT_DRAFT);
    router.push(basePath);
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
            value={draft.taskId}
            onChange={(e) => setDraft((current) => ({ ...current, taskId: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={draft.status}
            onValueChange={(value) =>
              setDraft((current) => ({ ...current, status: value as TaskStatus | "all" }))
            }
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
              value={draft.userId || "all"}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  userId: value === "all" ? undefined : value,
                }))
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
            value={draft.dateField}
            onValueChange={(value) =>
              setDraft((current) => ({ ...current, dateField: value as TasksDateField }))
            }
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
            value={draft.datePreset}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                datePreset: value as TasksDatePreset,
              }))
            }
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

        {draft.datePreset === "custom" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="tasks-from">From</Label>
              <Input
                id="tasks-from"
                type="datetime-local"
                value={draft.dateFrom}
                onChange={(e) =>
                  setDraft((current) => ({ ...current, dateFrom: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tasks-to">To</Label>
              <Input
                id="tasks-to"
                type="datetime-local"
                value={draft.dateTo}
                onChange={(e) =>
                  setDraft((current) => ({ ...current, dateTo: e.target.value }))
                }
              />
            </div>
          </>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t pt-4 sm:col-span-2 lg:col-span-4">
          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            disabled={!hasActiveTasksPageFilters(filters, { isAdmin }) && !hasDraftChanges}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button type="button" className="bg-brand-blue" onClick={applyFilters}>
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

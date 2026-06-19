"use client";

import Link from "next/link";
import { Eye, Play } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { IconTip } from "@/components/ui/icon-tip";
import { StatusBadge } from "@/components/tasks/status-badge";
import { formatDateTime } from "@/lib/utils";
import {
  formatTaskImageCount,
  formatTaskSpanDuration,
  formatTaskWorkDuration,
  canShowTaskStartAction,
  getTaskStartActionLabel,
} from "@/lib/task-utils";
import type { Task } from "@/lib/types";
import { getUserLabel } from "@/lib/user-utils";

interface TaskTableProps {
  tasks: Task[];
  onStart?: (taskId: string) => void;
  showAssignedTo?: boolean;
  activeTaskIds?: Iterable<string>;
  currentUserId?: string;
}

export function TaskTable({
  tasks,
  onStart,
  showAssignedTo = true,
  activeTaskIds,
  currentUserId,
}: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No tasks found.
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Images</TableHead>
              <TableHead>Status</TableHead>
              {showAssignedTo && <TableHead>Assigned To</TableHead>}
              <TableHead>Created</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Work</TableHead>
              <TableHead>Span</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-mono text-sm">{task.task_id}</TableCell>
                <TableCell>{task.task_name}</TableCell>
                <TableCell>{formatTaskImageCount(task)}</TableCell>
                <TableCell>
                  <StatusBadge status={task.status} />
                </TableCell>
                {showAssignedTo && (
                  <TableCell>{getUserLabel(task.assigned_user)}</TableCell>
                )}
                <TableCell>{formatDateTime(task.created_at)}</TableCell>
                <TableCell>{task.start_time ? formatDateTime(task.start_time) : "—"}</TableCell>
                <TableCell className="font-mono text-sm">
                  {formatTaskWorkDuration(task)}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatTaskSpanDuration(task)}
                </TableCell>
                <TableCell>{task.end_time ? formatDateTime(task.end_time) : "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <IconTip label="View details">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/tasks/${task.id}`} aria-label="View details">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </IconTip>
                    {onStart &&
                      canShowTaskStartAction(task, { activeTaskIds, currentUserId }) && (
                      <IconTip label={getTaskStartActionLabel(task.status)}>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={getTaskStartActionLabel(task.status)}
                          onClick={() => onStart(task.id)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </IconTip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-lg border p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-sm text-muted-foreground">{task.task_id}</p>
                <p className="font-medium">{task.task_name}</p>
              </div>
              <StatusBadge status={task.status} />
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>{formatTaskImageCount(task)} images</span>
              {showAssignedTo && <span>• {getUserLabel(task.assigned_user)}</span>}
              <span>• Created {formatDateTime(task.created_at)}</span>
              <span>• Start {task.start_time ? formatDateTime(task.start_time) : "—"}</span>
              <span>• Work {formatTaskWorkDuration(task)}</span>
              <span>• Span {formatTaskSpanDuration(task)}</span>
              <span>• End {task.end_time ? formatDateTime(task.end_time) : "—"}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/tasks/${task.id}`}>View</Link>
              </Button>
              {onStart &&
                canShowTaskStartAction(task, { activeTaskIds, currentUserId }) && (
                <Button size="sm" onClick={() => onStart(task.id)}>
                  {getTaskStartActionLabel(task.status)}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

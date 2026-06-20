"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Hash,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconTip } from "@/components/ui/icon-tip";
import { toastError } from "@/lib/toast-helpers";
import { isNumericTaskId } from "@/lib/task-utils";

type AdjacentTask = {
  id: string;
  task_id: number;
  task_name: string;
};

interface TaskIdJumpProps {
  currentTaskId: number;
  previousTask?: AdjacentTask | null;
  nextTask?: AdjacentTask | null;
}

export function TaskIdJump({ currentTaskId, previousTask, nextTask }: TaskIdJumpProps) {
  const router = useRouter();
  const [value, setValue] = useState(String(currentTaskId));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValue(String(currentTaskId));
  }, [currentTaskId]);

  function navigateToTask(task: AdjacentTask) {
    router.push(`/tasks/${task.id}`);
    router.refresh();
  }

  async function navigateToTaskId(taskId: number) {
    if (taskId < 1) {
      toastError("Invalid task ID", "Task ID must be a positive number.");
      return;
    }

    if (taskId === currentTaskId) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/tasks/lookup?taskId=${encodeURIComponent(String(taskId))}`);
      const data = await res.json();

      if (!res.ok) {
        toastError("Task not found", data.error || `No task with ID ${taskId}.`);
        return;
      }

      router.push(`/tasks/${data.id}`);
      router.refresh();
    } catch {
      toastError("Lookup failed", "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen() {
    const trimmed = value.trim();

    if (!isNumericTaskId(trimmed)) {
      toastError("Invalid task ID", "Enter a numeric task ID.");
      return;
    }

    await navigateToTaskId(Number(trimmed));
  }

  const previousLabel = previousTask
    ? `Previous task (#${previousTask.task_id})`
    : "No previous task";
  const nextLabel = nextTask ? `Next task (#${nextTask.task_id})` : "No next task";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <IconTip label="Back to task list" side="bottom">
        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <Link href="/tasks">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">All tasks</span>
          </Link>
        </Button>
      </IconTip>

      <IconTip label={previousLabel} side="bottom">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={loading || !previousTask}
          onClick={() => previousTask && navigateToTask(previousTask)}
          aria-label={previousLabel}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </IconTip>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleOpen();
        }}
        className="flex min-w-0 flex-1 items-stretch sm:max-w-xs"
      >
        <div className="flex min-w-0 flex-1 overflow-hidden rounded-md border bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring">
          <div className="flex items-center gap-1.5 border-r bg-muted/40 px-2.5 text-muted-foreground">
            <Hash className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden text-xs font-medium sm:inline">Task ID</span>
          </div>
          <Input
            id="task-id-jump"
            inputMode="numeric"
            placeholder="Enter ID"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={(e) => e.target.select()}
            disabled={loading}
            className="h-9 min-w-0 flex-1 rounded-none border-0 font-mono shadow-none focus-visible:ring-0"
            aria-label="Task ID to open"
          />
          <Button
            type="submit"
            size="sm"
            disabled={loading}
            className="h-9 shrink-0 rounded-none rounded-r-md bg-brand-blue px-3"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Open</span>
              </>
            )}
          </Button>
        </div>
      </form>

      <IconTip label={nextLabel} side="bottom">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={loading || !nextTask}
          onClick={() => nextTask && navigateToTask(nextTask)}
          aria-label={nextLabel}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </IconTip>
    </div>
  );
}

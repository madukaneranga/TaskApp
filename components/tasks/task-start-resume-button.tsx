"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startOrResumeTask } from "@/lib/start-or-resume-task";
import { toastError, toastSuccess } from "@/lib/toast-helpers";
import type { TaskStatus } from "@/lib/types";

interface TaskStartResumeButtonProps {
  taskId: string;
  taskName: string;
  status: TaskStatus;
}

export function TaskStartResumeButton({
  taskId,
  taskName,
  status,
}: TaskStartResumeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isResume = status === "paused";

  async function handleClick() {
    setLoading(true);
    const res = await startOrResumeTask(taskId, status);
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toastError(
        isResume ? "Could not resume task" : "Could not start task",
        data.error || "Please try again."
      );
      return;
    }

    toastSuccess(`Task ${isResume ? "resumed" : "started"}`, taskName);
    router.refresh();
  }

  return (
    <Button onClick={handleClick} disabled={loading} className="bg-brand-blue">
      <Play className="mr-2 h-4 w-4" />
      {isResume ? "Resume" : "Start"}
    </Button>
  );
}

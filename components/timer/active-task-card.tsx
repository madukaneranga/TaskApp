"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/tasks/status-badge";
import { SubmitModal } from "@/components/tasks/submit-modal";
import { useTimer } from "@/lib/hooks/useTimer";
import { formatDuration } from "@/lib/utils";
import { isSessionActive } from "@/lib/session-utils";
import { toastError, toastSuccess } from "@/lib/toast-helpers";
import type { Session, Task } from "@/lib/types";

interface ActiveTaskCardProps {
  session: Session | null;
  task: Task | null;
  initialElapsed?: number;
}

export function ActiveTaskCard({ session, task, initialElapsed = 0 }: ActiveTaskCardProps) {
  const router = useRouter();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const segments = session?.segments || [];
  const { active, isPaused } = isSessionActive(segments);
  const elapsed = useTimer(initialElapsed, active && !isPaused);

  const handleAction = useCallback(
    async (action: "pause" | "resume") => {
      if (!session) return;
      setLoading(true);
      const endpoint = action === "pause" ? "/api/sessions/pause" : "/api/sessions/resume";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: session.id }),
      });
      setLoading(false);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toastError(
          action === "pause" ? "Could not pause task" : "Could not resume task",
          data.error || "Please try again."
        );
        return;
      }
      toastSuccess(
        action === "pause" ? "Task paused" : "Task resumed",
        task?.task_name
      );
      router.refresh();
    },
    [session, task, router]
  );

  if (!session || !task) {
    return (
      <Card className="border-l-4 border-l-brand-blue/30">
        <CardContent className="py-6 text-center text-muted-foreground">
          No active tasks — start one below
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-l-4 border-l-brand-blue">
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{task.task_name}</h3>
              <StatusBadge status={task.status} />
            </div>
            <p className="text-sm text-muted-foreground">{task.client_name}</p>
            <p className="mt-2 font-mono text-2xl font-bold text-brand-blue">
              {formatDuration(elapsed)}
            </p>
          </div>
          <div className="flex gap-2">
            {isPaused ? (
              <Button
                onClick={() => handleAction("resume")}
                disabled={loading}
                className="bg-brand-blue"
              >
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => handleAction("pause")}
                disabled={loading}
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setSubmitOpen(true)}
              disabled={loading}
            >
              <Send className="mr-2 h-4 w-4" />
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>

      <SubmitModal
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        sessionId={session.id}
        totalImages={task.total_images_count}
        onSuccess={() => {
          toastSuccess("Task submitted", task.task_name);
          router.refresh();
        }}
      />
    </>
  );
}

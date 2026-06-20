"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useTimer } from "@/lib/hooks/useTimer";
import { formatDuration } from "@/lib/utils";
import { isSessionActive } from "@/lib/session-utils";
import type { ActiveSession } from "@/lib/session-mapper";
import type { Task } from "@/lib/types";
import { getUserLabel } from "@/lib/user-utils";

interface AdminActiveTaskCardProps {
  session: ActiveSession;
  task: Task;
}

export function AdminActiveTaskCard({ session, task }: AdminActiveTaskCardProps) {
  const segments = session.segments || [];
  const { active, isPaused } = isSessionActive(segments);
  const elapsed = useTimer(session.initialElapsed, active && !isPaused);

  return (
    <Link href={`/tasks/${task.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/40">
        <CardContent className="flex items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  isPaused ? "bg-amber-500" : "bg-green-500"
                }`}
                aria-hidden
              />
              <p className="truncate text-sm font-medium">{getUserLabel(session.user)}</p>
            </div>
            <p className="truncate pl-4 text-xs text-muted-foreground">
              #{task.task_id} · {task.task_name}
            </p>
          </div>
          <p className="shrink-0 font-mono text-sm font-semibold tabular-nums text-brand-blue">
            {formatDuration(elapsed)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

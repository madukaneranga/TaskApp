import { ActiveTaskCard } from "@/components/timer/active-task-card";
import { Card, CardContent } from "@/components/ui/card";
import type { ActiveSession } from "@/lib/session-mapper";

interface ActiveTasksPanelProps {
  sessions: ActiveSession[];
}

export function ActiveTasksPanel({ sessions }: ActiveTasksPanelProps) {
  const active = sessions.filter((s) => s.task);

  if (active.length === 0) {
    return (
      <Card className="border-l-4 border-l-brand-blue/30">
        <CardContent className="py-6 text-center text-muted-foreground">
          No active tasks — start one below
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {active.length > 1 && (
        <h2 className="text-lg font-semibold text-brand-navy dark:text-foreground">
          Active Tasks ({active.length})
        </h2>
      )}
      {active.map((session) => (
        <ActiveTaskCard
          key={session.id}
          session={session}
          task={session.task!}
          initialElapsed={session.initialElapsed}
        />
      ))}
    </div>
  );
}

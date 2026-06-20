import { AdminActiveTaskCard } from "@/components/admin/admin-active-task-card";
import type { ActiveSession } from "@/lib/session-mapper";

interface AdminActiveTasksPanelProps {
  sessions: ActiveSession[];
}

export function AdminActiveTasksPanel({ sessions }: AdminActiveTasksPanelProps) {
  const active = sessions.filter((session) => session.task);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Working on Tasks Now</h2>

      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one is currently working.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((session) => (
            <AdminActiveTaskCard
              key={session.id}
              session={session}
              task={session.task!}
            />
          ))}
        </div>
      )}
    </div>
  );
}

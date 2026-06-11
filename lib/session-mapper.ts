import { calculateWorkDuration } from "@/lib/session-utils";
import type { Session, SessionSegment, Task } from "@/lib/types";

type ActiveSessionRow = Session & {
  tasks: Task;
  session_segments: SessionSegment[];
};

export type ActiveSession = Session & { initialElapsed: number };

export function getSessionElapsedSeconds(session: Pick<Session, "segments">): number {
  return calculateWorkDuration(session.segments || []);
}

export function mapActiveSessionRows(
  rows: ActiveSessionRow[] | null | undefined
): ActiveSession[] {
  return (rows || []).map((row) => {
    const segments = row.session_segments;
    const session: ActiveSession = {
      ...row,
      task: row.tasks,
      segments,
      initialElapsed: getSessionElapsedSeconds({ segments }),
    };
    return session;
  });
}

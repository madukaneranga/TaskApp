import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateWorkDuration } from "@/lib/session-utils";
import type { SessionSegment } from "@/lib/types";

export async function closeAllOpenSegments(
  supabase: SupabaseClient,
  sessionId: string,
  now = new Date().toISOString()
): Promise<SessionSegment[]> {
  const { data: segments } = await supabase
    .from("session_segments")
    .select("*")
    .eq("session_id", sessionId);

  const rows = (segments || []) as SessionSegment[];
  const openIds = rows.filter((segment) => !segment.ended_at).map((segment) => segment.id);

  if (openIds.length > 0) {
    const { error } = await supabase
      .from("session_segments")
      .update({ ended_at: now })
      .in("id", openIds);

    if (error) {
      throw new Error(`Failed to close open segments: ${error.message}`);
    }
  }

  return rows.map((segment) =>
    !segment.ended_at ? { ...segment, ended_at: now } : segment
  );
}

export async function finalizeOpenSession(
  supabase: SupabaseClient,
  sessionId: string,
  now = new Date().toISOString()
): Promise<void> {
  const segments = await closeAllOpenSegments(supabase, sessionId, now);
  const duration = calculateWorkDuration(segments);

  const { error } = await supabase
    .from("sessions")
    .update({ end_time: now, duration })
    .eq("id", sessionId)
    .is("end_time", null);

  if (error) {
    throw new Error(`Failed to finalize session: ${error.message}`);
  }
}

export async function closeOpenSessionsForTask(
  supabase: SupabaseClient,
  taskId: string,
  options?: { excludeUserIds?: string[] }
): Promise<number> {
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, user_id")
    .eq("task_id", taskId)
    .is("end_time", null);

  const exclude = new Set(options?.excludeUserIds || []);
  const toClose = (sessions || []).filter((session) => !exclude.has(session.user_id));

  if (toClose.length === 0) {
    return 0;
  }

  const now = new Date().toISOString();
  await Promise.all(toClose.map((session) => finalizeOpenSession(supabase, session.id, now)));

  return toClose.length;
}

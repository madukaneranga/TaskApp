import type { TaskStatus } from "@/lib/types";

export async function startOrResumeTask(taskId: string, status: TaskStatus): Promise<Response> {
  if (status === "paused") {
    const sessionRes = await fetch(`/api/sessions/active?task_id=${taskId}`);
    const { session_id } = await sessionRes.json();
    if (session_id) {
      return fetch("/api/sessions/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id }),
      });
    }
  }

  return fetch("/api/sessions/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id: taskId }),
  });
}

"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export function useSession() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const start = useCallback(async (taskId: string) => {
    setLoading(true);
    await fetch("/api/sessions/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId }),
    });
    setLoading(false);
    router.refresh();
  }, [router]);

  const pause = useCallback(async (sessionId: string, remark?: string, force?: boolean) => {
    setLoading(true);
    await fetch("/api/sessions/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, remark, force }),
    });
    setLoading(false);
    router.refresh();
  }, [router]);

  const resume = useCallback(async (sessionId: string) => {
    setLoading(true);
    await fetch("/api/sessions/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
    setLoading(false);
    router.refresh();
  }, [router]);

  return { start, pause, resume, loading };
}

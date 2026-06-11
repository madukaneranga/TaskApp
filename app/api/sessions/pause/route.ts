import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { session_id, remark, force } = await request.json();

    const { data: session } = await supabase
      .from("sessions")
      .select("*, tasks(id)")
      .eq("id", session_id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!force && session.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date().toISOString();

    const { data: openSegment } = await supabase
      .from("session_segments")
      .select("*")
      .eq("session_id", session_id)
      .is("ended_at", null)
      .maybeSingle();

    if (openSegment) {
      await supabase
        .from("session_segments")
        .update({ ended_at: now })
        .eq("id", openSegment.id);
    }

    await supabase.from("session_segments").insert({
      session_id,
      type: "pause",
      started_at: now,
    });

    await supabase.from("tasks").update({ status: "paused" }).eq("id", session.task_id);

    if (force && remark) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      await supabase.from("notes").insert({
        task_id: session.task_id,
        user_id: user.id,
        role: profile?.role || "admin",
        content: `[Force Paused] ${remark}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

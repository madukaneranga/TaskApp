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

    const { session_id } = await request.json();

    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (!session || session.user_id !== user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    const { data: pauseSegment } = await supabase
      .from("session_segments")
      .select("*")
      .eq("session_id", session_id)
      .eq("type", "pause")
      .is("ended_at", null)
      .maybeSingle();

    if (pauseSegment) {
      await supabase
        .from("session_segments")
        .update({ ended_at: now })
        .eq("id", pauseSegment.id);
    }

    await supabase.from("session_segments").insert({
      session_id,
      type: "work",
      started_at: now,
    });

    await supabase.from("tasks").update({ status: "in_progress" }).eq("id", session.task_id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
